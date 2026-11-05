import { pool } from "../db";
import type { PoolClient } from "pg";
import type {
  RequestInput,
  RequestQuery,
} from "../middleware/validations/schemas/requestSchema";

export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type RequestScope = { userId: string; manager: boolean };
type RequestRow = {
  id: string;
  solicitante_id: string | null;
  status: string;
};
const isManager = async (userId: string): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT 1 FROM usuarios u
     JOIN usuarios_perfis up ON up.usuario_id = u.id
     JOIN perfis p ON p.id = up.perfil_id
     WHERE u.id = $1 AND u.ativo = TRUE AND u.deletado_em IS NULL
     AND p.codigo IN ('administrador', 'gestor_frota') LIMIT 1`,
    [userId],
  );
  return rows.length > 0;
};
const list = async (scope: RequestScope, filters: RequestQuery) => {
  const values: unknown[] = [];
  const clauses: string[] = [];
  const add = (expression: string, value: unknown) => {
    values.push(value);
    clauses.push(expression.replace("?", "$" + values.length));
  };
  if (!scope.manager) add("s.solicitante_id = ?", scope.userId);
  if (filters.status) add("s.status = ?", filters.status);
  if (filters.setor) add("u.setor_id = ?", filters.setor);
  if (filters.solicitante) add("s.solicitante_id = ?", filters.solicitante);
  if (filters.tipo) add("LOWER(s.categoria) = LOWER(?)", filters.tipo);
  // O período considera dias completos em UTC, sobre data_necessidade.
  if (filters.data_inicio)
    add(
      "s.data_necessidade >= ?::timestamptz",
      filters.data_inicio + "T00:00:00Z",
    );
  if (filters.data_fim)
    add(
      "s.data_necessidade < (?::timestamptz + INTERVAL '1 day')",
      filters.data_fim + "T00:00:00Z",
    );
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  values.push(filters.limite, (filters.pagina - 1) * filters.limite);
  const { rows } = await pool.query(
    `WITH filtered AS (
       SELECT s.*, u.nome AS solicitante_nome, u.setor_id, se.nome AS setor_nome
       FROM solicitacoes s LEFT JOIN usuarios u ON u.id = s.solicitante_id
       LEFT JOIN setores se ON se.id = u.setor_id ${where}
     ), page AS (
       SELECT * FROM filtered ORDER BY criado_em DESC, id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}
     )
     SELECT (SELECT COUNT(*)::int FROM filtered) AS total,
       COALESCE((SELECT jsonb_agg(p ORDER BY p.criado_em DESC, p.id DESC) FROM page p), '[]'::jsonb) AS dados`,
    values,
  );
  return { ...rows[0], pagina: filters.pagina, limite: filters.limite };
};
const get = async (id: string, scope: RequestScope) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.nome AS solicitante_nome, u.setor_id, se.nome AS setor_nome,
       COALESCE((SELECT jsonb_agg(h ORDER BY h.data_hora, h.id)
         FROM historico_status_solicitacao h WHERE h.solicitacao_id = s.id), '[]'::jsonb) AS historico
     FROM solicitacoes s LEFT JOIN usuarios u ON u.id = s.solicitante_id
     LEFT JOIN setores se ON se.id = u.setor_id
     WHERE s.id = $1 AND ($2::boolean OR s.solicitante_id = $3)`,
    [id, scope.manager, scope.userId],
  );
  if (!rows[0]) throw new RequestError(404, "Solicitação não encontrada");
  return rows[0];
};
const transaction = async <T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const lock = async (
  client: PoolClient,
  id: string,
  scope: RequestScope,
): Promise<RequestRow> => {
  const { rows } = await client.query<RequestRow>(
    "SELECT id, solicitante_id, status FROM solicitacoes WHERE id = $1 AND ($2::boolean OR solicitante_id = $3) FOR UPDATE",
    [id, scope.manager, scope.userId],
  );
  if (!rows[0]) throw new RequestError(404, "Solicitação não encontrada");
  return rows[0];
};
const update = (id: string, input: RequestInput, scope: RequestScope) =>
  transaction(async (client) => {
    const request = await lock(client, id, scope);
    if (request.solicitante_id !== scope.userId)
      throw new RequestError(403, "Somente o próprio solicitante pode editar");
    if (request.status !== "Pendente")
      throw new RequestError(
        409,
        "Somente solicitações pendentes podem ser editadas",
      );
    const { rows } = await client.query(
      `UPDATE solicitacoes SET categoria = $2, flag_urgencia = $3,
       data_necessidade = $4, atualizado_em = NOW() WHERE id = $1 RETURNING *`,
      [id, input.categoria, input.flag_urgencia, input.data_necessidade],
    );
    return rows[0];
  });
const cancel = (id: string, motivo: string, scope: RequestScope) =>
  transaction(async (client) => {
    if (!scope.manager)
      throw new RequestError(
        403,
        "Somente Gestor de Frota ou Administrador pode cancelar",
      );
    const request = await lock(client, id, scope);
    if (!["Pendente", "Aprovada", "Agendada"].includes(request.status))
      throw new RequestError(409, "O status atual não permite cancelamento");
    const trips = await client.query<{ id: string; status: string }>(
      "SELECT id, status FROM viagens WHERE solicitacao_id = $1 ORDER BY id FOR UPDATE",
      [id],
    );
    if (
      trips.rows.some(
        (trip) => !["Agendada", "Cancelada"].includes(trip.status),
      )
    )
      throw new RequestError(
        409,
        "Solicitação possui viagem iniciada ou finalizada",
      );
    for (const trip of trips.rows.filter(
      (trip) => trip.status === "Agendada",
    )) {
      await client.query(
        "UPDATE viagens SET status = 'Cancelada', atualizado_em = NOW() WHERE id = $1",
        [trip.id],
      );
      await client.query(
        `INSERT INTO historico_status_viagem (viagem_id, status_anterior, status_novo, usuario_id)
         VALUES ($1, $2, 'Cancelada', $3)`,
        [trip.id, trip.status, scope.userId],
      );
    }
    const { rows } = await client.query(
      `UPDATE solicitacoes SET status = 'Cancelada', motivo_cancelamento = $2,
       atualizado_em = NOW() WHERE id = $1 RETURNING *`,
      [id, motivo],
    );
    await client.query(
      `INSERT INTO historico_status_solicitacao
       (solicitacao_id, status_anterior, status_novo, usuario_id, motivo)
       VALUES ($1, $2, 'Cancelada', $3, $4)`,
      [id, request.status, scope.userId, motivo],
    );
    return rows[0];
  });
export default { isManager, list, get, update, cancel };

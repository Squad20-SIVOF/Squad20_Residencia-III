import { pool } from "../db";
import type {
  SvoAttendanceInput,
  SvoQuery,
} from "../middleware/validations/schemas/svoSchema";

const create = async (input: SvoAttendanceInput, userId: string) => {
  const { rows } = await pool.query(
    `INSERT INTO atendimentos_svo
      (falecido_nome, solicitante_nome, solicitante_telefone, endereco_ocorrencia,
       prioridade, observacoes, registrado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, prioridade, status, criado_em`,
    [
      input.falecido_nome,
      input.solicitante_nome,
      input.solicitante_telefone,
      input.endereco_ocorrencia,
      input.prioridade,
      input.observacoes ?? null,
      userId,
    ],
  );
  return rows[0];
};
const list = async (query: SvoQuery) => {
  // A listagem operacional evita expor nomes, telefone e observações.
  const { rows } = await pool.query(
    `WITH filtered AS (
       SELECT id, endereco_ocorrencia, prioridade, status, criado_em
       FROM atendimentos_svo WHERE ($1::text IS NULL OR prioridade = $1)
     ), page AS (
       SELECT * FROM filtered
       ORDER BY CASE prioridade WHEN 'Urgente' THEN 0 WHEN 'Alta' THEN 1 ELSE 2 END,
         criado_em, id
       LIMIT $2 OFFSET $3
     )
     SELECT (SELECT COUNT(*)::int FROM filtered) AS total,
       COALESCE((SELECT jsonb_agg(p ORDER BY
         CASE p.prioridade WHEN 'Urgente' THEN 0 WHEN 'Alta' THEN 1 ELSE 2 END,
         p.criado_em, p.id) FROM page p), '[]'::jsonb) AS dados`,
    [query.prioridade ?? null, query.limite, (query.pagina - 1) * query.limite],
  );
  return { ...rows[0], pagina: query.pagina, limite: query.limite };
};
const get = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT id, falecido_nome, solicitante_nome, solicitante_telefone,
       endereco_ocorrencia, prioridade, observacoes, status, registrado_por, criado_em
     FROM atendimentos_svo WHERE id = $1`,
    [id],
  );
  return rows[0];
};
export default { create, list, get };

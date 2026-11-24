import type { PoolClient } from "pg";
import profiles from "./profileModel";
import requests from "./requestModel";
import { authorizeTripActor } from "./tripAuthorization";
import { transaction } from "../utils/transaction";
import { DomainError } from "../utils/serviceUtils";
import type {
  RequestCreate,
  RequestApproval,
} from "../middleware/validations/schemas/requestSchema";

const history = (
  client: PoolClient,
  id: string,
  previous: string | null,
  status: string,
  userId: string,
  reason: string | null = null,
) =>
  client.query(
    `INSERT INTO historico_status_solicitacao
    (solicitacao_id, status_anterior, status_novo, usuario_id, motivo)
    VALUES ($1,$2,$3,$4,$5)`,
    [id, previous, status, userId, reason],
  );

const create = (input: RequestCreate, userId: string) =>
  transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock_shared(2034, 1)");
    const user = await client.query(
      "SELECT id FROM usuarios WHERE id=$1 AND ativo AND deletado_em IS NULL FOR SHARE",
      [userId],
    );
    if (!user.rows.length)
      throw new DomainError(401, "Usuário inativo ou inexistente");
    if (
      !(await profiles.permissions(userId, client))?.includes(
        "solicitacoes:criar",
      )
    )
      throw new DomainError(403, "Sem permissão para criar solicitações");
    if (input.veiculo_preferencial_id) {
      const vehicle = await client.query(
        "SELECT id FROM veiculos WHERE id=$1 AND ativo AND deletado_em IS NULL FOR SHARE",
        [input.veiculo_preferencial_id],
      );
      if (!vehicle.rows.length)
        throw new DomainError(400, "Veículo preferencial indisponível");
    }
    const { rows } = await client.query(
      `INSERT INTO solicitacoes
    (solicitante_id,categoria,origem,destino,setor,data_necessidade,data_retorno_prevista,numero_passageiros,veiculo_preferencial_id,motivo,flag_urgencia)
    VALUES ($1,'administrativa',$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        userId,
        input.origem,
        input.destino,
        input.setor,
        input.data_necessidade,
        input.data_retorno_prevista ?? null,
        input.numero_passageiros,
        input.veiculo_preferencial_id ?? null,
        input.motivo,
        input.flag_urgencia,
      ],
    );
    await history(client, rows[0].id, null, "Pendente", userId);
    return rows[0];
  });

const manager = async (client: PoolClient, userId: string) => {
  const actor = await authorizeTripActor(client, userId);
  if (!actor.manager || !(await requests.isManager(userId, client)))
    throw new DomainError(
      403,
      "Somente Gestor de Frota ou Administrador pode decidir solicitações",
    );
};

const approve = (id: string, input: RequestApproval, userId: string) =>
  transaction(async (client) => {
    await manager(client, userId);
    const request = (
      await client.query("SELECT * FROM solicitacoes WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    if (!request) throw new DomainError(404, "Solicitação não encontrada");
    if (request.status !== "Pendente")
      throw new DomainError(
        409,
        "Somente solicitações pendentes podem ser aprovadas",
      );
    const end = input.data_retorno_prevista ?? request.data_retorno_prevista;
    if (!end || new Date(end) <= new Date(request.data_necessidade))
      throw new DomainError(400, "Informe retorno previsto posterior à saída");
    if (request.categoria?.toLowerCase() === "svo")
      throw new DomainError(
        409,
        "Atendimentos SVO devem usar o fluxo de coleta",
      );
    const vehicle = (
      await client.query(
        "SELECT * FROM veiculos WHERE id=$1 AND ativo AND deletado_em IS NULL FOR UPDATE",
        [input.veiculo_id],
      )
    ).rows[0];
    if (
      !vehicle ||
      !["ativo", "Disponível"].includes(vehicle.status) ||
      vehicle.frota === "SVO" ||
      vehicle.exclusivo_svo
    )
      throw new DomainError(
        409,
        "Veículo indisponível para viagem institucional",
      );
    const driver = (
      await client.query(
        `SELECT *, validade_cnh >= ($2::timestamptz AT TIME ZONE 'America/Fortaleza')::date AS cnh_valida
    FROM motoristas WHERE id=$1 AND ativo AND deletado_em IS NULL FOR UPDATE`,
        [input.motorista_id, end],
      )
    ).rows[0];
    if (
      !driver ||
      !["ativo", "Disponível"].includes(driver.status) ||
      !driver.cnh_valida
    )
      throw new DomainError(
        409,
        "Motorista indisponível ou CNH vencida no período",
      );
    if (
      !driver.motorista_coringa &&
      (!driver.frota || driver.frota !== vehicle.frota)
    )
      throw new DomainError(
        409,
        "Motorista incompatível com a frota do veículo",
      );
    if (
      request.numero_passageiros != null &&
      request.numero_passageiros > vehicle.capacidade_maxima
    )
      throw new DomainError(409, "Capacidade de passageiros insuficiente");
    // Viagens legadas sem janela não têm previsão confiável: bloquear em vez de presumir disponibilidade.
    const legacy = await client.query(
      `SELECT id FROM viagens WHERE (veiculo_id=$1 OR motorista_id=$2)
    AND saida_prevista IS NULL AND status NOT IN ('Finalizada','Cancelada') LIMIT 1`,
      [input.veiculo_id, input.motorista_id],
    );
    if (legacy.rows.length)
      throw new DomainError(
        409,
        "Recurso possui viagem sem período previsto; concilie a viagem existente",
      );
    const trip = (
      await client.query(
        `INSERT INTO viagens
    (solicitacao_id,veiculo_id,motorista_id,qtd_passageiros_obitos,saida_prevista,retorno_previsto)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          id,
          input.veiculo_id,
          input.motorista_id,
          request.numero_passageiros ?? 0,
          request.data_necessidade,
          end,
        ],
      )
    ).rows[0];
    const updated = (
      await client.query(
        "UPDATE solicitacoes SET status='Agendada', data_retorno_prevista=$2, atualizado_em=NOW() WHERE id=$1 RETURNING *",
        [id, end],
      )
    ).rows[0];
    await history(client, id, request.status, "Agendada", userId);
    await client.query(
      "INSERT INTO historico_status_viagem (viagem_id,status_anterior,status_novo,usuario_id) VALUES ($1,NULL,'Agendada',$2)",
      [trip.id, userId],
    );
    return { ...updated, viagem: trip };
  });

const reject = (id: string, reason: string, userId: string) =>
  transaction(async (client) => {
    await manager(client, userId);
    const request = (
      await client.query(
        "SELECT status FROM solicitacoes WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!request) throw new DomainError(404, "Solicitação não encontrada");
    if (request.status !== "Pendente")
      throw new DomainError(
        409,
        "Somente solicitações pendentes podem ser recusadas",
      );
    const { rows } = await client.query(
      "UPDATE solicitacoes SET status='Recusada', motivo_recusa=$2, atualizado_em=NOW() WHERE id=$1 RETURNING *",
      [id, reason],
    );
    await history(client, id, request.status, "Recusada", userId, reason);
    return rows[0];
  });

export default { create, approve, reject };

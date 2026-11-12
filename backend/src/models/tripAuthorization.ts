import type { PoolClient } from "pg";
import profiles from "./profileModel";
import { DomainError } from "../utils/serviceUtils";

// Perfis e concessões usam o lock exclusivo de mesma chave. Sempre adquirir
// autorização antes de bloquear solicitações/viagens, para evitar ordem inversa.
export const authorizeTripActor = async (
  client: PoolClient,
  userId: string,
  ownOnly = false,
) => {
  await client.query("SELECT pg_advisory_xact_lock_shared(2034, 1)");
  const { rows } = await client.query<{ motorista_id: string | null }>(
    "SELECT motorista_id FROM usuarios WHERE id=$1 AND ativo AND deletado_em IS NULL FOR SHARE",
    [userId],
  );
  if (!rows[0]) throw new DomainError(401, "Usuário inativo ou inexistente");
  const permissions = await profiles.permissions(userId, client);
  const manager =
    !ownOnly && (permissions?.includes("viagens:gerenciar") ?? false);
  if (!manager && !permissions?.includes("viagens:atualizar-proprias"))
    throw new DomainError(403, "Sem permissão para alterar viagens");
  if (!manager) {
    const driver = await client.query(
      "SELECT id FROM motoristas WHERE id=$1 AND ativo AND deletado_em IS NULL FOR SHARE",
      [rows[0].motorista_id],
    );
    if (!driver.rows.length)
      throw new DomainError(404, "Viagem não encontrada");
  }
  return { userId, manager };
};

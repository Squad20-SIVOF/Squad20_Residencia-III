import { pool } from "../db";
import { transaction } from "../utils/transaction";
import { DomainError } from "../utils/serviceUtils";
import { authorizeTripActor } from "./tripAuthorization";

const eligible = `SELECT c.id,c.placa,c.modelo,c.identificacao,c.quilometragem,c.tipo_combustivel
FROM veiculos c JOIN usuarios u ON u.id=$1 JOIN motoristas m ON m.id=u.motorista_id
WHERE c.id=$2 AND c.ativo AND c.deletado_em IS NULL AND m.ativo AND m.deletado_em IS NULL
AND (m.motorista_coringa OR EXISTS(SELECT 1 FROM motoristas_veiculos mv WHERE mv.motorista_id=m.id AND mv.veiculo_id=c.id)
OR EXISTS(SELECT 1 FROM viagens v WHERE v.motorista_id=m.id AND v.veiculo_id=c.id AND v.status IN ('Agendada','Em deslocamento','Em andamento')))`;
const get = async (userId: string, session: string) => {
  const { rows } = await pool.query(
    `${eligible.replace("c.id=$2", "c.id=(SELECT veiculo_id FROM motorista_veiculo_sessao WHERE session_hash=$2)")}
  AND EXISTS(SELECT 1 FROM auth_sessions s WHERE s.token_hash=$2 AND s.usuario_id=u.id AND s.expires_at>NOW())`,
    [userId, session],
  );
  return rows[0] ?? null;
};
const set = (userId: string, session: string, vehicleId: string) =>
  transaction(async (client) => {
    await authorizeTripActor(client, userId, true);
    const { rows } = await client.query(`${eligible} FOR SHARE OF c,m`, [
      userId,
      vehicleId,
    ]);
    if (!rows[0])
      throw new DomainError(
        404,
        "Veículo indisponível para sua conta. Solicite a liberação ao gestor.",
      );
    const saved = await client.query(
      `INSERT INTO motorista_veiculo_sessao(session_hash,veiculo_id)
  SELECT token_hash,$3 FROM auth_sessions WHERE token_hash=$2 AND usuario_id=$1 AND expires_at>NOW()
  ON CONFLICT(session_hash) DO UPDATE SET veiculo_id=EXCLUDED.veiculo_id,atualizado_em=NOW() RETURNING veiculo_id`,
      [userId, session, vehicleId],
    );
    if (!saved.rows[0])
      throw new DomainError(401, "Sessão inválida ou expirada");
    return rows[0];
  });
const remove = async (userId: string, session: string) => {
  await pool.query(
    "DELETE FROM motorista_veiculo_sessao x USING auth_sessions s WHERE x.session_hash=s.token_hash AND s.usuario_id=$1 AND s.token_hash=$2",
    [userId, session],
  );
  return null;
};
export default { get, set, remove };

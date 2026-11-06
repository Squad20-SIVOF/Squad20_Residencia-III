import { pool } from "../db";

export interface DriverAccount {
  id: string;
  nome: string;
  motorista_coringa: boolean;
}
const getByUserId = async (
  userId: string,
): Promise<DriverAccount | undefined> => {
  const { rows } = await pool.query(
    `SELECT m.id,m.nome,m.motorista_coringa FROM usuarios u
    JOIN motoristas m ON m.id=u.motorista_id WHERE u.id=$1 AND m.ativo AND m.deletado_em IS NULL`,
    [userId],
  );
  return rows[0];
};
const hasVehicle = async (driverId: string, vehicleId: string) => {
  const { rows } = await pool.query(
    `SELECT v.id FROM veiculos v JOIN motoristas m ON m.id=$1
    WHERE v.id=$2 AND v.ativo AND v.deletado_em IS NULL AND (m.motorista_coringa OR EXISTS(
      SELECT 1 FROM motoristas_veiculos mv WHERE mv.motorista_id=m.id AND mv.veiculo_id=v.id))`,
    [driverId, vehicleId],
  );
  return rows.length > 0;
};
export default { getByUserId, hasVehicle };

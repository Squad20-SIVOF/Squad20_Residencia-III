import { pool } from "../db";
import type { DriverAccount } from "./driverAccountModel";
import type { DriverInspectionInput } from "../middleware/validations/schemas/driverInspectionSchema";

const list = async (driver: DriverAccount) => {
  const { rows } = await pool.query(
    `SELECT v.id,v.placa,v.modelo,v.checklist_vistoria FROM veiculos v
    WHERE v.ativo AND v.deletado_em IS NULL AND ($2::boolean OR EXISTS(SELECT 1 FROM motoristas_veiculos mv WHERE mv.motorista_id=$1 AND mv.veiculo_id=v.id))
    ORDER BY v.modelo,v.placa`,
    [driver.id, driver.motorista_coringa],
  );
  return rows;
};
const save = async (input: DriverInspectionInput) => {
  await pool.query(
    "UPDATE veiculos SET checklist_vistoria=$2::jsonb,atualizado_em=NOW() WHERE id=$1",
    [input.veiculo_id, JSON.stringify(input.itens)],
  );
};
export default { list, save };

import { pool } from "../db";
import type { MaintenaceInput } from "../middleware/validations/schemas/maintanceSchema";

export interface Maintance extends MaintenaceInput {
  id: string;
  criado_em: Date;
  atualizado_em: Date;
}
const columns =
  "id, veiculo_id, tipo_manutencao, data_inicio, data_fim, custo, descricao, status, km_realizado, km_proxima, criado_em, atualizado_em, oficina, to_char(data_servico,'YYYY-MM-DD') AS data_servico, hora_servico, to_char(proxima_revisao_data,'YYYY-MM-DD') AS proxima_revisao_data, notificar_revisao, comprovante_nome";
const values = (input: MaintenaceInput) => [
  input.veiculo_id,
  input.tipo_manutencao,
  input.data_inicio ?? null,
  input.data_fim ?? null,
  input.custo,
  input.descricao ?? null,
  input.status,
  input.km_realizado ?? null,
  input.km_proxima ?? null,
  input.oficina ?? "",
  input.data_servico ?? null,
  input.hora_servico ?? null,
  input.proxima_revisao_data ?? null,
  input.notificar_revisao ?? false,
  input.comprovante_nome ?? null,
];
const getAllMaintance = async (): Promise<Maintance[]> =>
  (
    await pool.query(
      `SELECT ${columns} FROM manutencoes ORDER BY data_inicio DESC, id`,
    )
  ).rows;
const getMaintancById = async (id: string): Promise<Maintance | undefined> =>
  (await pool.query(`SELECT ${columns} FROM manutencoes WHERE id=$1`, [id]))
    .rows[0];
const save = async (
  input: MaintenaceInput,
  id?: string,
): Promise<Maintance | undefined> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Mesma ordem de locks dos cadastros de frota.
    await client.query("SELECT pg_advisory_xact_lock(203734441, 20)");
    const result = id
      ? await client.query(
          `UPDATE manutencoes SET veiculo_id=$1,tipo_manutencao=$2,data_inicio=COALESCE($3,data_inicio),data_fim=$4,custo=$5,descricao=$6,status=$7,km_realizado=$8,km_proxima=$9,
          oficina=$10,data_servico=COALESCE($11,data_servico),hora_servico=$12,proxima_revisao_data=$13,notificar_revisao=$14,comprovante_nome=$15 WHERE id=$16 RETURNING ${columns}`,
          [...values(input), id],
        )
      : await client.query(
          `INSERT INTO manutencoes (veiculo_id,tipo_manutencao,data_inicio,data_fim,custo,descricao,status,km_realizado,km_proxima,oficina,data_servico,hora_servico,proxima_revisao_data,notificar_revisao,comprovante_nome)
          VALUES ($1,$2,COALESCE($3,NOW()),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING ${columns}`,
          values(input),
        );
    if (
      result.rows[0] &&
      input.status === "Concluída" &&
      input.km_realizado != null
    ) {
      await client.query(
        "UPDATE veiculos SET quilometragem=GREATEST(quilometragem,$2),atualizado_em=NOW() WHERE id=$1",
        [input.veiculo_id, input.km_realizado],
      );
    }
    await client.query("COMMIT");
    return result.rows[0];
  } catch (cause) {
    await client.query("ROLLBACK");
    throw cause;
  } finally {
    client.release();
  }
};
const createMaintance = async (input: MaintenaceInput): Promise<Maintance> =>
  (await save(input))!;
const updateMaintance = async (
  id: string,
  input: MaintenaceInput,
): Promise<Maintance | undefined> => save(input, id);
const deleteMaintance = async (id: string): Promise<boolean> =>
  (await pool.query("DELETE FROM manutencoes WHERE id=$1", [id])).rowCount ===
  1;
export default {
  getAllMaintance,
  getMaintancById,
  createMaintance,
  updateMaintance,
  deleteMaintance,
};

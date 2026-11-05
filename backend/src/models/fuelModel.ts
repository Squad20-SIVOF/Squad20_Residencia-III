import { pool } from "../db";
import type {
  FuelInput,
  FuelQuery,
} from "../middleware/validations/schemas/fuelSchema";

const select = `SELECT a.*, v.placa, v.modelo, v.identificacao, v.teto_gasto_mensal,
  m.nome AS motorista_nome FROM abastecimentos a
  LEFT JOIN veiculos v ON v.id=a.veiculo_id LEFT JOIN motoristas m ON m.id=a.motorista_id`;
export class FuelError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const list = async (input: FuelQuery) => {
  const values: unknown[] = [];
  const where: string[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };
  if (input.veiculo_id) add("a.veiculo_id=?", input.veiculo_id);
  if (input.data_inicio)
    add(
      "a.data_abastecimento >= (?::date::timestamp AT TIME ZONE 'America/Bahia')",
      input.data_inicio,
    );
  if (input.data_fim)
    add(
      "a.data_abastecimento < ((?::date + 1)::timestamp AT TIME ZONE 'America/Bahia')",
      input.data_fim,
    );
  const { rows } = await pool.query(
    `${select} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY a.data_abastecimento DESC,a.id`,
    values,
  );
  return rows;
};
const get = async (id: string) =>
  (await pool.query(`${select} WHERE a.id=$1`, [id])).rows[0];
const options = async () => {
  const [vehicles, drivers] = await Promise.all([
    pool.query(
      "SELECT id,identificacao,placa,modelo,quilometragem,tipo_combustivel,capacidade_maxima,teto_gasto_mensal,frota FROM veiculos WHERE ativo AND deletado_em IS NULL ORDER BY modelo,placa",
    ),
    pool.query(
      "SELECT id,nome FROM motoristas WHERE ativo AND deletado_em IS NULL ORDER BY nome",
    ),
  ]);
  return { veiculos: vehicles.rows, motoristas: drivers.rows };
};
const save = async (input: FuelInput, total: number, id?: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializa registros e edições que alteram o veículo ou o mês.
    await client.query("SELECT pg_advisory_xact_lock(203734441, 21)");
    if (id) {
      const existing = await client.query(
        "SELECT id FROM abastecimentos WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (!existing.rows.length)
        throw new FuelError(404, "Abastecimento não encontrado");
    }
    const vehicles = await client.query(
      "SELECT teto_gasto_mensal FROM veiculos WHERE id=$1 AND ativo AND deletado_em IS NULL FOR UPDATE",
      [input.veiculo_id],
    );
    if (!vehicles.rows.length)
      throw new FuelError(400, "Selecione um veículo ativo");
    const drivers = await client.query(
      "SELECT id FROM motoristas WHERE id=$1 AND ativo AND deletado_em IS NULL FOR SHARE",
      [input.motorista_id],
    );
    if (!drivers.rows.length)
      throw new FuelError(400, "Selecione um motorista ativo");
    const spent = await client.query(
      `SELECT COALESCE(SUM(valor_total),0) AS total FROM abastecimentos
      WHERE veiculo_id=$1 AND ($3::uuid IS NULL OR id<>$3)
      AND date_trunc('month',data_abastecimento AT TIME ZONE 'America/Bahia')=date_trunc('month',$2::timestamptz AT TIME ZONE 'America/Bahia')`,
      [input.veiculo_id, input.data_abastecimento, id ?? null],
    );
    const cap = vehicles.rows[0].teto_gasto_mensal;
    const exceeded =
      cap != null && Number(spent.rows[0].total) + total > Number(cap);
    const values = [
      input.veiculo_id,
      input.motorista_id,
      input.data_abastecimento,
      input.combustivel,
      input.posto,
      input.litros,
      input.preco_litro,
      total,
      input.km_momento_abastecimento,
      exceeded,
    ];
    const result = id
      ? await client.query(
          `UPDATE abastecimentos SET veiculo_id=$1,motorista_id=$2,data_abastecimento=$3,combustivel=$4,posto=$5,litros=$6,preco_litro=$7,valor_total=$8,km_momento_abastecimento=$9,alerta_teto_excedido=$10,atualizado_em=NOW() WHERE id=$11 RETURNING id`,
          [...values, id],
        )
      : await client.query(
          `INSERT INTO abastecimentos(veiculo_id,motorista_id,data_abastecimento,combustivel,posto,litros,preco_litro,valor_total,km_momento_abastecimento,alerta_teto_excedido) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
          values,
        );
    await client.query(
      "UPDATE veiculos SET quilometragem=GREATEST(quilometragem,$2),atualizado_em=NOW() WHERE id=$1",
      [input.veiculo_id, input.km_momento_abastecimento],
    );
    const { rows } = await client.query(`${select} WHERE a.id=$1`, [
      result.rows[0].id,
    ]);
    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const remove = async (id: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(203734441, 21)");
    const result = await client.query(
      "DELETE FROM abastecimentos WHERE id=$1",
      [id],
    );
    await client.query("COMMIT");
    return result.rowCount === 1;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const ownOptions = async (driver: {
  id: string;
  nome: string;
  motorista_coringa: boolean;
}) => {
  const { rows } = await pool.query(
    `SELECT v.id,v.identificacao,v.placa,v.modelo,v.quilometragem,v.tipo_combustivel,v.capacidade_maxima,v.teto_gasto_mensal,v.frota
    FROM veiculos v WHERE v.ativo AND v.deletado_em IS NULL AND ($2::boolean OR EXISTS(
      SELECT 1 FROM motoristas_veiculos mv WHERE mv.motorista_id=$1 AND mv.veiculo_id=v.id)) ORDER BY v.modelo,v.placa`,
    [driver.id, driver.motorista_coringa],
  );
  return { veiculos: rows, motoristas: [{ id: driver.id, nome: driver.nome }] };
};
const summary = async (vehicleId: string, start: string, end: string) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(valor_total),0) AS total FROM abastecimentos
    WHERE veiculo_id=$1 AND data_abastecimento>=($2::date::timestamp AT TIME ZONE 'America/Bahia')
    AND data_abastecimento<(($3::date+1)::timestamp AT TIME ZONE 'America/Bahia')`,
    [vehicleId, start, end],
  );
  return { total: Number(rows[0].total) };
};
export default { list, get, options, save, remove, ownOptions, summary };

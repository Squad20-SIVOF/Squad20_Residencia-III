import { pool } from "../db";
import type {
  MultaInput,
  MultaQuery,
} from "../middleware/validations/schemas/multaSchema";

const select = `SELECT mu.*, v.placa, v.modelo, m.nome AS motorista_nome
  FROM multas mu
  LEFT JOIN veiculos v ON v.id=mu.veiculo_id
  LEFT JOIN motoristas m ON m.id=mu.motorista_id`;

export class MultaError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const list = async (query: MultaQuery) => {
  const values: unknown[] = [];
  const where: string[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };
  if (query.veiculo_id) add("mu.veiculo_id=?", query.veiculo_id);
  if (query.motorista_id) add("mu.motorista_id=?", query.motorista_id);
  if (query.status) add("mu.status=?", query.status);
  if (query.data_inicio) add("mu.data_infracao>=?::date", query.data_inicio);
  if (query.data_fim) add("mu.data_infracao<=?::date", query.data_fim);
  const { rows } = await pool.query(
    `${select} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY mu.data_infracao DESC, mu.id`,
    values,
  );
  return rows;
};

const get = async (id: string) =>
  (await pool.query(`${select} WHERE mu.id=$1`, [id])).rows[0];

const save = async (input: MultaInput, id?: string) => {
  const values = [
    input.veiculo_id,
    input.motorista_id ?? null,
    input.auto_infracao ?? null,
    input.data_infracao,
    input.local_infracao ?? null,
    input.descricao,
    input.gravidade,
    input.pontos,
    input.valor,
    input.status,
    input.data_pagamento ?? null,
    input.observacoes ?? null,
  ];
  if (id) {
    const { rows } = await pool.query(
      `UPDATE multas SET veiculo_id=$1, motorista_id=$2, auto_infracao=$3,
        data_infracao=$4, local_infracao=$5, descricao=$6, gravidade=$7,
        pontos=$8, valor=$9, status=$10, data_pagamento=$11, observacoes=$12,
        atualizado_em=NOW()
       WHERE id=$13 RETURNING id`,
      [...values, id],
    );
    if (!rows.length) return undefined;
    return (await pool.query(`${select} WHERE mu.id=$1`, [id])).rows[0];
  }
  const { rows } = await pool.query(
    `INSERT INTO multas (veiculo_id, motorista_id, auto_infracao, data_infracao,
      local_infracao, descricao, gravidade, pontos, valor, status, data_pagamento, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    values,
  );
  return (await pool.query(`${select} WHERE mu.id=$1`, [rows[0].id])).rows[0];
};

const remove = async (id: string) => {
  const { rowCount } = await pool.query(`DELETE FROM multas WHERE id=$1`, [id]);
  return rowCount === 1;
};

const options = async () => {
  const [vehicles, drivers] = await Promise.all([
    pool.query(
      "SELECT id,placa,modelo,identificacao FROM veiculos WHERE ativo AND deletado_em IS NULL ORDER BY modelo,placa",
    ),
    pool.query(
      "SELECT id,nome FROM motoristas WHERE ativo AND deletado_em IS NULL ORDER BY nome",
    ),
  ]);
  return { veiculos: vehicles.rows, motoristas: drivers.rows };
};

export default { list, get, save, remove, options };

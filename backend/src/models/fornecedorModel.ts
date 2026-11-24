import { pool } from "../db";
import type {
  FornecedorInput,
  FornecedorQuery,
} from "../middleware/validations/schemas/fornecedorSchema";

const columns = `id, nome, cnpj, telefone, email, endereco,
  tipo_contrato, contrato_referencia, ativo, deletado_em, criado_em, atualizado_em`;

export class FornecedorError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const list = async (query: FornecedorQuery) => {
  const values: unknown[] = [];
  const where: string[] = ["deletado_em IS NULL"];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };
  if (query.tipo_contrato) add("tipo_contrato=?", query.tipo_contrato);
  if (query.ativo !== undefined) add("ativo=?", query.ativo);
  const { rows } = await pool.query(
    `SELECT ${columns} FROM fornecedores WHERE ${where.join(" AND ")} ORDER BY nome, id`,
    values,
  );
  return rows;
};

const get = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM fornecedores WHERE id=$1 AND deletado_em IS NULL`,
    [id],
  );
  return rows[0];
};

const save = async (input: FornecedorInput, id?: string) => {
  if (id) {
    const { rows } = await pool.query(
      `UPDATE fornecedores SET nome=$2, cnpj=$3, telefone=$4, email=$5,
        endereco=$6, tipo_contrato=$7, contrato_referencia=$8, atualizado_em=NOW()
       WHERE id=$1 AND deletado_em IS NULL RETURNING ${columns}`,
      [
        id,
        input.nome,
        input.cnpj ?? null,
        input.telefone ?? null,
        input.email ?? null,
        input.endereco ?? null,
        input.tipo_contrato,
        input.contrato_referencia ?? null,
      ],
    );
    return rows[0];
  }
  const { rows } = await pool.query(
    `INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, tipo_contrato, contrato_referencia)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${columns}`,
    [
      input.nome,
      input.cnpj ?? null,
      input.telefone ?? null,
      input.email ?? null,
      input.endereco ?? null,
      input.tipo_contrato,
      input.contrato_referencia ?? null,
    ],
  );
  return rows[0];
};

const remove = async (id: string) => {
  const { rowCount } = await pool.query(
    `UPDATE fornecedores SET ativo=FALSE, deletado_em=NOW(), atualizado_em=NOW()
     WHERE id=$1 AND deletado_em IS NULL`,
    [id],
  );
  return rowCount === 1;
};

export default { list, get, save, remove };

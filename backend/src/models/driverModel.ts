import { pool } from "../db";
import { type DriverInput } from "../middleware/validations/schemas/driverSchema";

export interface Driver extends DriverInput {
  id: string;
  motorista_coringa: boolean;
  status: string;
  ativo: boolean;
  deletado_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
}

export interface DriverLicenseRow {
  id: string;
  nome: string;
  validade_cnh: string;
  dias_restantes: number;
}

// Keep PostgreSQL DATE as a calendar date, independent of the host timezone.
const columns = `id, nome, cpf, cnh, categoria, telefone, email, foto,
  to_char(validade_cnh, 'YYYY-MM-DD') AS validade_cnh,
  motorista_coringa, frota, status, ativo, deletado_em, criado_em, atualizado_em,
  ARRAY(SELECT v.placa FROM motoristas_veiculos mv JOIN veiculos v ON v.id = mv.veiculo_id
    WHERE mv.motorista_id = motoristas.id ORDER BY v.placa) AS veiculos`;

const getAllDrivers = async (): Promise<Driver[]> => {
  const result = await pool.query(
    `SELECT ${columns} FROM motoristas ORDER BY nome, id`,
  );
  return result.rows;
};

const getDriverById = async (id: string): Promise<Driver | undefined> => {
  const result = await pool.query(
    `SELECT ${columns} FROM motoristas WHERE id = $1`,
    [id],
  );
  return result.rows[0];
};

const getDriverWLicenseExp = async (
  dayAhead: number,
): Promise<DriverLicenseRow[]> => {
  const result = await pool.query(
    `SELECT id, nome, validade_cnh::text as validade_cnh,
    (validade_cnh - CURRENT_DATE) as dias_restantes
    FROM motoristas
    WHERE ativo and deletado_em IS NULL
    AND validade_cnh <= CURRENT_DATE + $1::int
    ORDER BY validade_cnh`,
    [dayAhead],
  );
  return result.rows;
};

// Cadastro e vínculos são atômicos: qualquer incompatibilidade desfaz tudo.
const saveDriver = async (
  driver: DriverInput,
  id?: string,
): Promise<Driver | undefined> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(203734441, 20)");
    const result = id
      ? await client.query(
          `UPDATE motoristas SET nome=$2, cpf=$3, cnh=$4,
          categoria=$5, validade_cnh=$6, motorista_coringa=COALESCE($7,motorista_coringa),
          frota=CASE WHEN $9 THEN $8 ELSE frota END, atualizado_em=NOW()
          WHERE id=$1 RETURNING id`,
          [
            id,
            driver.nome,
            driver.cpf,
            driver.cnh,
            driver.categoria,
            driver.validade_cnh,
            driver.motorista_coringa ?? null,
            driver.frota ?? null,
            driver.frota !== undefined,
          ],
        )
      : await client.query(
          `INSERT INTO motoristas (nome,cpf,cnh,categoria,validade_cnh,motorista_coringa,frota)
          VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [
            driver.nome,
            driver.cpf,
            driver.cnh,
            driver.categoria,
            driver.validade_cnh,
            driver.motorista_coringa ?? false,
            driver.frota ?? null,
          ],
        );
    const savedId = result.rows[0]?.id;
    if (!savedId) {
      await client.query("ROLLBACK");
      return undefined;
    }
    const contact = JSON.stringify({
      telefone: driver.telefone,
      email: driver.email,
      foto: driver.foto,
    });
    await client.query(
      `UPDATE motoristas SET
      telefone=CASE WHEN $2::jsonb ? 'telefone' THEN $2::jsonb->>'telefone' ELSE telefone END,
      email=CASE WHEN $2::jsonb ? 'email' THEN $2::jsonb->>'email' ELSE email END,
      foto=CASE WHEN $2::jsonb ? 'foto' THEN $2::jsonb->>'foto' ELSE foto END
      WHERE id=$1`,
      [savedId, contact],
    );
    if (driver.veiculos !== undefined) {
      const vehicles = await client.query(
        `SELECT id FROM veiculos WHERE placa = ANY($1::text[]) AND ativo AND deletado_em IS NULL`,
        [driver.veiculos],
      );
      if (vehicles.rows.length !== driver.veiculos.length) {
        throw Object.assign(
          new Error("Um ou mais veículos não existem ou estão inativos"),
          { code: "INVALID_VEHICLES" },
        );
      }
      await client.query(
        "DELETE FROM motoristas_veiculos WHERE motorista_id=$1",
        [savedId],
      );
      await client.query(
        `INSERT INTO motoristas_veiculos (motorista_id,veiculo_id)
        SELECT $1, id FROM veiculos WHERE placa = ANY($2::text[])`,
        [savedId, driver.veiculos],
      );
    }
    const saved = await client.query(
      `SELECT ${columns} FROM motoristas WHERE id=$1`,
      [savedId],
    );
    await client.query("COMMIT");
    return saved.rows[0];
  } catch (cause) {
    await client.query("ROLLBACK");
    throw cause;
  } finally {
    client.release();
  }
};
const createDriver = async (driver: DriverInput): Promise<Driver> =>
  (await saveDriver(driver))!;
const updateDriver = async (
  id: string,
  driver: DriverInput,
): Promise<Driver | undefined> => saveDriver(driver, id);

const deleteDriver = async (id: string): Promise<boolean> => {
  const result = await pool.query("DELETE FROM motoristas WHERE id = $1", [id]);
  return result.rowCount === 1;
};

export default {
  getAllDrivers,
  getDriverById,
  getDriverWLicenseExp,
  createDriver,
  updateDriver,
  deleteDriver,
};

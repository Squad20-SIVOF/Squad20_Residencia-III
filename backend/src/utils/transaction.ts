import type { PoolClient } from "pg";
import { pool } from "../db";

// O callback sempre usa este cliente; não abre transações aninhadas.
export const transaction = async <T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

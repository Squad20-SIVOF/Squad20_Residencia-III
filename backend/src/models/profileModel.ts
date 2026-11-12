import { pool } from "../db";
import type { PoolClient } from "pg";
import {
  ADMIN_PERMISSIONS,
  type ProfileInput,
} from "../middleware/validations/schemas/profileSchema";

export class ProfileError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const columns = "id, nome, descricao, codigo, permissoes";
const transaction = async <T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializa alterações de perfis e vínculos para proteger o último Administrador.
    await client.query("SELECT pg_advisory_xact_lock(2034, 1)");
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
const findProfile = async (client: PoolClient, id: string) => {
  const { rows } = await client.query(
    "SELECT * FROM perfis WHERE id = $1 FOR UPDATE",
    [id],
  );
  if (!rows[0]) throw new ProfileError(404, "Perfil não encontrado");
  return rows[0];
};
const list = async () =>
  (await pool.query(`SELECT ${columns} FROM perfis ORDER BY nome, id`)).rows;
const get = async (id: string) =>
  (await pool.query(`SELECT ${columns} FROM perfis WHERE id = $1`, [id]))
    .rows[0];
const create = async (input: ProfileInput) =>
  (
    await pool.query(
      `INSERT INTO perfis (nome, descricao, permissoes) VALUES ($1, $2, $3) RETURNING ${columns}`,
      [input.nome, input.descricao ?? null, input.permissoes],
    )
  ).rows[0];
const update = (id: string, input: ProfileInput) =>
  transaction(async (client) => {
    const profile = await findProfile(client, id);
    if (
      profile.codigo === "administrador" &&
      ADMIN_PERMISSIONS.some(
        (permission) => !input.permissoes.includes(permission),
      )
    ) {
      throw new ProfileError(
        409,
        "O perfil Administrador deve manter as permissões de gestão de perfis",
      );
    }
    return (
      await client.query(
        `UPDATE perfis SET nome = $2, descricao = $3, permissoes = $4 WHERE id = $1 RETURNING ${columns}`,
        [id, input.nome, input.descricao ?? null, input.permissoes],
      )
    ).rows[0];
  });
const remove = (id: string) =>
  transaction(async (client) => {
    await findProfile(client, id);
    const used = await client.query(
      "SELECT 1 FROM usuarios_perfis WHERE perfil_id = $1 LIMIT 1",
      [id],
    );
    if (used.rows.length)
      throw new ProfileError(409, "Perfil em uso não pode ser excluído");
    await client.query("DELETE FROM perfis WHERE id = $1", [id]);
  });
const assign = (userId: string, profileId: string, removing = false) =>
  transaction(async (client) => {
    const profile = await findProfile(client, profileId);
    const user = (
      await client.query(
        "SELECT ativo, deletado_em FROM usuarios WHERE id = $1 FOR UPDATE",
        [userId],
      )
    ).rows[0];
    if (!user) throw new ProfileError(404, "Usuário não encontrado");
    if (!removing) {
      await client.query(
        "INSERT INTO usuarios_perfis (usuario_id, perfil_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, profileId],
      );
      return;
    }
    const link = await client.query(
      "SELECT 1 FROM usuarios_perfis WHERE usuario_id = $1 AND perfil_id = $2",
      [userId, profileId],
    );
    if (!link.rows.length)
      throw new ProfileError(404, "Perfil não atribuído ao usuário");
    if (profile.codigo === "administrador" && user.ativo && !user.deletado_em) {
      const others = await client.query(
        `SELECT 1 FROM usuarios_perfis up
       JOIN usuarios u ON u.id = up.usuario_id
       JOIN perfis p ON p.id = up.perfil_id
       WHERE p.codigo = 'administrador' AND u.ativo = TRUE AND u.deletado_em IS NULL
       AND u.id <> $1 LIMIT 1`,
        [userId],
      );
      if (!others.rows.length)
        throw new ProfileError(
          409,
          "Não é permitido remover o último Administrador",
        );
    }
    await client.query(
      "DELETE FROM usuarios_perfis WHERE usuario_id = $1 AND perfil_id = $2",
      [userId, profileId],
    );
  });
const permissions = async (userId: string): Promise<string[] | null> => {
  const { rows } = await pool.query(
    `SELECT p.permissoes, extra.permissoes AS individuais FROM usuarios u
     LEFT JOIN usuarios_permissoes extra ON extra.usuario_id = u.id
     LEFT JOIN usuarios_perfis up ON up.usuario_id = u.id
     LEFT JOIN perfis p ON p.id = up.perfil_id
     WHERE u.id = $1 AND u.ativo = TRUE AND u.deletado_em IS NULL`,
    [userId],
  );
  if (!rows.length) return null;
  return [
    ...new Set(
      rows.flatMap((row) => [
        ...(row.permissoes ?? []),
        ...(row.individuais ?? []),
      ]),
    ),
  ] as string[];
};
export default { list, get, create, update, remove, assign, permissions };

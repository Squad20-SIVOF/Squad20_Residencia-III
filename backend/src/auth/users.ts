import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import model from "../models/profileModel";
import { authorize } from "../middleware/authorization";
import { hashPassword } from "./password";
import { DELEGABLE_PERMISSIONS } from "./permissions";
import type { AuthenticatedRequest } from "./session";

const router = Router();
const idSchema = z.string().uuid();
const userSchema = z
  .object({
    nome: z.string().trim().min(3).max(150),
    email: z
      .string()
      .trim()
      .email()
      .max(150)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(12).max(256),
    perfil_id: idSchema,
    motorista_id: idSchema.nullable().optional(),
  })
  .strict();

router.get("/", authorize("usuarios:gerenciar"), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nome, u.email, u.ativo, u.motorista_id, COALESCE((SELECT json_agg(json_build_object('id',p.id,'nome',p.nome)) FROM usuarios_perfis up JOIN perfis p ON p.id=up.perfil_id WHERE up.usuario_id=u.id), '[]') AS perfis FROM usuarios u WHERE u.deletado_em IS NULL ORDER BY u.nome, u.id`,
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Não foi possível listar usuários" });
  }
});

router.post("/", authorize("usuarios:gerenciar"), async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message:
        "Informe nome, e-mail, senha com ao menos 12 caracteres e perfil_id válido",
    });
    return;
  }
  try {
    const hash = await hashPassword(parsed.data.password);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "INSERT INTO usuarios (nome, email, password_hash, motorista_id) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, motorista_id",
        [
          parsed.data.nome,
          parsed.data.email,
          hash,
          parsed.data.motorista_id ?? null,
        ],
      );
      await client.query(
        "INSERT INTO usuarios_perfis (usuario_id, perfil_id) VALUES ($1, $2)",
        [rows[0].id, parsed.data.perfil_id],
      );
      await client.query("COMMIT");
      res.status(201).json(rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    res.status(code === "23505" ? 409 : code === "23503" ? 400 : 500).json({
      message:
        code === "23505"
          ? "E-mail ou motorista já vinculado a outra conta"
          : code === "23503"
            ? "Perfil não encontrado"
            : "Não foi possível criar usuário",
    });
  }
});

router.get(
  "/motoristas-opcoes",
  authorize("usuarios:gerenciar"),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id,nome FROM motoristas WHERE ativo AND deletado_em IS NULL ORDER BY nome",
      );
      res.json(rows);
    } catch {
      res
        .status(500)
        .json({ message: "Não foi possível consultar motoristas" });
    }
  },
);
router.put(
  "/:id/motorista",
  authorize("usuarios:gerenciar"),
  async (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    const input = z
      .object({ motorista_id: idSchema.nullable() })
      .strict()
      .safeParse(req.body);
    if (!id.success || !input.success) {
      res.status(400).json({ message: "Informe usuário e motorista válidos" });
      return;
    }
    try {
      const { rows } = await pool.query(
        "UPDATE usuarios SET motorista_id=$2,atualizado_em=NOW() WHERE id=$1 AND deletado_em IS NULL RETURNING id,motorista_id",
        [id.data, input.data.motorista_id],
      );
      if (!rows.length) {
        res.status(404).json({ message: "Usuário não encontrado" });
        return;
      }
      res.json(rows[0]);
    } catch (error) {
      const code = (error as { code?: string }).code;
      res.status(code === "23505" ? 409 : code === "23503" ? 400 : 500).json({
        message:
          code === "23505"
            ? "Motorista já vinculado a outra conta"
            : code === "23503"
              ? "Motorista não encontrado"
              : "Não foi possível vincular motorista",
      });
    }
  },
);

router.get(
  ["/permissoes", "/auxiliares"],
  authorize("usuarios:delegar-permissoes"),
  async (req, res) => {
    try {
      const actor = await model.permissions(
        (req as AuthenticatedRequest).user!.id,
      );
      const { rows } =
        await pool.query(`SELECT u.id, u.nome, u.email, COALESCE(extra.permissoes, '{}') AS permissoes,
      COALESCE((SELECT json_agg(json_build_object('id',p.id,'nome',p.nome)) FROM usuarios_perfis up JOIN perfis p ON p.id=up.perfil_id WHERE up.usuario_id=u.id), '[]') AS perfis,
      ARRAY(SELECT DISTINCT unnest(p.permissoes) FROM usuarios_perfis up JOIN perfis p ON p.id=up.perfil_id WHERE up.usuario_id=u.id) AS "permissoesHerdadas"
      FROM usuarios u LEFT JOIN usuarios_permissoes extra ON extra.usuario_id = u.id
      WHERE u.ativo AND u.deletado_em IS NULL ORDER BY u.nome, u.id`);
      res.json({
        usuarios: rows,
        permissoesDisponiveis: DELEGABLE_PERMISSIONS.filter((p) =>
          actor?.includes(p),
        ),
      });
    } catch {
      res.status(500).json({
        message: "Não foi possível consultar permissões dos usuários",
      });
    }
  },
);

router.put(
  "/:id/permissoes",
  authorize("usuarios:delegar-permissoes"),
  async (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    const input = z
      .object({
        permissoes: z
          .array(z.enum(DELEGABLE_PERMISSIONS))
          .max(DELEGABLE_PERMISSIONS.length),
      })
      .strict()
      .safeParse(req.body);
    if (
      !id.success ||
      !input.success ||
      new Set(input.data.permissoes).size !== input.data.permissoes.length
    ) {
      res
        .status(400)
        .json({ message: "Informe usuário e permissões operacionais válidos" });
      return;
    }
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(2034, 1)");
        const { rows: actors } = await client.query(
          `SELECT p.permissoes FROM usuarios u JOIN usuarios_perfis up ON up.usuario_id=u.id JOIN perfis p ON p.id=up.perfil_id WHERE u.id=$1 AND u.ativo AND u.deletado_em IS NULL`,
          [(req as AuthenticatedRequest).user!.id],
        );
        const actorPermissions = actors.flatMap(
          (r) => r.permissoes ?? [],
        ) as string[];
        if (
          !actorPermissions.includes("usuarios:delegar-permissoes") ||
          input.data.permissoes.some((p) => !actorPermissions.includes(p))
        ) {
          await client.query("ROLLBACK");
          res
            .status(403)
            .json({ message: "Você só pode delegar acessos que possui" });
          return;
        }
        const { rows } = await client.query(
          `SELECT u.id FROM usuarios u WHERE u.id=$1 AND u.ativo AND u.deletado_em IS NULL FOR UPDATE`,
          [id.data],
        );
        if (!rows.length) {
          await client.query("ROLLBACK");
          res.status(409).json({
            message: "A alteração exige um usuário ativo",
          });
          return;
        }
        await client.query(
          "INSERT INTO usuarios_permissoes (usuario_id, permissoes) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET permissoes=EXCLUDED.permissoes",
          [id.data, input.data.permissoes],
        );
        await client.query("COMMIT");
        res.json({ permissoes: input.data.permissoes });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch {
      res
        .status(500)
        .json({ message: "Não foi possível atualizar permissões" });
    }
  },
);
export default router;

import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import {
  phoneSchema,
  photoSchema,
  optionalText,
} from "../middleware/validations/schemas/contactSchema";
import profileModel from "../models/profileModel";
import { hashPassword, verifyPassword } from "./password";
import {
  authenticate,
  createSession,
  type AuthenticatedRequest,
} from "./session";

const router = Router();
const credentials = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(150)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(256),
  })
  .strict();
const attempts = new Map<string, { count: number; until: number }>();
let dummyHash: Promise<string> | undefined;

router.post("/login", async (req, res) => {
  const input = credentials.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ message: "Informe e-mail e senha válidos" });
    return;
  }
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until <= now) attempts.delete(key);
  const key = input.data.email;
  const attempt = attempts.get(key) ?? { count: 0, until: now + 60_000 };
  if (attempt.count >= 10 || attempts.size >= 10_000) {
    res.status(429).json({ message: "Muitas tentativas. Aguarde um minuto." });
    return;
  }
  attempt.count++;
  attempts.set(key, attempt);
  try {
    const { rows } = await pool.query(
      "SELECT id, nome, email, password_hash FROM usuarios WHERE LOWER(email) = $1 AND ativo = TRUE AND deletado_em IS NULL",
      [input.data.email],
    );
    const user = rows[0];
    dummyHash ??= hashPassword("invalid-account-placeholder");
    const valid = await verifyPassword(
      input.data.password,
      user?.password_hash ?? (await dummyHash),
    );
    if (!user?.password_hash || !valid) {
      res.status(401).json({ message: "E-mail ou senha inválidos" });
      return;
    }
    const session = await createSession(user.id);
    const permissions = await profileModel.permissions(user.id);
    res.json({
      ...session,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        permissoes: permissions ?? [],
      },
    });
  } catch {
    res.status(500).json({ message: "Não foi possível entrar" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const id = (req as AuthenticatedRequest).user!.id;
    const { rows } = await pool.query(
      "SELECT id, nome, email, telefone, departamento, cargo, matricula, foto, senha_alterada_em, motorista_id FROM usuarios WHERE id = $1",
      [id],
    );
    res.json({ ...rows[0], permissoes: await profileModel.permissions(id) });
  } catch {
    res.status(500).json({ message: "Não foi possível consultar o usuário" });
  }
});

const profileInput = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(150)
      .transform((value) => value.toLowerCase()),
    telefone: phoneSchema,
    departamento: optionalText(150),
    cargo: optionalText(150),
    matricula: optionalText(50),
    foto: photoSchema,
  })
  .strict();
router.put("/profile", authenticate, async (req, res) => {
  const parsed = profileInput.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: parsed.error.issues.map((i) => i.message).join("; ") });
    return;
  }
  try {
    const input = parsed.data;
    const { rows } = await pool.query(
      `UPDATE usuarios SET email=$2,
      telefone=CASE WHEN $3::jsonb ? 'telefone' THEN $3::jsonb->>'telefone' ELSE telefone END,
      departamento=CASE WHEN $3::jsonb ? 'departamento' THEN $3::jsonb->>'departamento' ELSE departamento END,
      cargo=CASE WHEN $3::jsonb ? 'cargo' THEN $3::jsonb->>'cargo' ELSE cargo END,
      matricula=CASE WHEN $3::jsonb ? 'matricula' THEN $3::jsonb->>'matricula' ELSE matricula END,
      foto=CASE WHEN $3::jsonb ? 'foto' THEN $3::jsonb->>'foto' ELSE foto END,
      atualizado_em=NOW() WHERE id=$1
      RETURNING id, nome, email, telefone, departamento, cargo, matricula, foto, senha_alterada_em`,
      [
        (req as AuthenticatedRequest).user!.id,
        input.email,
        JSON.stringify(input),
      ],
    );
    res.json(rows[0]);
  } catch (error) {
    res.status((error as { code?: string }).code === "23505" ? 409 : 500).json({
      message:
        (error as { code?: string }).code === "23505"
          ? "E-mail já cadastrado"
          : "Não foi possível salvar o perfil",
    });
  }
});

router.post("/password", authenticate, async (req, res) => {
  const parsed = z
    .object({
      currentPassword: z.string().min(1).max(256),
      newPassword: z.string().min(12).max(256),
    })
    .strict()
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Informe a senha atual e uma nova senha de 12 a 256 caracteres",
    });
    return;
  }
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { rows } = await pool.query(
      "SELECT password_hash FROM usuarios WHERE id=$1",
      [userId],
    );
    if (
      !rows[0]?.password_hash ||
      !(await verifyPassword(
        parsed.data.currentPassword,
        rows[0].password_hash,
      ))
    ) {
      res.status(400).json({ message: "Senha atual inválida" });
      return;
    }
    const hash = await hashPassword(parsed.data.newPassword);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        "UPDATE usuarios SET password_hash=$2, senha_alterada_em=NOW(), atualizado_em=NOW() WHERE id=$1 AND password_hash=$3",
        [userId, hash, rows[0].password_hash],
      );
      if (!updated.rowCount) {
        await client.query("ROLLBACK");
        res.status(409).json({
          message: "A senha foi alterada em outra sessão. Tente novamente.",
        });
        return;
      }
      await client.query(
        "DELETE FROM auth_sessions WHERE usuario_id=$1 AND token_hash<>$2",
        [userId, (req as AuthenticatedRequest).sessionHash],
      );
      await client.query("COMMIT");
      res.sendStatus(204);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    res.status(500).json({ message: "Não foi possível alterar a senha" });
  }
});

router.post("/logout", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM auth_sessions WHERE token_hash = $1", [
      (req as AuthenticatedRequest).sessionHash,
    ]);
    res.sendStatus(204);
  } catch {
    res.status(500).json({ message: "Não foi possível encerrar a sessão" });
  }
});
export default router;

import { z } from "zod";

export const userIdSchema = z.string().uuid("ID de usuário inválido");

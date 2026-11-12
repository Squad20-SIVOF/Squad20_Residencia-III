import type { RequestHandler } from "express";
import model from "../models/profileModel";
import { userIdSchema } from "../auth/identity";

import type { AuthenticatedRequest } from "../auth/session";
export const authorize =
  (permission: string): RequestHandler =>
  async (req, res, next) => {
    const identity = userIdSchema.safeParse(
      (req as AuthenticatedRequest).user?.id,
    );
    if (!identity.success) {
      res.status(401).json({ message: "Autenticação necessária" });
      return;
    }
    try {
      const permissions = await model.permissions(identity.data);
      if (permissions === null) {
        res.status(401).json({ message: "Usuário não está ativo" });
        return;
      }
      if (!permissions.includes(permission)) {
        res.status(403).json({ message: "Permissão insuficiente" });
        return;
      }
      next();
    } catch {
      res
        .status(500)
        .json({ message: "Não foi possível verificar as permissões" });
    }
  };

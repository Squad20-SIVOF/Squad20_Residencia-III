import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../auth/session";
import service from "../service/svo/svoService";
import { idFrom } from "../utils/controllerUtils";

// Erros do PostgreSQL podem conter dados pessoais nos detalhes.
// Mantém o contrato dos controllers sem registrar o erro bruto.
const handle =
  (
    operation: (
      req: AuthenticatedRequest,
    ) => Promise<{ status: number; message: unknown }>,
  ) =>
  async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const { status, message } = await operation(req);
      res.status(status).json({ message });
    } catch {
      res.status(500).json({
        message: "Não foi possível concluir a operação de atendimento SVO",
      });
    }
  };
export default {
  create: handle((req) => service.create(req.body, req.user?.id)),
  list: handle((req) => service.list(req.query)),
  get: handle((req) => service.get(idFrom(req))),
};

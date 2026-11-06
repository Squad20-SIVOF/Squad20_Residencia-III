import type { Request, Response } from "express";
import { idFrom } from "../utils/controllerUtils";
import service from "../service/svo/deathService";

const handle =
  (
    operation: (req: Request) => Promise<{ status: number; message: unknown }>,
  ) =>
  async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const { status, message } = await operation(req);
      res.status(status).json({ message });
    } catch {
      // Detalhes do erro do banco podem conter dados pessoais.
      res
        .status(500)
        .json({ message: "Não foi possível concluir a operação de óbito" });
    }
  };

export default {
  list: handle((req) => service.list(req.query)),
  listByTrip: handle((req) => service.list(req.query, idFrom(req))),
  get: handle((req) => service.get(idFrom(req))),
  create: handle((req) => service.save(req.body)),
  update: handle((req) => service.save(req.body, idFrom(req))),
  cancel: handle((req) => service.cancel(idFrom(req), req.body)),
};

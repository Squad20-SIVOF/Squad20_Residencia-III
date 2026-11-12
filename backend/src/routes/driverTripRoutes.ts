import { z } from "zod";
import sessionVehicle from "../models/driverSessionVehicleModel";
import { execute, parse } from "../utils/serviceUtils";
import { Router } from "express";
import { authorize } from "../middleware/authorization";
import { createHandler, idFrom } from "../utils/controllerUtils";
import type { AuthenticatedRequest } from "../auth/session";
import service from "../service/trips/driverTripService";
const router = Router();
const handle = createHandler("Não foi possível concluir a operação da viagem", {
  noStore: true,
  logError: false,
});
router.get(
  "/resumo",
  authorize("viagens:ler-proprias"),
  handle((req: AuthenticatedRequest) => service.summary(req.user?.id)),
);
router.get(
  "/viagens",
  authorize("viagens:ler-proprias"),
  handle((req: AuthenticatedRequest) => service.list(req.query, req.user?.id)),
);
router.get(
  "/viagens/:id",
  authorize("viagens:ler-proprias"),
  handle((req: AuthenticatedRequest) => service.get(idFrom(req), req.user?.id)),
);
router.post(
  "/viagens/:id/iniciar",
  authorize("viagens:atualizar-proprias"),
  handle((req: AuthenticatedRequest) =>
    service.capture(idFrom(req), req.body, "inicio", req.user?.id),
  ),
);
router.post(
  "/viagens/:id/finalizar",
  authorize("viagens:atualizar-proprias"),
  handle((req: AuthenticatedRequest) =>
    service.capture(idFrom(req), req.body, "fim", req.user?.id),
  ),
);
router.get(
  "/veiculo-sessao",
  authorize("viagens:ler-proprias"),
  handle((req: AuthenticatedRequest) =>
    execute(() => sessionVehicle.get(req.user!.id, req.sessionHash!)),
  ),
);
router.post(
  "/veiculo-sessao",
  authorize("viagens:atualizar-proprias"),
  handle((req: AuthenticatedRequest) =>
    execute(() => {
      const body = parse(
        z.object({ veiculo_id: z.string().uuid() }).strict(),
        req.body,
      );
      return sessionVehicle.set(
        req.user!.id,
        req.sessionHash!,
        body.veiculo_id,
      );
    }),
  ),
);
router.delete(
  "/veiculo-sessao",
  authorize("viagens:atualizar-proprias"),
  handle((req: AuthenticatedRequest) =>
    execute(() => sessionVehicle.remove(req.user!.id, req.sessionHash!)),
  ),
);
export default router;

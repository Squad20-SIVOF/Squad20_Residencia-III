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
export default router;

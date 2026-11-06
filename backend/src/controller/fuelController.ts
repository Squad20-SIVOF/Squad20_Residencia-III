import service from "../service/fuel/fuelService";
import { createHandler, idFrom } from "../utils/controllerUtils";
import type { AuthenticatedRequest } from "../auth/session";

const handle = createHandler(
  "Não foi possível concluir a operação de abastecimentos",
);
export default {
  getAllFuel: handle((req) => service.list(req.query)),
  getFuelById: handle((req) => service.get(idFrom(req))),
  getFuelOptions: handle(() => service.options()),
  createFuel: handle((req) => service.save(req.body)),
  updateFuel: handle((req) => service.save(req.body, idFrom(req))),
  deleteFuel: handle((req) => service.remove(idFrom(req))),
  getDriverFuelOptions: handle((req: AuthenticatedRequest) =>
    service.ownOptions(req.user?.id),
  ),
  getDriverFuelSummary: handle((req: AuthenticatedRequest) =>
    service.ownSummary(req.query, req.user?.id),
  ),
  createDriverFuel: handle((req: AuthenticatedRequest) =>
    service.save(req.body, undefined, req.user?.id, true),
  ),
};

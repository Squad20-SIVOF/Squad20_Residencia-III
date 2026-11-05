import service from "../service/driver/driverInspectionService";
import { createHandler } from "../utils/controllerUtils";
import type { AuthenticatedRequest } from "../auth/session";

const handle = createHandler("Não foi possível registrar a vistoria");
export default {
  getDriverInspections: handle((req: AuthenticatedRequest) =>
    service.list(req.user?.id),
  ),
  createDriverInspection: handle((req: AuthenticatedRequest) =>
    service.save(req.body, req.user?.id),
  ),
};

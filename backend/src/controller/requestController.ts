import type { AuthenticatedRequest } from "../auth/session";
import service from "../service/request/requestService";
import { createHandler, idFrom } from "../utils/controllerUtils";
const handle = createHandler(
  "Não foi possível concluir a operação de solicitações",
);
export default {
  list: handle((req: AuthenticatedRequest) =>
    service.list(req.query, req.user?.id),
  ),
  get: handle((req: AuthenticatedRequest) =>
    service.get(idFrom(req), req.user?.id),
  ),
  update: handle((req: AuthenticatedRequest) =>
    service.update(idFrom(req), req.body, req.user?.id),
  ),
  cancel: handle((req: AuthenticatedRequest) =>
    service.cancel(idFrom(req), req.body, req.user?.id),
  ),
};

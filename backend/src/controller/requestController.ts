import type { AuthenticatedRequest } from "../auth/session";
import service from "../service/request/requestService";
import workflow from "../service/request/requestWorkflowService";
import { createHandler, idFrom } from "../utils/controllerUtils";
const handle = createHandler(
  "Não foi possível concluir a operação de solicitações",
);
export default {
  create: handle((req: AuthenticatedRequest) =>
    workflow.create(req.body, req.user?.id),
  ),
  approve: handle((req: AuthenticatedRequest) =>
    workflow.approve(idFrom(req), req.body, req.user?.id),
  ),
  reject: handle((req: AuthenticatedRequest) =>
    workflow.reject(idFrom(req), req.body, req.user?.id),
  ),
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

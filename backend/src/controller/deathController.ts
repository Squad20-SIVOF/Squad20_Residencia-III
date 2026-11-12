import type { AuthenticatedRequest } from "../auth/session";
import { createHandler, idFrom } from "../utils/controllerUtils";
import service from "../service/svo/deathService";

const handle = createHandler("Não foi possível concluir a operação de óbito", {
  noStore: true,
  logError: false,
});

export default {
  list: handle((req) => service.list(req.query)),
  listByTrip: handle((req) => service.list(req.query, idFrom(req))),
  get: handle((req) => service.get(idFrom(req))),
  create: handle((req: AuthenticatedRequest) =>
    service.save(req.body, undefined, req.user?.id),
  ),
  update: handle((req: AuthenticatedRequest) =>
    service.save(req.body, idFrom(req), req.user?.id),
  ),
  cancel: handle((req) => service.cancel(idFrom(req), req.body)),
};

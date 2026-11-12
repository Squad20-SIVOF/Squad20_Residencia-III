import type { AuthenticatedRequest } from "../auth/session";
import service from "../service/trips/tripStatusService";
import { createHandler, idFrom } from "../utils/controllerUtils";

const handle = createHandler("Não foi possível alterar o status da viagem", {
  noStore: true,
  logError: false,
});
export default {
  transition: handle((req: AuthenticatedRequest) =>
    service.transition(idFrom(req), req.body, req.user?.id),
  ),
};

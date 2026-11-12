import type { AuthenticatedRequest } from "../auth/session";
import service from "../service/svo/svoService";
import { createHandler, idFrom } from "../utils/controllerUtils";

// Erros do PostgreSQL podem conter dados pessoais nos detalhes.
// Mantém o contrato dos controllers sem registrar o erro bruto.
const handle = createHandler(
  "Não foi possível concluir a operação de atendimento SVO",
  {
    noStore: true,
    logError: false,
  },
);

export default {
  create: handle((req: AuthenticatedRequest) =>
    service.create(req.body, req.user?.id),
  ),
  list: handle((req) => service.list(req.query)),
  get: handle((req) => service.get(idFrom(req))),
};

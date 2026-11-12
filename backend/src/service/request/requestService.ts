import { execute, parse } from "../../utils/serviceUtils";
import model, {
  RequestError,
  type RequestScope,
} from "../../models/requestModel";
import profileModel from "../../models/profileModel";
import {
  requestIdSchema,
  requestQuerySchema,
  requestUpdateSchema,
  requestCancelSchema,
} from "../../middleware/validations/schemas/requestSchema";

const scopeFor = async (userId?: string): Promise<RequestScope> => {
  if (!userId || !requestIdSchema.safeParse(userId).success)
    throw new RequestError(401, "Autenticação necessária");
  const permissions = await profileModel.permissions(userId);
  if (permissions === null)
    throw new RequestError(401, "Usuário inativo ou inexistente");
  const manager = await model.isManager(userId);
  if (!manager && !permissions.includes("solicitacoes:ler-proprias"))
    throw new RequestError(403, "Sem permissão para acessar solicitações");
  return { userId, manager };
};
const list = (query: unknown, userId?: string) =>
  execute(async () => {
    const scope = await scopeFor(userId);
    return model.list(scope, parse(requestQuerySchema, query));
  });
const get = (id: string, userId?: string) =>
  execute(async () => {
    const scope = await scopeFor(userId);
    return model.get(parse(requestIdSchema, id), scope);
  });
const update = (id: string, body: unknown, userId?: string) =>
  execute(async () => {
    const scope = await scopeFor(userId);
    return model.update(
      parse(requestIdSchema, id),
      parse(requestUpdateSchema, body),
      scope,
    );
  });
const cancel = (id: string, body: unknown, userId?: string) =>
  execute(async () => {
    const scope = await scopeFor(userId);
    if (!scope.manager)
      throw new RequestError(
        403,
        "Somente Gestor de Frota ou Administrador pode cancelar",
      );
    return model.cancel(
      parse(requestIdSchema, id),
      parse(requestCancelSchema, body).motivo,
      scope,
    );
  });
export default { list, get, update, cancel };

import model from "../../models/tripModel";
import profiles from "../../models/profileModel";
import {
  tripIdSchema,
  tripTransitionSchema,
} from "../../middleware/validations/schemas/tripSchema";
import { DomainError, execute, parse } from "../../utils/serviceUtils";

const transition = (id: string, body: unknown, userId?: string) =>
  execute(async () => {
    if (!tripIdSchema.safeParse(userId).success)
      throw new DomainError(401, "Autenticação necessária");
    const identity = userId as string;
    const permissions = await profiles.permissions(identity);
    if (permissions === null)
      throw new DomainError(401, "Usuário inativo ou inexistente");
    const manager = permissions.includes("viagens:gerenciar");
    if (!manager && !permissions.includes("viagens:atualizar-proprias"))
      throw new DomainError(403, "Sem permissão para alterar viagens");
    return model.transition(
      parse(tripIdSchema, id),
      parse(tripTransitionSchema, body),
      { userId: identity, manager },
    );
  });
// SCRUM-38 valida o QR antes de chamar estes adaptadores. Eles não aceitam
// usuário vindo do QR: a identidade continua sendo a sessão autenticada.
const checkIn = (id: string, userId?: string) =>
  transition(id, { status: "Em andamento" }, userId);
const checkOut = (id: string, userId?: string) =>
  transition(id, { status: "Finalizada" }, userId);
export default { transition, checkIn, checkOut };

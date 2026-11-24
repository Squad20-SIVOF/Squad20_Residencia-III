import model from "../../models/requestWorkflowModel";
import { execute, parse, DomainError } from "../../utils/serviceUtils";
import {
  requestCreateSchema,
  requestApprovalSchema,
  requestCancelSchema,
  requestIdSchema,
} from "../../middleware/validations/schemas/requestSchema";

const identity = (userId?: string) => {
  if (!requestIdSchema.safeParse(userId).success)
    throw new DomainError(401, "Autenticação necessária");
  return userId!;
};
const run = (operation: () => Promise<unknown>, status = 200) =>
  execute(async () => {
    try {
      return await operation();
    } catch (error) {
      const db = error as { code?: string; constraint?: string };
      if (
        db.code === "23P01" &&
        ["viagens_reserva_veiculo", "viagens_reserva_motorista"].includes(
          db.constraint ?? "",
        )
      )
        throw new DomainError(
          409,
          "Veículo ou motorista já reservado neste período",
        );
      if (db.code === "23503")
        throw new DomainError(409, "O vínculo informado não existe mais");
      throw error;
    }
  }, status);

export default {
  create: (body: unknown, userId?: string) =>
    run(
      () => model.create(parse(requestCreateSchema, body), identity(userId)),
      201,
    ),
  approve: (id: string, body: unknown, userId?: string) =>
    run(() =>
      model.approve(
        parse(requestIdSchema, id),
        parse(requestApprovalSchema, body),
        identity(userId),
      ),
    ),
  reject: (id: string, body: unknown, userId?: string) =>
    run(() =>
      model.reject(
        parse(requestIdSchema, id),
        parse(requestCancelSchema, body).motivo,
        identity(userId),
      ),
    ),
};

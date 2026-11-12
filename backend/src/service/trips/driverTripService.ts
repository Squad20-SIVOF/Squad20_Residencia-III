import model from "../../models/driverTripModel";
import { userIdSchema } from "../../auth/identity";
import { tripIdSchema } from "../../middleware/validations/schemas/tripSchema";
import {
  driverTripCaptureSchema,
  driverTripQuerySchema,
} from "../../middleware/validations/schemas/driverTripSchema";
import { DomainError, execute, parse } from "../../utils/serviceUtils";
const identity = (id?: string) => {
  if (!userIdSchema.safeParse(id).success)
    throw new DomainError(401, "Autenticação necessária");
  return id as string;
};
export default {
  list: (query: unknown, userId?: string) =>
    execute(() =>
      model.list(identity(userId), parse(driverTripQuerySchema, query)),
    ),
  get: (id: string, userId?: string) =>
    execute(() => model.get(identity(userId), parse(tripIdSchema, id))),
  summary: (userId?: string) => execute(() => model.summary(identity(userId))),
  capture: (
    id: string,
    body: unknown,
    type: "inicio" | "fim",
    userId?: string,
  ) =>
    execute(() =>
      model.capture(
        identity(userId),
        parse(tripIdSchema, id),
        parse(driverTripCaptureSchema, body),
        type,
      ),
    ),
};

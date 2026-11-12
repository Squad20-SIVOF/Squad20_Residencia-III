import { execute } from "../../utils/serviceUtils";
import model, { DeathError } from "../../models/deathModel";
import {
  deathCancelSchema,
  deathIdSchema,
  deathInputSchema,
  deathQuerySchema,
} from "../../middleware/validations/schemas/deathSchema";

const parseId = (id: string) => {
  const parsed = deathIdSchema.safeParse(id);
  if (!parsed.success) throw new DeathError(400, "ID inválido");
  return parsed.data;
};

const list = (query: unknown, tripId?: string) =>
  execute(async () => {
    const parsed = deathQuerySchema.safeParse(query);
    if (!parsed.success) throw new DeathError(400, "Paginação inválida");
    return model.list(
      parsed.data,
      tripId === undefined ? undefined : parseId(tripId),
    );
  });

const get = (id: string) =>
  execute(async () => {
    const row = await model.get(parseId(id));
    if (!row) throw new DeathError(404, "Óbito não encontrado");
    return row;
  });

const save = (body: unknown, id?: string, userId?: string) =>
  execute(
    async () => {
      if (!deathIdSchema.safeParse(userId).success)
        throw new DeathError(401, "Autenticação necessária");
      const parsed = deathInputSchema.safeParse(body);
      if (!parsed.success)
        throw new DeathError(
          400,
          parsed.error.issues.map((issue) => issue.message).join("; "),
        );
      return model.save(
        parsed.data,
        userId as string,
        id === undefined ? undefined : parseId(id),
      );
    },
    id === undefined ? 201 : 200,
  );

const cancel = (id: string, body: unknown) =>
  execute(async () => {
    const parsed = deathCancelSchema.safeParse(body);
    if (!parsed.success)
      throw new DeathError(400, "Informe um motivo de até 500 caracteres");
    return model.cancel(parseId(id), parsed.data.motivo);
  });

export default { list, get, save, cancel };

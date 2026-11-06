import model, { DeathError } from "../../models/deathModel";
import {
  deathCancelSchema,
  deathIdSchema,
  deathInputSchema,
  deathQuerySchema,
} from "../../middleware/validations/schemas/deathSchema";

const execute = async (operation: () => Promise<unknown>, status = 200) => {
  try {
    return { message: await operation(), status };
  } catch (error) {
    if (error instanceof DeathError)
      return { status: error.status, message: error.message };
    throw error;
  }
};

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

const save = (body: unknown, id?: string) =>
  execute(
    async () => {
      const parsed = deathInputSchema.safeParse(body);
      if (!parsed.success)
        throw new DeathError(
          400,
          parsed.error.issues.map((issue) => issue.message).join("; "),
        );
      return model.save(
        parsed.data,
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

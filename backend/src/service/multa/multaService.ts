import model, { MultaError } from "../../models/multaModel";
import {
  multaIdSchema,
  multaInputSchema,
  multaQuerySchema,
} from "../../middleware/validations/schemas/multaSchema";

const execute = async (operation: () => Promise<unknown>, status = 200) => {
  try {
    return { message: await operation(), status };
  } catch (error) {
    if (error instanceof MultaError)
      return { message: error.message, status: error.status };
    const dbError = error as { code?: string };
    if (dbError?.code === "23503")
      return {
        message: "Veículo ou motorista inexistente ou em uso",
        status: 409,
      };
    throw error;
  }
};

const parseId = (id: string) => {
  const result = multaIdSchema.safeParse(id);
  if (!result.success) throw new MultaError(400, "ID inválido");
  return result.data;
};

const list = (query: unknown) =>
  execute(async () => {
    const input = multaQuerySchema.safeParse(query);
    if (!input.success) throw new MultaError(400, "Filtros inválidos");
    return model.list(input.data);
  });

const get = (id: string) =>
  execute(async () => {
    const row = await model.get(parseId(id));
    if (!row) throw new MultaError(404, "Multa não encontrada");
    return row;
  });

const save = (body: unknown, id?: string) =>
  execute(
    async () => {
      const input = multaInputSchema.safeParse(body);
      if (!input.success)
        throw new MultaError(
          400,
          input.error.issues.map((issue) => issue.message).join("; "),
        );
      const validId = id === undefined ? undefined : parseId(id);
      const result = await model.save(input.data, validId);
      if (validId && !result) throw new MultaError(404, "Multa não encontrada");
      return result;
    },
    id === undefined ? 201 : 200,
  );

const remove = (id: string) =>
  execute(async () => {
    if (!(await model.remove(parseId(id))))
      throw new MultaError(404, "Multa não encontrada");
    return undefined;
  }, 204);

const options = () => execute(() => model.options());

export default { list, get, save, remove, options };

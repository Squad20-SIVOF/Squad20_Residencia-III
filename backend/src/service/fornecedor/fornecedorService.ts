import model, { FornecedorError } from "../../models/fornecedorModel";
import {
  fornecedorIdSchema,
  fornecedorInputSchema,
  fornecedorQuerySchema,
} from "../../middleware/validations/schemas/fornecedorSchema";

const execute = async (operation: () => Promise<unknown>, status = 200) => {
  try {
    return { message: await operation(), status };
  } catch (error) {
    if (error instanceof FornecedorError)
      return { message: error.message, status: error.status };
    const dbError = error as { code?: string; constraint?: string };
    if (
      dbError?.code === "23505" &&
      dbError.constraint === "fornecedores_cnpj_key"
    )
      return { message: "CNPJ já cadastrado", status: 409 };
    throw error;
  }
};

const parseId = (id: string) => {
  const result = fornecedorIdSchema.safeParse(id);
  if (!result.success) throw new FornecedorError(400, "ID inválido");
  return result.data;
};

const list = (query: unknown) =>
  execute(async () => {
    const input = fornecedorQuerySchema.safeParse(query);
    if (!input.success) throw new FornecedorError(400, "Filtros inválidos");
    return model.list(input.data);
  });

const get = (id: string) =>
  execute(async () => {
    const row = await model.get(parseId(id));
    if (!row) throw new FornecedorError(404, "Fornecedor não encontrado");
    return row;
  });

const save = (body: unknown, id?: string) =>
  execute(
    async () => {
      const input = fornecedorInputSchema.safeParse(body);
      if (!input.success)
        throw new FornecedorError(
          400,
          input.error.issues.map((issue) => issue.message).join("; "),
        );
      const validId = id === undefined ? undefined : parseId(id);
      const result = await model.save(input.data, validId);
      if (validId && !result)
        throw new FornecedorError(404, "Fornecedor não encontrado");
      return result;
    },
    id === undefined ? 201 : 200,
  );

const remove = (id: string) =>
  execute(async () => {
    if (!(await model.remove(parseId(id))))
      throw new FornecedorError(404, "Fornecedor não encontrado");
    return undefined;
  }, 204);

export default { list, get, save, remove };

import maintanceModel from "../models/maintanceModel";
import maintanceSchema, {
  maintanceIdSchema,
} from "../middleware/validations/schemas/maintanceSchema";

const success = (message: unknown, status = 200) => ({
  type: "success",
  message,
  status,
});
const error = (message: string, status: number) => ({
  type: "error",
  message,
  status,
});
const invalidId = (id: string) => !maintanceIdSchema.safeParse(id).success;
const notFound = () => error("Manutenção não encontrada", 404);

const handleDuplicateKeyError = (cause: unknown) => {
  const dbError = cause as { code?: string; constraint?: string };
  if (dbError?.code === "23503") return error("Veículo não encontrado", 400);
  if (dbError?.code === "23514")
    return error("Dados de manutenção inválidos", 400);
  if (dbError?.code !== "23505") throw cause;
  if (dbError.constraint === "veiculos_key")
    return error("Veiculo já vinculado", 409);
  throw cause;
};

const getAllMaintance = async () =>
  success(await maintanceModel.getAllMaintance());

const getMaintanceById = async (id: string) => {
  if (invalidId(id)) return error("Invalid maintance ID", 400);
  const maintance = await maintanceModel.getMaintancById(id);
  return maintance ? success(maintance) : notFound();
};

const createMaintance = async (body: unknown) => {
  const validation = maintanceSchema.safeParse(body);
  if (!validation.success) return error(validation.error.message, 400);
  try {
    const createdMaintance = await maintanceModel.createMaintance(
      validation.data,
    );
    return success(createdMaintance, 201);
  } catch (cause) {
    return handleDuplicateKeyError(cause);
  }
};

const updateMaintance = async (id: string, body: unknown) => {
  if (invalidId(id)) return error("Invalid maintance ID", 400);
  const validation = maintanceSchema.safeParse(body);
  if (validation.error) return error(validation.error.message, 400);
  try {
    const maintance = await maintanceModel.updateMaintance(id, validation.data);
    return maintance ? success(maintance, 200) : notFound();
  } catch (cause) {
    return handleDuplicateKeyError(cause);
  }
};

const deleteMaintance = async (id: string) => {
  if (invalidId(id)) return error("Invalid maintance ID", 400);
  return (await maintanceModel.deleteMaintance(id))
    ? success("Maintance deleted succesfully")
    : notFound();
};

export = {
  getAllMaintance,
  getMaintanceById,
  createMaintance,
  updateMaintance,
  deleteMaintance,
};

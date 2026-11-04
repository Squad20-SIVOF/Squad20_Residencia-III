import model from "../../models/svoModel";
import {
  svoAttendanceSchema,
  svoIdSchema,
  svoQuerySchema,
} from "../../middleware/validations/schemas/svoSchema";

const create = async (body: unknown, userId?: string) => {
  const identity = svoIdSchema.safeParse(userId);
  if (!identity.success)
    return { status: 401, message: "Autenticação necessária" };
  const parsed = svoAttendanceSchema.safeParse(body);
  if (!parsed.success)
    return {
      status: 400,
      message: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  return {
    status: 201,
    message: await model.create(parsed.data, identity.data),
  };
};
const list = async (query: unknown) => {
  const parsed = svoQuerySchema.safeParse(query);
  if (!parsed.success)
    return {
      status: 400,
      message: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  return { status: 200, message: await model.list(parsed.data) };
};
const get = async (id: string) => {
  const parsed = svoIdSchema.safeParse(id);
  if (!parsed.success) return { status: 400, message: "ID inválido" };
  const attendance = await model.get(parsed.data);
  return attendance
    ? { status: 200, message: attendance }
    : { status: 404, message: "Atendimento SVO não encontrado" };
};
export default { create, list, get };

import model, { FuelError } from "../../models/fuelModel";
import account, { DriverAccountError } from "../driver/driverAccountService";
import {
  fuelIdSchema,
  fuelInputSchema,
  fuelQuerySchema,
} from "../../middleware/validations/schemas/fuelSchema";
import { calculateFuelTotal } from "../../utils/fuelUtils";

const execute = async (operation: () => Promise<unknown>, status = 200) => {
  try {
    return { message: await operation(), status };
  } catch (error) {
    if (error instanceof FuelError || error instanceof DriverAccountError)
      return { message: error.message, status: error.status };
    throw error;
  }
};
const parseId = (id: string) => {
  const result = fuelIdSchema.safeParse(id);
  if (!result.success) throw new FuelError(400, "ID inválido");
  return result.data;
};
const list = (query: unknown) =>
  execute(async () => {
    const input = fuelQuerySchema.safeParse(query);
    if (!input.success) throw new FuelError(400, "Filtros inválidos");
    return model.list(input.data);
  });
const get = (id: string) =>
  execute(async () => {
    const row = await model.get(parseId(id));
    if (!row) throw new FuelError(404, "Abastecimento não encontrado");
    return row;
  });
const save = (body: unknown, id?: string, userId?: string, own = false) =>
  execute(
    async () => {
      let payload = body;
      if (own) {
        if (
          !payload ||
          typeof payload !== "object" ||
          Array.isArray(payload) ||
          "motorista_id" in payload
        )
          throw new FuelError(400, "O motorista é identificado pela sua conta");
        const driver = await account.ownDriver(userId);
        const vehicle = (payload as Record<string, unknown>).veiculo_id;
        payload = { ...payload, motorista_id: driver.id };
        if (fuelIdSchema.safeParse(vehicle).success)
          await account.canUseVehicle(driver.id, vehicle as string);
      }
      const input = fuelInputSchema.safeParse(payload);
      if (!input.success)
        throw new FuelError(
          400,
          input.error.issues.map((issue) => issue.message).join("; "),
        );
      const validId = id === undefined ? undefined : parseId(id);
      return model.save(
        input.data,
        calculateFuelTotal(input.data.litros, input.data.preco_litro),
        validId,
      );
    },
    id === undefined ? 201 : 200,
  );
const remove = (id: string) =>
  execute(async () => {
    if (!(await model.remove(parseId(id))))
      throw new FuelError(404, "Abastecimento não encontrado");
    return undefined;
  }, 204);
const options = () => execute(() => model.options());
const ownOptions = (userId?: string) =>
  execute(async () => model.ownOptions(await account.ownDriver(userId)));
const ownSummary = (query: unknown, userId?: string) =>
  execute(async () => {
    const input = fuelQuerySchema.safeParse(query);
    if (
      !input.success ||
      !input.data.veiculo_id ||
      !input.data.data_inicio ||
      !input.data.data_fim
    )
      throw new FuelError(400, "Selecione veículo e período");
    const driver = await account.ownDriver(userId);
    await account.canUseVehicle(driver.id, input.data.veiculo_id);
    return model.summary(
      input.data.veiculo_id,
      input.data.data_inicio,
      input.data.data_fim,
    );
  });
export default { list, get, save, remove, options, ownOptions, ownSummary };

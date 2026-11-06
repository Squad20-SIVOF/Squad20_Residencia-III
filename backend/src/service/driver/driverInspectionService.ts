import model from "../../models/driverInspectionModel";
import account, { DriverAccountError } from "./driverAccountService";
import schema from "../../middleware/validations/schemas/driverInspectionSchema";

const execute = async (operation: () => Promise<unknown>, status = 200) => {
  try {
    return { message: await operation(), status };
  } catch (error) {
    if (error instanceof DriverAccountError)
      return { message: error.message, status: error.status };
    throw error;
  }
};
const list = (userId?: string) =>
  execute(async () => model.list(await account.ownDriver(userId)));
const save = (body: unknown, userId?: string) =>
  execute(async () => {
    const input = schema.safeParse(body);
    if (!input.success)
      throw new DriverAccountError(
        400,
        "Informe veículo e itens válidos para a vistoria",
      );
    const driver = await account.ownDriver(userId);
    await account.canUseVehicle(driver.id, input.data.veiculo_id);
    await model.save(input.data);
  }, 204);
export default { list, save };

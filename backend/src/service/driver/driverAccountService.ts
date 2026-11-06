import model from "../../models/driverAccountModel";

export class DriverAccountError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const ownDriver = async (userId?: string) => {
  if (!userId) throw new DriverAccountError(401, "Autenticação necessária");
  const driver = await model.getByUserId(userId);
  if (!driver)
    throw new DriverAccountError(
      409,
      "Sua conta ainda não está vinculada a um motorista ativo. Peça ao administrador para configurar em Usuários e permissões.",
    );
  return driver;
};
const canUseVehicle = async (driverId: string, vehicleId: string) => {
  if (!(await model.hasVehicle(driverId, vehicleId)))
    throw new DriverAccountError(
      403,
      "Veículo não vinculado ao seu cadastro de motorista",
    );
};
export default { ownDriver, canUseVehicle };

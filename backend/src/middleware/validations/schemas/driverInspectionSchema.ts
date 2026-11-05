import { z } from "zod";
import vehicleSchema from "./vehicleSchema";
export const driverInspectionSchema = z
  .object({
    veiculo_id: z.string().uuid(),
    itens: vehicleSchema.shape.checklist_vistoria.unwrap().min(1),
  })
  .strict();
export type DriverInspectionInput = z.infer<typeof driverInspectionSchema>;
export default driverInspectionSchema;

import { authorize } from "../middleware/authorization";
import { Router } from "express";
import fuelController from "../controller/fuelController";

const router = Router();
router.get("/", authorize("abastecimentos:ler"), fuelController.getAllFuel);
router.get(
  "/opcoes",
  authorize("abastecimentos:gerenciar"),
  fuelController.getFuelOptions,
);
router.get("/:id", authorize("abastecimentos:ler"), fuelController.getFuelById);
router.post(
  "/",
  authorize("abastecimentos:gerenciar"),
  fuelController.createFuel,
);
router.put(
  "/:id",
  authorize("abastecimentos:gerenciar"),
  fuelController.updateFuel,
);
router.delete(
  "/:id",
  authorize("abastecimentos:gerenciar"),
  fuelController.deleteFuel,
);

export const fuelRoutes = router;
export default fuelRoutes;

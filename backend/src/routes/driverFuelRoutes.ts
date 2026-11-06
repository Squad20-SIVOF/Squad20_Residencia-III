import { authorize } from "../middleware/authorization";
import { Router } from "express";
import fuelController from "../controller/fuelController";

const router = Router();
router.get(
  "/opcoes",
  authorize("abastecimentos:criar-proprio"),
  fuelController.getDriverFuelOptions,
);
router.get(
  "/resumo",
  authorize("abastecimentos:criar-proprio"),
  fuelController.getDriverFuelSummary,
);
router.post(
  "/",
  authorize("abastecimentos:criar-proprio"),
  fuelController.createDriverFuel,
);

export const driverFuelRoutes = router;
export default driverFuelRoutes;

import { authorize } from "../middleware/authorization";
import { Router } from "express";
import driverInspectionController from "../controller/driverInspectionController";

const router = Router();
router.get(
  "/",
  authorize("veiculos:vistoriar-proprios"),
  driverInspectionController.getDriverInspections,
);
router.post(
  "/",
  authorize("veiculos:vistoriar-proprios"),
  driverInspectionController.createDriverInspection,
);

export const driverInspectionRoutes = router;
export default driverInspectionRoutes;

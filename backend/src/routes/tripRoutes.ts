import { Router } from "express";
import controller from "../controller/tripController";

const router = Router();
// O serviço valida permissão e escopo próprio; o app exige autenticação.
router.patch("/:id/status", controller.transition);
export default router;

import { Router } from "express";
import { authorize } from "../middleware/authorization";
import controller from "../controller/svoController";

const router = Router();
router.post("/atendimentos", authorize("svo:registrar"), controller.create);
router.get("/atendimentos", authorize("svo:ler"), controller.list);
router.get("/atendimentos/:id", authorize("svo:ler"), controller.get);
export default router;

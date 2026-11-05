import { Router } from "express";
import controller from "../controller/deathController";
import { authorize } from "../middleware/authorization";

const router = Router();
router.get("/", authorize("obitos:ler"), controller.list);
router.get("/:id", authorize("obitos:ler"), controller.get);
router.post("/", authorize("obitos:gerenciar"), controller.create);
router.put("/:id", authorize("obitos:gerenciar"), controller.update);
router.patch("/:id/cancelar", authorize("obitos:gerenciar"), controller.cancel);

export default router;

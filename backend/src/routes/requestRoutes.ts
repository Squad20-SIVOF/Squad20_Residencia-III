import { Router } from "express";
import controller from "../controller/requestController";
const router = Router();
router.get("/", controller.list);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.patch("/:id/cancelar", controller.cancel);
export default router;

import { Router } from "express";
import controller from "../controller/multaController";
import { authorize } from "../middleware/authorization";

const router = Router();
router.get("/", authorize("multas:ler"), controller.list);
router.get("/opcoes", authorize("multas:gerenciar"), controller.options);
router.get("/:id", authorize("multas:ler"), controller.get);
router.post("/", authorize("multas:gerenciar"), controller.create);
router.put("/:id", authorize("multas:gerenciar"), controller.update);
router.delete("/:id", authorize("multas:gerenciar"), controller.remove);
export default router;

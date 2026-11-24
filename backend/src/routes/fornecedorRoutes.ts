import { Router } from "express";
import controller from "../controller/fornecedorController";
import { authorize } from "../middleware/authorization";

const router = Router();
router.get("/", authorize("fornecedores:ler"), controller.list);
router.get("/:id", authorize("fornecedores:ler"), controller.get);
router.post("/", authorize("fornecedores:gerenciar"), controller.create);
router.put("/:id", authorize("fornecedores:gerenciar"), controller.update);
router.delete("/:id", authorize("fornecedores:gerenciar"), controller.remove);
export default router;

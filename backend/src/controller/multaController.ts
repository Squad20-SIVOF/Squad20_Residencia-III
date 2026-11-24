import service from "../service/multa/multaService";
import { createHandler, idFrom } from "../utils/controllerUtils";

const handle = createHandler("Não foi possível concluir a operação de multas");

export default {
  list: handle((req) => service.list(req.query)),
  get: handle((req) => service.get(idFrom(req))),
  create: handle((req) => service.save(req.body)),
  update: handle((req) => service.save(req.body, idFrom(req))),
  remove: handle((req) => service.remove(idFrom(req))),
  options: handle(() => service.options()),
};

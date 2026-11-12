import service from "./svoService";
import model from "../../models/svoModel";

jest.mock("../../models/svoModel", () => ({
  __esModule: true,
  default: { create: jest.fn(), list: jest.fn(), get: jest.fn() },
}));
const userId = "11111111-1111-4111-8111-111111111111";
const input = {
  falecido_nome: "Pessoa de Teste",
  solicitante_nome: "Contato de Teste",
  solicitante_telefone: "(79) 99999-1234",
  endereco_ocorrencia: "Rua de Teste, 100, Centro, Aracaju",
};
describe("registro e triagem SVO", () => {
  beforeEach(() => jest.resetAllMocks());
  it("exige identidade válida antes de gravar", async () => {
    expect((await service.create(input)).status).toBe(401);
    expect(model.create).not.toHaveBeenCalled();
  });
  it("normaliza os dados e usa prioridade Normal por padrão", async () => {
    jest
      .mocked(model.create)
      .mockResolvedValue({ id: userId, status: "Registrada" });
    const result = await service.create(
      { ...input, solicitante_nome: "  Contato de Teste  " },
      userId,
    );
    expect(result.status).toBe(201);
    expect(model.create).toHaveBeenCalledWith(
      {
        ...input,
        solicitante_telefone: "79999991234",
        prioridade: "Normal",
      },
      userId,
    );
  });
  it("permite falecido ainda não identificado sem inventar um nome", async () => {
    expect(
      (await service.create({ ...input, falecido_nome: null }, userId)).status,
    ).toBe(201);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ falecido_nome: null }),
      userId,
    );
  });
  it.each([
    { falecido_nome: "" },
    { solicitante_nome: " " },
    { solicitante_telefone: "999991234" },
    { solicitante_telefone: "abc79999991234" },
    { endereco_ocorrencia: "" },
    { prioridade: "Crítica" },
    { observacoes: "x".repeat(2001) },
    { registrado_por: userId },
    { viagem_id: userId },
    { status: "Concluída" },
    { categoria: "Administrativa" },
  ])("rejeita campos inválidos ou fora do escopo: %j", async (change) => {
    expect((await service.create({ ...input, ...change }, userId)).status).toBe(
      400,
    );
    expect(model.create).not.toHaveBeenCalled();
  });
  it("não aceita omitir os dados obrigatórios", async () => {
    expect((await service.create({}, userId)).status).toBe(400);
    expect(model.create).not.toHaveBeenCalled();
  });
  it("valida paginação e filtro antes de consultar", async () => {
    for (const query of [
      { pagina: 0 },
      { limite: 101 },
      { prioridade: "Inválida" },
      { busca: "nome" },
    ]) {
      expect((await service.list(query)).status).toBe(400);
    }
    expect(model.list).not.toHaveBeenCalled();
  });
  it("aplica os limites padrão e preserva filtro de prioridade", async () => {
    expect((await service.list({ prioridade: "Urgente" })).status).toBe(200);
    expect(model.list).toHaveBeenCalledWith({
      pagina: 1,
      limite: 20,
      prioridade: "Urgente",
    });
  });
  it("rejeita ID inválido sem consulta", async () => {
    expect((await service.get("inválido")).status).toBe(400);
    expect(model.get).not.toHaveBeenCalled();
  });
  it("retorna 404 para atendimento inexistente", async () => {
    jest.mocked(model.get).mockResolvedValue(undefined);
    expect((await service.get(userId)).status).toBe(404);
  });
  it("devolve o detalhe encontrado", async () => {
    jest.mocked(model.get).mockResolvedValue({ id: userId, ...input });
    expect((await service.get(userId)).message).toEqual({
      id: userId,
      ...input,
    });
  });
});

import { expect, it } from "@jest/globals";
import type { Pool } from "pg";
const foto =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7sAAAAASUVORK5CYII=";
interface Context {
  pool: () => Pool;
  base: () => string;
  user: string;
  other: string;
  trip: string;
  vehicle: string;
}
export function registerDriverTripCases(ctx: Context) {
  const call = async (
    path: string,
    method = "GET",
    body?: unknown,
    user = ctx.user,
  ) => {
    const { createSession } = await import("../auth/session");
    const { token } = await createSession(user);
    return fetch(`${ctx.base()}/motorista${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };
  const endpoint = () => `/viagens/${ctx.trip}`;
  const counts = async () => {
    const { rows } = await ctx.pool().query(
      `SELECT v.status,v.km_inicial,v.km_final,c.quilometragem,
      (SELECT COUNT(*)::int FROM viagens_registros_painel) AS fotos,
      (SELECT COUNT(*)::int FROM historico_status_viagem) AS historicos,
      (SELECT COUNT(*)::int FROM outbox_events) AS eventos
      FROM viagens v JOIN veiculos c ON c.id=v.veiculo_id WHERE v.id=$1`,
      [ctx.trip],
    );
    return rows[0];
  };
  it("mobile lista apenas viagens da conta e retorna dados reais do veículo", async () => {
    const summary = await call("/resumo");
    expect(summary.status).toBe(200);
    expect((await summary.json()).message).toMatchObject({
      motorista: { nome: "Motorista teste" },
      viagem: { id: ctx.trip, veiculo_id: ctx.vehicle, status: "Agendada" },
    });
    const page = (await (await call("/viagens?pagina=1&limite=20")).json())
      .message;
    expect(page).toMatchObject({ total: 1, pagina: 1, limite: 20 });
    expect(page.dados[0].id).toBe(ctx.trip);
    expect((await call(endpoint(), "GET", undefined, ctx.other)).status).toBe(
      404,
    );
    expect(
      (await (await call("/viagens", "GET", undefined, ctx.other)).json())
        .message.total,
    ).toBe(0);
  });
  it("mobile prioriza a viagem agendada mais próxima no resumo e na lista", async () => {
    const next = "40000000-0000-4000-8000-000000000002";
    await ctx
      .pool()
      .query(
        "UPDATE viagens SET solicitacao_id=NULL,criado_em='2030-02-01' WHERE id=$1",
        [ctx.trip],
      );
    await ctx
      .pool()
      .query(
        "INSERT INTO viagens(id,veiculo_id,motorista_id,criado_em) SELECT $1,veiculo_id,motorista_id,'2030-01-01' FROM viagens WHERE id=$2",
        [next, ctx.trip],
      );
    expect((await (await call("/resumo")).json()).message.viagem.id).toBe(next);
    expect(
      (await (await call("/viagens")).json()).message.dados.map(
        (v: { id: string }) => v.id,
      ),
    ).toEqual([next, ctx.trip]);
  });
  it("mobile não permite registrar foto de viagem de outra conta", async () => {
    expect(
      (await call(`${endpoint()}/iniciar`, "POST", { km: 10, foto }, ctx.other))
        .status,
    ).toBe(404);
    expect(await counts()).toMatchObject({
      status: "Agendada",
      fotos: 0,
      historicos: 0,
      eventos: 0,
      quilometragem: 0,
    });
  });
  it.each([
    { usuario_id: "outro" },
    { motorista_id: "outro" },
    { veiculo_id: "outro" },
    { status: "Finalizada" },
    { km: -1 },
    { km: 2.5 },
    { foto: "data:image/png;base64,YWJj" },
  ])("mobile rejeita adulteração antes da gravação: %j", async (extra) => {
    expect(
      (await call(`${endpoint()}/iniciar`, "POST", { km: 10, foto, ...extra }))
        .status,
    ).toBe(400);
    expect((await counts()).fotos).toBe(0);
  });
  it("mobile inicia, confirma chegada e finaliza com foto, km, histórico e outbox", async () => {
    expect(
      (await call(`${endpoint()}/iniciar`, "POST", { km: 10, foto })).status,
    ).toBe(200);
    expect(await counts()).toMatchObject({
      status: "Em deslocamento",
      km_inicial: 10,
      km_final: null,
      quilometragem: 10,
      fotos: 1,
      historicos: 1,
      eventos: 1,
    });
    const { token } = await (
      await import("../auth/session")
    ).createSession(ctx.user);
    const arrived = await fetch(`${ctx.base()}/viagens/${ctx.trip}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Em andamento" }),
    });
    expect(arrived.status).toBe(200);
    expect(
      (await call(`${endpoint()}/finalizar`, "POST", { km: 25, foto })).status,
    ).toBe(200);
    expect(await counts()).toMatchObject({
      status: "Finalizada",
      km_inicial: 10,
      km_final: 25,
      quilometragem: 25,
      fotos: 2,
      historicos: 3,
      eventos: 3,
    });
    const records = await ctx
      .pool()
      .query(
        "SELECT tipo,km,foto,usuario_id FROM viagens_registros_painel ORDER BY tipo",
      );
    expect(records.rows.map((r) => r.tipo)).toEqual(["fim", "inicio"]);
    expect(
      records.rows.every((r) => r.foto === foto && r.usuario_id === ctx.user),
    ).toBe(true);
    expect(
      (await call(`${endpoint()}/finalizar`, "POST", { km: 25, foto })).status,
    ).toBe(200);
    expect((await counts()).eventos).toBe(3);
  });
  it("mobile serializa reenvios sem duplicar foto e evento", async () => {
    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        call(`${endpoint()}/iniciar`, "POST", { km: 10, foto }),
      ),
    );
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(await counts()).toMatchObject({
      fotos: 1,
      historicos: 1,
      eventos: 1,
      quilometragem: 10,
    });
    expect(
      (await call(`${endpoint()}/iniciar`, "POST", { km: 11, foto })).status,
    ).toBe(409);
  });
  it("mobile bloqueia finalização antes da chegada e leitura menor que a atual", async () => {
    expect(
      (await call(`${endpoint()}/finalizar`, "POST", { km: 10, foto })).status,
    ).toBe(409);
    await ctx
      .pool()
      .query("UPDATE veiculos SET quilometragem=100 WHERE id=$1", [
        ctx.vehicle,
      ]);
    expect(
      (await call(`${endpoint()}/iniciar`, "POST", { km: 99, foto })).status,
    ).toBe(400);
    expect(await counts()).toMatchObject({
      status: "Agendada",
      quilometragem: 100,
      fotos: 0,
      historicos: 0,
      eventos: 0,
    });
  });
  it.each(["viagens_registros_painel", "outbox_events"])(
    "mobile reverte todas as gravações se falhar %s",
    async (table) => {
      await ctx
        .pool()
        .query(
          "CREATE FUNCTION reject_mobile_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha de teste'; END; $$",
        );
      await ctx
        .pool()
        .query(
          `CREATE TRIGGER reject_mobile_test BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION reject_mobile_test()`,
        );
      try {
        expect(
          (await call(`${endpoint()}/iniciar`, "POST", { km: 10, foto }))
            .status,
        ).toBe(500);
        expect(await counts()).toMatchObject({
          status: "Agendada",
          km_inicial: null,
          quilometragem: 0,
          fotos: 0,
          historicos: 0,
          eventos: 0,
        });
      } finally {
        await ctx.pool().query(`DROP TRIGGER reject_mobile_test ON ${table}`);
        await ctx.pool().query("DROP FUNCTION reject_mobile_test()");
      }
    },
  );
  it("mobile impede duas viagens simultâneas do mesmo motorista", async () => {
    const vehicle2 = "30000000-0000-4000-8000-000000000002";
    const trip2 = "40000000-0000-4000-8000-000000000002";
    await ctx
      .pool()
      .query(
        "INSERT INTO veiculos(id,placa,modelo,tipo_combustivel,capacidade_maxima,frota) VALUES ($1,'TEST002','Viatura dois','Diesel',4,'SVO')",
        [vehicle2],
      );
    await ctx
      .pool()
      .query(
        "INSERT INTO viagens(id,veiculo_id,motorista_id) SELECT $1,$2,motorista_id FROM viagens WHERE id=$3",
        [trip2, vehicle2, ctx.trip],
      );
    const responses = await Promise.all([
      call(`${endpoint()}/iniciar`, "POST", { km: 10, foto }),
      call(`/viagens/${trip2}/iniciar`, "POST", { km: 10, foto }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      (
        await ctx
          .pool()
          .query(
            "SELECT COUNT(*)::int AS total FROM viagens WHERE status='Em deslocamento'",
          )
      ).rows[0].total,
    ).toBe(1);
  });
  it("mobile não amplia o escopo próprio mesmo se a conta também for gestora", async () => {
    await ctx
      .pool()
      .query(
        "INSERT INTO usuarios_perfis(usuario_id,perfil_id) SELECT $1,id FROM perfis WHERE codigo='administrador'",
        [ctx.other],
      );
    expect(
      (await call(`${endpoint()}/iniciar`, "POST", { km: 10, foto }, ctx.other))
        .status,
    ).toBe(404);
    expect((await counts()).fotos).toBe(0);
  });
  it("mobile impede início simultâneo do mesmo veículo por motoristas diferentes", async () => {
    const driver2 = "20000000-0000-4000-8000-000000000002";
    const trip2 = "40000000-0000-4000-8000-000000000002";
    await ctx
      .pool()
      .query(
        "INSERT INTO motoristas(id,nome,cpf,cnh,categoria,validade_cnh,frota) VALUES($1,'Outro motorista','12345678902','TESTE-CNH2','D','2030-01-01','SVO')",
        [driver2],
      );
    await ctx
      .pool()
      .query("UPDATE usuarios SET motorista_id=$1 WHERE id=$2", [
        driver2,
        ctx.other,
      ]);
    await ctx
      .pool()
      .query(
        "INSERT INTO viagens(id,veiculo_id,motorista_id) VALUES($1,$2,$3)",
        [trip2, ctx.vehicle, driver2],
      );
    const responses = await Promise.all([
      call(`${endpoint()}/iniciar`, "POST", { km: 10, foto }),
      call(`/viagens/${trip2}/iniciar`, "POST", { km: 10, foto }, ctx.other),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      (
        await ctx
          .pool()
          .query(
            "SELECT COUNT(*)::int AS total FROM viagens WHERE status='Em deslocamento'",
          )
      ).rows[0].total,
    ).toBe(1);
  });
  it("seleção de veículo fica restrita à sessão e não altera vínculo permanente", async () => {
    const { createSession, tokenHash } = await import("../auth/session");
    const token = (await createSession(ctx.user)).token;
    const token2 = (await createSession(ctx.user)).token;
    const request = (token: string, method = "GET", body?: unknown) =>
      fetch(`${ctx.base()}/motorista/veiculo-sessao`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    expect(
      (await request(token, "POST", { veiculo_id: ctx.vehicle })).status,
    ).toBe(200);
    expect((await (await request(token)).json()).message.id).toBe(ctx.vehicle);
    expect((await (await request(token2)).json()).message).toBeNull();
    expect(
      (
        await ctx
          .pool()
          .query("SELECT COUNT(*)::int AS total FROM motoristas_veiculos")
      ).rows[0].total,
    ).toBe(0);
    expect(
      (
        await request(token, "POST", {
          veiculo_id: "30000000-0000-4000-8000-000000000099",
        })
      ).status,
    ).toBe(404);
    await request(token, "DELETE");
    expect((await (await request(token)).json()).message).toBeNull();
    await request(token, "POST", { veiculo_id: ctx.vehicle });
    await ctx
      .pool()
      .query("DELETE FROM auth_sessions WHERE token_hash=$1", [
        tokenHash(token),
      ]);
    expect((await request(token)).status).toBe(401);
    expect(
      (
        await ctx
          .pool()
          .query("SELECT COUNT(*)::int AS total FROM motorista_veiculo_sessao")
      ).rows[0].total,
    ).toBe(0);
  });
  it("simulação exige configuração explícita e nunca grava foto fictícia", async () => {
    const previous = process.env.ENABLE_PANEL_DEMO;
    try {
      delete process.env.ENABLE_PANEL_DEMO;
      expect(
        (
          await call(`${endpoint()}/iniciar`, "POST", {
            km: 10,
            simulada: true,
          })
        ).status,
      ).toBe(403);
      expect((await counts()).fotos).toBe(0);
      process.env.ENABLE_PANEL_DEMO = "true";
      expect(
        (
          await call(`${endpoint()}/iniciar`, "POST", {
            km: 10,
            simulada: true,
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await ctx
            .pool()
            .query("SELECT foto,simulada,km FROM viagens_registros_painel")
        ).rows,
      ).toEqual([{ foto: null, simulada: true, km: 10 }]);
    } finally {
      if (previous === undefined) delete process.env.ENABLE_PANEL_DEMO;
      else process.env.ENABLE_PANEL_DEMO = previous;
    }
  });
}

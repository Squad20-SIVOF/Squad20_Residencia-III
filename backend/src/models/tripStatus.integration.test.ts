import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// Opt-in: exclusivamente um PostgreSQL descartável. Nunca usa DATABASE_URL/.env.
const url = process.env.TRIP_TEST_DATABASE_URL;
const describeDatabase = url ? describe : describe.skip;
const manager = "10000000-0000-4000-8000-000000000001";
const driverUser = "10000000-0000-4000-8000-000000000002";
const otherUser = "10000000-0000-4000-8000-000000000003";
const driverId = "20000000-0000-4000-8000-000000000001";
const vehicleId = "30000000-0000-4000-8000-000000000001";
const tripId = "40000000-0000-4000-8000-000000000001";
const requestId = "50000000-0000-4000-8000-000000000001";
const scope = { userId: manager, manager: true };

describeDatabase("viagens com PostgreSQL real e migrations", () => {
  let pool: Pool;
  let trips: typeof import("./tripModel").default;
  let requests: typeof import("./requestModel").default;
  let deaths: typeof import("./deathModel").default;
  let server: Server | undefined;
  let base: string;
  let driverToken: string;

  beforeAll(async () => {
    const target = new URL(url!);
    if (
      !["localhost", "127.0.0.1"].includes(target.hostname) ||
      target.pathname !== "/trip_status_test"
    )
      throw new Error("Use somente o banco local descartável trip_status_test");
    process.env.DATABASE_URL = url;
    pool = (await import("../db")).pool;
    for (const name of (
      await readdir(path.resolve(__dirname, "../../migrations"))
    )
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      const sql = (
        await readFile(
          path.resolve(__dirname, "../../migrations", name),
          "utf8",
        )
      ).split("-- Down Migration")[0];
      await pool.query(sql);
    }
    trips = (await import("./tripModel")).default;
    requests = (await import("./requestModel")).default;
    deaths = (await import("./deathModel")).default;
    const express = (await import("express")).default;
    const { authenticate } = await import("../auth/session");
    const routes = (await import("../routes/tripRoutes")).default;
    const app = express();
    app.use(express.json());
    app.use("/viagens", authenticate, routes);
    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
      server.once("error", reject);
    });
    base = `http://127.0.0.1:${(server!.address() as AddressInfo).port}/viagens/${tripId}/status`;
  }, 30000);

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE viagens, solicitacoes, usuarios, motoristas, veiculos, outbox_events CASCADE",
    );
    await pool.query(
      `INSERT INTO motoristas (id,nome,cpf,cnh,categoria,validade_cnh,frota)
      VALUES ($1,'Motorista teste','12345678901','TESTE-CNH','D','2030-01-01','SVO')`,
      [driverId],
    );
    await pool.query(
      `INSERT INTO usuarios (id,nome,email,motorista_id) VALUES
      ($1,'Gestor teste','gestor@test.local',NULL),
      ($2,'Motorista teste','motorista@test.local',$4),
      ($3,'Outro usuário','outro@test.local',NULL)`,
      [manager, driverUser, otherUser, driverId],
    );
    await pool.query(
      "INSERT INTO usuarios_perfis (usuario_id,perfil_id) SELECT $1,id FROM perfis WHERE codigo='motorista'",
      [driverUser],
    );
    await pool.query(
      `INSERT INTO veiculos (id,placa,modelo,tipo_combustivel,capacidade_maxima,frota)
      VALUES ($1,'TEST001','Viatura teste','Diesel',4,'SVO')`,
      [vehicleId],
    );
    await pool.query(
      "INSERT INTO solicitacoes (id,categoria,data_necessidade,status) VALUES ($1,'SVO',NOW(),'Agendada')",
      [requestId],
    );
    await pool.query(
      "INSERT INTO viagens (id,solicitacao_id,veiculo_id,motorista_id) VALUES ($1,$2,$3,$4)",
      [tripId, requestId, vehicleId, driverId],
    );
    driverToken = (
      await (await import("../auth/session")).createSession(driverUser)
    ).token;
  });

  afterAll(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server!.close((error) => (error ? reject(error) : resolve())),
      );
    if (pool) await pool.end();
  });

  const snapshot = async () => {
    const { rows } = await pool.query(
      `SELECT status,
      (SELECT COUNT(*)::int FROM historico_status_viagem) AS historicos,
      (SELECT COUNT(*)::int FROM outbox_events) AS eventos
      FROM viagens WHERE id=$1`,
      [tripId],
    );
    return rows[0];
  };

  it("aplica o mesmo fluxo em viagens SVO e administrativas", async () => {
    for (const fleet of ["SVO", "Administrativa"]) {
      if (fleet === "Administrativa") {
        await pool.query("UPDATE veiculos SET frota=$1 WHERE id=$2", [
          fleet,
          vehicleId,
        ]);
        await pool
          .query(
            "INSERT INTO viagens (veiculo_id,motorista_id) VALUES ($1,$2) RETURNING id",
            [vehicleId, driverId],
          )
          .then(async ({ rows }) => {
            await pool.query("DELETE FROM viagens WHERE id=$1", [tripId]);
            await pool.query("UPDATE viagens SET id=$1 WHERE id=$2", [
              tripId,
              rows[0].id,
            ]);
          });
        await pool.query("TRUNCATE outbox_events");
      }
      for (const status of [
        "Em deslocamento",
        "Em andamento",
        "Finalizada",
      ] as const)
        await trips.transition(tripId, { status }, scope);
      expect(await snapshot()).toEqual({
        status: "Finalizada",
        historicos: 3,
        eventos: 3,
      });
      const { rows } = await pool.query(
        "SELECT data_inicio,data_fim FROM viagens WHERE id=$1",
        [tripId],
      );
      expect(rows[0].data_inicio).toBeInstanceOf(Date);
      expect(rows[0].data_fim.getTime()).toBeGreaterThanOrEqual(
        rows[0].data_inicio.getTime(),
      );
    }
  });

  it("serializa reenvios concorrentes sem duplicar histórico/evento", async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        trips.transition(tripId, { status: "Em deslocamento" }, scope),
      ),
    );
    expect(await snapshot()).toEqual({
      status: "Em deslocamento",
      historicos: 1,
      eventos: 1,
    });
  });

  it("rejeita salto de estado sem gravação parcial", async () => {
    await expect(
      trips.transition(tripId, { status: "Finalizada" }, scope),
    ).rejects.toMatchObject({ status: 409 });
    expect(await snapshot()).toEqual({
      status: "Agendada",
      historicos: 0,
      eventos: 0,
    });
  });

  it.each(["historico_status_viagem", "outbox_events"])(
    "desfaz tudo quando %s falha",
    async (table) => {
      await pool.query(
        "CREATE FUNCTION reject_trip_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha de teste'; END; $$",
      );
      await pool.query(
        `CREATE TRIGGER reject_trip_test BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION reject_trip_test()`,
      );
      try {
        await expect(
          trips.transition(tripId, { status: "Em deslocamento" }, scope),
        ).rejects.toThrow("falha de teste");
        expect(await snapshot()).toEqual({
          status: "Agendada",
          historicos: 0,
          eventos: 0,
        });
      } finally {
        await pool.query(`DROP TRIGGER reject_trip_test ON ${table}`);
        await pool.query("DROP FUNCTION reject_trip_test()");
      }
    },
  );

  it.each(["Agendada", "Em deslocamento"] as const)(
    "cancelamento da solicitação cancela viagem %s atomicamente",
    async (initial) => {
      if (initial === "Em deslocamento")
        await trips.transition(tripId, { status: initial }, scope);
      await requests.cancel(requestId, "Teste", scope);
      const count = initial === "Agendada" ? 1 : 2;
      expect(await snapshot()).toEqual({
        status: "Cancelada",
        historicos: count,
        eventos: count,
      });
      const { rows } = await pool.query(
        "SELECT event_type FROM outbox_events WHERE event_type='ViagemCancelada'",
      );
      expect(rows).toHaveLength(1);
    },
  );

  it("duas coletas concorrentes do mesmo óbito emitem apenas um evento", async () => {
    const input = {
      viagem_id: tripId,
      identificacao: null,
      local_recolhimento: "Local teste",
      status_coleta: "Pendente" as const,
    };
    const row = await deaths.save(input, manager);
    const collected = {
      ...input,
      status_coleta: "Recolhido" as const,
      data_hora_recolhimento: "2026-11-11T12:00:00-03:00",
    };
    await Promise.all([
      deaths.save(collected, manager, row.id),
      deaths.save(collected, manager, row.id),
    ]);
    const { rows } = await pool.query(
      "SELECT event_type, payload FROM outbox_events",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].event_type).toBe("ObitoColetado");
    expect(rows[0].payload.obito_id).toBe(row.id);
  });

  it("motorista só altera viagens próprias", async () => {
    await expect(
      trips.transition(
        tripId,
        { status: "Em deslocamento" },
        { userId: otherUser, manager: false },
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(await snapshot()).toEqual({
      status: "Agendada",
      historicos: 0,
      eventos: 0,
    });
    await trips.transition(
      tripId,
      { status: "Em deslocamento" },
      { userId: driverUser, manager: false },
    );
    expect((await snapshot()).status).toBe("Em deslocamento");
  });

  it("HTTP exige sessão, valida payload e aplica permissão própria", async () => {
    expect((await fetch(base, { method: "PATCH" })).status).toBe(401);
    const headers = {
      Authorization: `Bearer ${driverToken}`,
      "Content-Type": "application/json",
    };
    expect(
      (
        await fetch(base, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: "Em deslocamento",
            usuario_id: manager,
          }),
        })
      ).status,
    ).toBe(400);
    const response = await fetch(base, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "Em deslocamento" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).message.status).toBe("Em deslocamento");
    expect((await snapshot()).eventos).toBe(1);
  });
  it("Gestor de Frota cancela viagem em deslocamento pela API", async () => {
    await pool.query(
      "INSERT INTO usuarios_perfis (usuario_id,perfil_id) SELECT $1,id FROM perfis WHERE codigo='gestor_frota'",
      [manager],
    );
    await trips.transition(tripId, { status: "Em deslocamento" }, scope);
    const token = (
      await (await import("../auth/session")).createSession(manager)
    ).token;
    const response = await fetch(base, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "Cancelada",
        motivo: "Retorno solicitado",
      }),
    });
    expect(response.status).toBe(200);
    expect(await snapshot()).toEqual({
      status: "Cancelada",
      historicos: 2,
      eventos: 2,
    });
    const { rows } = await pool.query(
      "SELECT motivo FROM historico_status_viagem WHERE status_novo='Cancelada'",
    );
    expect(rows[0].motivo).toBe("Retorno solicitado");
  });
});

import type { Pool } from "pg";

interface Context {
  pool: () => Pool;
  manager: string;
  driver: string;
  vehicle: string;
}

export function registerRequestWorkflowCases(ctx: Context) {
  const prepare = async () => {
    await ctx
      .pool()
      .query(
        "INSERT INTO usuarios_perfis (usuario_id,perfil_id) SELECT $1,id FROM perfis WHERE codigo='solicitante' ON CONFLICT DO NOTHING",
        [ctx.manager],
      );
    await ctx.pool().query("UPDATE viagens SET status='Cancelada'");
    await ctx
      .pool()
      .query("UPDATE motoristas SET frota='Administrativa' WHERE id=$1", [
        ctx.driver,
      ]);
    await ctx
      .pool()
      .query("UPDATE veiculos SET frota='Administrativa' WHERE id=$1", [
        ctx.vehicle,
      ]);
  };
  const create = async (
    start = "2027-01-04T08:00:00-03:00",
    end = "2027-01-04T12:00:00-03:00",
  ) =>
    (await import("./requestWorkflowModel")).default.create(
      {
        origem: "Fundação",
        destino: "Hospital",
        setor: "Administrativo",
        data_necessidade: start,
        data_retorno_prevista: end,
        numero_passageiros: 2,
        motivo: "Visita institucional",
        flag_urgencia: false,
      },
      ctx.manager,
    );
  const approve = async (id: string) =>
    (await import("./requestWorkflowModel")).default.approve(
      id,
      { veiculo_id: ctx.vehicle, motorista_id: ctx.driver },
      ctx.manager,
    );

  it("serializa aprovações concorrentes sem duplicar reserva ou histórico", async () => {
    await prepare();
    const first = await create();
    const second = await create();
    const results = await Promise.allSettled([
      approve(first.id),
      approve(second.id),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult;
    expect(failed.reason).toMatchObject({ code: "23P01" });
    const { rows } = await ctx
      .pool()
      .query(
        "SELECT status, (SELECT count(*)::int FROM viagens v WHERE v.solicitacao_id=s.id) AS total FROM solicitacoes s WHERE id=ANY($1::uuid[])",
        [[first.id, second.id]],
      );
    expect(rows).toEqual(
      expect.arrayContaining([
        { status: "Pendente", total: 0 },
        { status: "Agendada", total: 1 },
      ]),
    );
  });

  it("permite janelas adjacentes e libera reserva cancelada", async () => {
    await prepare();
    await approve((await create()).id);
    await approve(
      (await create("2027-01-04T12:00:00-03:00", "2027-01-04T13:00:00-03:00"))
        .id,
    );
    await ctx
      .pool()
      .query("UPDATE viagens SET status='Cancelada' WHERE status='Agendada'");
    expect((await approve((await create()).id)).status).toBe("Agendada");
  });

  it("protege sobreposição de motorista mesmo em outro veículo", async () => {
    await prepare();
    const first = await approve((await create()).id);
    const otherVehicle = (
      await ctx
        .pool()
        .query(
          "INSERT INTO veiculos (placa,modelo,tipo_combustivel,capacidade_maxima,frota) VALUES ('TEST002','Carro','Diesel',4,'Administrativa') RETURNING id",
        )
    ).rows[0].id;
    await expect(
      ctx
        .pool()
        .query(
          "INSERT INTO viagens (veiculo_id,motorista_id,saida_prevista,retorno_previsto) VALUES ($1,$2,$3,$4)",
          [
            otherVehicle,
            ctx.driver,
            first.viagem.saida_prevista,
            first.viagem.retorno_previsto,
          ],
        ),
    ).rejects.toMatchObject({
      code: "23P01",
      constraint: "viagens_reserva_motorista",
    });
  });
}

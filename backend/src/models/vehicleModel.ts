import { pool } from "../db";
import { type VehicleInput } from "../middleware/validations/schemas/vehicleSchema";

export type Vehicle = Omit<
  VehicleInput,
  "teto_gasto_mensal" | "deletado_em" | "criado_em" | "atualizado_em"
> & {
  id: string;
  teto_gasto_mensal: number | null;
  status: string;
  ativo: boolean;
  deletado_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
  quilometragem: number;
  ultimo_km_alertado: number;
};

export interface VehicleMaintenanceRow {
  id: string;
  placa: string;
  quilometragem: number;
  ultimo_km_alertado: number;
  km_restantes: number;
}

const columns = `
    id, identificacao, marca, to_char(proxima_vistoria, 'YYYY-MM-DD') AS proxima_vistoria, checklist_vistoria,
    placa,
    modelo,
    tipo_combustivel,
    capacidade_maxima,
    teto_gasto_mensal,
    status,
    ativo,
    deletado_em,
    criado_em,
    atualizado_em,
    quilometragem,
    ultimo_km_alertado, frota, exclusivo_svo
  `;

const getAllVehicles = async () => {
  const result = await pool.query(
    `SELECT ${columns} FROM veiculos ORDER BY modelo, id`,
  );
  return result.rows;
};

const getVehicleById = async (id: string) => {
  const result = await pool.query(
    `SELECT ${columns} FROM veiculos WHERE id = $1`,
    [id],
  );
  return result.rows[0];
};

const getNearMaintance = async (
  intervalKM: number,
  warnKM: number,
): Promise<VehicleMaintenanceRow[]> => {
  const result = await pool.query(
    `SELECT v.id,v.placa,v.quilometragem,base.km AS ultimo_km_alertado,
      (base.km + $1) - v.quilometragem AS km_restantes
      FROM veiculos v
      CROSS JOIN LATERAL (SELECT COALESCE(MAX(m.km_realizado),0)::integer AS km
        FROM manutencoes m WHERE m.veiculo_id=v.id AND m.status='Concluída') base
      WHERE v.ativo AND v.deletado_em IS NULL AND v.quilometragem >= base.km + $1 - $2`,
    [intervalKM, warnKM],
  );
  return result.rows;
};

const createVehicle = async (vehicle: Vehicle) => {
  const result = await pool.query(
    `INSERT INTO veiculos (modelo, placa, tipo_combustivel, capacidade_maxima, teto_gasto_mensal, quilometragem, ultimo_km_alertado, frota, exclusivo_svo, identificacao, marca, proxima_vistoria, checklist_vistoria)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      RETURNING ${columns}`,
    [
      vehicle.modelo,
      vehicle.placa,
      vehicle.tipo_combustivel,
      vehicle.capacidade_maxima,
      vehicle.teto_gasto_mensal ?? null,
      vehicle.quilometragem,
      vehicle.ultimo_km_alertado,
      vehicle.frota ?? null,
      vehicle.exclusivo_svo ?? false,
      vehicle.identificacao ?? null,
      vehicle.marca ?? null,
      vehicle.proxima_vistoria ?? null,
      JSON.stringify(vehicle.checklist_vistoria ?? []),
    ],
  );

  return result.rows[0];
};

const updateVehicle = async (
  id: string,
  vehicle: VehicleInput,
): Promise<Vehicle | undefined> => {
  const result = await pool.query(
    `UPDATE veiculos
      SET modelo = $1, placa = $2, tipo_combustivel = $3, capacidade_maxima = $4, teto_gasto_mensal = $5, quilometragem = $6, ultimo_km_alertado = $7, atualizado_em = NOW(), frota = CASE WHEN $11 THEN $9 ELSE frota END, exclusivo_svo = COALESCE($10, exclusivo_svo),
      identificacao=CASE WHEN $12::jsonb ? 'identificacao' THEN $12::jsonb->>'identificacao' ELSE identificacao END,
      marca=CASE WHEN $12::jsonb ? 'marca' THEN $12::jsonb->>'marca' ELSE marca END,
      proxima_vistoria=CASE WHEN $12::jsonb ? 'proxima_vistoria' THEN ($12::jsonb->>'proxima_vistoria')::date ELSE proxima_vistoria END,
      checklist_vistoria=COALESCE($12::jsonb->'checklist_vistoria',checklist_vistoria)
      WHERE id = $8
      RETURNING ${columns}`,
    [
      vehicle.modelo,
      vehicle.placa,
      vehicle.tipo_combustivel,
      vehicle.capacidade_maxima,
      vehicle.teto_gasto_mensal ?? null,
      vehicle.quilometragem,
      vehicle.ultimo_km_alertado,
      id,
      vehicle.frota ?? null,
      vehicle.exclusivo_svo ?? null,
      vehicle.frota !== undefined,
      JSON.stringify({
        identificacao: vehicle.identificacao,
        marca: vehicle.marca,
        proxima_vistoria: vehicle.proxima_vistoria,
        checklist_vistoria: vehicle.checklist_vistoria,
      }),
    ],
  );

  return result.rows[0];
};

const deleteVehicle = async (id: string) => {
  const result = await pool.query(`DELETE FROM veiculos WHERE id = $1`, [id]);
  return result.rowCount === 1;
};

const getVehicleTrips = async (id: string) => {
  const result = await pool.query(
    `SELECT id, status, data_inicio, data_fim, km_inicial, km_final
    FROM viagens WHERE veiculo_id=$1 ORDER BY data_inicio DESC NULLS LAST, criado_em DESC, id`,
    [id],
  );
  return result.rows;
};

export default {
  getVehicleTrips,
  getAllVehicles,
  getVehicleById,
  getNearMaintance,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};

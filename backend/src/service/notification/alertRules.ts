import driverModel from "../../models/driverModel";
import vehicleModel from "../../models/vehicleModel";

import { alertIntervals } from "../../config/emailAlerts";
const LICENSE_WARN_DAYS = 30;

export const getLicenseAlerts = async () => {
  const drivers = await driverModel.getDriverWLicenseExp(LICENSE_WARN_DAYS);
  return drivers.map((d) => ({
    ...d,
    severity:
      d.dias_restantes < 0
        ? "critica"
        : d.dias_restantes <= 7
          ? "alta"
          : "aviso",
  }));
};

export const getMaintanceAlerts = async () => {
  const { interval, warning } = alertIntervals();
  const vehicles = await vehicleModel.getNearMaintance(interval, warning);
  return vehicles.map((v) => ({
    ...v,
    severity: v.km_restantes <= 0 ? "critica" : "aviso",
  }));
};

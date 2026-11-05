import { runEmailAlerts } from "../src/service/notification/emailAlertJob";
import { pool } from "../src/db";
runEmailAlerts()
  .then((result) => {
    console.log(result);
    if (result.failed || result.review) process.exitCode = 1;
  })
  .catch(() => {
    console.error("Falha no job de alertas. Confira a configuração.");
    process.exitCode = 1;
  })
  .finally(() => pool.end());

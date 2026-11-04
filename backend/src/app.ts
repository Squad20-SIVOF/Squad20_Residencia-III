import "./config/env";
import express from "express";
import authRoutes from "./auth/routes";
import usersRoutes from "./auth/users";
import { authenticate } from "./auth/session";
import cors from "cors";
import { createCorsOptions } from "./config/cors";
import { vehicleRoutes } from "./routes/vehicleRoutes";
import { driverRoutes } from "./routes/driverRoutes";
import maintanceRoutes from "./routes/maintanceRoutes";
import notifRoutes from "./routes/notifRoutes";
import profileRoutes from "./routes/profileRoutes";
import userProfileRoutes from "./routes/userProfileRoutes";
import alertRoutes from "./routes/alertRoutes";
import requestRoutes from "./routes/requestRoutes";
import svoRoutes from "./routes/svoRoutes";

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors(createCorsOptions()));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.use("/vehicles", authenticate, vehicleRoutes);
app.use("/drivers", authenticate, driverRoutes);
app.use("/maintance", authenticate, maintanceRoutes);
app.use("/notification", authenticate, notifRoutes);
app.use("/perfis", authenticate, profileRoutes);
app.use("/usuarios", authenticate, usersRoutes, userProfileRoutes);
app.use("/alerts", authenticate, alertRoutes);
app.use("/solicitacoes", authenticate, requestRoutes);
app.use("/svo", authenticate, svoRoutes);

export default app;

// npm cache clean --force

import { Router } from "express";
import { requireIntegrationKey } from "../../../middlewares/integration-key.middleware";
import { createTypebotLead } from "./typebot-lead.controller";

export const typebotRoutes = Router();

typebotRoutes.post("/leads", requireIntegrationKey, createTypebotLead);

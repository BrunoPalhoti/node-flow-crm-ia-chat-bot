import { Router } from "express";
import { createTypebotLead } from "./typebot-lead.controller";

export const typebotRoutes = Router();

typebotRoutes.post("/leads", createTypebotLead);

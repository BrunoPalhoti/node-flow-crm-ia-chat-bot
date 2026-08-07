import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

export function setupSwagger(app: Express): void {
  app.get("/api/docs.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Flow CRM IA Chat Bot API",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}

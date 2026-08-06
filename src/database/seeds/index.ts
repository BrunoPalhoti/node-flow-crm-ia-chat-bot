import type { DataSource } from "typeorm";

export type Seed = {
  name: string;
  run: (dataSource: DataSource) => Promise<void>;
};

/**
 * Seeds da aplicação. Inclua novos seeds aqui na ordem desejada.
 * Vazio por enquanto — entidades ainda serão introduzidas nos próximos épicos.
 */
export const seeds: Seed[] = [];

import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration inicial (no-op).
 * O schema real será criado em migrations geradas a partir das entidades.
 */
export class Baseline1786040323540 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}

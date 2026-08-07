import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compara strings em tempo constante.
 * Ambos os valores são hasheados (SHA-256) para que o timingSafeEqual
 * sempre opere sobre buffers de 32 bytes — evita vazamento por tamanho
 * e o no-op de comparar um buffer consigo mesmo.
 */
export function safeCompare(provided: string, expected: string): boolean {
  const providedDigest = createHash("sha256").update(provided, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}

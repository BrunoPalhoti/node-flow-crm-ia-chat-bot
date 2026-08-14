import { describe, expect, it } from "vitest";
import { safeCompare } from "../src/shared/crypto/safe-compare";

describe("safeCompare", () => {
  it("retorna true para strings iguais", () => {
    expect(safeCompare("secret-value", "secret-value")).toBe(true);
  });

  it("retorna false para strings diferentes do mesmo tamanho", () => {
    expect(safeCompare("secret-value", "secret-valuX")).toBe(false);
  });

  it("retorna false para comprimentos diferentes", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
    expect(safeCompare("", "a")).toBe(false);
  });
});

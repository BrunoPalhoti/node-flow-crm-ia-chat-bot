export function foldSimNaoKey(value: string): string {
  return value.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function parseSimNaoToBoolean(value: string): boolean {
  const key = foldSimNaoKey(value);

  if (key === "sim") {
    return true;
  }

  if (key === "nao") {
    return false;
  }

  return false;
}

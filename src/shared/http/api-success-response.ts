export type ApiSuccessResponse<T> = {
  data: T;
  correlationId: string;
};

export function apiSuccessResponse<T>(
  data: T,
  correlationId: string,
): ApiSuccessResponse<T> {
  return { data, correlationId };
}

export type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export type ErrorResult<T> = { code: T; message: string };

export const result = {
  ok: <TResult>(value: TResult): Result<TResult, never> => ({
    ok: true,
    value,
  }),

  error: <TError>(error: TError): Result<never, TError> => ({
    ok: false,
    error,
  }),
};

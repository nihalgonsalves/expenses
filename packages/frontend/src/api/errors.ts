import {
  isAppErrorCode,
  type AppErrorCode,
} from "@nihalgonsalves/expenses-shared/errors";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getAppErrorCode = (error: unknown): AppErrorCode | undefined => {
  if (!isRecord(error)) return undefined;

  if (isAppErrorCode(error["code"])) return error["code"];

  const data = error["data"];
  if (isRecord(data) && isAppErrorCode(data["code"])) {
    return data["code"];
  }

  return undefined;
};

export const isAppError = (
  error: unknown,
): error is Error & {
  code: AppErrorCode;
} => getAppErrorCode(error) !== undefined;

export const isNonRetryableAppError = (error: unknown) => {
  const code = getAppErrorCode(error);

  return (
    code === "BAD_REQUEST" ||
    code === "UNAUTHORIZED" ||
    code === "FORBIDDEN" ||
    code === "NOT_FOUND" ||
    code === "CONFLICT"
  );
};

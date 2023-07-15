export const getErrorMessage = (error: unknown) => {
  if (IS_PROD) {
    return 'Internal Server Error';
  }

  return error instanceof Error ? error.message : 'Unknown Error';
};

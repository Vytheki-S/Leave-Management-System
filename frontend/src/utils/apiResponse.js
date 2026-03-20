export function unwrapData(response) {
  return response?.data?.data;
}

export function extractErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function isSuccess(response) {
  return response?.data?.success !== false;
}
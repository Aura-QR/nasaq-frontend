const getApiError = (
  error,
  fallbackMessage =
    "حدث خطأ ما"
) => {
  const responseData =
    error?.response?.data;

  const rawMessage =
    responseData?.message ||
    responseData?.error ||
    error?.message;

  let message =
    fallbackMessage;

  if (
    Array.isArray(
      rawMessage
    )
  ) {
    message =
      rawMessage.join("، ");
  } else if (
    typeof rawMessage ===
      "string" &&
    rawMessage.trim()
  ) {
    message =
      rawMessage.trim();
  } else if (
    rawMessage &&
    typeof rawMessage ===
      "object"
  ) {
    message =
      rawMessage.message ||
      fallbackMessage;
  }

  return {
    status: false,
    message,

    statusCode:
      error?.response?.status ||
      responseData?.statusCode,

    errors:
      responseData?.errors,

    raw:
      responseData,
  };
};

export default getApiError;
export {
  getApiError,
};

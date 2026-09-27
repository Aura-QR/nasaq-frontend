const getEnv = (key, fallback) => {
  const value = import.meta.env?.[key];

  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
};

export const CURRENCY_CODE = getEnv("VITE_CURRENCY_CODE", "SAR");
export const CURRENCY_LOCALE = getEnv("VITE_CURRENCY_LOCALE", "ar-SA");
export const CURRENCY_LABEL = getEnv("VITE_CURRENCY_LABEL", "ريال");
export const DATE_LOCALE = getEnv("VITE_DATE_LOCALE", "ar-SA");

const toSafeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatCurrency = (
  value,
  {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showCode = false,
  } = {}
) => {
  const formattedValue = new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(toSafeNumber(value));

  return `${formattedValue} ${showCode ? CURRENCY_CODE : CURRENCY_LABEL}`;
};

export const getCurrencyFieldLabel = (label = "المبلغ") =>
  `${label} (${CURRENCY_LABEL})`;

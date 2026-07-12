import { format as formatDateFns } from "date-fns";
import { ar } from "date-fns/locale";

// You can store this in context, settings, or .env if you want dynamic language switching
const currentLocale = ar;

export function formatDate(date, formatStr = "EEE, dd MMM yyyy") {
  if (!date) return "—";
  return formatDateFns(new Date(date), formatStr, { locale: currentLocale });
}
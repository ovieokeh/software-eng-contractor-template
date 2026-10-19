import { site } from "./site";
import values from "./pricing.generated.json";

// Generated from the pricing workbook. Edit the workbook, then run pricing:generate.
export const pricing = values;
export const money = (amount: number) =>
  new Intl.NumberFormat(site.locale, {
    style: "currency",
    currency: site.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

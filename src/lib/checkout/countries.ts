/** ISO countries with E.164 dial codes for checkout phone + address pickers. */

export type CountryOption = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dial: string; // without leading +
};

export const COUNTRIES: CountryOption[] = [
  { code: "NG", name: "Nigeria", dial: "234" },
  { code: "US", name: "United States", dial: "1" },
  { code: "GB", name: "United Kingdom", dial: "44" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "GH", name: "Ghana", dial: "233" },
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "ZA", name: "South Africa", dial: "27" },
  { code: "AE", name: "United Arab Emirates", dial: "971" },
  { code: "AU", name: "Australia", dial: "61" },
  { code: "FR", name: "France", dial: "33" },
  { code: "DE", name: "Germany", dial: "49" },
  { code: "IE", name: "Ireland", dial: "353" },
  { code: "IT", name: "Italy", dial: "39" },
  { code: "NL", name: "Netherlands", dial: "31" },
  { code: "ES", name: "Spain", dial: "34" },
  { code: "PT", name: "Portugal", dial: "351" },
  { code: "BE", name: "Belgium", dial: "32" },
  { code: "CH", name: "Switzerland", dial: "41" },
  { code: "SE", name: "Sweden", dial: "46" },
  { code: "NO", name: "Norway", dial: "47" },
  { code: "DK", name: "Denmark", dial: "45" },
  { code: "FI", name: "Finland", dial: "358" },
  { code: "AT", name: "Austria", dial: "43" },
  { code: "PL", name: "Poland", dial: "48" },
  { code: "CZ", name: "Czechia", dial: "420" },
  { code: "HU", name: "Hungary", dial: "36" },
  { code: "RO", name: "Romania", dial: "40" },
  { code: "GR", name: "Greece", dial: "30" },
  { code: "TR", name: "Türkiye", dial: "90" },
  { code: "SA", name: "Saudi Arabia", dial: "966" },
  { code: "QA", name: "Qatar", dial: "974" },
  { code: "KW", name: "Kuwait", dial: "965" },
  { code: "BH", name: "Bahrain", dial: "973" },
  { code: "OM", name: "Oman", dial: "968" },
  { code: "IN", name: "India", dial: "91" },
  { code: "PK", name: "Pakistan", dial: "92" },
  { code: "BD", name: "Bangladesh", dial: "880" },
  { code: "CN", name: "China", dial: "86" },
  { code: "JP", name: "Japan", dial: "81" },
  { code: "KR", name: "South Korea", dial: "82" },
  { code: "SG", name: "Singapore", dial: "65" },
  { code: "MY", name: "Malaysia", dial: "60" },
  { code: "ID", name: "Indonesia", dial: "62" },
  { code: "TH", name: "Thailand", dial: "66" },
  { code: "PH", name: "Philippines", dial: "63" },
  { code: "VN", name: "Vietnam", dial: "84" },
  { code: "HK", name: "Hong Kong", dial: "852" },
  { code: "TW", name: "Taiwan", dial: "886" },
  { code: "NZ", name: "New Zealand", dial: "64" },
  { code: "BR", name: "Brazil", dial: "55" },
  { code: "MX", name: "Mexico", dial: "52" },
  { code: "AR", name: "Argentina", dial: "54" },
  { code: "CL", name: "Chile", dial: "56" },
  { code: "CO", name: "Colombia", dial: "57" },
  { code: "PE", name: "Peru", dial: "51" },
  { code: "EG", name: "Egypt", dial: "20" },
  { code: "MA", name: "Morocco", dial: "212" },
  { code: "TZ", name: "Tanzania", dial: "255" },
  { code: "UG", name: "Uganda", dial: "256" },
  { code: "RW", name: "Rwanda", dial: "250" },
  { code: "ET", name: "Ethiopia", dial: "251" },
  { code: "CI", name: "Côte d’Ivoire", dial: "225" },
  { code: "SN", name: "Senegal", dial: "221" },
  { code: "CM", name: "Cameroon", dial: "237" },
  { code: "JM", name: "Jamaica", dial: "1876" },
  { code: "TT", name: "Trinidad and Tobago", dial: "1868" },
  { code: "BB", name: "Barbados", dial: "1246" },
  { code: "IL", name: "Israel", dial: "972" },
  { code: "RU", name: "Russia", dial: "7" },
  { code: "UA", name: "Ukraine", dial: "380" },
];

export const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "NG")!;

export function findCountryByName(name: string) {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return COUNTRIES.find((c) => c.name.toLowerCase() === needle);
}

export function findCountryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

/** Combine dial code + national number into an E.164-ish string (+dialnational). */
export function formatInternationalPhone(dial: string, national: string) {
  const d = String(dial || "").replace(/\D/g, "");
  let n = String(national || "").replace(/\D/g, "");
  // Strip a leading 0 from national numbers (common in NG/UK/etc.)
  if (n.startsWith("0")) n = n.slice(1);
  if (!d || !n) return n ? `+${n}` : "";
  // Avoid double-prefixing if the user already typed the country code
  if (n.startsWith(d)) return `+${n}`;
  return `+${d}${n}`;
}

/** Split a stored E.164-ish number into dial code + national digits. */
export function parseInternationalPhone(value: string) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return { dial: DEFAULT_COUNTRY.dial, national: "" };
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      return { dial: c.dial, national: digits.slice(c.dial.length) };
    }
  }
  return { dial: DEFAULT_COUNTRY.dial, national: digits };
}

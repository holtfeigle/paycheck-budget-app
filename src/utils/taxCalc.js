// 2026 federal income tax brackets (Rev. Proc. 2025-32)
const FEDERAL_BRACKETS = {
  single: [
    { max: 12400,  rate: 0.10 },
    { max: 50400,  rate: 0.12 },
    { max: 105700, rate: 0.22 },
    { max: 201775, rate: 0.24 },
    { max: 256225, rate: 0.32 },
    { max: 640600, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ],
  married: [
    { max: 24800,  rate: 0.10 },
    { max: 100800, rate: 0.12 },
    { max: 211400, rate: 0.22 },
    { max: 403550, rate: 0.24 },
    { max: 512450, rate: 0.32 },
    { max: 768700, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION = { single: 16100, married: 32200 };
const SS_RATE = 0.062;
const SS_WAGE_BASE = 184500; // 2026
const MEDICARE_RATE = 0.0145;

// Approximate effective state income tax rates for moderate incomes ($40k–$100k annual)
// No-tax states use 0. Progressive states use simplified effective rates.
export const STATES = [
  { code: 'AL', name: 'Alabama',          rate: 0.040 },
  { code: 'AK', name: 'Alaska',           rate: 0,     noTax: true },
  { code: 'AZ', name: 'Arizona',          rate: 0.025 },
  { code: 'AR', name: 'Arkansas',         rate: 0.047 },
  { code: 'CA', name: 'California',       rate: 0.063 },
  { code: 'CO', name: 'Colorado',         rate: 0.044 },
  { code: 'CT', name: 'Connecticut',      rate: 0.055 },
  { code: 'DE', name: 'Delaware',         rate: 0.052 },
  { code: 'FL', name: 'Florida',          rate: 0,     noTax: true },
  { code: 'GA', name: 'Georgia',          rate: 0.055 },
  { code: 'HI', name: 'Hawaii',           rate: 0.079 },
  { code: 'ID', name: 'Idaho',            rate: 0.058 },
  { code: 'IL', name: 'Illinois',         rate: 0.0495 },
  { code: 'IN', name: 'Indiana',          rate: 0.0315 },
  { code: 'IA', name: 'Iowa',             rate: 0.047 },
  { code: 'KS', name: 'Kansas',           rate: 0.053 },
  { code: 'KY', name: 'Kentucky',         rate: 0.040 },
  { code: 'LA', name: 'Louisiana',        rate: 0.042 },
  { code: 'ME', name: 'Maine',            rate: 0.063 },
  { code: 'MD', name: 'Maryland',         rate: 0.055 },
  { code: 'MA', name: 'Massachusetts',    rate: 0.050 },
  { code: 'MI', name: 'Michigan',         rate: 0.0425 },
  { code: 'MN', name: 'Minnesota',        rate: 0.066 },
  { code: 'MS', name: 'Mississippi',      rate: 0.047 },
  { code: 'MO', name: 'Missouri',         rate: 0.048 },
  { code: 'MT', name: 'Montana',          rate: 0.064 },
  { code: 'NE', name: 'Nebraska',         rate: 0.054 },
  { code: 'NV', name: 'Nevada',           rate: 0,     noTax: true },
  { code: 'NH', name: 'New Hampshire',    rate: 0,     noTax: true },
  { code: 'NJ', name: 'New Jersey',       rate: 0.057 },
  { code: 'NM', name: 'New Mexico',       rate: 0.049 },
  { code: 'NY', name: 'New York',         rate: 0.065 },
  { code: 'NC', name: 'North Carolina',   rate: 0.045 },
  { code: 'ND', name: 'North Dakota',     rate: 0.021 },
  { code: 'OH', name: 'Ohio',             rate: 0.038 },
  { code: 'OK', name: 'Oklahoma',         rate: 0.047 },
  { code: 'OR', name: 'Oregon',           rate: 0.087 },
  { code: 'PA', name: 'Pennsylvania',     rate: 0.0307 },
  { code: 'RI', name: 'Rhode Island',     rate: 0.050 },
  { code: 'SC', name: 'South Carolina',   rate: 0.065 },
  { code: 'SD', name: 'South Dakota',     rate: 0,     noTax: true },
  { code: 'TN', name: 'Tennessee',        rate: 0,     noTax: true },
  { code: 'TX', name: 'Texas',            rate: 0,     noTax: true },
  { code: 'UT', name: 'Utah',             rate: 0.0455 },
  { code: 'VT', name: 'Vermont',          rate: 0.066 },
  { code: 'VA', name: 'Virginia',         rate: 0.057 },
  { code: 'WA', name: 'Washington',       rate: 0,     noTax: true },
  { code: 'WV', name: 'West Virginia',    rate: 0.052 },
  { code: 'WI', name: 'Wisconsin',        rate: 0.065 },
  { code: 'WY', name: 'Wyoming',          rate: 0,     noTax: true },
  { code: 'DC', name: 'Washington D.C.',  rate: 0.072 },
];

function calcFederalTax(annualIncome, filingStatus) {
  const taxable = Math.max(0, annualIncome - STANDARD_DEDUCTION[filingStatus]);
  const brackets = FEDERAL_BRACKETS[filingStatus];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, b.max) - prev) * b.rate;
    prev = b.max;
  }
  return tax;
}

export function estimateNetPay(grossPaycheck, frequency, filingStatus, stateCode) {
  const periods = { weekly: 52, biweekly: 26, monthly: 12, yearly: 1 }[frequency];
  const annualGross = grossPaycheck * periods;

  const annualFederal = calcFederalTax(annualGross, filingStatus);
  const annualSS = Math.min(annualGross, SS_WAGE_BASE) * SS_RATE;
  const annualMedicare = annualGross * MEDICARE_RATE;

  const state = STATES.find((s) => s.code === stateCode);
  const annualState = state ? annualGross * state.rate : 0;

  const totalAnnualTax = annualFederal + annualSS + annualMedicare + annualState;
  const netPaycheck = (annualGross - totalAnnualTax) / periods;

  const per = (n) => Math.round((n / periods) * 100) / 100;

  return {
    net: Math.round(netPaycheck * 100) / 100,
    breakdown: {
      federal: per(annualFederal),
      ss: per(annualSS),
      medicare: per(annualMedicare),
      state: per(annualState),
      stateName: state?.name ?? '',
      noStateTax: state?.noTax ?? false,
    },
  };
}

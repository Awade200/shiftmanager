export type TaxCode = '1257L' | 'BR' | 'D0' | 'D1' | '0T' | 'NT';

export type PayFrequency = 'weekly' | 'monthly';

export interface TaxSettings {
  taxCode: TaxCode;
  payFrequency: PayFrequency;
}

export interface TaxCalculation {
  grossPay: number;
  taxCode: TaxCode;
  payFrequency: PayFrequency;
  incomeTax: number;
  nationalInsurance: number;
  totalDeductions: number;
  netPay: number;
  breakdown: {
    personalAllowance: number;
    basicRateTax: number;
    higherRateTax: number;
    additionalRateTax: number;
    niLowerRate: number;
    niHigherRate: number;
  };
}

export interface TaxBand {
  min: number;
  max: number | null;
  rate: number;
}
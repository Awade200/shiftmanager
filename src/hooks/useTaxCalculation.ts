import { useState, useEffect } from 'react';
import { TaxCode, PayFrequency, TaxCalculation, TaxSettings, TaxBand } from '@/types/taxation';

// 2024/25 UK PAYE Configuration
const TAX_YEAR = '2024/25';
const WEEKLY_ALLOWANCE_1257L = 12570 / 52; // £241.73

const SETTINGS_KEY = 'tax-settings';

const defaultTaxSettings: TaxSettings = {
  taxCode: '1257L',
  payFrequency: 'weekly'
};

export const useTaxCalculation = () => {
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        setTaxSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(taxSettings));
  }, [taxSettings]);

  const calculateIncomeTax = (grossPay: number, taxCode: TaxCode, payFrequency: PayFrequency): { amount: number; breakdown: any } => {
    const breakdown = {
      personalAllowance: 0,
      basicRateTax: 0,
      higherRateTax: 0,
      additionalRateTax: 0
    };

    // Handle no tax case
    if (taxCode === 'NT') return { amount: 0, breakdown };

    // Simple flat-rate codes
    const flatRates: Record<string, number> = { 
      BR: 0.20, 
      D0: 0.40, 
      D1: 0.45, 
      '0T': 0.20 
    };
    
    if (flatRates[taxCode]) {
      const amount = +(grossPay * flatRates[taxCode]).toFixed(2);
      if (taxCode === 'BR' || taxCode === '0T') {
        breakdown.basicRateTax = amount;
      } else if (taxCode === 'D0') {
        breakdown.higherRateTax = amount;
      } else if (taxCode === 'D1') {
        breakdown.additionalRateTax = amount;
      }
      return { amount, breakdown };
    }

    // Standard 1257L logic
    const allowance = payFrequency === 'weekly' ? WEEKLY_ALLOWANCE_1257L : WEEKLY_ALLOWANCE_1257L * 52 / 12;
    const taxable = Math.max(0, grossPay - allowance);
    let tax = 0;

    breakdown.personalAllowance = Math.min(grossPay, allowance);

    if (taxable > 0) {
      // Calculate basic rate limit based on frequency
      const basicLimit = payFrequency === 'weekly' ? 
        (37700 / 52) : // Weekly: £37,700 / 52 = £725
        (37700 / 12);  // Monthly: £37,700 / 12 = £3,141.67

      if (taxable <= basicLimit) {
        // All taxable income at basic rate (20%)
        tax = taxable * 0.20;
        breakdown.basicRateTax = tax;
      } else {
        // Basic rate portion
        const basicTax = basicLimit * 0.20;
        breakdown.basicRateTax = basicTax;
        
        // Higher rate portion (40%)
        const higherRateIncome = Math.min(taxable - basicLimit, 
          payFrequency === 'weekly' ? (125140 - 37700) / 52 : (125140 - 37700) / 12
        );
        const higherTax = higherRateIncome * 0.40;
        breakdown.higherRateTax = higherTax;
        
        // Additional rate portion (45%) for income over £125,140
        const additionalRateIncome = Math.max(0, taxable - basicLimit - higherRateIncome);
        const additionalTax = additionalRateIncome * 0.45;
        breakdown.additionalRateTax = additionalTax;
        
        tax = basicTax + higherTax + additionalTax;
      }
    }

    return { amount: +tax.toFixed(2), breakdown };
  };

  const calculateNationalInsurance = (grossPay: number, payFrequency: PayFrequency): { amount: number; breakdown: any } => {
    const breakdown = {
      niLowerRate: 0,
      niHigherRate: 0
    };

    // Convert thresholds based on pay frequency
    const primaryThreshold = payFrequency === 'weekly' ? 242 : 242 * 52 / 12; // £1,048/month
    const upperEarningsLimit = payFrequency === 'weekly' ? 967 : 967 * 52 / 12; // £4,189/month

    // No NI if below primary threshold
    if (grossPay <= primaryThreshold) return { amount: 0, breakdown };

    let totalNI = 0;

    // 12% rate between primary threshold and upper earnings limit
    if (grossPay <= upperEarningsLimit) {
      const niableIncome = grossPay - primaryThreshold;
      totalNI = niableIncome * 0.12;
      breakdown.niLowerRate = totalNI;
    } else {
      // 12% up to upper limit, then 2% above
      const lowerRateIncome = upperEarningsLimit - primaryThreshold;
      const lowerRateNI = lowerRateIncome * 0.12;
      breakdown.niLowerRate = lowerRateNI;

      const higherRateIncome = grossPay - upperEarningsLimit;
      const higherRateNI = higherRateIncome * 0.02;
      breakdown.niHigherRate = higherRateNI;

      totalNI = lowerRateNI + higherRateNI;
    }

    return { amount: +totalNI.toFixed(2), breakdown };
  };

  const calculateTax = (grossPay: number): TaxCalculation => {
    const { taxCode, payFrequency } = taxSettings;

    const incomeTaxResult = calculateIncomeTax(grossPay, taxCode, payFrequency);
    const nationalInsuranceResult = calculateNationalInsurance(grossPay, payFrequency);

    const totalDeductions = incomeTaxResult.amount + nationalInsuranceResult.amount;
    const netPay = grossPay - totalDeductions;

    return {
      grossPay,
      taxCode,
      payFrequency,
      incomeTax: incomeTaxResult.amount,
      nationalInsurance: nationalInsuranceResult.amount,
      totalDeductions,
      netPay,
      breakdown: {
        ...incomeTaxResult.breakdown,
        ...nationalInsuranceResult.breakdown
      }
    };
  };

  const updateTaxSettings = (newSettings: Partial<TaxSettings>) => {
    setTaxSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    taxSettings,
    updateTaxSettings,
    calculateTax
  };
};
import { useState, useEffect } from 'react';
import { TaxCode, PayFrequency, TaxCalculation, TaxSettings, TaxBand } from '@/types/taxation';

// 2024/25 UK tax rates
const TAX_BANDS_WEEKLY: TaxBand[] = [
  { min: 0, max: 241.73, rate: 0 },        // Personal allowance
  { min: 241.74, max: 967, rate: 0.20 },   // Basic rate
  { min: 967.01, max: 2400, rate: 0.40 },  // Higher rate
  { min: 2400.01, max: null, rate: 0.45 }  // Additional rate
];

const TAX_BANDS_MONTHLY: TaxBand[] = [
  { min: 0, max: 1047.50, rate: 0 },        // Personal allowance (£12,570/12)
  { min: 1047.51, max: 4189, rate: 0.20 },  // Basic rate
  { min: 4189.01, max: 10400, rate: 0.40 }, // Higher rate
  { min: 10400.01, max: null, rate: 0.45 }  // Additional rate
];

const NI_BANDS_WEEKLY: TaxBand[] = [
  { min: 0, max: 242, rate: 0 },
  { min: 242.01, max: 967, rate: 0.12 },
  { min: 967.01, max: null, rate: 0.02 }
];

const NI_BANDS_MONTHLY: TaxBand[] = [
  { min: 0, max: 1048, rate: 0 },
  { min: 1048.01, max: 4189, rate: 0.12 },
  { min: 4189.01, max: null, rate: 0.02 }
];

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

    // Handle different tax codes
    switch (taxCode) {
      case 'BR':
        breakdown.basicRateTax = grossPay * 0.20;
        return { amount: breakdown.basicRateTax, breakdown };
      
      case 'D0':
        breakdown.higherRateTax = grossPay * 0.40;
        return { amount: breakdown.higherRateTax, breakdown };
      
      case 'D1':
        breakdown.additionalRateTax = grossPay * 0.45;
        return { amount: breakdown.additionalRateTax, breakdown };
      
      case '0T':
        breakdown.basicRateTax = grossPay * 0.20;
        return { amount: breakdown.basicRateTax, breakdown };
      
      case 'NT':
        return { amount: 0, breakdown };
      
      case '1257L':
      default:
        // Standard calculation with personal allowance
        const taxBands = payFrequency === 'weekly' ? TAX_BANDS_WEEKLY : TAX_BANDS_MONTHLY;
        let totalTax = 0;
        let remainingPay = grossPay;

        for (const band of taxBands) {
          if (remainingPay <= 0) break;

          const bandMin = band.min;
          const bandMax = band.max || Infinity;
          const taxableInBand = Math.min(Math.max(0, remainingPay - (bandMin - Math.min(grossPay, bandMin))), bandMax - bandMin);
          
          if (taxableInBand > 0) {
            const taxInBand = taxableInBand * band.rate;
            totalTax += taxInBand;

            // Track breakdown
            if (band.rate === 0) {
              breakdown.personalAllowance += taxableInBand;
            } else if (band.rate === 0.20) {
              breakdown.basicRateTax += taxInBand;
            } else if (band.rate === 0.40) {
              breakdown.higherRateTax += taxInBand;
            } else if (band.rate === 0.45) {
              breakdown.additionalRateTax += taxInBand;
            }
          }
        }

        return { amount: totalTax, breakdown };
    }
  };

  const calculateNationalInsurance = (grossPay: number, payFrequency: PayFrequency): { amount: number; breakdown: any } => {
    const niBands = payFrequency === 'weekly' ? NI_BANDS_WEEKLY : NI_BANDS_MONTHLY;
    const breakdown = {
      niLowerRate: 0,
      niHigherRate: 0
    };

    let totalNI = 0;
    let remainingPay = grossPay;

    for (const band of niBands) {
      if (remainingPay <= 0) break;

      const bandMin = band.min;
      const bandMax = band.max || Infinity;
      
      if (grossPay > bandMin) {
        const taxableInBand = Math.min(grossPay - bandMin, bandMax - bandMin);
        
        if (taxableInBand > 0) {
          const niInBand = taxableInBand * band.rate;
          totalNI += niInBand;

          // Track breakdown
          if (band.rate === 0.12) {
            breakdown.niLowerRate += niInBand;
          } else if (band.rate === 0.02) {
            breakdown.niHigherRate += niInBand;
          }
        }
      }
    }

    return { amount: totalNI, breakdown };
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
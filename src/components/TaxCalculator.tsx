import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, PoundSterling, Receipt, Wallet } from 'lucide-react';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import { TaxCode, PayFrequency } from '@/types/taxation';

interface TaxCalculatorProps {
  grossPay: number;
  className?: string;
}

const TAX_CODE_OPTIONS: { value: TaxCode; label: string; description: string }[] = [
  { value: '1257L', label: '1257L', description: 'Standard personal allowance' },
  { value: 'BR', label: 'BR', description: 'Basic rate (20%) - no allowance' },
  { value: 'D0', label: 'D0', description: 'Higher rate (40%) - no allowance' },
  { value: 'D1', label: 'D1', description: 'Additional rate (45%) - no allowance' },
  { value: '0T', label: '0T', description: 'No allowance - basic rate' },
  { value: 'NT', label: 'NT', description: 'No tax' }
];

const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

const TaxCalculator = ({ grossPay, className }: TaxCalculatorProps) => {
  const { taxSettings, updateTaxSettings, calculateTax } = useTaxCalculation();
  
  const taxCalculation = calculateTax(grossPay);

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Tax & NI Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tax-code">Tax Code</Label>
            <Select 
              value={taxSettings.taxCode} 
              onValueChange={(value: TaxCode) => updateTaxSettings({ taxCode: value })}
            >
              <SelectTrigger id="tax-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_CODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pay-frequency">Pay Frequency</Label>
            <Select 
              value={taxSettings.payFrequency} 
              onValueChange={(value: PayFrequency) => updateTaxSettings({ payFrequency: value })}
            >
              <SelectTrigger id="pay-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Calculation Results */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gross Pay</span>
              <span className="text-lg font-bold">{formatCurrency(taxCalculation.grossPay)}</span>
            </div>
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-xs">
                {taxCalculation.taxCode} | {taxCalculation.payFrequency}
              </Badge>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Deductions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                Income Tax
              </span>
              <span className="font-medium text-red-600">
                -{formatCurrency(taxCalculation.incomeTax)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <PoundSterling className="w-4 h-4 text-muted-foreground" />
                National Insurance
              </span>
              <span className="font-medium text-red-600">
                -{formatCurrency(taxCalculation.nationalInsurance)}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total Deductions</span>
              <span className="text-red-600">
                -{formatCurrency(taxCalculation.totalDeductions)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="w-4 h-4" />
                Net Pay (Take Home)
              </span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(taxCalculation.netPay)}
              </span>
            </div>
          </div>

          {/* Quick Info */}
          {grossPay > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Effective tax rate: {((taxCalculation.totalDeductions / grossPay) * 100).toFixed(1)}%</div>
              <div>• Based on {taxCalculation.payFrequency} pay period for tax year 2024/25</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxCalculator;
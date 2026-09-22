import { GSTBreakdown } from '../../types';

export const SELLER_STATE = 'Karnataka';
export const SELLER_GSTIN = '29ABCDE1234F1Z5';
export const SELLER_LEGAL_NAME = 'Nitro Hub Apparel Private Limited';

export function calculateOrderGST(
  items: Array<{ unit_price: number; quantity: number }>,
  buyerState: string = 'Karnataka',
  discountAmount: number = 0
): GSTBreakdown {
  const isInterstate = buyerState.trim().toLowerCase() !== SELLER_STATE.toLowerCase();
  
  const rawSubtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const netTaxableAmount = Math.max(0, rawSubtotal - discountAmount);

  // Determine blended or average tax rate based on garment prices
  // Garments > 1000 INR take 12% GST, <= 1000 INR take 5% GST
  let totalTax = 0;
  
  items.forEach((item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const itemShare = rawSubtotal > 0 ? itemSubtotal / rawSubtotal : 0;
    const allocatedDiscount = discountAmount * itemShare;
    const itemTaxable = Math.max(0, itemSubtotal - allocatedDiscount);
    
    // In apparel, if price > 1000 -> 12%, else 5%
    const rate = item.unit_price > 1000 ? 0.12 : 0.05;
    totalTax += itemTaxable * rate;
  });

  totalTax = Math.round(totalTax * 100) / 100;

  if (isInterstate) {
    return {
      taxable_amount: netTaxableAmount,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: netTaxableAmount > 0 ? Math.round((totalTax / netTaxableAmount) * 10000) / 100 : 12,
      igst_amount: totalTax,
      total_tax: totalTax,
      is_interstate: true,
    };
  } else {
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    const halfRate = netTaxableAmount > 0 ? Math.round(((totalTax / 2) / netTaxableAmount) * 10000) / 100 : 6;
    return {
      taxable_amount: netTaxableAmount,
      cgst_rate: halfRate,
      cgst_amount: halfTax,
      sgst_rate: halfRate,
      sgst_amount: halfTax,
      igst_rate: 0,
      igst_amount: 0,
      total_tax: totalTax,
      is_interstate: false,
    };
  }
}

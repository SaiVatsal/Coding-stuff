import jsPDF from 'jspdf';
import { Order } from '../../types';
import { SELLER_GSTIN, SELLER_STATE } from './calculator';

export function generateGSTInvoicePDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header / Brand
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text('NITRO HUB', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('PREMIUM FASHION. ACCESSIBLE LUXURY.', 15, y + 5);

  // Tax Invoice Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('TAX INVOICE', pageWidth - 15, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Invoice No: INV-${order.order_number}`, pageWidth - 15, y + 6, { align: 'right' });
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, pageWidth - 15, y + 11, { align: 'right' });
  doc.text(`Place of Supply: ${order.shipping_address.state}`, pageWidth - 15, y + 16, { align: 'right' });

  y += 24;

  // Line separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  y += 6;

  // Seller & Buyer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('SOLD BY (SELLER):', 15, y);
  doc.text('BILL TO & SHIP TO (BUYER):', pageWidth / 2 + 5, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  // Seller info
  doc.text('Nitro Hub Apparel Pvt. Ltd.', 15, y);
  doc.text('104, Indiranagar 100ft Road, Stage 2', 15, y + 4);
  doc.text('Bengaluru, Karnataka - 560038, India', 15, y + 8);
  doc.text(`GSTIN: ${SELLER_GSTIN}`, 15, y + 12);
  doc.text(`State: ${SELLER_STATE} (Code: 29)`, 15, y + 16);
  doc.text('Email: support@nitrohub.in | Phone: +91 80 4912 3456', 15, y + 20);

  // Buyer info
  const b = order.shipping_address;
  doc.text(`${b.recipient_name}`, pageWidth / 2 + 5, y);
  doc.text(`${b.address_line1}${b.address_line2 ? ', ' + b.address_line2 : ''}`, pageWidth / 2 + 5, y + 4);
  doc.text(`${b.city}, ${b.state} - ${b.pincode}`, pageWidth / 2 + 5, y + 8);
  doc.text(`Phone: ${b.phone}`, pageWidth / 2 + 5, y + 12);
  if (order.guest_email) {
    doc.text(`Email: ${order.guest_email}`, pageWidth / 2 + 5, y + 16);
  }

  y += 28;

  // Table Header
  doc.setFillColor(245, 242, 235);
  doc.rect(15, y, pageWidth - 30, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);

  doc.text('#', 18, y + 5);
  doc.text('ITEM DESCRIPTION', 26, y + 5);
  doc.text('HSN', 90, y + 5);
  doc.text('QTY', 110, y + 5);
  doc.text('RATE (₹)', 128, y + 5);
  doc.text('TAXABLE (₹)', 150, y + 5);
  doc.text('TOTAL (₹)', pageWidth - 18, y + 5, { align: 'right' });

  y += 9;

  // Line Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  order.items.forEach((item, idx) => {
    doc.text(`${idx + 1}`, 18, y);
    doc.text(`${item.product_name} (${item.variant_name})`, 26, y);
    doc.text(`${item.hsn_code || '61091000'}`, 90, y);
    doc.text(`${item.quantity}`, 112, y);
    doc.text(`${item.unit_price.toFixed(2)}`, 128, y);
    doc.text(`${(item.unit_price * item.quantity).toFixed(2)}`, 150, y);
    doc.text(`${item.total_price.toFixed(2)}`, pageWidth - 18, y, { align: 'right' });

    y += 6;
  });

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Calculations block (Right aligned)
  const calcX = pageWidth - 75;
  const valX = pageWidth - 18;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', calcX, y);
  doc.text(`₹${order.subtotal.toFixed(2)}`, valX, y, { align: 'right' });
  y += 5;

  if (order.discount_amount > 0) {
    doc.text(`Discount (${order.coupon_code || 'Promo'}):`, calcX, y);
    doc.text(`-₹${order.discount_amount.toFixed(2)}`, valX, y, { align: 'right' });
    y += 5;
  }

  if (order.gst_breakdown) {
    if (order.gst_breakdown.is_interstate) {
      doc.text(`IGST (${order.gst_breakdown.igst_rate}%):`, calcX, y);
      doc.text(`₹${order.gst_breakdown.igst_amount.toFixed(2)}`, valX, y, { align: 'right' });
      y += 5;
    } else {
      doc.text(`CGST (${order.gst_breakdown.cgst_rate}%):`, calcX, y);
      doc.text(`₹${order.gst_breakdown.cgst_amount.toFixed(2)}`, valX, y, { align: 'right' });
      y += 5;
      doc.text(`SGST (${order.gst_breakdown.sgst_rate}%):`, calcX, y);
      doc.text(`₹${order.gst_breakdown.sgst_amount.toFixed(2)}`, valX, y, { align: 'right' });
      y += 5;
    }
  }

  doc.text('Shipping Fee:', calcX, y);
  doc.text(order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee.toFixed(2)}`, valX, y, { align: 'right' });
  y += 6;

  // Grand Total Box
  doc.setFillColor(20, 20, 20);
  doc.rect(calcX - 5, y - 4, pageWidth - calcX - 10 + 5, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', calcX, y + 1.5);
  doc.text(`₹${order.total_amount.toFixed(2)}`, valX, y + 1.5, { align: 'right' });

  y += 20;

  // Signatory & Declarations
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', 15, y);
  doc.text('Customer Grievance Officer: grievance@nitrohub.in | Consumer Protection (E-Commerce) Rules 2020 Compliant', 15, y + 4);

  doc.text('For Nitro Hub Apparel Pvt. Ltd.', pageWidth - 60, y + 10);
  doc.text('Authorized Signatory (Digital Signature)', pageWidth - 60, y + 18);

  // Save the PDF
  doc.save(`Invoice_${order.order_number}.pdf`);
}

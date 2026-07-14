import { jsPDF } from 'jspdf';
import { Booking, Payment } from '../types';
import { BrandSettings } from '../contexts/BrandContext';
import { getStatusLabel } from './statusUtils';
import { offlineService } from '../services/offlineService';

// Helper to load image from URL and convert to Base64 data URI for jsPDF
const loadLogoImage = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    // If it's already a base64 DataURL, return it directly
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error('Error rendering image to canvas for PDF:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load logo image for PDF, using text fallback.');
      resolve(null);
    };
    img.src = url;
  });
};

// Helper to draw a beautiful, highly precise vector QR code
const drawQRCode = (doc: jsPDF, x: number, y: number, size: number = 25) => {
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  doc.setLineWidth(0.4);
  
  // Outer Border Frame
  doc.rect(x - 1, y - 1, size + 2, size + 2, 'D');

  // Position detection eyes (top-left, top-right, bottom-left)
  const eyeSize = size * 0.28;

  // 1. Top-Left Eye
  doc.rect(x, y, eyeSize, eyeSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + eyeSize * 0.15, y + eyeSize * 0.15, eyeSize * 0.7, eyeSize * 0.7, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + eyeSize * 0.3, y + eyeSize * 0.3, eyeSize * 0.4, eyeSize * 0.4, 'F');

  // 2. Top-Right Eye
  doc.rect(x + size - eyeSize, y, eyeSize, eyeSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size - eyeSize + eyeSize * 0.15, y + eyeSize * 0.15, eyeSize * 0.7, eyeSize * 0.7, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + size - eyeSize + eyeSize * 0.3, y + eyeSize * 0.3, eyeSize * 0.4, eyeSize * 0.4, 'F');

  // 3. Bottom-Left Eye
  doc.rect(x, y + size - eyeSize, eyeSize, eyeSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + eyeSize * 0.15, y + size - eyeSize + eyeSize * 0.15, eyeSize * 0.7, eyeSize * 0.7, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + eyeSize * 0.3, y + size - eyeSize + eyeSize * 0.3, eyeSize * 0.4, eyeSize * 0.4, 'F');

  // Small alignment marker bottom-right
  const alignSize = size * 0.12;
  doc.rect(x + size - alignSize - 1.5, y + size - alignSize - 1.5, alignSize, alignSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size - alignSize - 1.5 + alignSize * 0.2, y + size - alignSize - 1.5 + alignSize * 0.2, alignSize * 0.6, alignSize * 0.6, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + size - alignSize - 1.5 + alignSize * 0.35, y + size - alignSize - 1.5 + alignSize * 0.35, alignSize * 0.3, alignSize * 0.3, 'F');

  // Fill pseudo-random cells to make it look completely authentic
  doc.setFillColor(0, 0, 0);
  const cells = 17;
  const cellSize = size / cells;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Don't draw over the outer tracking eyes
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c > cells - 7;
      const inBottomLeft = r > cells - 7 && c < 6;
      const inBottomRight = r > cells - 4 && c > cells - 4;
      
      if (!inTopLeft && !inTopRight && !inBottomLeft && !inBottomRight) {
        if ((r * 11 + c * 7) % 3 === 0 || (r * c) % 4 === 1 || (r + c) % 5 === 0) {
          doc.rect(x + c * cellSize, y + r * cellSize, cellSize, cellSize, 'F');
        }
      }
    }
  }
};

// Add standard luxury styles, header, and logo to PDF
const addPDFHeader = (
  doc: jsPDF,
  settings: BrandSettings,
  logoBase64: string | null,
  title: string
): number => {
  // 1. Gold-colored top primary band
  doc.setFillColor(212, 175, 55); // #D4AF37
  doc.rect(0, 0, 210, 8, 'F');

  let currentY = 22;
  let leftBottomY = currentY + 18;

  // 2. Draw brand identity (Left Side with automatic wrapping to prevent overlap)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, currentY, 18, 18);
      
      // Business Name beside logo (Max width 90mm to reserve right column)
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      
      const nameText = settings.studioName || 'Asmaul Production';
      const nameLines = doc.splitTextToSize(nameText, 90);
      let nameY = currentY + 6;
      nameLines.forEach((line: string) => {
        doc.text(line, 36, nameY);
        nameY += 6.5;
      });

      // Business Tagline below Business Name (Max width 90mm)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      
      const taglineText = settings.studioTagline || 'Luxury Wedding Photojournalism';
      const taglineLines = doc.splitTextToSize(taglineText, 90);
      let taglineY = nameY - 1.5; // space perfectly below name
      taglineLines.forEach((line: string) => {
        doc.text(line, 36, taglineY);
        taglineY += 4.5;
      });

      leftBottomY = Math.max(currentY + 18, taglineY);
    } catch (e) {
      // Fallback
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(212, 175, 55);
      
      const nameText = settings.studioName || 'Asmaul Production';
      const nameLines = doc.splitTextToSize(nameText, 110);
      let nameY = currentY + 7;
      nameLines.forEach((line: string) => {
        doc.text(line, 14, nameY);
        nameY += 8;
      });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      
      const taglineText = settings.studioTagline || 'Luxury Wedding Photojournalism';
      const taglineLines = doc.splitTextToSize(taglineText, 110);
      let taglineY = nameY - 1;
      taglineLines.forEach((line: string) => {
        doc.text(line, 14, taglineY);
        taglineY += 4.5;
      });

      leftBottomY = taglineY;
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55); // Luxury Gold Theme
    
    const nameText = settings.studioName || 'Asmaul Production';
    const nameLines = doc.splitTextToSize(nameText, 110);
    let nameY = currentY + 7;
    nameLines.forEach((line: string) => {
      doc.text(line, 14, nameY);
      nameY += 8;
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    
    const taglineText = settings.studioTagline || 'Luxury Wedding Photojournalism';
    const taglineLines = doc.splitTextToSize(taglineText, 110);
    let taglineY = nameY - 1;
    taglineLines.forEach((line: string) => {
      doc.text(line, 14, taglineY);
      taglineY += 4.5;
    });

    leftBottomY = taglineY;
  }

  // 3. Right Side: Document Header Details (Fixed area on the right, right-aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(title.toUpperCase(), 196, currentY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${today}`, 196, currentY + 9, { align: 'right' });
  doc.text(`Office Phone: ${settings.studioPhone || '+91 98765 43210'}`, 196, currentY + 13, { align: 'right' });

  const rightBottomY = currentY + 18;
  const headerBottomY = Math.max(leftBottomY, rightBottomY);

  // Dynamic header end Y coordinate with proper spacing
  currentY = headerBottomY + 3;

  // Thin dividing line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, 196, currentY);

  return currentY + 8;
};

// Add standard footer
const addPDFFooter = (doc: jsPDF, settings: BrandSettings) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Gold divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`${settings.studioName || 'Asmaul Production'} | ${settings.studioAddress || 'Calcutta, India'}`, 14, pageHeight - 12);
  doc.text(`Email: ${settings.studioEmail || 'info@asmaulproduction.com'} | Web: ${settings.website || 'www.asmaulproduction.com'}`, 14, pageHeight - 8);
  
  doc.setFont('helvetica', 'bold');
  doc.text('PAGE 1 OF 1', 196, pageHeight - 10, { align: 'right' });
};

// Core Builder: Booking Confirmation
export const buildBookingConfirmationPDF = async (
  booking: Booking,
  settings: BrandSettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = await loadLogoImage(settings.studioLogo || '');
  let y = addPDFHeader(doc, settings, logoBase64, 'Booking Confirmation');

  // 1. Client & Booking Registry Details Panel (Simplified)
  doc.setFillColor(249, 249, 248);
  doc.rect(14, y, 182, 38, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, y, 182, 38, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('BOOKING CONFIRMATION', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  
  doc.text(`Client Name: ${booking.clientName}`, 18, y + 13);
  doc.text(`Booking For: ${booking.bookingFor || 'Wedding'}`, 18, y + 19);
  doc.text(`Coverage: ${booking.coverage || 'Both Side'}`, 18, y + 25);
  doc.text(`Event Date: ${booking.weddingDate}`, 18, y + 31);

  doc.text(`Total Amount: INR ${booking.totalAmount.toLocaleString('en-IN')}`, 112, y + 13);
  doc.text(`Advance Paid: INR ${booking.paidAmount.toLocaleString('en-IN')}`, 112, y + 19);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55); // Premium Gold color
  doc.text(`Remaining Due: INR ${(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}`, 112, y + 25);

  y += 46;

  // 2. Payment History Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('PAYMENT HISTORY', 14, y);
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 6;

  // Fetch payment records from database
  let bookingPayments: Payment[] = [];
  try {
    const allPayments = await offlineService.getPayments();
    bookingPayments = allPayments
      .filter((p) => p.bookingId === booking.id && p.status === 'completed')
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically (oldest first)
  } catch (err) {
    console.error('Error fetching payments for PDF:', err);
  }

  // Calculate rows for history
  let cumulativePaid = 0;
  let historyRows = bookingPayments.map((p) => {
    cumulativePaid += p.amount;
    const remainingDue = Math.max(0, booking.totalAmount - cumulativePaid);
    
    let formattedDate = p.date;
    try {
      const d = new Date(p.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (_) {}
    
    return {
      date: formattedDate,
      received: `₹${p.amount.toLocaleString('en-IN')}`,
      totalPaid: `₹${cumulativePaid.toLocaleString('en-IN')}`,
      remainingDue: `₹${remainingDue.toLocaleString('en-IN')}`
    };
  });

  // Fallback if there are no logged payment records but there is paidAmount on the booking
  if (historyRows.length === 0 && booking.paidAmount > 0) {
    let formattedDate = '';
    try {
      const d = new Date(booking.createdAt);
      formattedDate = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      formattedDate = 'Initial Deposit';
    }
    historyRows = [
      {
        date: formattedDate,
        received: `₹${booking.paidAmount.toLocaleString('en-IN')}`,
        totalPaid: `₹${booking.paidAmount.toLocaleString('en-IN')}`,
        remainingDue: `₹${(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}`
      }
    ];
  }

  // Header row for table
  doc.setFillColor(242, 242, 241);
  doc.rect(14, y, 182, 7.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Payment Date', 18, y + 4.5);
  doc.text('Payment Received', 70, y + 4.5);
  doc.text('Total Paid', 122, y + 4.5);
  doc.text('Remaining Due', 186, y + 4.5, { align: 'right' });
  
  y += 7.5;

  if (historyRows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text('No payments registered yet.', 18, y + 5);
    y += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);

    historyRows.forEach((row, idx) => {
      // Zebra striping
      if (idx % 2 === 1) {
        doc.setFillColor(252, 252, 252);
        doc.rect(14, y, 182, 7.5, 'F');
      }
      
      doc.setDrawColor(245, 245, 245);
      doc.line(14, y + 7.5, 196, y + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(row.date, 18, y + 5);
      doc.text(row.received, 70, y + 5);
      doc.text(row.totalPaid, 122, y + 5);
      
      doc.setFont('helvetica', 'bold');
      if (row.remainingDue === '₹0' || row.remainingDue.includes(' 0')) {
        doc.setTextColor(30, 100, 50); // Green if fully paid
      } else {
        doc.setTextColor(212, 175, 55); // Premium Gold
      }
      doc.text(row.remainingDue, 186, y + 5, { align: 'right' });
      
      y += 7.5;
    });
  }

  y += 10;

  // 3. Thank You & QR Authentication block
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 7;

  // Render Custom Vector QR Code
  drawQRCode(doc, 170, y, 22);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Thank you for choosing Asmaul Production.', 14, y);

  // Authorizing Signature stamp
  y = Math.max(y + 20, 225);
  doc.setDrawColor(180, 180, 180);
  doc.line(140, y, 190, y);
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text(settings.authorizedSignature || 'Asmaul Production Authorized Signatory', 165, y - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Studio Sign-off', 165, y + 4, { align: 'center' });

  addPDFFooter(doc, settings);
  return doc;
};

// Core Builder: Payment Receipt
export const buildPaymentReceiptPDF = async (
  payment: Payment,
  settings: BrandSettings,
  associatedBooking?: Booking
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = await loadLogoImage(settings.studioLogo || '');
  
  // Detect if paid in full (Remaining Due = 0)
  const bookingTotal = associatedBooking ? associatedBooking.totalAmount : payment.amount;
  const bookingPaid = associatedBooking ? associatedBooking.paidAmount : payment.amount;
  const remainingDue = Math.max(0, bookingTotal - bookingPaid);
  const isPaidInFull = remainingDue === 0;

  const titleText = isPaidInFull ? 'Final Payment Receipt' : 'Payment Installment Receipt';
  let y = addPDFHeader(doc, settings, logoBase64, titleText);

  // 1. Payment Registry panel
  doc.setFillColor(249, 249, 248);
  doc.rect(14, y, 182, 32, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, y, 182, 32, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('TRANSACTION CREDIT LEDGER', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Receipt Reference: REC-2026-${payment.id.toUpperCase().slice(2, 8)}`, 18, y + 13);
  doc.text(`Payment Logged: ${payment.date}`, 18, y + 19);
  doc.text(`Payment Instrument: ${payment.paymentMethod}`, 18, y + 25);

  doc.text(`Client Marriage Registry: ${payment.clientName}`, 112, y + 13);
  doc.text(`Booking Reference ID: ${payment.bookingId.toUpperCase().slice(0, 8)}`, 112, y + 19);
  
  // Paid-In-Full Badge / Status
  doc.text(`Transaction Status:`, 112, y + 25);
  doc.setFillColor(isPaidInFull ? 212 : 230, isPaidInFull ? 175 : 245, isPaidInFull ? 55 : 233, isPaidInFull ? 0.15 : 1.0);
  doc.rect(142, y + 21, 26, 5, 'F');
  doc.setDrawColor(isPaidInFull ? 212 : 180, isPaidInFull ? 175 : 220, isPaidInFull ? 55 : 190);
  doc.rect(142, y + 21, 26, 5, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(isPaidInFull ? 130 : 30, isPaidInFull ? 100 : 100, isPaidInFull ? 30 : 50);
  doc.text(isPaidInFull ? 'PAID IN FULL' : 'SUCCESSFUL', 155, y + 24.5, { align: 'center' });

  y += 40;

  // 2. Receipt Amount highlight block
  doc.setFillColor(242, 247, 243); // Light soft green
  doc.rect(14, y, 182, 16, 'F');
  doc.setDrawColor(180, 215, 185);
  doc.rect(14, y, 182, 16, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 90, 50);
  doc.text('CREDITED AMOUNT RECEIVED:', 20, y + 10);
  
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`INR ${payment.amount.toLocaleString('en-IN')}`, 176, y + 11, { align: 'right' });

  y += 24;

  // 3. Ledger break-down
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('OFFICIAL STATEMENTS OF ACCOUNTS', 14, y);
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 6;

  const statementRows = [
    { label: 'Original Project Shoot Value:', val: `INR ${bookingTotal.toLocaleString('en-IN')}` },
    { label: 'Cumulative Total Paid Till Date:', val: `INR ${bookingPaid.toLocaleString('en-IN')}` },
    { label: 'Net Outstanding Remaining Due:', val: `INR ${remainingDue.toLocaleString('en-IN')}`, highlight: true },
  ];

  statementRows.forEach((row) => {
    if (row.highlight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(212, 175, 55); // Gold
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
    }
    doc.setFontSize(8.5);
    doc.text(row.label, 14, y);
    doc.text(row.val, 186, y, { align: 'right' });
    y += 6.5;
  });

  y += 4;

  // 4. Notes & QR
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('REMITTANCE REMARKS & AUTHENTICATOR', 14, y);

  // QR
  drawQRCode(doc, 170, y, 22);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`Remarks: ${payment.notes || 'Production shoot advance credit logged successfully.'}`, 14, y);
  
  y += 5;
  if (isPaidInFull) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 100, 50);
    doc.text('CONGRATULATIONS! Your contract is paid in full. We look forward to wedding delivery.', 14, y);
    doc.setTextColor(110, 110, 110);
  } else {
    doc.text('This is a legally binding ledger statement. Retain copy for final registry clearance.', 14, y);
  }

  y = Math.max(y + 12, 225);
  doc.setDrawColor(180, 180, 180);
  doc.line(140, y, 190, y);
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text(settings.authorizedSignature || 'Asmaul Production Accounts Dept', 165, y - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Finance Sign-off', 165, y + 4, { align: 'center' });

  addPDFFooter(doc, settings);
  return doc;
};

// Backwards-compatible download triggers
export const downloadBookingConfirmationPDF = async (
  booking: Booking,
  settings: BrandSettings
) => {
  const doc = await buildBookingConfirmationPDF(booking, settings);
  doc.save(`booking_confirmation_${booking.id.slice(0, 8)}.pdf`);
};

export const downloadPaymentReceiptPDF = async (
  payment: Payment,
  settings: BrandSettings,
  associatedBooking?: Booking
) => {
  const doc = await buildPaymentReceiptPDF(payment, settings, associatedBooking);
  doc.save(`payment_receipt_${payment.id.slice(0, 8)}.pdf`);
};

// Invoice Builder
export const buildInvoicePDF = async (
  booking: Booking,
  settings: BrandSettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = await loadLogoImage(settings.studioLogo || '');
  let y = addPDFHeader(doc, settings, logoBase64, 'Invoice');

  // Invoice registry details
  const invoicePrefix = settings.invoicePrefix || 'INV-2026-';
  const invoiceNo = `${invoicePrefix}${booking.id.toUpperCase().slice(0, 6)}`;

  doc.setFillColor(249, 249, 248);
  doc.rect(14, y, 182, 32, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, y, 182, 32, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('BILL TO CLIENT', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Client Name: ${booking.clientName}`, 18, y + 13);
  doc.text(`Client Phone: ${booking.clientPhone || 'N/A'}`, 18, y + 19);
  doc.text(`Client Email: ${booking.clientEmail || 'N/A'}`, 18, y + 25);

  doc.text(`Invoice No: ${invoiceNo}`, 112, y + 13);
  doc.text(`Wedding Shoot Date: ${booking.weddingDate}`, 112, y + 19);
  doc.text(`Payment Clearance Term: Advance Installment`, 112, y + 25);

  y += 40;

  // Invoice lines table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('INVOICE LINE ITEMS', 14, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Item Description of Services', 18, y + 4.5);
  doc.text('Total Price', 186, y + 4.5, { align: 'right' });
  y += 7.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Wedding Shoots Luxury Coverage Package: ${booking.packageName}`, 18, y + 4.5);
  doc.text(`INR ${booking.totalAmount.toLocaleString('en-IN')}`, 186, y + 4.5, { align: 'right' });

  y += 11;
  doc.line(14, y, 196, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 125, y);
  doc.text(`INR ${booking.totalAmount.toLocaleString('en-IN')}`, 186, y, { align: 'right' });
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.text('Advance Payments Logged:', 125, y);
  doc.text(`INR ${booking.paidAmount.toLocaleString('en-IN')}`, 186, y, { align: 'right' });
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text('Remaining Due:', 125, y);
  doc.text(`INR ${(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}`, 186, y, { align: 'right' });
  
  y += 12;

  // Remittance
  if (settings.bankName || settings.upiId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text('OFFICIAL STUDIO REMITTANCE ROUTING', 14, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    if (settings.bankName) {
      doc.text(`Bank Name: ${settings.bankName} | Account No: ${settings.bankAccountNo} | IFSC Code: ${settings.bankIfsc}`, 14, y);
      y += 4;
    }
    if (settings.upiId) {
      doc.text(`UPI Virtual Address: ${settings.upiId}`, 14, y);
    }
  }

  y = Math.max(y + 12, 225);
  doc.setDrawColor(180, 180, 180);
  doc.line(140, y, 190, y);
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text(settings.authorizedSignature || 'Asmaul Production Finance Dept', 165, y - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Signatory Stamp', 165, y + 4, { align: 'center' });

  addPDFFooter(doc, settings);
  return doc;
};

export const downloadInvoicePDF = async (
  booking: Booking,
  settings: BrandSettings
) => {
  const doc = await buildInvoicePDF(booking, settings);
  doc.save(`invoice_${booking.id.slice(0, 8)}.pdf`);
};

// Freelancer Work Order builder
export const buildFreelancerWorkOrderPDF = async (
  booking: Booking,
  settings: BrandSettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = await loadLogoImage(settings.studioLogo || '');
  let y = addPDFHeader(doc, settings, logoBase64, 'Freelancer Work Order');

  // Freelancer details panel
  doc.setFillColor(249, 249, 248);
  doc.rect(14, y, 182, 32, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, y, 182, 32, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('CONTRACTOR DETAILS', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Freelancer Name: ${booking.photographer}`, 18, y + 13);
  doc.text(`Contact Phone: ${booking.freelancerPhone || 'N/A'}`, 18, y + 19);
  doc.text(`Work Order ID: WO-${booking.id.toUpperCase().slice(0, 8)}`, 18, y + 25);

  doc.text(`Project Assignment: ${booking.packageName}`, 112, y + 13);
  doc.text(`Date of Wedding: ${booking.weddingDate}`, 112, y + 19);
  doc.text(`Total Agreed Remittance: INR ${(booking.freelancerRate || 0).toLocaleString('en-IN')}`, 112, y + 25);

  y += 40;

  // Work details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('ASSIGNMENTS & EVENT SCHEDULE BREAKDOWNS', 14, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Event Venue / Destination: ${booking.venue}`, 14, y);
  y += 8;

  if (booking.freelancerAssignments && booking.freelancerAssignments.length > 0) {
    booking.freelancerAssignments.forEach((assignment, index) => {
      doc.setFillColor(252, 252, 252);
      doc.rect(14, y, 182, 13, 'F');
      doc.setDrawColor(235, 235, 235);
      doc.rect(14, y, 182, 13, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(`${index + 1}. ${assignment.eventType} - ${assignment.eventDate}`, 18, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`Venue: ${assignment.venue} | Duration: ${assignment.workingDays} Days | Rate: INR ${assignment.perDayRate}/day`, 18, y + 9);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(`Subtotal: INR ${assignment.totalPayment.toLocaleString('en-IN')}`, 180, y + 7.5, { align: 'right' });

      y += 16;
    });
  } else {
    doc.text('Lead shooter/videography production support. Delivery of RAW cards within 48h.', 14, y);
    y += 10;
  }

  y = Math.max(y + 5, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('OFFICIAL STUDIO RULES & COMPLIANCES', 14, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  const guidelines = [
    '1. Absolute strict professional code of conduct in front of guests and premium clients.',
    '2. Standard black formal/semiformal attire is mandatory during shoot coverage.',
    '3. RAW backup must be uploaded to our private studio servers within 48 hours of completion.',
    '4. Remittance is released within 5 bank business days post verification of card deliveries.',
  ];
  guidelines.forEach((g) => {
    doc.text(g, 14, y);
    y += 4.5;
  });

  y = Math.max(y + 12, 225);
  doc.setDrawColor(180, 180, 180);
  doc.line(140, y, 190, y);
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text(settings.authorizedSignature || 'Asmaul Production Production Team', 165, y - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Studio Sign-off', 165, y + 4, { align: 'center' });

  addPDFFooter(doc, settings);
  return doc;
};

export const downloadFreelancerWorkOrderPDF = async (
  booking: Booking,
  settings: BrandSettings
) => {
  const doc = await buildFreelancerWorkOrderPDF(booking, settings);
  doc.save(`freelancer_work_order_${booking.id.slice(0, 8)}.pdf`);
};

// Helper to format date in DD/MM/YYYY format
const formatDateDMY = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD format
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (_) {}
  return dateStr;
};

// Helper to draw a luxury minimal header for the Agreement specifically
const addAgreementHeader = (
  doc: jsPDF,
  settings: BrandSettings,
  logoBase64: string | null,
  title: string
): number => {
  // 1. Sleek top decorative gold accent line
  doc.setFillColor(212, 175, 55); // #D4AF37 (Gold)
  doc.rect(0, 0, 210, 8, 'F');

  let currentY = 16;

  // 2. Left side: Branding (Logo, Business Name, Tagline)
  let leftBottomY = currentY + 18;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, currentY, 18, 18);
      
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      
      const nameText = settings.studioName || 'Asmaul Production';
      const nameLines = doc.splitTextToSize(nameText, 90);
      let nameY = currentY + 6;
      nameLines.forEach((line: string) => {
        doc.text(line, 36, nameY);
        nameY += 6.5;
      });

      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      
      const taglineText = settings.studioTagline || 'Luxury Wedding Photojournalism';
      const taglineLines = doc.splitTextToSize(taglineText, 90);
      let taglineY = nameY - 1.5;
      taglineLines.forEach((line: string) => {
        doc.text(line, 36, taglineY);
        taglineY += 4.5;
      });

      leftBottomY = Math.max(currentY + 18, taglineY);
    } catch (_) {
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(212, 175, 55);
      
      const nameText = settings.studioName || 'Asmaul Production';
      const nameLines = doc.splitTextToSize(nameText, 110);
      let nameY = currentY + 7;
      nameLines.forEach((line: string) => {
        doc.text(line, 14, nameY);
        nameY += 8;
      });

      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      
      const taglineText = settings.studioTagline || 'Luxury Wedding Photojournalism';
      const taglineLines = doc.splitTextToSize(taglineText, 110);
      let taglineY = nameY - 1;
      taglineLines.forEach((line: string) => {
        doc.text(line, 14, taglineY);
        taglineY += 4.5;
      });

      leftBottomY = taglineY;
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    
    const nameText = settings.studioName || 'Asmaul Production';
    const nameLines = doc.splitTextToSize(nameText, 110);
    let nameY = currentY + 7;
    nameLines.forEach((line: string) => {
      doc.text(line, 14, nameY);
      nameY += 8;
    });

    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    
    const taglineText = settings.studioTagline || 'Luxury Wedding Photojournalism';
    const taglineLines = doc.splitTextToSize(taglineText, 110);
    let taglineY = nameY - 1;
    taglineLines.forEach((line: string) => {
      doc.text(line, 14, taglineY);
      taglineY += 4.5;
    });

    leftBottomY = taglineY;
  }

  // 3. Right side: Dynamic Business Contact & Header Information (Address, Phone, Email, Website)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  
  let rightY = currentY;
  const rightAlignX = 196;

  // Render Document Title first (small top bold tag)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(title.toUpperCase(), rightAlignX, rightY, { align: 'right' });
  rightY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);

  // Split and draw studioAddress
  const addrText = settings.studioAddress || 'Calcutta, West Bengal, India';
  const addrLines = doc.splitTextToSize(addrText, 70);
  addrLines.forEach((line: string) => {
    doc.text(line, rightAlignX, rightY, { align: 'right' });
    rightY += 3.2;
  });

  doc.text(`Phone: ${settings.studioPhone || '+91 98765 43210'}`, rightAlignX, rightY, { align: 'right' });
  rightY += 3.2;
  doc.text(`Email: ${settings.studioEmail || 'info@asmaulproduction.com'}`, rightAlignX, rightY, { align: 'right' });
  rightY += 3.2;
  doc.text(`Website: ${settings.website || 'www.asmaulproduction.com'}`, rightAlignX, rightY, { align: 'right' });

  const rightBottomY = rightY;
  const headerBottomY = Math.max(leftBottomY, rightBottomY);

  // Spacing and line
  currentY = headerBottomY + 4;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, 196, currentY);

  return currentY + 8;
};

// Core Builder: Premium Wedding Photography & Cinematography Agreement
export const buildAgreementPDF = async (
  booking: Booking,
  settings: BrandSettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const logoBase64 = await loadLogoImage(settings.studioLogo || '');
  const today = formatDateDMY(booking.agreementDate || booking.createdAt ? new Date(booking.agreementDate || booking.createdAt || Date.now()).toISOString() : new Date().toISOString());

  // --- PAGE 1: HEADER, CLIENT PROFILE, & EVENT SCHEDULES ---
  // Using the completely new premium professional header
  let y = addAgreementHeader(doc, settings, logoBase64, 'Wedding Agreement');

  // Title block
  doc.setFillColor(245, 243, 240); // Soft sand/cream accent
  doc.rect(14, y, 182, 10, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text('WEDDING PHOTOGRAPHY & CINEMATOGRAPHY AGREEMENT', 18, y + 6.5);

  // Agreement Number on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  const agreementNo = `AP/AGR/${new Date(booking.createdAt || Date.now()).getFullYear()}/${booking.id.toUpperCase().slice(-4)}`;
  doc.text(`Agreement No: ${agreementNo}`, 192, y + 6.5, { align: 'right' });

  y += 16;

  // Section 1: Client Profile Header
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('I. CLIENT INFORMATION PROFILE', 14, y);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, y + 2, 196, y + 2);
  
  y += 7;

  // Client Details Table Box
  doc.setFillColor(249, 249, 248);
  doc.rect(14, y, 182, 38, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.rect(14, y, 182, 38, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  
  // Column Labels
  doc.text('Client Marriage Name:', 18, y + 6);
  doc.text('Bride Name:', 18, y + 12);
  doc.text('Groom Name:', 18, y + 18);
  doc.text('Contact Person:', 18, y + 24);
  doc.text('Full Address:', 18, y + 30);

  doc.text('Client Email Address:', 112, y + 6);
  doc.text('Client Primary Phone:', 112, y + 12);
  doc.text('Alternate Contact Phone:', 112, y + 18);

  // Field values
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(booking.clientName || 'N/A', 54, y + 6);
  doc.text(booking.brideName || 'N/A', 54, y + 12);
  doc.text(booking.groomName || 'N/A', 54, y + 18);
  doc.text(booking.contactPerson || booking.clientName || 'N/A', 54, y + 24);
  
  const addr = booking.fullAddress || 'N/A';
  const addrLines = doc.splitTextToSize(addr, 50);
  let addrY = y + 30;
  addrLines.forEach((line: string, i: number) => {
    if (i < 2) {
      doc.text(line, 54, addrY);
      addrY += 3.5;
    }
  });

  doc.text(booking.clientEmail || 'N/A', 148, y + 6);
  doc.text(booking.clientPhone || 'N/A', 148, y + 12);
  doc.text(booking.alternatePhone || 'N/A', 148, y + 18);

  y += 45;

  // Section 2: Work Schedule Header
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('II. WORK SCHEDULE & EVENT COVERAGE DETAIL', 14, y);
  doc.setDrawColor(212, 175, 55);
  doc.line(14, y + 2, 196, y + 2);
  
  y += 7;

  // Render Selected Events Table
  doc.setFillColor(242, 242, 241);
  doc.rect(14, y, 182, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Event Title / Description', 18, y + 4.5);
  doc.text('Event Date', 68, y + 4.5);
  doc.text('Coverage Time', 100, y + 4.5);
  doc.text('Event Venue Location', 132, y + 4.5);
  
  y += 7.5;

  // Collect enabled events
  const eventList: Array<{ name: string; date: string; time: string; location: string }> = [];
  if (booking.events) {
    Object.entries(booking.events).forEach(([key, value]) => {
      if (value && value.enabled) {
        eventList.push({
          name: key === 'wedding' ? 'Wedding Ceremony' :
                key === 'preWedding' ? 'Pre-Wedding Shoot' :
                key === 'mehendi' ? 'Mehendi Ceremony' :
                key === 'haldi' ? 'Haldi Ceremony' :
                key === 'reception' ? 'Wedding Reception' :
                key === 'aiburobhat' ? 'Aiburobhat Feast' :
                key === 'boubat' ? 'Boubat Ceremony' :
                key === 'biday' ? 'Biday Ceremony' : key.charAt(0).toUpperCase() + key.slice(1),
          date: formatDateDMY(value.date),
          time: value.time || '12:00 PM',
          location: value.location || 'Venue Destination'
        });
      }
    });
  }

  // Fallback if no specific events were enabled
  if (eventList.length === 0) {
    eventList.push({
      name: booking.bookingFor || 'Wedding Ceremony',
      date: formatDateDMY(booking.weddingDate),
      time: booking.eventTime || '12:00 PM',
      location: booking.venue || 'Venue Destination'
    });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  eventList.forEach((ev, idx) => {
    // Zebra Striping
    if (idx % 2 === 1) {
      doc.setFillColor(252, 252, 252);
      doc.rect(14, y, 182, 8, 'F');
    }
    doc.setDrawColor(245, 245, 245);
    doc.line(14, y + 8, 196, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(ev.name, 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(ev.date, 68, y + 5);
    doc.text(ev.time, 100, y + 5);

    const locText = ev.location || 'TBD';
    const locLines = doc.splitTextToSize(locText, 60);
    doc.text(locLines[0] || 'TBD', 132, y + 5);

    y += 8;
  });

  // Page 1 Footer
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text(`${settings.studioName || 'Asmaul Production'} | ${settings.studioAddress || 'Calcutta, India'}`, 14, pageHeight - 12);
  doc.text(`Email: ${settings.studioEmail || 'info@asmaulproduction.com'} | Web: ${settings.website || 'www.asmaulproduction.com'}`, 14, pageHeight - 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PAGE 1 OF 2', 196, pageHeight - 10, { align: 'right' });


  // --- PAGE 2: PACKAGE, FINANCIALS, LEGAL TERMS, SIGNATURES ---
  doc.addPage();

  // Top primary gold band
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, 210, 8, 'F');

  let yPage2 = 18;

  // Mini Brand Header
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, yPage2, 10, 10);
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text(settings.studioName || 'Asmaul Production', 26, yPage2 + 6.5);
    } catch (_) {
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(212, 175, 55);
      doc.text(settings.studioName || 'Asmaul Production', 14, yPage2 + 6.5);
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(212, 175, 55);
    doc.text(settings.studioName || 'Asmaul Production', 14, yPage2 + 6.5);
  }
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('Wedding Photography & Cinematography Agreement', 196, yPage2 + 6.5, { align: 'right' });
  
  yPage2 += 14;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.4);
  doc.line(14, yPage2, 196, yPage2);
  yPage2 += 8;

  // Section 3: Package, Coverage & Deliverables
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('III. PACKAGE, COVERAGE & DELIVERABLES', 14, yPage2);
  doc.setDrawColor(212, 175, 55);
  doc.line(14, yPage2 + 2, 196, yPage2 + 2);
  
  yPage2 += 7;

  // Selected deliverables compilation
  const photoDeliverables: string[] = [];
  if (booking.photographyService) photoDeliverables.push('Professional Photography Coverage');
  if (booking.albumService) photoDeliverables.push('Premium Leatherette Wedding Album');
  if (booking.frameService) photoDeliverables.push('Signature Hand-Finished Wall Frame');
  if (booking.pendriveService) photoDeliverables.push('Luxury Wooden USB / Pendrive Box');
  if (booking.editedPhotosService) photoDeliverables.push('Color Graded Digital Photo Archive');

  const videoDeliverables: string[] = [];
  if (booking.videographyService) videoDeliverables.push('Professional Videography Coverage');
  if (booking.standardEditService) videoDeliverables.push('Standard Full-Length Documentary Edit');
  if (booking.cinematicEditService) videoDeliverables.push('Cinematic Wedding Film / Movie Cut');
  if (booking.rawVideoService) videoDeliverables.push('High-Capacity RAW Footage Handover');
  if (booking.trailerService) videoDeliverables.push('Cinematic Teaser / Social Media Reel');
  if (booking.droneService) videoDeliverables.push('4K Aerial Drone Coverage');
  if (booking.ledWallService) videoDeliverables.push('Dual-Panel LED Wall Video Display');
  if (booking.craneService) videoDeliverables.push('Heavy-Duty Crane / Jib Camera Setup');
  if (booking.liveStreamingService) videoDeliverables.push('Ultra-Low Latency Live Webcast');

  // Package & Work Details Box (Enhanced to be fully comprehensive)
  doc.setFillColor(249, 249, 248);
  doc.rect(14, yPage2, 182, 44, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.rect(14, yPage2, 182, 44, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);

  // Column 1 Labels
  doc.text('Contracted Package:', 18, yPage2 + 6);
  doc.text('Booking For:', 18, yPage2 + 12);
  doc.text('Pre Wedding Shoot:', 18, yPage2 + 18);
  doc.text('Wedding Date & Venue:', 18, yPage2 + 24);
  doc.text('Google Maps Location:', 18, yPage2 + 30);
  doc.text('Lead Photographer:', 18, yPage2 + 36);

  // Column 2 Labels
  doc.text('Shoot Coverage Scope:', 110, yPage2 + 6);
  doc.text('Standard Video Edit:', 110, yPage2 + 12);
  doc.text('Cinematic Film Edit:', 110, yPage2 + 18);
  doc.text('Lead Cinematographer:', 110, yPage2 + 24);

  // Values
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  doc.setFont('helvetica', 'bold');
  doc.text(booking.packageName || 'N/A', 56, yPage2 + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.bookingFor || 'Wedding Ceremony', 56, yPage2 + 12);
  
  const hasPreWedding = booking.events?.preWedding?.enabled ? 'Yes (Included)' : 'No';
  doc.text(hasPreWedding, 56, yPage2 + 18);
  doc.text(`${formatDateDMY(booking.weddingDate)} — ${booking.venue}`, 56, yPage2 + 24);
  
  const mapLoc = booking.googleMapLocation || 'N/A';
  doc.setFontSize(7.5);
  if (mapLoc !== 'N/A') {
    doc.setTextColor(0, 100, 200);
    doc.text(mapLoc.length > 80 ? mapLoc.slice(0, 80) + '...' : mapLoc, 56, yPage2 + 30);
  } else {
    doc.text('N/A', 56, yPage2 + 30);
  }
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(booking.leadPhotographer || 'TBD / Studio Crew', 56, yPage2 + 36);

  // Column 2 Values
  doc.text(booking.coverage || 'Both Side (Groom & Bride)', 148, yPage2 + 6);
  doc.text(booking.standardEditService ? 'Yes (Included)' : 'No', 148, yPage2 + 12);
  doc.text(booking.cinematicEditService ? 'Yes (Included)' : 'No', 148, yPage2 + 18);
  doc.text(booking.leadCinematographer || 'TBD / Studio Crew', 148, yPage2 + 24);

  // Contracted Deliverables Scope (Double Column)
  yPage2 += 50;
  
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text('CONTRACTED SERVICE DELIVERABLES SCOPE', 14, yPage2);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.2);
  doc.line(14, yPage2 + 1.5, 196, yPage2 + 1.5);
  
  yPage2 += 5;
  
  // Left Column (Photography)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('PHOTOGRAPHY COMPONENT', 18, yPage2 + 3);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  let photoY = yPage2 + 7;
  if (photoDeliverables.length === 0) {
    doc.text('[ ]  No photography deliverables selected', 18, photoY);
    photoY += 3.5;
  } else {
    photoDeliverables.forEach((item) => {
      doc.text(`[x]  ${item}`, 18, photoY);
      photoY += 3.5;
    });
  }

  // Right Column (Videography)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('CINEMATOGRAPHY COMPONENT', 110, yPage2 + 3);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  let videoY = yPage2 + 7;
  if (videoDeliverables.length === 0) {
    doc.text('[ ]  No cinematography deliverables selected', 110, videoY);
    videoY += 3.5;
  } else {
    videoDeliverables.forEach((item) => {
      doc.text(`[x]  ${item}`, 110, videoY);
      videoY += 3.5;
    });
  }
  
  yPage2 = Math.max(photoY, videoY) + 6;

  // Section 4: Financial Structure (Strictly using ₹ symbol)
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('IV. FINANCIAL STRUCTURE & MILESTONE TIMELINE', 14, yPage2);
  doc.setDrawColor(212, 175, 55);
  doc.line(14, yPage2 + 2, 196, yPage2 + 2);
  
  yPage2 += 7;

  // Financial Detail Table Box
  doc.setFillColor(249, 249, 248);
  doc.rect(14, yPage2, 182, 22, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.rect(14, yPage2, 182, 22, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);

  doc.text('Gross Package Price:', 18, yPage2 + 6);
  doc.text('Applied Discount:', 18, yPage2 + 11);
  doc.text('Total Net Contract Value:', 18, yPage2 + 16);

  doc.text('Advance Paid:', 110, yPage2 + 6);
  doc.text('Remaining Due Balance:', 110, yPage2 + 11);
  doc.text('Preferred Payment Method:', 110, yPage2 + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(`₹ ${(booking.packagePrice || booking.totalAmount).toLocaleString('en-IN')}`, 54, yPage2 + 6);
  doc.setTextColor(180, 50, 50);
  doc.text(`- ₹ ${(booking.discount || 0).toLocaleString('en-IN')}`, 54, yPage2 + 11);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹ ${(booking.totalAmount).toLocaleString('en-IN')}`, 54, yPage2 + 16);
  doc.setFont('helvetica', 'normal');

  doc.text(`₹ ${(booking.advanceAmount || booking.paidAmount).toLocaleString('en-IN')}`, 154, yPage2 + 6);
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹ ${(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}`, 154, yPage2 + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(booking.paymentMethod || 'Cash / Bank Transfer', 154, yPage2 + 16);

  yPage2 += 28;

  // Section 5: Standard Terms & Conditions
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('V. STANDARD TERMS & CONDITIONS', 14, yPage2);
  doc.setDrawColor(212, 175, 55);
  doc.line(14, yPage2 + 2, 196, yPage2 + 2);
  
  yPage2 += 7;

  // Terms and conditions listing (wrapped nicely)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);

  const studioName = settings.studioName || 'Alexander Sterling';
  const terms = [
    '1. RETENTION & ADVANCE: A non-refundable advance of 50% is required to secure the dates. The booking is only considered confirmed upon payment receipt.',
    `2. EXCLUSIVITY: ${studioName} shall be the sole and exclusive professional photographer & cinematographer assigned to the contracted event(s).`,
    '3. CREATIVE CONTROL & COOPERATIVE: The studio retains ultimate creative control over style, edits, postures, lighting, and finalized selections.',
    '4. WORK PRODUCT DELIVERY: Curated High-Resolution JPEG files and edited films will be delivered within 60 to 90 business days from the event date. RAW cards are strictly private archive assets.',
    '5. LIMITATION OF LIABILITY & FORCE MAJEURE: In the unlikely event of severe injury, medical emergency, or sudden technical loss of data, the liability of the studio is strictly limited to the refund of all moneys paid.'
  ];

  terms.forEach((term) => {
    const splitTerm = doc.splitTextToSize(term, 182);
    splitTerm.forEach((line: string) => {
      doc.text(line, 14, yPage2);
      yPage2 += 3.2;
    });
    yPage2 += 1.2; // space between terms
  });

  // Section 6: Execution of Agreement (Signatures with dynamic dates)
  yPage2 = Math.max(yPage2 + 5, 218);
  
  // Left Box: Client Signature Line
  doc.setDrawColor(210, 210, 210);
  doc.line(20, yPage2 + 12, 85, yPage2 + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('CLIENT SIGNATURE & ACCEPTANCE', 20, yPage2 + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Date: ____/____/________`, 20, yPage2 + 20);

  // Right Box: Studio Signature Line
  doc.line(125, yPage2 + 12, 190, yPage2 + 12);
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  doc.text(settings.authorizedSignature || 'Proprietor Sign-off', 157, yPage2 + 10, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`FOR ${studioName.toUpperCase()}`, 157, yPage2 + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Date: ${today}`, 125, yPage2 + 20);

  // Section 7: Vector QR Verification stamp
  drawQRCode(doc, 172, yPage2 - 6, 18);

  // Page 2 Footer
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text(`${settings.studioName || 'Asmaul Production'} | ${settings.studioAddress || 'Calcutta, India'}`, 14, pageHeight - 12);
  doc.text(`Email: ${settings.studioEmail || 'info@asmaulproduction.com'} | Web: ${settings.website || 'www.asmaulproduction.com'}`, 14, pageHeight - 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PAGE 2 OF 2', 196, pageHeight - 10, { align: 'right' });

  return doc;
};

export const downloadAgreementPDF = async (
  booking: Booking,
  settings: BrandSettings
) => {
  const doc = await buildAgreementPDF(booking, settings);
  doc.save(`wedding_photography_agreement_${booking.id.slice(0, 8)}.pdf`);
};

// ==========================================
// UNIFIED HIGH-FIDELITY ACTIONS EXECUTOR
// ==========================================
export const handlePDFActions = async (
  doc: jsPDF,
  filename: string,
  action: 'download' | 'preview' | 'share' | 'whatsapp',
  messageText: string,
  clientPhone: string,
  onPreviewOpen?: (url: string) => void
) => {
  if (action === 'download') {
    doc.save(filename);
  } else if (action === 'preview') {
    const url = doc.output('bloburl') as any as string;
    if (onPreviewOpen) {
      onPreviewOpen(url);
    } else {
      window.open(url, '_blank');
    }
  } else if (action === 'share') {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
          text: 'PDF Document from Asmaul Production.'
        });
      } catch (err) {
        console.warn('Native sharing cancelled or failed:', err);
        doc.save(filename); // Fallback to download
      }
    } else {
      // Fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: filename,
            text: `Document for Asmaul Production. Please download manually.`
          });
        } catch (e) {
          doc.save(filename);
        }
      } else {
        doc.save(filename);
      }
    }
  } else if (action === 'whatsapp') {
    // 1. Download PDF so client has it locally
    doc.save(filename);

    // 2. Prepare WhatsApp Redirect
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    // Check if device sharing sheets can attach the file (where supported in some PWA/Mobile browsers)
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
          text: messageText
        });
        return; // Success! Mobile web share successfully sent to WhatsApp/etc.
      } catch (err) {
        console.warn('Native share error, falling back to deep link:', err);
      }
    }

    // Direct Deep Link Redirect
    const waUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  }
};

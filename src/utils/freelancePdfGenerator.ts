import { jsPDF } from 'jspdf';
import { FreelanceJob } from '../types';
import { BrandSettings } from '../contexts/BrandContext';

// Helper to load image from URL and convert to Base64 data URI for jsPDF
const loadLogoImage = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
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
        console.error('Error rendering image to canvas for Freelance PDF:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load logo image for Freelance PDF, using text fallback.');
      resolve(null);
    };
    img.src = url;
  });
};

export const buildFreelanceBookingConfirmationPDF = async (
  job: FreelanceJob,
  settings: BrandSettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoBase64 = await loadLogoImage(settings.studioLogo || '');

  // 1. Gold-colored top primary band
  doc.setFillColor(212, 175, 55); // Premium Gold (#D4AF37)
  doc.rect(0, 0, 210, 8, 'F');

  let currentY = 22;

  // 2. Draw Brand Header
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, currentY, 18, 18);
      
      // Studio Name
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.text(settings.studioName || 'Asmaul Production', 36, currentY + 6);

      // Studio Tagline
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(settings.studioTagline || 'Luxury Wedding Photojournalism', 36, currentY + 11);
    } catch (e) {
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(212, 175, 55);
      doc.text(settings.studioName || 'Asmaul Production', 14, currentY + 6);
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    doc.text(settings.studioName || 'Asmaul Production', 14, currentY + 6);
  }

  // Right Side of Header - Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(212, 175, 55);
  doc.text('FREELANCE BOOKING', 196, currentY + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('CONFIRMATION & CONTRACT', 196, currentY + 10, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, currentY + 15, { align: 'right' });

  currentY += 26;

  // Horizontal divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, 196, currentY);

  currentY += 8;

  // 3. Client & Freelance Job Details Panel
  const baseBoxHeight = 35;
  const eventLinesCount = job.events && job.events.length > 0 ? job.events.length : 1;
  const dynamicBoxHeight = Math.max(40, baseBoxHeight + (eventLinesCount * 5.5));

  doc.setFillColor(249, 249, 248);
  doc.rect(14, currentY, 182, dynamicBoxHeight, 'F');
  doc.setDrawColor(225, 225, 224);
  doc.setLineWidth(0.3);
  doc.rect(14, currentY, 182, dynamicBoxHeight, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('FREELANCE BOOKING DETAILS', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  // Left Column
  doc.text(`Studio / Company Name: ${job.studioName}`, 18, currentY + 15);
  doc.text(`Contact Person: ${job.contactPerson}`, 18, currentY + 22);
  doc.text(`Contact Phone: ${job.contactPhone}`, 18, currentY + 29);
  doc.text(`General Location: ${job.location}`, 18, currentY + 36);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('EVENTS SCHEDULE:', 112, currentY + 15);
  doc.setFont('helvetica', 'normal');
  
  let eventY = currentY + 21;
  if (job.events && job.events.length > 0) {
    job.events.forEach((ev) => {
      const typeStr = ev.eventType === 'Others' && ev.customEventType
        ? `Others (${ev.customEventType})`
        : ev.eventType;
      const locStr = ev.location ? ` at ${ev.location}` : '';
      const textLine = `${typeStr} - ${ev.eventDate}${locStr}`;
      const wrapped = doc.splitTextToSize(textLine, 78);
      wrapped.forEach((line: string) => {
        if (eventY < currentY + dynamicBoxHeight - 4) {
          doc.text(line, 112, eventY);
          eventY += 5.5;
        }
      });
    });
  } else {
    const singleType = job.eventTypes.includes('Others') && job.customEventType
      ? `Others (${job.customEventType})`
      : job.eventTypes.join(', ');
    const textLine = `${singleType} - ${job.eventDate}${job.location ? ` at ${job.location}` : ''}`;
    const wrapped = doc.splitTextToSize(textLine, 78);
    wrapped.forEach((line: string) => {
      if (eventY < currentY + dynamicBoxHeight - 4) {
        doc.text(line, 112, eventY);
        eventY += 5.5;
      }
    });
  }

  currentY += dynamicBoxHeight + 8;

  // 4. Financial Breakdown Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('FINANCIAL STATEMENT', 14, currentY);
  
  currentY += 3;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, 196, currentY);

  currentY += 7;

  // Table structure for financial breakdown
  doc.setFillColor(245, 245, 243);
  doc.rect(14, currentY, 182, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('ITEM DESCRIPTION', 18, currentY + 5.5);
  doc.text('AMOUNT (INR)', 190, currentY + 5.5, { align: 'right' });

  // Rows
  const rows = [
    { label: 'Freelance Photographic Services (Total Package Fee)', val: job.totalAmount },
    { label: 'Retainer Advance Payment Received', val: job.advancePayment, isSubtract: true },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  
  let rowY = currentY + 14;
  rows.forEach((r) => {
    doc.text(r.label, 18, rowY);
    const amountStr = r.isSubtract 
      ? `- ₹ ${r.val.toLocaleString('en-IN')}` 
      : `₹ ${r.val.toLocaleString('en-IN')}`;
    doc.text(amountStr, 190, rowY, { align: 'right' });
    rowY += 7;
  });

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(14, rowY - 2, 196, rowY - 2);

  // Totals Row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('REMAINING BALANCE DUE', 18, rowY + 3);
  doc.setTextColor(212, 175, 55); // premium gold highlight for outstanding balance
  doc.text(`₹ ${job.dueAmount.toLocaleString('en-IN')}`, 190, rowY + 3, { align: 'right' });

  // Payment Status Chip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('PAYMENT STATUS:', 18, rowY + 11);
  
  let statusColor = [220, 53, 69]; // Pending Red
  if (job.paymentStatus === 'Paid') {
    statusColor = [40, 167, 69]; // Paid Green
  } else if (job.paymentStatus === 'Partial') {
    statusColor = [253, 126, 20]; // Orange
  }

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(52, rowY + 8, 18, 4.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(job.paymentStatus.toUpperCase(), 61, rowY + 11.2, { align: 'center' });

  currentY = rowY + 20;

  // 5. Notes & Terms Section
  if (job.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text('ADDITIONAL NOTES & TERMS', 14, currentY);
    
    currentY += 3;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(14, currentY, 196, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    
    const splitNotes = doc.splitTextToSize(job.notes, 182);
    splitNotes.forEach((line: string) => {
      doc.text(line, 14, currentY);
      currentY += 4.5;
    });
  }

  // 6. Signatures (Positioned stably towards the bottom of the page)
  currentY = Math.max(currentY + 10, 225);

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(14, currentY, 196, currentY);

  currentY += 15;

  // Left Signee: Photographer/Main Studio
  doc.setDrawColor(200, 200, 200);
  doc.line(20, currentY + 10, 85, currentY + 10);
  
  // Draw Photographer Name (simulated signature font/italic)
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  doc.text(settings.ownerName || 'Asmaul Haque', 52.5, currentY + 8, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('PHOTOGRAPHER SIGNATURE', 20, currentY + 14);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Studio: ${settings.studioName || 'Asmaul Production'}`, 20, currentY + 18);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, currentY + 22);

  // Right Signee: Client Representative
  doc.line(125, currentY + 10, 190, currentY + 10);
  
  // Draw Contact Person name as client signee placeholder
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  doc.text(job.contactPerson, 157.5, currentY + 8, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('CLIENT / REPRESENTATIVE SIGNATURE', 125, currentY + 14);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Company: ${job.studioName}`, 125, currentY + 18);
  doc.text('Date: ____/____/________', 125, currentY + 22);

  // Page Footer details
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 16, 196, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text(`${settings.studioName || 'Asmaul Production'} | ${settings.studioAddress || 'Calcutta, India'}`, 14, pageHeight - 11);
  doc.text(`Phone: ${settings.studioPhone || '+91 98765 43210'} | Email: ${settings.studioEmail || 'info@asmaulproduction.com'}`, 14, pageHeight - 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text('A4 PORTRAIT STANDARD CONTRACT', 196, pageHeight - 9, { align: 'right' });

  return doc;
};

export const downloadFreelanceBookingConfirmationPDF = async (
  job: FreelanceJob,
  settings: BrandSettings
): Promise<void> => {
  const doc = await buildFreelanceBookingConfirmationPDF(job, settings);
  const filename = `freelance_confirmation_${job.id.slice(0, 8)}.pdf`;
  doc.save(filename);
};

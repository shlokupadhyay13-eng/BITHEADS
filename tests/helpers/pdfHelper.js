/**
 * @file pdfHelper.js
 * @description In-memory PDF buffer generator for unit and integration testing.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Generates an in-memory PDF buffer with specified page contents.
 * @param {Array<string>} pageTexts - Array of text strings, one per page
 * @returns {Promise<Buffer>} Valid PDF buffer
 */
export async function createTestPdfBuffer(pageTexts = ['Sample Document Page 1']) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const text of pageTexts) {
    const page = pdfDoc.addPage([600, 400]);
    page.drawText(text, {
      x: 50,
      y: 350,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

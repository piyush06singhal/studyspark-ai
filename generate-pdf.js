const fs = require('fs');
const PDFDocument = require('pdfkit');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test.pdf'));
doc.fontSize(25).text('Some text to extract', 100, 100);
doc.end();

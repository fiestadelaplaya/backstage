#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import React from "react";
import { renderToString } from "react-dom/server";
import { CredentialsPage } from "./CredentialsPage";
import { CredentialData } from "./CredentialCard";

// Get __dirname equivalent for ES modules (tsx supports import.meta.url)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CSVRow {
  name: string;
  lastname: string;
  idNumber: string;
  role: string;
}

async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 256,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
}

function loadTemplateAsDataUrl(role: string, templatesDir: string): string {
  const templateRole = role === "X - TEC" ? "X" : (role === "C - COM" ? "C" : role.toUpperCase());
  const templateFile = `${templateRole.toUpperCase()}.png`;
  const templatePath = path.join(templatesDir, templateFile);

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template file not found for role "${role}": ${templatePath}`
    );
  }

  // Read image file and convert to base64 data URL
  const imageBuffer = fs.readFileSync(templatePath);
  const imageBase64 = imageBuffer.toString("base64");
  const mimeType = "image/png";
  return `data:${mimeType};base64,${imageBase64}`;
}

function parseCSV(filePath: string): CSVRow[] {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CSVRow[];

  // Validate CSV structure
  if (records.length === 0) {
    throw new Error("CSV file is empty or has no valid rows");
  }

  const firstRow = records[0];
  if (!('name' in firstRow) || !('lastname' in firstRow) || !('idNumber' in firstRow) || !('role' in firstRow)) {
    throw new Error(
      'CSV must have columns: "name", "lastname", "idNumber", and "role"'
    );
  }

  return records;
}

async function generateCredentials(
  csvPath: string,
  outputPath: string,
  templatesDir: string,
  credentialsPerRow: number = 4
): Promise<void> {
  console.log(`Reading CSV from: ${csvPath}`);

  // Parse CSV
  const csvRows = parseCSV(csvPath);

  console.log(`Found ${csvRows.length} credentials to generate`);

  // Generate credentials data
  const credentials: CredentialData[] = [];

  for (const row of csvRows) {
    console.log(`Processing: ${row.name} (${row.role})`);

    // Generate QR code
    const qrData = JSON.stringify({ id: row.idNumber });
    const qrCodeDataUrl = await generateQRCode(qrData);

    // Get template as data URL
    const templateImagePath = loadTemplateAsDataUrl(row.role, templatesDir);

    credentials.push({
      name: row.name,
      lastname: row.lastname,
      idNumber: row.idNumber,
      role: row.role,
      qrCodeDataUrl,
      templateImagePath,
    });
  }

  // Split credentials into chunks of 8 (4×2 grid per page)
  // Pad each page to exactly 8 credentials (fill with null for missing ones)
  const CREDENTIALS_PER_PAGE = 8; // 2 rows × 4 columns
  const credentialPages: (CredentialData | null)[][] = [];
  for (let i = 0; i < credentials.length; i += CREDENTIALS_PER_PAGE) {
    const pageCredentials = credentials.slice(i, i + CREDENTIALS_PER_PAGE);
    // Pad to exactly 8 credentials
    while (pageCredentials.length < CREDENTIALS_PER_PAGE) {
      pageCredentials.push(null as any);
    }
    credentialPages.push(pageCredentials);
  }

  console.log(`Generating ${credentialPages.length} page(s) with up to ${CREDENTIALS_PER_PAGE} credentials each`);

  // Calculate page dimensions for 4×2 grid
  // Each card is 945px × 1300px
  const CARD_WIDTH = 945;
  const CARD_HEIGHT = 1300;
  const CREDENTIALS_PER_ROW = 4; // Fixed to 4 columns
  const ROWS_PER_PAGE = 2; // Fixed to 2 rows per page
  const pageWidthPx = CREDENTIALS_PER_ROW * CARD_WIDTH;
  const pageHeightPx = ROWS_PER_PAGE * CARD_HEIGHT;
  
  // Helper function to create HTML template for a single page
  const createPageHtml = (pageContent: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credentials</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @media print {
      @page {
        size: ${pageWidthPx}px ${pageHeightPx}px;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .credential-page {
        width: ${pageWidthPx}px;
        height: ${pageHeightPx}px;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        position: relative;
      }
      .credential-page > div {
        width: ${pageWidthPx}px !important;
        height: ${pageHeightPx}px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
      .credential-page .grid {
        width: ${pageWidthPx}px !important;
        height: ${pageHeightPx}px !important;
        margin: 0 !important;
        padding: 0 !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
      .print\\:border-2 {
        border-width: 2px !important;
      }
    }
    img {
      max-width: none;
    }
  </style>
</head>
<body>
  ${pageContent}
</body>
</html>`;
  };

  // Generate PDF using Puppeteer - page by page to avoid string length limits
  console.log("Generating PDF...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(120000); // 2 minutes
    
    await page.setViewport({
      width: pageWidthPx,
      height: pageHeightPx,
      deviceScaleFactor: 1,
    });

    // Generate PDF for each page separately and merge
    const tempPdfPaths: string[] = [];
    
    for (let pageIndex = 0; pageIndex < credentialPages.length; pageIndex++) {
      const pageCredentials = credentialPages[pageIndex];
      console.log(`Generating page ${pageIndex + 1}/${credentialPages.length}...`);
      
      // Generate HTML for this page only
      const reactHtml = renderToString(
        React.createElement(CredentialsPage, {
          credentials: pageCredentials,
          credentialsPerRow: CREDENTIALS_PER_ROW,
          noPadding: true,
        })
      );
      
      const pageContent = `<div class="credential-page">${reactHtml}</div>`;
      const htmlTemplate = createPageHtml(pageContent);
      
      // Set content and wait for it to load
      await page.setContent(htmlTemplate, { 
        waitUntil: "load",
        timeout: 120000,
      });

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF for this single page
      const tempPdfPath = outputPath.replace(/\.pdf$/i, `_page_${pageIndex}.pdf`);
      tempPdfPaths.push(tempPdfPath);
      
      await page.pdf({
        path: tempPdfPath,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
        printBackground: true,
        preferCSSPageSize: true,
      });
    }

    // Merge all PDF pages into one
    console.log("Merging PDF pages...");
    const { PDFDocument } = await import("pdf-lib");
    const mergedPdf = await PDFDocument.create();

    for (const tempPdfPath of tempPdfPaths) {
      const pdfBytes = fs.readFileSync(tempPdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((pdfPage) => mergedPdf.addPage(pdfPage));
      
      // Clean up temp file
      fs.unlinkSync(tempPdfPath);
    }

    // Save merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);

    console.log(`PDF file written to: ${outputPath}`);
    
    // Write HTML file for first page only (for debugging, to avoid string length issues)
    if (credentialPages.length > 0) {
      const firstPageReactHtml = renderToString(
        React.createElement(CredentialsPage, {
          credentials: credentialPages[0],
          credentialsPerRow: CREDENTIALS_PER_ROW,
          noPadding: true,
        })
      );
      const firstPageContent = `<div class="credential-page">${firstPageReactHtml}</div>`;
      const htmlTemplate = createPageHtml(firstPageContent);
      const htmlPath = outputPath.replace(/\.pdf$/i, ".html");
      fs.writeFileSync(htmlPath, htmlTemplate);
      console.log(`HTML file written to: ${htmlPath} (first page only for debugging)`);
    }
  } finally {
    await browser.close();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: tsx index.tsx <csv-file> [output-file] [credentials-per-row]");
  console.error("");
  console.error("Arguments:");
  console.error("  csv-file              Path to CSV file with name,lastname,idNumber,role columns");
  console.error("  output-file           Output PDF path (default: credentials.pdf)");
  console.error("  credentials-per-row   Number of credentials per row (default: 4)");
  process.exit(1);
}

const csvFile = args[0];
const outputFile = args[1] || "credentials.pdf";
const credentialsPerRow = args[2] ? parseInt(args[2], 10) : 4;

if (!fs.existsSync(csvFile)) {
  console.error(`Error: CSV file not found: ${csvFile}`);
  process.exit(1);
}

const scriptDir = __dirname;
const templatesDir = path.join(scriptDir, "templates");

generateCredentials(csvFile, outputFile, templatesDir, credentialsPerRow)
  .then(() => {
    console.log("✅ Credentials generated successfully!");
  })
  .catch((error) => {
    console.error("❌ Error generating credentials:", error);
    process.exit(1);
  });

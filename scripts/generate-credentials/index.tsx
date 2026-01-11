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
  const templateFile = `${role.toUpperCase()}.png`;
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
  if (!firstRow.name || !firstRow.lastname || !firstRow.idNumber || !firstRow.role) {
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
  credentialsPerRow: number = 2
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

  // Generate HTML with React component
  const reactHtml = renderToString(
    React.createElement(CredentialsPage, {
      credentials,
      credentialsPerRow,
    })
  );

  // Create full HTML document with Tailwind CSS
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credentials</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
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
  <div id="root">${reactHtml}</div>
</body>
</html>`;

  // Write HTML file
  const htmlPath = outputPath.replace(/\.pdf$/i, ".html");
  fs.writeFileSync(htmlPath, htmlTemplate);
  console.log(`HTML file written to: ${htmlPath}`);

  // Generate PDF using Puppeteer
  console.log("Generating PDF...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });

    // Wait for all images to load (data URLs should load immediately, but just in case)
    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${img.src.substring(0, 50)}`));
            // Timeout after 5 seconds
            setTimeout(() => reject(new Error("Image load timeout")), 5000);
          });
        })
      );
    });

    await page.pdf({
      path: outputPath,
      format: "letter",
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      printBackground: true,
    });

    console.log(`PDF file written to: ${outputPath}`);
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
  console.error("  credentials-per-row   Number of credentials per row (default: 2)");
  process.exit(1);
}

const csvFile = args[0];
const outputFile = args[1] || "credentials.pdf";
const credentialsPerRow = args[2] ? parseInt(args[2], 10) : 2;

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

#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { Client } from "pg";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CSVRow {
  name: string;
  lastname: string;
  dni: string;
  role: string;
  group?: string;
}

interface DatabaseUser {
  id: number;
  dni: number;
  role: string;
  name: string;
  lastname: string;
  group_id: number | null;
}

// Map various header formats to standard column names
const HEADER_MAPPINGS: Record<string, string> = {
  // Name variations
  nombre: "name",
  "nombre": "name",
  "NOMBRE": "name",
  "Nombre": "name",
  
  // Lastname variations
  apellido: "lastname",
  "apellido": "lastname",
  "APELLIDO": "lastname",
  "Apellido": "lastname",
  
  // DNI variations
  dni: "dni",
  "DNI": "dni",
  "dni (sin puntos)": "dni",
  "DNI (sin puntos)": "dni",
  
  // Role variations
  role: "role",
  "role": "role",
  "ROLE": "role",
  acceso: "role",
  "ACCESO": "role",
  "Acceso": "role",
  
  // Group variations (optional)
  group: "group",
  "group": "group",
  "GROUP": "group",
  "nombre banda musical": "group",
  "Nombre banda musical": "group",
  medio: "group",
  "MEDIO": "group",
  "Medio": "group",
};

// Function to capitalize string (first letter of each word capital, rest lowercase)
function capitalizeWords(str: string): string {
  if (!str || str.trim().length === 0) {
    return str;
  }
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

// Function to normalize header names
function normalizeHeader(header: string): string {
  const trimmed = header.trim().toLowerCase();
  return HEADER_MAPPINGS[trimmed] || trimmed;
}

// Function to detect CSV delimiter
function detectDelimiter(line: string): string {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

// Function to parse CSV file
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  
  if (lines.length === 0) {
    return [];
  }
  
  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);
  
  // Parse CSV
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter: delimiter,
    trim: true,
    bom: true,
  });
  
  // Normalize headers and extract data
  const rows: CSVRow[] = [];
  for (const record of records) {
    // Skip rows where all values are empty
    const values = Object.values(record);
    if (values.every((v) => !v || String(v).trim().length === 0)) {
      continue;
    }
    
    // Map headers to standard column names
    const normalizedRecord: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      const normalizedKey = normalizeHeader(key);
      normalizedRecord[normalizedKey] = String(value || "").trim();
    }
    
    // Extract required fields
    const name = capitalizeWords(normalizedRecord.name || "");
    const lastname = capitalizeWords(normalizedRecord.lastname || "");
    const dni = normalizedRecord.dni || "";
    const role = (normalizedRecord.role || "").toUpperCase().trim();
    const group = normalizedRecord.group ? capitalizeWords(normalizedRecord.group) : undefined;
    
    // Skip if required fields are missing
    if (!name || !lastname || !dni || !role) {
      console.warn(`Skipping row in ${path.basename(filePath)}: missing required fields`, {
        name,
        lastname,
        dni,
        role,
      });
      continue;
    }
    
    // Skip if DNI is not a valid number
    const dniNumber = parseInt(dni.replace(/\D/g, ""), 10);
    if (isNaN(dniNumber) || dniNumber <= 0) {
      console.warn(`Skipping row in ${path.basename(filePath)}: invalid DNI "${dni}"`);
      continue;
    }
    
    rows.push({
      name,
      lastname,
      dni: dniNumber.toString(),
      role,
      group,
    });
  }
  
  return rows;
}

// Function to get or create group
async function getOrCreateGroup(
  client: Client,
  groupName: string
): Promise<number | null> {
  if (!groupName || groupName.trim().length === 0) {
    return null;
  }
  
  const normalizedGroupName = capitalizeWords(groupName.trim());
  
  // Check if group exists
  const existingGroup = await client.query(
    'SELECT id FROM "public"."groups" WHERE name = $1',
    [normalizedGroupName]
  );
  
  if (existingGroup.rows.length > 0) {
    return existingGroup.rows[0].id;
  }
  
  // Create new group
  const result = await client.query(
    'INSERT INTO "public"."groups" (name) VALUES ($1) RETURNING id',
    [normalizedGroupName]
  );
  
  return result.rows[0].id;
}

// Function to insert or update user
async function insertUser(
  client: Client,
  row: CSVRow
): Promise<{ success: boolean; message: string }> {
  const dniNumber = parseInt(row.dni, 10);
  
  try {
    // Check if user exists by DNI
    const existingUser = await client.query(
      'SELECT id, dni, role, name, lastname, group_id FROM "public"."users" WHERE dni = $1',
      [dniNumber]
    );
    
    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0] as DatabaseUser;
      
      // Check if role is different
      if (existing.role !== row.role) {
        const errorMsg = `DNI conflict for ${row.name} ${row.lastname} (DNI: ${row.dni}): ` +
          `existing role="${existing.role}", new role="${row.role}"`;
        console.error(`❌ ${errorMsg}`);
        return {
          success: false,
          message: errorMsg,
        };
      }
      
      // User exists with same role, skip (or you could update other fields)
      console.log(`⚠️  Skipping existing user: ${row.name} ${row.lastname} (DNI: ${row.dni}, Role: ${row.role})`);
      return {
        success: true,
        message: "User already exists with same role",
      };
    }
    
    // Get or create group
    let groupId: number | null = null;
    if (row.group) {
      groupId = await getOrCreateGroup(client, row.group);
    }
    
    // Insert new user
    await client.query(
      `INSERT INTO "public"."users" (name, lastname, dni, role, group_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.name, row.lastname, dniNumber, row.role, groupId]
    );
    
    return {
      success: true,
      message: "User inserted successfully",
    };
  } catch (error: any) {
    // Handle unique constraint violation (in case there's a unique constraint on DNI)
    if (error.code === "23505" && (
      error.constraint?.includes("dni") || 
      error.message?.includes("dni") ||
      error.message?.includes("unique")
    )) {
      // This shouldn't happen due to our check, but handle it anyway
      const existingUser = await client.query(
        'SELECT id, dni, role, name, lastname FROM "public"."users" WHERE dni = $1',
        [dniNumber]
      );
      
      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0] as DatabaseUser;
        const errorMsg = `DNI conflict for ${row.name} ${row.lastname} (DNI: ${row.dni}): ` +
          `existing role="${existing.role}", new role="${row.role}"`;
        console.error(`❌ ${errorMsg}`);
        return {
          success: false,
          message: errorMsg,
        };
      }
    }
    
    throw error;
  }
}

// Main function
async function main() {
  const csvFolder = process.argv[2] || path.join(__dirname, "../../data/csv");
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    `postgresql://postgres:postgres@localhost:54322/postgres`;
  
  console.log(`📁 Loading CSV files from: ${csvFolder}`);
  console.log(`🗄️  Database URL: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
  
  // Validate folder exists
  if (!fs.existsSync(csvFolder)) {
    console.error(`❌ Folder does not exist: ${csvFolder}`);
    process.exit(1);
  }
  
  // Get all CSV files
  const files = fs
    .readdirSync(csvFolder)
    .filter((file) => file.toLowerCase().endsWith(".csv"))
    .map((file) => path.join(csvFolder, file));
  
  if (files.length === 0) {
    console.error(`❌ No CSV files found in: ${csvFolder}`);
    process.exit(1);
  }
  
  console.log(`📄 Found ${files.length} CSV file(s)`);
  
  // Connect to database
  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log("✅ Connected to database");
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    // Process each file
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      console.log(`\n📖 Processing: ${fileName}`);
      
      try {
        const rows = parseCSV(filePath);
        console.log(`   Found ${rows.length} row(s)`);
        
        // Process each row in a transaction
        for (const row of rows) {
          totalProcessed++;
          const result = await insertUser(client, row);
          
          if (result.success) {
            if (result.message.includes("already exists")) {
              totalSkipped++;
            } else {
              totalInserted++;
            }
          } else {
            totalErrors++;
          }
        }
      } catch (error: any) {
        console.error(`❌ Error processing ${fileName}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Inserted: ${totalInserted}`);
    console.log(`   Skipped (existing): ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} error(s) occurred. Check the logs above for details.`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n✅ Disconnected from database");
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});


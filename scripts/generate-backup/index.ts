#!/usr/bin/env tsx

import { Client } from "pg";

// All available roles from the enum
const ROLES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "P",
  "X",
  "X - TEC",
  "C - COM",
] as const;

type Role = (typeof ROLES)[number];

interface RoleCount {
  role: Role;
  count: number;
}

// Parse command-line arguments
function parseArguments(): {
  roleCounts: RoleCount[];
  totalSize: number;
} {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`
Usage: tsx scripts/generate-backup/index.ts [role:count]...

Arguments:
  role:count              Role and number of users to create (can specify multiple)

Example:
  tsx scripts/generate-backup/index.ts A:100 B:200 C:50 D:30 E:20 P:10 X:5

Note: Specify how many users you want for each role.
      Total number of users will be the sum of all counts.
`);
    process.exit(1);
  }

  const roleCounts: RoleCount[] = [];
  const specifiedRoles = new Set<Role>();

  // Parse role:count pairs
  for (const arg of args) {
    const match = arg.match(/^([^:]+):(\d+)$/);

    if (!match) {
      console.error(
        `❌ Invalid format: "${arg}". Expected format: role:count (e.g., A:100)`
      );
      process.exit(1);
    }

    const role = match[1].trim() as Role;
    const count = parseInt(match[2], 10);

    if (!ROLES.includes(role)) {
      console.error(
        `❌ Invalid role: "${role}". Valid roles are: ${ROLES.join(", ")}`
      );
      process.exit(1);
    }

    if (specifiedRoles.has(role)) {
      console.error(`❌ Duplicate role specified: "${role}"`);
      process.exit(1);
    }

    if (count <= 0) {
      console.error(
        `❌ Invalid count: ${count}. Must be a positive integer.`
      );
      process.exit(1);
    }

    roleCounts.push({ role, count });
    specifiedRoles.add(role);
  }

  const totalSize = roleCounts.reduce((sum, rc) => sum + rc.count, 0);

  if (totalSize === 0) {
    console.error(`❌ Total count must be greater than 0`);
    process.exit(1);
  }

  return { roleCounts, totalSize };
}

// Convert role counts to a map
function roleCountsToMap(roleCounts: RoleCount[]): Map<Role, number> {
  const map = new Map<Role, number>();
  for (const { role, count } of roleCounts) {
    map.set(role, count);
  }
  return map;
}

// Generate users and insert them in batches
async function generateUsers(
  client: Client,
  totalSize: number,
  roleDistribution: Map<Role, number>
): Promise<void> {
  const startDNI = 81;
  console.log(`📊 Starting DNI: ${startDNI}`);

  // Build the list of users to insert
  const users: Array<{ dni: number; role: Role }> = [];
  let currentDNI = startDNI;

  for (const [role, count] of roleDistribution.entries()) {
    for (let i = 0; i < count; i++) {
      users.push({ dni: currentDNI, role });
      currentDNI++;
    }
  }

  // Shuffle to randomize role distribution
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [users[i], users[j]] = [users[j], users[i]];
  }

  console.log(`📝 Generated ${users.length} users`);
  console.log(`📊 Role distribution:`);
  for (const [role, count] of roleDistribution.entries()) {
    console.log(`   ${role}: ${count}`);
  }

  // Insert in batches of 1000 for efficiency
  const batchSize = 1000;
  let inserted = 0;

  console.log(`\n💾 Inserting users...`);

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const user of batch) {
      values.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
      );
      params.push("BACKUP", "", user.dni, user.role, false);
      paramIndex += 5;
    }

    const query = `
      INSERT INTO "public"."users" (name, lastname, dni, role, enabled)
      VALUES ${values.join(", ")}
    `;

    try {
      await client.query(query, params);
      inserted += batch.length;
      console.log(`   ✅ Inserted ${inserted}/${users.length} users...`);
    } catch (error: any) {
      console.error(`❌ Error inserting batch:`, error.message);
      throw error;
    }
  }

  console.log(`\n✅ Successfully inserted ${inserted} users`);
  console.log(`📊 DNI range: ${startDNI} - ${startDNI + inserted - 1}`);
}

// Main function
async function main() {
  const { roleCounts, totalSize } = parseArguments();

  console.log(`\n🎯 Generating ${totalSize} backup users`);
  console.log(`📊 Role counts:`);
  for (const { role, count } of roleCounts) {
    console.log(`   ${role}: ${count}`);
  }

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    `postgresql://postgres:postgres@localhost:54322/postgres`;

  console.log(
    `\n🗄️  Database URL: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`
  );

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Convert role counts to map
    const roleDistribution = roleCountsToMap(roleCounts);

    // Generate and insert users
    await generateUsers(client, totalSize, roleDistribution);

    console.log("\n✅ Done!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("✅ Disconnected from database");
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});


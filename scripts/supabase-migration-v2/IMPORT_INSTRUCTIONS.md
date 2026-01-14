# How to Import the SQL Migration File

There are several ways to import the SQL migration file into your Supabase database. Choose the method that works best for your setup.

## Option 1: Using psql (Direct PostgreSQL Connection)

### For Local Supabase (Development)

Connect to your local Supabase database and run the SQL file:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/supabase-migration-v2/20260111202729_initial_schema.sql
```

Or using individual connection parameters:

```bash
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/supabase-migration-v2/20260111202729_initial_schema.sql
```

When prompted, enter the password (default is `postgres` for local Supabase).

**Non-interactive mode (no password prompt):**

```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/supabase-migration-v2/20260111202729_initial_schema.sql
```

### For Remote Supabase (Production)

Get your connection string from Supabase Dashboard → Project Settings → Database → Connection string (URI).

Then run:

```bash
psql "YOUR_CONNECTION_STRING" -f scripts/supabase-migration-v2/20260111202729_initial_schema.sql
```

Or extract the components and use:

```bash
psql -h YOUR_HOST -p 5432 -U postgres -d postgres -f scripts/supabase-migration-v2/20260111202729_initial_schema.sql
```

**Note:** For remote Supabase, you'll need:
- Your database password (found in Supabase Dashboard → Project Settings → Database)
- The connection pooler port (if using connection pooling) or direct connection port

---

## Option 2: Using Supabase CLI (Recommended for Migrations)

If you want to use Supabase's migration system (recommended), move the file to the migrations folder:

```bash
# Move the migration file to Supabase migrations directory
cp scripts/supabase-migration-v2/20260111202729_initial_schema.sql supabase/migrations/

# Then apply migrations using Supabase CLI
supabase db reset  # This will apply all migrations (⚠️ resets database)
# OR
supabase migration up  # Apply pending migrations (if available)
```

**Note:** The Supabase CLI migration system is better for:
- Version control
- Tracking applied migrations
- Team collaboration
- Production deployments

---

## Option 3: Using Supabase Dashboard SQL Editor

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `20260111202729_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" or press `Cmd/Ctrl + Enter`

**Note:** This method doesn't track migrations in the migration system.

---

## Option 4: Using psql with stdin (Alternative)

You can also pipe the file to psql:

```bash
# Local
cat scripts/supabase-migration-v2/20260111202729_initial_schema.sql | psql postgresql://postgres:postgres@localhost:54322/postgres

# Remote
cat scripts/supabase-migration-v2/20260111202729_initial_schema.sql | psql "YOUR_CONNECTION_STRING"
```

---

## Verify the Migration

After importing, verify that the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'groups', 'controllers', 'activity', 'restrictions')
ORDER BY table_name;

-- Check if the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'check_and_log_access';

-- Check if enums exist
SELECT typname 
FROM pg_type 
WHERE typname IN ('role', 'gate');
```

---

## Troubleshooting

### Error: "relation already exists"

If you get errors about tables/enums already existing, you have a few options:

1. **Drop existing tables first** (⚠️ This will delete all data):
   ```sql
   -- Be careful! This deletes everything
   DROP TABLE IF EXISTS activity CASCADE;
   DROP TABLE IF EXISTS restrictions CASCADE;
   DROP TABLE IF EXISTS controllers CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS groups CASCADE;
   DROP TYPE IF EXISTS gate CASCADE;
   DROP TYPE IF EXISTS role CASCADE;
   ```

2. **Use IF NOT EXISTS clauses** (the SQL file already uses these, but enums don't support it)

### Error: "password authentication failed"

- **Local:** Make sure your local Supabase instance is running (`supabase start`)
- **Remote:** Verify your password and connection string from the Supabase dashboard

### Error: "connection refused"

- Make sure Supabase is running locally: `supabase start`
- Check the port (should be 54322 for local Supabase)
- Verify your connection string

### Error: "permission denied"

- Make sure you're using the `postgres` user (or a user with appropriate permissions)
- For remote Supabase, ensure your IP is whitelisted in the dashboard

---

## Quick Reference

### Local Supabase Connection Details
- **Host:** localhost / 127.0.0.1
- **Port:** 54322
- **Database:** postgres
- **User:** postgres
- **Password:** postgres (default)

### Command Template
```bash
psql -h HOST -p PORT -U USERNAME -d DATABASE -f PATH_TO_SQL_FILE
```

Or using connection string:
```bash
psql "postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE" -f PATH_TO_SQL_FILE
```


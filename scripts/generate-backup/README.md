# Generate Backup Users Script

This script generates a batch of empty credential users (backup users) in the database.

## Features

- Creates users with:
  - `name`: "BACKUP"
  - `lastname`: "" (empty string)
  - `dni`: Incremental numbers starting from 1
  - `enabled`: `false` (disabled)
  - `role`: Based on specified counts for each role
  - `group_id`: `NULL`

- Starts DNI numbering from 1 (no conflict checking - assumes existing DNIs are in the millions)
- Specify exact counts for each role
- Total number of users is the sum of all role counts
- Shuffles users to randomize role distribution
- Inserts users in batches of 1000 for efficiency

## Usage

```bash
tsx scripts/generate-backup/index.ts [role:count]...
```

### Arguments

- `role:count`: Role and number of users to create (can specify multiple)

### Examples

Generate users with specific counts for each role:
```bash
tsx scripts/generate-backup/index.ts A:100 B:200 C:50 D:30 E:20 P:10 X:5
```

Generate users for only some roles:
```bash
tsx scripts/generate-backup/index.ts A:500 B:300 C:200
```

Using npm script:
```bash
npm run generate-backup A:100 B:200 C:50
```

## Available Roles

- `A`
- `B`
- `C`
- `D`
- `E`
- `P`
- `X`
- `X - TEC`
- `C - COM`

## Database Connection

The script uses the following environment variables (in order of precedence):

1. `DATABASE_URL`
2. `SUPABASE_DB_URL`
3. Default: `postgresql://postgres:postgres@localhost:54322/postgres`

## Notes

- DNI numbers always start from 1 (no conflict checking - assumes existing DNIs are in the millions)
- Total number of users is the sum of all specified role counts
- You can specify counts for any subset of roles (not all roles need to be specified)
- Users are inserted in batches of 1000 for efficiency
- All generated users are disabled (`enabled = false`)


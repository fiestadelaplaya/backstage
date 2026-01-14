# Supabase Migration v2 - Database Schema Documentation

## Overview

This migration sets up a simplified access control system for the Backstage application. The system manages users, groups, controllers, access activity logging, and date-based restrictions.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Tables](#tables)
  - [Users](#users)
  - [Groups](#groups)
  - [Controllers](#controllers)
  - [Activity](#activity)
  - [Restrictions](#restrictions)
- [Access Control Rules](#access-control-rules)
- [Functions](#functions)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Usage Examples](#usage-examples)
- [Potential Pitfalls & Concerns](#potential-pitfalls--concerns)
- [Recommendations](#recommendations)

---

## Schema Overview

The database consists of 5 main tables:

1. **users** - Stores user information and access roles
2. **groups** - Organizational groups for users
3. **controllers** - Google Sign In authenticated gate controllers
4. **activity** - Logs all access attempts through gates
5. **restrictions** - Date-based access restrictions for groups

---

## Tables

### Users

Stores user information and access control data.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary Key, Auto-increment | Unique user identifier |
| `name` | `varchar` | NOT NULL | User's first name |
| `lastname` | `varchar` | NOT NULL | User's last name |
| `dni` | `integer` | NOT NULL | National ID number |
| `role` | `role` enum | NOT NULL | Access role (A, B, C, D, E, P, X) |
| `group_id` | `bigint` | Foreign Key (groups.id), Nullable | Optional group membership |
| `created_at` | `timestamptz` | NOT NULL, Default: now() | Record creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, Default: now() | Record update timestamp (auto-updated) |
| `enabled` | `boolean` | NOT NULL, Default: true | Whether user is enabled for access |

**Indexes:**
- Primary key on `id`
- Index on `dni` for faster lookups

**Relationships:**
- Many-to-one with `groups` (optional)
- One-to-many with `activity`

---

### Groups

Organizational groups for users.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary Key, Auto-increment | Unique group identifier |
| `name` | `varchar` | NOT NULL | Group name |

**Relationships:**
- One-to-many with `users`
- One-to-many with `restrictions`

---

### Controllers

Gate controllers who authenticate via Google Sign In and manage access at gates.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary Key, Auto-increment | Unique controller identifier |
| `email` | `varchar` | NOT NULL, UNIQUE | Google Sign In email address |
| `user_id` | `bigint` | Foreign Key (users.id), Nullable | Optional reference to users table |
| `gate` | `gate` enum | NOT NULL | Assigned gate (S1, S2, S3, S4) |

**Indexes:**
- Primary key on `id`
- Unique constraint on `email`
- Index on `email` for faster lookups

**Relationships:**
- Many-to-one with `users` (optional)

**Note:** The `user_id` field links to the users table, but its purpose is unclear from the requirements. It may be used to track which user record corresponds to a controller, or for future integration purposes.

---

### Activity

Logs all access attempts through gates.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary Key, Auto-increment | Unique activity identifier |
| `user_id` | `bigint` | Foreign Key (users.id), NOT NULL | User who attempted access |
| `timestamp` | `timestamptz` | NOT NULL, Default: now() | When access was attempted |
| `gate` | `gate` enum | NOT NULL | Gate where access was attempted |

**Indexes:**
- Primary key on `id`
- Index on `user_id` for faster user activity queries
- Index on `timestamp` for faster time-based queries

**Relationships:**
- Many-to-one with `users`

**Note:** The activity table only logs successful access attempts (when `check_and_log_access` returns success). Failed attempts are not logged. If you need to log failed attempts, consider adding a separate table or modifying the function.

---

### Restrictions

Date-based access restrictions for groups.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary Key, Auto-increment | Unique restriction identifier |
| `group_id` | `bigint` | Foreign Key (groups.id), NOT NULL | Group this restriction applies to |
| `date` | `date` | NOT NULL | Date when access is allowed |

**Indexes:**
- Primary key on `id`
- Unique constraint on (`group_id`, `date`) to prevent duplicates
- Index on (`group_id`, `date`) for faster lookups

**Relationships:**
- Many-to-one with `groups`

**Restriction Logic:**
- If a group has **any** restrictions, users in that group can **only** access on the dates specified in the restrictions table
- If a group has **no** restrictions, users in that group can access freely (no date restrictions)
- Users not in a group have no date restrictions

---

## Access Control Rules

Access is granted through gates based on the following rules:

### Role-Based Access

| Gate | Allowed Roles | Special Notes |
|------|---------------|---------------|
| S1 | All roles (A, B, C, D, E, P, X) | Open to all |
| S2 | All roles (A, B, C, D, E, P, X) | Open to all |
| S3 | A, B, X | Only high-level roles |
| S4 | A, X | Only highest-level role |

**Special Role:**
- Role **X** has access to all gates regardless of gate restrictions

### Additional Access Requirements

1. **User must be enabled:** The `enabled` field must be `true`
2. **Date restrictions:** If the user's group has restrictions, access is only allowed on dates specified in the `restrictions` table
3. **User must exist:** The user must exist in the `users` table

### Access Flow

When a controller scans a QR code:

1. Controller authenticates via Google Sign In (email must exist in `controllers` table)
2. Controller calls `check_and_log_access(user_id, gate, controller_id)` function
3. Function validates:
   - User exists
   - User is enabled
   - User role has access to the gate
   - Date restrictions (if user belongs to a group with restrictions)
4. If all checks pass, activity is logged and access is granted
5. Function returns success/failure with details

---

## Functions

### `check_and_log_access`

**Purpose:** Atomically checks access permissions and logs activity if access is granted.

**Signature:**
```sql
check_and_log_access(
    p_user_id bigint,
    p_gate gate,
    p_controller_id bigint DEFAULT NULL
) RETURNS jsonb
```

**Parameters:**
- `p_user_id`: The ID of the user attempting access
- `p_gate`: The gate where access is being attempted (S1, S2, S3, or S4)
- `p_controller_id`: Optional controller ID (currently not used but available for future use)

**Returns:**
JSON object with:
- `success`: boolean indicating if access was granted
- `message`: string describing the result
- `activity_id`: bigint ID of the activity record if successful, NULL if failed

**Example Return Values:**

Success:
```json
{
  "success": true,
  "message": "Access granted",
  "activity_id": 123
}
```

Failure:
```json
{
  "success": false,
  "message": "User is not enabled",
  "activity_id": null
}
```

**Usage:**
```sql
SELECT check_and_log_access(1, 'S1', 5);
```

**Security:**
- Uses `SECURITY DEFINER` to bypass RLS when inserting activity records
- Ensures atomicity (all checks and insert happen in one transaction)

---

### `update_updated_at_column`

**Purpose:** Trigger function to automatically update the `updated_at` timestamp on the `users` table.

**Signature:**
```sql
update_updated_at_column() RETURNS TRIGGER
```

**Usage:** Automatically called by trigger on `users` table updates.

---

## Row Level Security (RLS)

RLS is enabled on all tables. Policies allow authenticated users (controllers) to:

- **Read users:** All authenticated users can read all users (needed for QR code scanning)
- **Read controllers:** Controllers can read all controllers, and their own record via email match
- **Read groups:** All authenticated users can read groups
- **Read restrictions:** All authenticated users can read restrictions
- **Read activity:** All authenticated users can read activity
- **Insert activity:** All authenticated users can insert activity (primarily via function)

**Note:** The `check_and_log_access` function uses `SECURITY DEFINER` to bypass RLS when inserting activity records, ensuring the function can always log access attempts.

---

## Usage Examples

### Creating a User

```sql
-- Create a user without a group
INSERT INTO users (name, lastname, dni, role)
VALUES ('John', 'Doe', 12345678, 'A');

-- Create a user with a group
INSERT INTO users (name, lastname, dni, role, group_id)
VALUES ('Jane', 'Smith', 87654321, 'B', 1);
```

### Creating a Controller

```sql
-- Create a controller (email must match Google Sign In email)
INSERT INTO controllers (email, gate)
VALUES ('controller@example.com', 'S1');

-- Create a controller with user reference
INSERT INTO controllers (email, user_id, gate)
VALUES ('controller@example.com', 1, 'S2');
```

### Creating a Group

```sql
INSERT INTO groups (name)
VALUES ('VIP Guests');
```

### Adding Restrictions

```sql
-- Allow a group to access only on specific dates
INSERT INTO restrictions (group_id, date)
VALUES (1, '2026-01-15'),
       (1, '2026-01-16'),
       (1, '2026-01-17');
```

### Checking and Logging Access

```sql
-- Check access for user ID 1 at gate S1
SELECT check_and_log_access(1, 'S1');

-- Response if successful:
-- {"success": true, "message": "Access granted", "activity_id": 123}

-- Response if failed:
-- {"success": false, "message": "User is not enabled", "activity_id": null}
```

### Querying Activity

```sql
-- Get recent activity for a user
SELECT a.*, u.name, u.lastname
FROM activity a
JOIN users u ON a.user_id = u.id
WHERE a.user_id = 1
ORDER BY a.timestamp DESC
LIMIT 10;
```

---

## Potential Pitfalls & Concerns

### 1. Controller `user_id` Field

**Issue:** The `controllers` table has a `user_id` field that references the `users` table, but its purpose is unclear from the requirements.

**Concern:** This creates a circular or ambiguous relationship. Controllers authenticate via Google Sign In (using email), but they also reference users. Are controllers also users? Should controllers be users?

**Recommendation:** Clarify the relationship. If controllers are not users, consider removing this field. If controllers should also be users, consider making controllers a view or enforcing a foreign key constraint with specific validation.

### 2. Activity Logging

**Issue:** The activity table only logs successful access attempts. Failed attempts are not logged.

**Concern:** For security auditing, you might want to log all access attempts (both successful and failed).

**Recommendation:** Consider:
- Adding a `status` field to activity table (SUCCESS, DENIED)
- Or creating a separate `access_attempts` table for all attempts
- Or modifying the function to always insert, with a status field

### 3. Date Restriction Logic

**Issue:** The current logic states: "If a group has any restrictions, users can only access on restricted dates."

**Concern:** This might be interpreted differently:
- **Current implementation:** If group has restrictions → users can ONLY access on those dates
- **Alternative interpretation:** Users can access on ANY date EXCEPT restricted dates (blacklist)

**Recommendation:** Clarify the intended behavior. The current implementation treats restrictions as a whitelist (only allowed dates). If you want a blacklist (blocked dates), the logic needs to be inverted.

### 4. Timezone Handling

**Issue:** Date restrictions use `CURRENT_DATE` which is timezone-aware, but the `date` column in restrictions is just a `date` type (no timezone).

**Concern:** If users and controllers are in different timezones, date comparisons might be inconsistent.

**Recommendation:** 
- Ensure all date comparisons use a consistent timezone (e.g., UTC or your application's timezone)
- Consider storing timestamps with timezone for restrictions if you need finer control

### 5. Missing Controller ID in Activity

**Issue:** The activity table doesn't include a `controller_id` field, even though controllers are the ones logging the access.

**Concern:** For audit trails, it's useful to know which controller granted access.

**Recommendation:** Consider adding a `controller_id` field to the activity table and updating the `check_and_log_access` function to include it.

### 6. Atomicity via Function

**Issue:** You requested functions for atomicity since Supabase doesn't support transactions via PostgREST.

**Note:** The `check_and_log_access` function ensures atomicity, but note that:
- Functions in PostgreSQL are automatically transactional
- If the function fails at any point, all changes are rolled back
- This is the correct approach for atomic operations

### 7. Role Enum Values

**Issue:** The roles are A, B, C, D, E, P, X, but the access rules only mention A, B, and X.

**Concern:** What happens to roles C, D, E, P? They can access S1 and S2, but not S3 or S4. Make sure this aligns with your business logic.

### 8. DNI Uniqueness

**Issue:** The `dni` field in users table is not unique.

**Concern:** If DNI is a national ID, it should probably be unique to prevent duplicate users.

**Recommendation:** Add a unique constraint on `dni`:
```sql
ALTER TABLE users ADD CONSTRAINT users_dni_key UNIQUE (dni);
```

### 9. Google Sign In Integration

**Issue:** Controllers authenticate via Google Sign In using email, but there's no direct link between Supabase auth.users and the controllers table.

**Concern:** You'll need to ensure that:
- Controller emails in the `controllers` table match the email in Supabase auth.users
- RLS policies that use `auth.jwt() ->> 'email'` will work correctly
- The controller lookup by email works correctly

**Recommendation:** Consider adding a trigger or function to sync controller emails with auth.users, or add a foreign key relationship if Supabase supports it.

### 10. Group Name Uniqueness

**Issue:** Group names are not unique.

**Concern:** If group names should be unique, add a unique constraint.

**Recommendation:** If needed, add:
```sql
ALTER TABLE groups ADD CONSTRAINT groups_name_key UNIQUE (name);
```

---

## Recommendations

### Immediate Actions

1. **Clarify controller-user relationship:** Decide if controllers are users or separate entities
2. **Add DNI uniqueness:** Add unique constraint on `dni` if it represents a national ID
3. **Consider controller_id in activity:** Add controller tracking to activity table for audit trails
4. **Review restriction logic:** Confirm if restrictions are whitelist (current) or blacklist (alternative)

### Future Enhancements

1. **Failed attempt logging:** Add logging for denied access attempts
2. **Audit trail:** Add `created_by` and `updated_by` fields to track who made changes
3. **Soft deletes:** Consider adding `deleted_at` for soft delete functionality
4. **Time-based restrictions:** Extend restrictions to include time windows, not just dates
5. **Access history views:** Create materialized views for common queries (e.g., "users accessed today")
6. **Controller activity tracking:** Track which controller performed which actions
7. **Rate limiting:** Consider adding rate limiting to prevent abuse

### Security Considerations

1. **RLS Policies:** Review and tighten RLS policies if needed (currently quite permissive)
2. **Function Security:** The `check_and_log_access` function uses `SECURITY DEFINER` - ensure it's secure
3. **Input Validation:** Add validation for function parameters (e.g., ensure user_id exists)
4. **Audit Logging:** Consider adding an audit log table for sensitive operations

---

## Migration Instructions

1. **Apply the migration:**
   ```bash
   # If using Supabase CLI locally
   supabase migration up
   
   # Or apply directly via SQL editor in Supabase dashboard
   ```

2. **Verify tables were created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'groups', 'controllers', 'activity', 'restrictions');
   ```

3. **Test the function:**
   ```sql
   -- Create a test user
   INSERT INTO users (name, lastname, dni, role) 
   VALUES ('Test', 'User', 99999999, 'A');
   
   -- Test access
   SELECT check_and_log_access(1, 'S1');
   ```

4. **Set up Google Sign In:** Ensure controller emails match Google Sign In emails in Supabase auth

---

## Questions to Address

Before deploying to production, consider:

1. Should controllers also be users?
2. Should DNI be unique?
3. Should group names be unique?
4. Should activity log include controller_id?
5. Are restrictions a whitelist (only these dates) or blacklist (not these dates)?
6. Should failed access attempts be logged?
7. What timezone should be used for date comparisons?
8. What are the intended behaviors for roles C, D, E, P?

---

## Support

For issues or questions about this migration, please review the concerns and recommendations above, or consult the main project documentation.


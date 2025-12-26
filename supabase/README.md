# Supabase Security Configuration

This folder contains SQL scripts to configure Row Level Security (RLS) policies for the HaloPSA AI application.

## Why RLS?

Row Level Security ensures that:
- Users can only access their own data
- Admins have appropriate elevated access
- Sensitive data is protected at the database level
- Defense-in-depth security (even if application code has bugs)

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `rls-policies.sql`
4. Paste and run the SQL

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the SQL file
supabase db execute --file supabase/rls-policies.sql
```

## Tables Protected

| Table | User Access | Admin Access |
|-------|-------------|--------------|
| User | Own profile only | All users |
| Account | Own OAuth accounts | - |
| Session | Own sessions | - |
| HaloConnection | Own connections | All (read) |
| ChatSession | Own sessions | - |
| ChatMessage | Own messages | - |
| ChatAttachment | Own attachments | - |
| AuditLog | Own logs | All logs |
| SystemConfig | Public configs | All configs |
| UsageRecord | Own records | All records |
| KnowledgeBaseItem | Own items | - |
| KnowledgeBaseSync | Own syncs | - |

## Security Features

### 1. Data Isolation
Each user can only see and modify their own data.

### 2. Admin Access
Admins (`ADMIN` and `SUPER_ADMIN` roles) have elevated access for debugging and management.

### 3. Privilege Escalation Prevention
Database triggers prevent users from:
- Changing their own role
- Changing their own plan/subscription

### 4. Service Role Bypass
The Prisma backend uses the service role which bypasses RLS. This is intentional as the backend handles authorization.

## Verification

Run this query to verify RLS is enabled:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

## Troubleshooting

### "permission denied" errors
- Ensure the authenticated role has proper grants
- Check if RLS policies are correctly applied

### Users seeing no data
- Verify `auth.user_id()` function returns the correct user ID
- Check JWT claims are properly set

### Admin access not working
- Verify user's role is correctly set in the User table
- Check `auth.is_admin()` function is working

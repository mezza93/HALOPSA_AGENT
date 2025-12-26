-- ===========================================
-- HaloPSA AI - Supabase Row Level Security (RLS) Policies
-- ===========================================
-- This file configures RLS policies for all tables to ensure
-- proper data isolation in a multi-tenant environment.
--
-- IMPORTANT: Run this in the Supabase SQL Editor after migrations
-- ===========================================

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HaloConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBaseItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBaseSync" ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTION: Get current user ID from JWT
-- ===========================================
-- This works with Supabase Auth. For NextAuth, the service role
-- bypasses RLS, but this provides defense-in-depth.

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'user_metadata')::json->>'user_id'
  );
$$ LANGUAGE SQL STABLE;

-- Helper to check if current user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.user_id()
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ===========================================
-- USER TABLE POLICIES
-- ===========================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON "User"
  FOR SELECT
  USING (id = auth.user_id());

-- Users can update their own profile (except role and plan)
CREATE POLICY "Users can update own profile"
  ON "User"
  FOR UPDATE
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON "User"
  FOR SELECT
  USING (auth.is_admin());

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON "User"
  FOR UPDATE
  USING (auth.is_admin());

-- ===========================================
-- ACCOUNT TABLE POLICIES (OAuth)
-- ===========================================

-- Users can only see their own OAuth accounts
CREATE POLICY "Users can view own accounts"
  ON "Account"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Users can delete their own OAuth accounts (unlink)
CREATE POLICY "Users can delete own accounts"
  ON "Account"
  FOR DELETE
  USING ("userId" = auth.user_id());

-- System can insert accounts (during OAuth flow)
CREATE POLICY "System can insert accounts"
  ON "Account"
  FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- SESSION TABLE POLICIES
-- ===========================================

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON "Session"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
  ON "Session"
  FOR DELETE
  USING ("userId" = auth.user_id());

-- System can manage sessions
CREATE POLICY "System can manage sessions"
  ON "Session"
  FOR ALL
  WITH CHECK (true);

-- ===========================================
-- VERIFICATION TOKEN POLICIES
-- ===========================================

-- Tokens are system-managed, allow all for service role
CREATE POLICY "System manages verification tokens"
  ON "VerificationToken"
  FOR ALL
  WITH CHECK (true);

-- ===========================================
-- HALO CONNECTION POLICIES
-- ===========================================

-- Users can only see their own connections
CREATE POLICY "Users can view own connections"
  ON "HaloConnection"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Users can create their own connections
CREATE POLICY "Users can create own connections"
  ON "HaloConnection"
  FOR INSERT
  WITH CHECK ("userId" = auth.user_id());

-- Users can update their own connections
CREATE POLICY "Users can update own connections"
  ON "HaloConnection"
  FOR UPDATE
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- Users can delete their own connections
CREATE POLICY "Users can delete own connections"
  ON "HaloConnection"
  FOR DELETE
  USING ("userId" = auth.user_id());

-- Admins can view all connections (for debugging)
CREATE POLICY "Admins can view all connections"
  ON "HaloConnection"
  FOR SELECT
  USING (auth.is_admin());

-- ===========================================
-- CHAT SESSION POLICIES
-- ===========================================

-- Users can only see their own chat sessions
CREATE POLICY "Users can view own chat sessions"
  ON "ChatSession"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Users can create their own chat sessions
CREATE POLICY "Users can create own chat sessions"
  ON "ChatSession"
  FOR INSERT
  WITH CHECK ("userId" = auth.user_id());

-- Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
  ON "ChatSession"
  FOR UPDATE
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
  ON "ChatSession"
  FOR DELETE
  USING ("userId" = auth.user_id());

-- ===========================================
-- CHAT MESSAGE POLICIES
-- ===========================================

-- Users can view messages in their own sessions
CREATE POLICY "Users can view own messages"
  ON "ChatMessage"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "ChatMessage"."sessionId"
      AND "ChatSession"."userId" = auth.user_id()
    )
  );

-- Users can create messages in their own sessions
CREATE POLICY "Users can create own messages"
  ON "ChatMessage"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "sessionId"
      AND "ChatSession"."userId" = auth.user_id()
    )
  );

-- Users can delete messages in their own sessions
CREATE POLICY "Users can delete own messages"
  ON "ChatMessage"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "ChatMessage"."sessionId"
      AND "ChatSession"."userId" = auth.user_id()
    )
  );

-- ===========================================
-- CHAT ATTACHMENT POLICIES
-- ===========================================

-- Users can view attachments in their own messages
CREATE POLICY "Users can view own attachments"
  ON "ChatAttachment"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatMessage"
      JOIN "ChatSession" ON "ChatSession".id = "ChatMessage"."sessionId"
      WHERE "ChatMessage".id = "ChatAttachment"."messageId"
      AND "ChatSession"."userId" = auth.user_id()
    )
  );

-- Users can create attachments in their own messages
CREATE POLICY "Users can create own attachments"
  ON "ChatAttachment"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatMessage"
      JOIN "ChatSession" ON "ChatSession".id = "ChatMessage"."sessionId"
      WHERE "ChatMessage".id = "messageId"
      AND "ChatSession"."userId" = auth.user_id()
    )
  );

-- Users can delete attachments in their own messages
CREATE POLICY "Users can delete own attachments"
  ON "ChatAttachment"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "ChatMessage"
      JOIN "ChatSession" ON "ChatSession".id = "ChatMessage"."sessionId"
      WHERE "ChatMessage".id = "ChatAttachment"."messageId"
      AND "ChatSession"."userId" = auth.user_id()
    )
  );

-- ===========================================
-- AUDIT LOG POLICIES
-- ===========================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON "AuditLog"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON "AuditLog"
  FOR SELECT
  USING (auth.is_admin());

-- System can insert audit logs (no user restrictions)
CREATE POLICY "System can insert audit logs"
  ON "AuditLog"
  FOR INSERT
  WITH CHECK (true);

-- Only super admins can delete audit logs
CREATE POLICY "Super admins can delete audit logs"
  ON "AuditLog"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.user_id()
      AND role = 'SUPER_ADMIN'
    )
  );

-- ===========================================
-- SYSTEM CONFIG POLICIES
-- ===========================================

-- Anyone can read public configs
CREATE POLICY "Anyone can read public configs"
  ON "SystemConfig"
  FOR SELECT
  USING ("isPublic" = true);

-- Admins can read all configs
CREATE POLICY "Admins can read all configs"
  ON "SystemConfig"
  FOR SELECT
  USING (auth.is_admin());

-- Only super admins can modify configs
CREATE POLICY "Super admins can modify configs"
  ON "SystemConfig"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.user_id()
      AND role = 'SUPER_ADMIN'
    )
  );

-- ===========================================
-- USAGE RECORD POLICIES
-- ===========================================

-- Users can view their own usage records
CREATE POLICY "Users can view own usage"
  ON "UsageRecord"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Admins can view all usage records
CREATE POLICY "Admins can view all usage"
  ON "UsageRecord"
  FOR SELECT
  USING (auth.is_admin());

-- System can insert/update usage records
CREATE POLICY "System can manage usage records"
  ON "UsageRecord"
  FOR ALL
  WITH CHECK (true);

-- ===========================================
-- KNOWLEDGE BASE ITEM POLICIES
-- ===========================================

-- Users can view their own KB items
CREATE POLICY "Users can view own KB items"
  ON "KnowledgeBaseItem"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Users can create their own KB items
CREATE POLICY "Users can create own KB items"
  ON "KnowledgeBaseItem"
  FOR INSERT
  WITH CHECK ("userId" = auth.user_id());

-- Users can update their own KB items
CREATE POLICY "Users can update own KB items"
  ON "KnowledgeBaseItem"
  FOR UPDATE
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- Users can delete their own KB items
CREATE POLICY "Users can delete own KB items"
  ON "KnowledgeBaseItem"
  FOR DELETE
  USING ("userId" = auth.user_id());

-- ===========================================
-- KNOWLEDGE BASE SYNC POLICIES
-- ===========================================

-- Users can view their own sync records
CREATE POLICY "Users can view own sync records"
  ON "KnowledgeBaseSync"
  FOR SELECT
  USING ("userId" = auth.user_id());

-- Users can create their own sync records
CREATE POLICY "Users can create own sync records"
  ON "KnowledgeBaseSync"
  FOR INSERT
  WITH CHECK ("userId" = auth.user_id());

-- Users can update their own sync records
CREATE POLICY "Users can update own sync records"
  ON "KnowledgeBaseSync"
  FOR UPDATE
  USING ("userId" = auth.user_id())
  WITH CHECK ("userId" = auth.user_id());

-- Users can delete their own sync records
CREATE POLICY "Users can delete own sync records"
  ON "KnowledgeBaseSync"
  FOR DELETE
  USING ("userId" = auth.user_id());

-- ===========================================
-- GRANT PERMISSIONS TO AUTHENTICATED ROLE
-- ===========================================

-- These grants allow the authenticated role (logged-in users via Supabase)
-- to access tables. The RLS policies above will filter the actual data.

GRANT SELECT, INSERT, UPDATE, DELETE ON "User" TO authenticated;
GRANT SELECT, DELETE ON "Account" TO authenticated;
GRANT SELECT, DELETE ON "Session" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "HaloConnection" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ChatSession" TO authenticated;
GRANT SELECT, INSERT, DELETE ON "ChatMessage" TO authenticated;
GRANT SELECT, INSERT, DELETE ON "ChatAttachment" TO authenticated;
GRANT SELECT ON "AuditLog" TO authenticated;
GRANT SELECT ON "SystemConfig" TO authenticated;
GRANT SELECT ON "UsageRecord" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "KnowledgeBaseItem" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "KnowledgeBaseSync" TO authenticated;

-- Service role bypasses RLS (used by Prisma backend)
-- This is the default behavior in Supabase

-- ===========================================
-- ADDITIONAL SECURITY: Prevent privilege escalation
-- ===========================================

-- Prevent users from changing their own role
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role AND auth.user_id() = OLD.id THEN
    -- Only allow if current user is a super admin changing someone else
    IF NOT EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.user_id()
      AND role = 'SUPER_ADMIN'
    ) THEN
      RAISE EXCEPTION 'Cannot change your own role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON "User";
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- Prevent users from changing their own plan
CREATE OR REPLACE FUNCTION prevent_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.plan != NEW.plan AND auth.user_id() = OLD.id THEN
    -- Only allow if current user is a super admin
    IF NOT EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.user_id()
      AND role = 'SUPER_ADMIN'
    ) THEN
      RAISE EXCEPTION 'Cannot change your own plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_plan_change_trigger ON "User";
CREATE TRIGGER prevent_plan_change_trigger
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_plan_change();

-- ===========================================
-- VERIFICATION QUERY
-- ===========================================
-- Run this to verify RLS is enabled on all tables:
/*
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

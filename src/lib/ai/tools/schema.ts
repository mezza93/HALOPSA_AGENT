/**
 * Schema AI tools for HaloPSA.
 * Provides tools to access database schema and lookup information
 * for accurate SQL report generation.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import { SchemaService } from '@/lib/halopsa/services/schema';
import { formatError } from './utils';

export function createSchemaTools(ctx: HaloContext) {
  const schemaService = new SchemaService(ctx.client);

  return {
    /**
     * Get SQL context for writing accurate reports.
     * IMPORTANT: Always use this before creating reports to get real table/column names.
     */
    getSqlSchemaContext: tool({
      description: `Get the SQL schema context for writing accurate HaloPSA reports.

CRITICAL: Always call this tool BEFORE creating any custom reports or SQL queries.
This returns the actual available tables, columns, and valid values from this HaloPSA instance.

Using table or column names not returned by this tool will cause "Invalid object name" errors.

Returns:
- Available tables and views (Request_View, FAULTS, UNAME, etc.)
- Column names with their data types
- Current status and priority values for this instance
- SQL syntax rules and example queries`,
      parameters: z.object({}),
      execute: async () => {
        try {
          console.log('[Tool:getSqlSchemaContext] Fetching SQL schema context');
          const context = await schemaService.getSqlContext();

          return {
            success: true,
            schemaContext: context,
            message: 'Schema context retrieved. Use ONLY the tables and columns listed above in SQL queries.',
          };
        } catch (error) {
          return formatError(error, 'getSqlSchemaContext');
        }
      },
    }),

    /**
     * Get available lookup tables (reference data).
     */
    getLookupTables: tool({
      description: `Get a list of all lookup tables (reference data) in this HaloPSA instance.

Lookup tables contain things like:
- Ticket statuses
- Priority levels
- Custom dropdown values
- Categories

Use this to understand what reference data is available.`,
      parameters: z.object({}),
      execute: async () => {
        try {
          console.log('[Tool:getLookupTables] Fetching lookup tables');
          const lookups = await schemaService.getLookupTables();

          return {
            success: true,
            count: lookups.length,
            lookupTables: lookups.map(l => ({
              id: l.id,
              name: l.name,
              group: l.group,
            })),
            message: `Found ${lookups.length} lookup tables`,
          };
        } catch (error) {
          return formatError(error, 'getLookupTables');
        }
      },
    }),

    /**
     * Get values from a specific lookup table.
     */
    getLookupValues: tool({
      description: `Get the values from a specific lookup table.

Use this to get the actual values in a dropdown/reference field, like:
- List of all ticket statuses
- List of all priority levels
- List of all categories`,
      parameters: z.object({
        lookupId: z.number().describe('The ID of the lookup table'),
      }),
      execute: async ({ lookupId }) => {
        try {
          console.log(`[Tool:getLookupValues] Fetching values for lookup ${lookupId}`);
          const values = await schemaService.getLookupValues(lookupId);

          return {
            success: true,
            lookupId,
            count: values.length,
            values: values.map(v => ({
              id: v.id,
              name: v.name,
              isArchived: v.isarchived,
            })),
            message: `Found ${values.length} values in lookup ${lookupId}`,
          };
        } catch (error) {
          return formatError(error, 'getLookupValues');
        }
      },
    }),

    /**
     * Get ticket statuses with their types.
     */
    getTicketStatuses: tool({
      description: `Get all ticket statuses in this HaloPSA instance.

Returns each status with:
- id: The status ID to use in SQL queries
- name: The display name
- type: 1=Open, 2=Closed, 3=Deleted

Use this to filter tickets by status in SQL queries.
Example: WHERE Status NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType = 2)`,
      parameters: z.object({}),
      execute: async () => {
        try {
          console.log('[Tool:getTicketStatuses] Fetching ticket statuses');
          const statuses = await schemaService.getTicketStatuses();

          const openStatuses = statuses.filter(s => s.type === 1);
          const closedStatuses = statuses.filter(s => s.type === 2);

          return {
            success: true,
            count: statuses.length,
            statuses,
            summary: {
              openCount: openStatuses.length,
              closedCount: closedStatuses.length,
              openStatusIds: openStatuses.map(s => s.id),
              closedStatusIds: closedStatuses.map(s => s.id),
            },
            message: `Found ${openStatuses.length} open statuses and ${closedStatuses.length} closed statuses`,
          };
        } catch (error) {
          return formatError(error, 'getTicketStatuses');
        }
      },
    }),

    /**
     * Get priority levels.
     */
    getPriorities: tool({
      description: `Get all priority levels in this HaloPSA instance.

Returns each priority with:
- id: The priority ID to use in SQL queries
- name: The display name (e.g., "Critical", "High", "Medium", "Low")`,
      parameters: z.object({}),
      execute: async () => {
        try {
          console.log('[Tool:getPriorities] Fetching priorities');
          const priorities = await schemaService.getPriorities();

          return {
            success: true,
            count: priorities.length,
            priorities,
            message: `Found ${priorities.length} priority levels`,
          };
        } catch (error) {
          return formatError(error, 'getPriorities');
        }
      },
    }),

    /**
     * Get custom field definitions.
     */
    getCustomFields: tool({
      description: `Get all custom field definitions in this HaloPSA instance.

Custom fields are additional fields added to tickets, clients, assets, etc.
Returns field name, type, and configuration.`,
      parameters: z.object({
        entityType: z.enum(['tickets', 'clients', 'assets', 'all']).optional()
          .describe('Filter by entity type (default: all)'),
      }),
      execute: async ({ entityType = 'all' }) => {
        try {
          console.log(`[Tool:getCustomFields] Fetching custom fields for ${entityType}`);
          const fields = await schemaService.getFieldDefinitions();

          // Map entity type to HaloPSA entity type codes
          const entityTypeMap: Record<string, number> = {
            tickets: 0,
            clients: 1,
            assets: 2,
          };

          let filteredFields = fields;
          if (entityType !== 'all' && entityTypeMap[entityType] !== undefined) {
            filteredFields = fields.filter(f => f.entitytype === entityTypeMap[entityType]);
          }

          return {
            success: true,
            count: filteredFields.length,
            fields: filteredFields.map(f => ({
              id: f.id,
              name: f.name,
              label: f.label,
              type: f.type,
              isRequired: f.isrequired,
            })),
            message: `Found ${filteredFields.length} custom fields`,
          };
        } catch (error) {
          return formatError(error, 'getCustomFields');
        }
      },
    }),

    /**
     * Validate a SQL query against the schema.
     */
    validateSqlQuery: tool({
      description: `Validate a SQL query against the known HaloPSA schema.

Checks if the tables and columns used in the query are known to exist.
Returns warnings for any potentially invalid references.

Note: This is a basic check and may not catch all issues.`,
      parameters: z.object({
        sql: z.string().describe('The SQL query to validate'),
      }),
      execute: async ({ sql }) => {
        try {
          console.log('[Tool:validateSqlQuery] Validating SQL query');
          const schemaInfo = await schemaService.getSchemaInfo();

          const warnings: string[] = [];
          const upperSql = sql.toUpperCase();

          // Known valid tables/views
          const validObjects = [
            'REQUEST_VIEW', 'FAULTS', 'UNAME', 'TSTATUS', 'SITE', 'AREA',
            'USERS', 'ACTIONS', 'POLICY', 'REQUESTTYPE', 'ASSET_VIEW',
            'ACTION_VIEW', 'GENERIC', 'ASSETS', 'SLA', 'CONTRACTS',
          ];

          // Check for common invalid table names
          const invalidPatterns = [
            { pattern: /\bTIMETAKEN\b/i, message: 'Table TIMETAKEN does not exist. Use ACTIONS.Atimetaken or Request_View.[Time Taken]' },
            { pattern: /\bTEAM\b/i, message: 'Table TEAM may not exist. Consider using UNAME for agent data' },
            { pattern: /\bCLIENT\b/i, message: 'Table CLIENT does not exist. Use SITE or AREA instead' },
            { pattern: /\bAGENT\b/i, message: 'Table AGENT does not exist. Use UNAME for agent data' },
            { pattern: /\bPRIORITY\b(?!\s*DESCRIPTION)/i, message: 'Table PRIORITY does not exist. Use POLICY for priority lookup' },
          ];

          for (const check of invalidPatterns) {
            if (check.pattern.test(sql)) {
              warnings.push(check.message);
            }
          }

          // Check if using ORDER BY without TOP
          if (/ORDER\s+BY/i.test(sql) && !/TOP\s+\d+/i.test(sql)) {
            warnings.push('SQL Server requires TOP clause when using ORDER BY in views. Add TOP 100 or similar.');
          }

          // Check for unquoted column names with spaces
          const columnWithSpace = /\b(Customer Name|Ticket Number|Date Logged|Priority Description|Status ID)\b(?!\])/i;
          if (columnWithSpace.test(sql)) {
            warnings.push('Column names with spaces must be quoted with [ ]. Example: [Customer Name]');
          }

          return {
            success: true,
            valid: warnings.length === 0,
            warnings,
            recommendations: [
              'Use Request_View for most reports (has pre-joined data)',
              'Always use TOP clause with ORDER BY',
              'Quote column names with spaces using [ ]',
              'Use COALESCE() for null handling',
            ],
            message: warnings.length === 0
              ? 'SQL query appears valid'
              : `Found ${warnings.length} potential issue(s)`,
          };
        } catch (error) {
          return formatError(error, 'validateSqlQuery');
        }
      },
    }),
  };
}

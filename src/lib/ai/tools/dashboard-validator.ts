/**
 * Dashboard Validation AI tools for HaloPSA.
 * Provides validation and auto-fix capabilities for dashboard reports.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import { DashboardValidatorService, VALIDATED_SQL_TEMPLATES } from '@/lib/halopsa/services/dashboard-validator';

/**
 * Format error for tool response.
 */
function formatError(error: unknown, toolName: string): { success: false; error: string } {
  console.error(`[Tool:${toolName}] Error:`, error);
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('401') || message.includes('Unauthorized')) {
    return { success: false, error: 'Authentication failed with HaloPSA. Please check your connection credentials.' };
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return { success: false, error: 'Access denied. Your HaloPSA account may not have permission for this operation.' };
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return { success: false, error: 'The requested resource was not found in HaloPSA.' };
  }

  return { success: false, error: `Operation failed: ${message}` };
}

export function createDashboardValidatorTools(ctx: HaloContext) {
  // Create the validator service
  const validator = new DashboardValidatorService(ctx.reports, ctx.reports.dashboards);

  return {
    validateDashboard: tool({
      description: `Validate a dashboard and all its widget reports.

This tool will:
1. Check each widget that uses a report
2. Attempt to run the report to verify SQL is valid
3. If errors are found and autoFix is true, attempt to fix the SQL
4. Return detailed results for each widget

Use this AFTER creating a dashboard to ensure all widgets work correctly.`,
      parameters: z.object({
        dashboardId: z.number().describe('The dashboard ID to validate'),
        autoFix: z.boolean().optional().default(true).describe('Attempt to automatically fix broken reports'),
      }),
      execute: async ({ dashboardId, autoFix }) => {
        try {
          console.log(`[Tool:validateDashboard] Validating dashboard ${dashboardId}`);
          const result = await validator.validateDashboard(dashboardId, autoFix ?? true);

          return {
            success: true,
            valid: result.valid,
            dashboardId: result.dashboardId,
            dashboardName: result.dashboardName,
            reportsValidated: result.reportsValidated,
            reportsFailed: result.reportsFailed,
            reportsFixed: result.reportsFixed,
            widgets: result.widgetResults,
            message: result.valid
              ? `Dashboard validated successfully! ${result.reportsValidated} reports checked, ${result.reportsFixed} fixed.`
              : `Dashboard has issues: ${result.reportsFailed} report(s) failed validation.`,
          };
        } catch (error) {
          return formatError(error, 'validateDashboard');
        }
      },
    }),

    validateReport: tool({
      description: `Validate a single report by attempting to run it.

Returns detailed error information if the SQL fails, including suggested fixes.`,
      parameters: z.object({
        reportId: z.number().describe('The report ID to validate'),
      }),
      execute: async ({ reportId }) => {
        try {
          console.log(`[Tool:validateReport] Validating report ${reportId}`);
          const result = await validator.validateReport(reportId);

          return {
            success: true,
            ...result,
            message: result.valid
              ? `Report validated successfully! Returned ${result.rowCount} rows.`
              : `Report failed: ${result.error}`,
          };
        } catch (error) {
          return formatError(error, 'validateReport');
        }
      },
    }),

    fixReport: tool({
      description: `Attempt to fix a broken report by analyzing the error and applying corrections.

This will:
1. Validate the report
2. If it fails, analyze the error
3. Apply known fixes (table names, column names, SQL Server syntax)
4. Re-validate to confirm the fix worked`,
      parameters: z.object({
        reportId: z.number().describe('The report ID to fix'),
        maxAttempts: z.number().optional().default(3).describe('Maximum fix attempts'),
      }),
      execute: async ({ reportId, maxAttempts }) => {
        try {
          console.log(`[Tool:fixReport] Attempting to fix report ${reportId}`);
          const result = await validator.validateAndFixReport(reportId, maxAttempts ?? 3);

          return {
            success: true,
            ...result,
            message: result.valid
              ? `Report fixed and validated successfully!`
              : `Could not fix report: ${result.error}`,
          };
        } catch (error) {
          return formatError(error, 'fixReport');
        }
      },
    }),

    createValidatedReport: tool({
      description: `Create a report with validation - if the SQL fails, use validated fallback templates.

This is safer than createReport as it:
1. Tries the provided SQL first
2. If it fails, attempts to fix common errors
3. If still failing, falls back to a validated template
4. Confirms the report works before returning`,
      parameters: z.object({
        name: z.string().describe('Report name'),
        sqlQuery: z.string().describe('SQL query for the report'),
        templateKey: z.enum([
          'tickets_by_priority',
          'tickets_by_status',
          'tickets_by_client',
          'tickets_by_category',
          'agent_workload',
          'tickets_closed_by_agent',
          'tickets_over_time',
          'sla_performance',
          'response_time_avg',
          'top_callers',
        ]).optional().describe('Fallback template to use if SQL fails'),
      }),
      execute: async ({ name, sqlQuery, templateKey }) => {
        try {
          console.log(`[Tool:createValidatedReport] Creating report '${name}'`);
          const result = await validator.createValidatedReport(
            name,
            sqlQuery,
            templateKey as keyof typeof VALIDATED_SQL_TEMPLATES | undefined
          );

          if (result.report) {
            return {
              success: true,
              reportId: result.report.id,
              name: result.report.name,
              validated: result.validated,
              usedFallback: result.usedFallback,
              message: result.usedFallback
                ? `Report created using validated fallback template.`
                : `Report created and validated successfully!`,
            };
          }

          return {
            success: false,
            error: 'Could not create a valid report with the provided SQL or fallback template.',
          };
        } catch (error) {
          return formatError(error, 'createValidatedReport');
        }
      },
    }),

    listValidatedTemplates: tool({
      description: `List all available validated SQL templates.

These templates have been tested against the HaloPSA database schema and are guaranteed to work.`,
      parameters: z.object({}),
      execute: async () => {
        try {
          const templates = validator.listValidatedTemplates();

          return {
            success: true,
            templates: templates.map(key => ({
              key,
              sql: VALIDATED_SQL_TEMPLATES[key as keyof typeof VALIDATED_SQL_TEMPLATES],
            })),
            message: `Available: ${templates.length} validated SQL templates`,
          };
        } catch (error) {
          return formatError(error, 'listValidatedTemplates');
        }
      },
    }),

    getValidatedSql: tool({
      description: `Get a validated SQL template for a specific widget type.

Use this to get SQL that is guaranteed to work with the HaloPSA database.`,
      parameters: z.object({
        templateKey: z.enum([
          'tickets_by_priority',
          'tickets_by_status',
          'tickets_by_client',
          'tickets_by_category',
          'agent_workload',
          'tickets_closed_by_agent',
          'tickets_over_time',
          'sla_performance',
          'response_time_avg',
          'top_callers',
          'tickets_by_priority_view',
          'tickets_by_status_view',
          'tickets_by_client_view',
        ]).describe('Template name'),
      }),
      execute: async ({ templateKey }) => {
        try {
          const sql = validator.getValidatedSql(templateKey as keyof typeof VALIDATED_SQL_TEMPLATES);

          if (sql) {
            return {
              success: true,
              templateKey,
              sql,
            };
          }

          return {
            success: false,
            error: `Template '${templateKey}' not found`,
          };
        } catch (error) {
          return formatError(error, 'getValidatedSql');
        }
      },
    }),
  };
}

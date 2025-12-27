/**
 * Report Repository AI tools for HaloPSA.
 * Provides access to HaloPSA's online repository of pre-built, tested reports.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';

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

export function createReportRepositoryTools(ctx: HaloContext) {
  // Use the repository service from context
  const repository = ctx.reportRepository;

  return {
    listRepositoryReports: tool({
      description: `List available reports from HaloPSA's online Report Repository.

These are pre-built, tested reports created by HaloPSA that are guaranteed to work.
Use these instead of creating custom SQL reports when possible.

Parameters:
- chartonly: Only return reports suitable for dashboard charts (recommended for dashboards)
- search: Search for specific reports by keyword
- count: Maximum number of reports to return`,
      parameters: z.object({
        chartonly: z.boolean().optional().default(true).describe('Only return chart-compatible reports'),
        search: z.string().optional().describe('Search keyword (e.g., "priority", "status", "agent")'),
        count: z.number().optional().default(50).describe('Max reports to return'),
      }),
      execute: async ({ chartonly, search, count }) => {
        try {
          console.log(`[Tool:listRepositoryReports] Listing repository reports (chartonly=${chartonly}, search=${search})`);

          const reports = await repository.list({
            includepublished: true,
            chartonly: chartonly ?? true,
            search,
            count: count ?? 50,
          });

          return {
            success: true,
            count: reports.length,
            reports: reports.map(r => ({
              id: r.id,
              name: r.name,
              description: r.description,
              chartType: r.chartType,
              category: r.category,
              isBuiltIn: r.isBuiltIn,
            })),
            message: `Found ${reports.length} reports in the HaloPSA repository`,
          };
        } catch (error) {
          return formatError(error, 'listRepositoryReports');
        }
      },
    }),

    searchRepositoryReports: tool({
      description: `Search for reports in HaloPSA's Report Repository.

Use this to find pre-built reports for specific purposes like:
- "tickets by priority"
- "agent workload"
- "SLA performance"
- "customer tickets"
- "response time"

These reports have tested SQL that works with the HaloPSA database.`,
      parameters: z.object({
        query: z.string().describe('Search query (e.g., "priority", "SLA", "agent workload")'),
        chartonly: z.boolean().optional().default(true).describe('Only return chart-compatible reports'),
        count: z.number().optional().default(20).describe('Max results'),
      }),
      execute: async ({ query, chartonly, count }) => {
        try {
          console.log(`[Tool:searchRepositoryReports] Searching for: ${query}`);

          const reports = await repository.search(query, {
            chartonly: chartonly ?? true,
            count: count ?? 20,
          });

          if (reports.length === 0) {
            return {
              success: true,
              count: 0,
              reports: [],
              message: `No matching reports found for "${query}". Try different keywords.`,
              suggestions: ['priority', 'status', 'agent', 'client', 'SLA', 'workload', 'tickets'],
            };
          }

          return {
            success: true,
            count: reports.length,
            reports: reports.map(r => ({
              id: r.id,
              name: r.name,
              description: r.description,
              chartType: r.chartType,
              category: r.category,
              hasSql: !!r.sql,
            })),
            message: `Found ${reports.length} matching reports for "${query}"`,
          };
        } catch (error) {
          return formatError(error, 'searchRepositoryReports');
        }
      },
    }),

    getRepositoryReport: tool({
      description: `Get full details of a report from HaloPSA's Repository, including its SQL.

Use this to see the exact SQL query used by a repository report before importing it.`,
      parameters: z.object({
        reportId: z.number().describe('The repository report ID'),
        includeDetails: z.boolean().optional().default(true).describe('Include SQL and other details'),
      }),
      execute: async ({ reportId, includeDetails }) => {
        try {
          console.log(`[Tool:getRepositoryReport] Getting repository report ${reportId}`);

          const report = await repository.get(reportId, {
            includedetails: includeDetails ?? true,
            loadreport: true,
          });

          return {
            success: true,
            report: {
              id: report.id,
              name: report.name,
              description: report.description,
              sql: report.sql,
              chartType: report.chartType,
              chartTitle: report.chartTitle,
              xAxis: report.xAxis,
              yAxis: report.yAxis,
              category: report.category,
              isBuiltIn: report.isBuiltIn,
            },
          };
        } catch (error) {
          return formatError(error, 'getRepositoryReport');
        }
      },
    }),

    importRepositoryReport: tool({
      description: `Import a report from HaloPSA's Repository into your local instance.

This creates a copy of the pre-built report that you can use in dashboards.
Repository reports have tested SQL that works correctly.

Use this instead of creating custom SQL reports for dashboard widgets.`,
      parameters: z.object({
        reportId: z.number().describe('The repository report ID to import'),
        name: z.string().optional().describe('Override the report name (optional)'),
        isShared: z.boolean().optional().default(true).describe('Make the report shared'),
      }),
      execute: async ({ reportId, name, isShared }) => {
        try {
          console.log(`[Tool:importRepositoryReport] Importing repository report ${reportId}`);

          const imported = await repository.importReport(reportId, ctx.reports, {
            name,
            isShared: isShared ?? true,
          });

          return {
            success: true,
            reportId: imported.id,
            name: imported.name,
            message: `Successfully imported repository report as local report ID ${imported.id}`,
          };
        } catch (error) {
          return formatError(error, 'importRepositoryReport');
        }
      },
    }),

    getRepositoryCategories: tool({
      description: `Get the list of report categories available in HaloPSA's Repository.

Use this to browse reports by category.`,
      parameters: z.object({}),
      execute: async () => {
        try {
          console.log(`[Tool:getRepositoryCategories] Getting repository categories`);

          const categories = await repository.getCategories();

          return {
            success: true,
            count: categories.length,
            categories,
          };
        } catch (error) {
          return formatError(error, 'getRepositoryCategories');
        }
      },
    }),

    findAndImportReport: tool({
      description: `Search for a report in the repository and import the best match.

This is a convenience tool that combines search + import in one step.
Useful when you need a report for a specific purpose like "tickets by priority".`,
      parameters: z.object({
        keywords: z.array(z.string()).describe('Keywords to search for (e.g., ["priority", "tickets by priority"])'),
        namePrefix: z.string().optional().describe('Prefix for the imported report name'),
        isShared: z.boolean().optional().default(true).describe('Make the report shared'),
      }),
      execute: async ({ keywords, namePrefix, isShared }) => {
        try {
          console.log(`[Tool:findAndImportReport] Finding and importing report for: ${keywords.join(', ')}`);

          const imported = await repository.findAndImport(keywords, ctx.reports, {
            chartonly: true,
            namePrefix,
            isShared: isShared ?? true,
          });

          if (!imported) {
            return {
              success: false,
              error: `No matching report found in repository for keywords: ${keywords.join(', ')}`,
              suggestion: 'Try different keywords or use listRepositoryReports to see available reports.',
            };
          }

          return {
            success: true,
            reportId: imported.id,
            name: imported.name,
            message: `Found and imported repository report as local report ID ${imported.id}`,
          };
        } catch (error) {
          return formatError(error, 'findAndImportReport');
        }
      },
    }),
  };
}

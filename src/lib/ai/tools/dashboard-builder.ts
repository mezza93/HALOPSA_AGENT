/**
 * Smart Dashboard Builder AI tools for HaloPSA.
 * Provides intelligent dashboard creation with automatic report discovery and widget configuration.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import { DashboardBuilderService, DASHBOARD_LAYOUTS, WIDGET_TEMPLATES } from '@/lib/halopsa/services/dashboard-builder';
import { formatError } from './utils';

export function createDashboardBuilderTools(ctx: HaloContext) {
  // Create the dashboard builder service
  const builder = new DashboardBuilderService(ctx.reports, ctx.reports.dashboards);

  return {
    smartBuildDashboard: tool({
      description: `Intelligently build a complete dashboard with automatic report discovery and creation.

This tool will:
1. Search for existing reports that match widget requirements
2. Create new reports if matching ones don't exist
3. Properly configure all widget types (charts, counters, lists)
4. Position widgets in a clean grid layout

Use this instead of manually adding widgets when building a new dashboard.

Available layouts:
- service_desk: Open tickets, unassigned, SLA hold, closed today, priority chart, agent workload, client breakdown
- management: Priority, status, agent workload, SLA performance, tickets over time
- sla_focused: SLA metrics, response times, priority breakdown
- client_focused: Client breakdown, top callers, categories
- minimal: Just the essentials (open, unassigned, priority, workload)`,
      parameters: z.object({
        name: z.string().describe('Name for the new dashboard'),
        layout: z.enum(['service_desk', 'management', 'sla_focused', 'client_focused', 'minimal'])
          .describe('Pre-defined layout to use'),
        description: z.string().optional().describe('Optional description for the dashboard'),
      }),
      execute: async ({ name, layout, description }) => {
        try {
          console.log(`[Tool:smartBuildDashboard] Building dashboard '${name}' with layout '${layout}'`);
          const result = await builder.buildDashboard(name, layout, description || '');
          return result;
        } catch (error) {
          return formatError(error, 'smartBuildDashboard');
        }
      },
    }),

    smartBuildCustomDashboard: tool({
      description: `Build a custom dashboard with specific widgets.

Provide a list of widget template names to include. The builder will
automatically find or create the necessary reports for each widget.

Available widget templates:
- Counters: open_tickets_counter, unassigned_counter, closed_tickets_counter, sla_hold_counter
- Charts: tickets_by_priority, tickets_by_status, tickets_by_client, tickets_by_category,
          agent_workload, tickets_closed_by_agent, tickets_over_time, sla_performance, top_callers
- Report counters: response_time_avg`,
      parameters: z.object({
        name: z.string().describe('Name for the new dashboard'),
        widgets: z.array(z.string()).describe('List of widget template names'),
        description: z.string().optional().describe('Optional description for the dashboard'),
      }),
      execute: async ({ name, widgets, description }) => {
        try {
          console.log(`[Tool:smartBuildCustomDashboard] Building custom dashboard '${name}' with ${widgets.length} widgets`);

          // Validate widget names
          const validWidgets: string[] = [];
          const invalidWidgets: string[] = [];

          for (const widget of widgets) {
            if (WIDGET_TEMPLATES[widget]) {
              validWidgets.push(widget);
            } else {
              invalidWidgets.push(widget);
            }
          }

          if (validWidgets.length === 0) {
            return {
              success: false,
              error: 'No valid widget templates provided',
              invalidWidgets,
              availableWidgets: Object.keys(WIDGET_TEMPLATES),
            };
          }

          const result = await builder.buildDashboard(name, validWidgets, description || '');

          if (invalidWidgets.length > 0) {
            result.errors = result.errors || [];
            result.errors.push(`Invalid widget templates ignored: ${invalidWidgets.join(', ')}`);
          }

          return result;
        } catch (error) {
          return formatError(error, 'smartBuildCustomDashboard');
        }
      },
    }),

    suggestDashboardWidgets: tool({
      description: `Suggest widgets based on a natural language description of what the dashboard should show.

Useful when the user describes what they want to see but doesn't know the specific widget names.
Returns a list of recommended widget template names that can be used with smartBuildCustomDashboard.`,
      parameters: z.object({
        description: z.string().describe('Natural language description of the desired dashboard'),
      }),
      execute: async ({ description }) => {
        try {
          console.log(`[Tool:suggestDashboardWidgets] Analyzing description: ${description}`);
          const suggestions = builder.suggestWidgetsForDescription(description);

          return {
            success: true,
            suggestions,
            suggestedWidgets: suggestions.map(name => ({
              templateName: name,
              displayName: WIDGET_TEMPLATES[name]?.name || name,
              description: WIDGET_TEMPLATES[name]?.description || '',
              type: WIDGET_TEMPLATES[name] && [0, 1, 2].includes(WIDGET_TEMPLATES[name].widgetType) ? 'chart' : 'counter',
            })),
            message: `Found ${suggestions.length} matching widgets. Use smartBuildCustomDashboard to create a dashboard with these widgets.`,
          };
        } catch (error) {
          return formatError(error, 'suggestDashboardWidgets');
        }
      },
    }),

    listDashboardTemplates: tool({
      description: `List all available widget templates and dashboard layouts.

Use this to see what widgets and pre-built layouts are available for building dashboards.`,
      parameters: z.object({}),
      execute: async () => {
        try {
          const templates = builder.getAvailableTemplates();

          return {
            success: true,
            ...templates,
            message: `Available: ${Object.keys(templates.widgetTemplates).length} widget templates, ${Object.keys(templates.dashboardLayouts).length} pre-built layouts`,
          };
        } catch (error) {
          return formatError(error, 'listDashboardTemplates');
        }
      },
    }),

    findReportForWidget: tool({
      description: `Search for an existing report that could be used for a dashboard widget.

Searches report names and descriptions for matches. Returns the best matching report if found.
Useful for checking if a report exists before creating a new one.`,
      parameters: z.object({
        keywords: z.array(z.string()).describe('Keywords to search for in report names/descriptions'),
      }),
      execute: async ({ keywords }) => {
        try {
          console.log(`[Tool:findReportForWidget] Searching for report with keywords: ${keywords.join(', ')}`);
          const report = await builder.findMatchingReport(keywords);

          if (report) {
            return {
              success: true,
              found: true,
              report: {
                id: report.id,
                name: report.name,
                description: report.description,
                category: report.category,
              },
              message: `Found matching report: ${report.name} (ID: ${report.id})`,
            };
          }

          return {
            success: true,
            found: false,
            message: 'No matching report found. A new report may need to be created.',
          };
        } catch (error) {
          return formatError(error, 'findReportForWidget');
        }
      },
    }),
  };
}

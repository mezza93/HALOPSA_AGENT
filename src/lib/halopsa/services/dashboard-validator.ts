/**
 * Dashboard and Report Validation Service.
 *
 * This service validates reports and dashboard widgets after creation,
 * detects SQL errors, and can auto-fix common issues.
 *
 * Based on HaloPSA database schema from NOSC_All_Columns and Tables.csv
 */

import { ReportService, DashboardService } from './reports';
import type { Report, Dashboard, ReportResult } from '../types/reports';

/**
 * Common SQL error patterns and their fixes.
 */
const SQL_ERROR_FIXES: Array<{
  pattern: RegExp;
  description: string;
  fix: (sql: string, match: RegExpMatchArray) => string;
}> = [
  {
    // Invalid object name 'Client' - should be AREA or Request_View.[Customer Name]
    pattern: /Invalid object name 'Client'/i,
    description: "Replace 'Client' table with 'AREA' table",
    fix: (sql: string) => {
      return sql
        .replace(/FROM\s+Client\s+/gi, 'FROM AREA ')
        .replace(/JOIN\s+Client\s+/gi, 'JOIN AREA ')
        .replace(/Client\.name/gi, 'AREA.aareadesc')
        .replace(/Client\.id/gi, 'AREA.Aarea')
        .replace(/c\.name/gi, 'a.aareadesc')
        .replace(/c\.id/gi, 'a.Aarea')
        .replace(/\[Client\]/g, '[Customer Name]')
        .replace(/f\.client_id/gi, 'f.Areaint')
        .replace(/client_id/gi, 'Areaint');
    },
  },
  {
    // Invalid column name 'Priority' table reference
    pattern: /Invalid object name 'PRIORITY'/i,
    description: "Replace 'PRIORITY' table with 'POLICY' table for priority lookup",
    fix: (sql: string) => {
      return sql
        .replace(/FROM\s+PRIORITY\s+/gi, 'FROM POLICY ')
        .replace(/JOIN\s+PRIORITY\s+/gi, 'JOIN POLICY ')
        .replace(/PRIORITY\.Pdesc/gi, 'POLICY.Pdesc')
        .replace(/PRIORITY\.Plevel/gi, 'POLICY.Ppolicy')
        .replace(/p\.Pdesc/gi, 'p.Pdesc')
        .replace(/p\.Plevel/gi, 'p.Ppolicy')
        .replace(/f\.Priority\s*=/gi, 'f.seriousness =');
    },
  },
  {
    // ORDER BY clause is invalid in views, subqueries
    pattern: /ORDER BY clause is invalid/i,
    description: 'Remove ORDER BY or add TOP clause',
    fix: (sql: string) => {
      // If there's ORDER BY without TOP, add TOP 1000
      if (!sql.match(/SELECT\s+TOP\s+/i) && sql.match(/ORDER\s+BY/i)) {
        sql = sql.replace(/SELECT\s+/i, 'SELECT TOP 1000 ');
      }
      // Remove ORDER BY from subqueries (inside parentheses)
      sql = sql.replace(/\(\s*SELECT[^)]*ORDER\s+BY[^)]*\)/gi, (match) => {
        return match.replace(/ORDER\s+BY\s+[^)]+/i, '');
      });
      return sql;
    },
  },
  {
    // Invalid column name 'statustype_id' or similar
    pattern: /Invalid column name 'statustype_id'/i,
    description: 'Use TSTATUS.TstatusType via JOIN instead of statustype_id',
    fix: (sql: string) => {
      // Replace statustype_id with proper JOIN to TSTATUS
      if (!sql.match(/JOIN\s+TSTATUS/i)) {
        sql = sql.replace(
          /FROM\s+FAULTS\s+f/i,
          'FROM FAULTS f JOIN TSTATUS t ON f.Status = t.Tstatus'
        );
      }
      sql = sql.replace(/f\.statustype_id/gi, 't.TstatusType');
      sql = sql.replace(/statustype_id/gi, 't.TstatusType');
      return sql;
    },
  },
  {
    // Invalid column name 'slahold' or 'slabreach'
    pattern: /Invalid column name '(slahold|slabreach)'/i,
    description: 'Use slastate and slaresponsestate columns instead',
    fix: (sql: string) => {
      // Replace slahold/slabreach with proper SLA columns
      sql = sql.replace(/f\.slahold\s*=\s*1/gi, "f.FSLAonhold = 1");
      sql = sql.replace(/f\.slabreach\s*=\s*1/gi, "f.slastate = 'O'");
      sql = sql.replace(/slahold/gi, 'FSLAonhold');
      sql = sql.replace(/slabreach/gi, 'slastate');
      return sql;
    },
  },
  {
    // Invalid column name 'dateoccurred' (wrong spelling)
    pattern: /Invalid column name 'dateoccurred'/i,
    description: "Correct spelling to 'dateoccured' (HaloPSA uses this spelling)",
    fix: (sql: string) => {
      return sql.replace(/dateoccurred/gi, 'dateoccured');
    },
  },
  {
    // Invalid column name in Request_View
    pattern: /Invalid column name '(\w+)'/i,
    description: 'Check column name in Request_View',
    fix: (sql: string, match: RegExpMatchArray) => {
      const columnName = match[1];
      const columnFixes: Record<string, string> = {
        'Priority_Description': '[Priority Description]',
        'Status_ID': '[Status ID]',
        'Customer_Name': '[Customer Name]',
        'Date_Logged': '[Date Logged]',
        'SLA_Compliance': '[SLA Compliance]',
        'Response_Time': '[Response Time]',
        'Response_Date': '[Response Date]',
      };
      if (columnFixes[columnName]) {
        return sql.replace(new RegExp(columnName, 'gi'), columnFixes[columnName]);
      }
      return sql;
    },
  },
];

/**
 * Working SQL templates based on actual HaloPSA schema.
 * These are tested and validated against the NOSC database.
 */
export const VALIDATED_SQL_TEMPLATES = {
  tickets_by_priority: `SELECT TOP 100
    COALESCE(p.Pdesc, 'No Priority') AS [Priority],
    COUNT(*) AS [Count]
FROM FAULTS f
LEFT JOIN POLICY p ON f.seriousness = p.Ppolicy
JOIN TSTATUS t ON f.Status = t.Tstatus
WHERE t.TstatusType = 1
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY p.Pdesc`,

  tickets_by_status: `SELECT TOP 100
    t.tstatusdesc AS [Status],
    COUNT(*) AS [Count]
FROM FAULTS f
JOIN TSTATUS t ON f.Status = t.Tstatus
WHERE f.dateoccured >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY t.tstatusdesc`,

  tickets_by_client: `SELECT TOP 10
    COALESCE(a.aareadesc, 'No Client') AS [Client],
    COUNT(*) AS [Count]
FROM FAULTS f
LEFT JOIN AREA a ON f.Areaint = a.Aarea
WHERE f.dateoccured >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY a.aareadesc`,

  tickets_by_category: `SELECT TOP 100
    COALESCE(f.category2, 'Uncategorized') AS [Category],
    COUNT(*) AS [Count]
FROM FAULTS f
WHERE f.dateoccured >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY f.category2`,

  agent_workload: `SELECT TOP 20
    COALESCE(u.uname, 'Unassigned') AS [Agent],
    COUNT(*) AS [Open Tickets]
FROM FAULTS f
LEFT JOIN UNAME u ON f.Assignedtoint = u.Unum
JOIN TSTATUS t ON f.Status = t.Tstatus
WHERE t.TstatusType = 1
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY u.uname`,

  tickets_closed_by_agent: `SELECT TOP 10
    COALESCE(u.uname, 'Unknown') AS [Agent],
    COUNT(*) AS [Closed Tickets]
FROM FAULTS f
JOIN UNAME u ON f.Clearwhoint = u.Unum
WHERE f.datecleared >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY u.uname`,

  tickets_over_time: `SELECT TOP 30
    CONVERT(varchar, f.dateoccured, 23) AS [Date],
    COUNT(*) AS [Ticket Count]
FROM FAULTS f
WHERE f.dateoccured >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY CONVERT(varchar, f.dateoccured, 23)`,

  sla_performance: `SELECT TOP 10
    CASE
        WHEN f.slaresponsestate = 'I' AND f.slastate = 'I' THEN 'Fully Met'
        WHEN f.slaresponsestate = 'O' OR f.slastate = 'O' THEN 'Missed'
        WHEN f.FSLAonhold = 1 THEN 'On Hold'
        ELSE 'Pending'
    END AS [SLA Status],
    COUNT(*) AS [Count]
FROM FAULTS f
JOIN TSTATUS t ON f.Status = t.Tstatus
WHERE t.TstatusType = 1
    AND f.FexcludefromSLA = 0
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY
    CASE
        WHEN f.slaresponsestate = 'I' AND f.slastate = 'I' THEN 'Fully Met'
        WHEN f.slaresponsestate = 'O' OR f.slastate = 'O' THEN 'Missed'
        WHEN f.FSLAonhold = 1 THEN 'On Hold'
        ELSE 'Pending'
    END`,

  response_time_avg: `SELECT TOP 1
    ROUND(ISNULL(AVG(f.FResponseTime), 0), 2) AS [Avg Response Hours]
FROM FAULTS f
WHERE f.FResponseDate IS NOT NULL
    AND f.dateoccured >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid`,

  top_callers: `SELECT TOP 10
    COALESCE(f.Username, 'Unknown') AS [Caller],
    COUNT(*) AS [Ticket Count]
FROM FAULTS f
WHERE f.dateoccured >= DATEADD(day, -30, GETDATE())
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY f.Username`,

  // Alternative versions using Request_View
  tickets_by_priority_view: `SELECT TOP 100
    COALESCE([Priority Description], 'No Priority') AS [Priority],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Status ID] NOT IN (
    SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3)
)
GROUP BY [Priority Description]`,

  tickets_by_status_view: `SELECT TOP 100
    [Status] AS [Status],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -30, GETDATE())
GROUP BY [Status]`,

  tickets_by_client_view: `SELECT TOP 10
    COALESCE([Customer Name], 'No Client') AS [Client],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -30, GETDATE())
GROUP BY [Customer Name]`,
};

/**
 * Validation result for a report.
 */
interface ReportValidationResult {
  valid: boolean;
  reportId: number;
  reportName: string;
  error?: string;
  errorType?: string;
  suggestedFix?: string;
  fixedSql?: string;
  executed?: boolean;
  rowCount?: number;
}

/**
 * Validation result for a dashboard.
 */
interface DashboardValidationResult {
  valid: boolean;
  dashboardId: number;
  dashboardName: string;
  widgetResults: Array<{
    widgetTitle: string;
    valid: boolean;
    error?: string;
    fixed?: boolean;
  }>;
  reportsValidated: number;
  reportsFailed: number;
  reportsFixed: number;
}

/**
 * Dashboard validation service.
 */
export class DashboardValidatorService {
  private reportService: ReportService;
  private dashboardService: DashboardService;

  constructor(reportService: ReportService, dashboardService: DashboardService) {
    this.reportService = reportService;
    this.dashboardService = dashboardService;
  }

  /**
   * Validate a report by attempting to run it.
   */
  async validateReport(reportId: number): Promise<ReportValidationResult> {
    try {
      const report = await this.reportService.get(reportId);

      try {
        // Try to run the report
        const result = await this.reportService.run(reportId, {});

        return {
          valid: true,
          reportId,
          reportName: report.name,
          executed: true,
          rowCount: result.rowCount,
        };
      } catch (runError) {
        const errorMessage = runError instanceof Error ? runError.message : String(runError);

        // Try to identify the error and suggest a fix
        const fixResult = this.analyzeAndFixSql(report.sqlQuery || '', errorMessage);

        return {
          valid: false,
          reportId,
          reportName: report.name,
          error: errorMessage,
          errorType: fixResult.errorType,
          suggestedFix: fixResult.description,
          fixedSql: fixResult.fixedSql ?? undefined,
          executed: false,
        };
      }
    } catch (error) {
      return {
        valid: false,
        reportId,
        reportName: `Report ${reportId}`,
        error: error instanceof Error ? error.message : String(error),
        executed: false,
      };
    }
  }

  /**
   * Analyze SQL error and attempt to fix it.
   */
  analyzeAndFixSql(sql: string, errorMessage: string): {
    errorType: string;
    description: string;
    fixedSql: string | null;
    canFix: boolean;
  } {
    for (const errorFix of SQL_ERROR_FIXES) {
      const match = errorMessage.match(errorFix.pattern);
      if (match) {
        try {
          const fixedSql = errorFix.fix(sql, match);
          return {
            errorType: errorFix.pattern.source,
            description: errorFix.description,
            fixedSql: fixedSql !== sql ? fixedSql : null,
            canFix: fixedSql !== sql,
          };
        } catch {
          // Fix failed, continue to next pattern
        }
      }
    }

    return {
      errorType: 'unknown',
      description: 'Unable to automatically fix this error',
      fixedSql: null,
      canFix: false,
    };
  }

  /**
   * Fix a report by updating its SQL.
   */
  async fixReport(reportId: number, newSql: string): Promise<boolean> {
    try {
      await this.reportService.update([{
        id: reportId,
        sql: newSql,
      } as Partial<Report>]);
      return true;
    } catch (error) {
      console.error(`Failed to fix report ${reportId}:`, error);
      return false;
    }
  }

  /**
   * Validate and auto-fix a report.
   * Returns true if the report is valid (either originally or after fix).
   */
  async validateAndFixReport(reportId: number, maxAttempts = 3): Promise<ReportValidationResult> {
    let attempts = 0;
    let currentReportId = reportId;
    let lastResult: ReportValidationResult | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      const result = await this.validateReport(currentReportId);

      if (result.valid) {
        return result;
      }

      lastResult = result;

      // Try to fix the report
      if (result.fixedSql) {
        console.log(`[Validator] Attempting to fix report ${currentReportId} (attempt ${attempts})`);
        const fixed = await this.fixReport(currentReportId, result.fixedSql);

        if (!fixed) {
          console.warn(`[Validator] Could not update report ${currentReportId}`);
          break;
        }

        // Continue loop to re-validate
        continue;
      }

      // No fix available
      break;
    }

    return lastResult || {
      valid: false,
      reportId,
      reportName: `Report ${reportId}`,
      error: 'Validation failed after maximum attempts',
      executed: false,
    };
  }

  /**
   * Validate a dashboard and all its widget reports.
   */
  async validateDashboard(dashboardId: number, autoFix = true): Promise<DashboardValidationResult> {
    const dashboard = await this.dashboardService.get(dashboardId);
    const widgetResults: DashboardValidationResult['widgetResults'] = [];
    let reportsValidated = 0;
    let reportsFailed = 0;
    let reportsFixed = 0;

    for (const widget of dashboard.widgets || []) {
      // Only validate report-based widgets
      if (widget.reportId && widget.reportId > 0) {
        reportsValidated++;

        const result = autoFix
          ? await this.validateAndFixReport(widget.reportId)
          : await this.validateReport(widget.reportId);

        if (result.valid) {
          widgetResults.push({
            widgetTitle: widget.name || `Widget ${widget.id}`,
            valid: true,
            fixed: result.fixedSql !== undefined,
          });

          if (result.fixedSql) {
            reportsFixed++;
          }
        } else {
          reportsFailed++;
          widgetResults.push({
            widgetTitle: widget.name || `Widget ${widget.id}`,
            valid: false,
            error: result.error,
          });
        }
      } else {
        // Filter-based widget - assume valid
        widgetResults.push({
          widgetTitle: widget.name || `Widget ${widget.id}`,
          valid: true,
        });
      }
    }

    return {
      valid: reportsFailed === 0,
      dashboardId,
      dashboardName: dashboard.name,
      widgetResults,
      reportsValidated,
      reportsFailed,
      reportsFixed,
    };
  }

  /**
   * Create a validated report with tested SQL.
   * If the initial SQL fails, falls back to validated templates.
   */
  async createValidatedReport(
    name: string,
    sqlQuery: string,
    templateKey?: keyof typeof VALIDATED_SQL_TEMPLATES,
    chartConfig?: {
      chartType?: number;
      xAxis?: string;
      yAxis?: string;
    }
  ): Promise<{ report: Report | null; validated: boolean; usedFallback: boolean }> {
    // First, try the provided SQL
    try {
      const reportOptions: Parameters<typeof this.reportService.createCustomReport>[0] = {
        name,
        sqlQuery: sqlQuery.trim(),
        description: 'Auto-created for dashboard widget',
        category: 'Dashboard',
        isShared: true,
      };

      // Add chart configuration if provided
      if (chartConfig?.chartType !== undefined) {
        reportOptions.chartType = chartConfig.chartType;
        reportOptions.xAxis = chartConfig.xAxis;
        reportOptions.yAxis = chartConfig.yAxis;
        reportOptions.chartTitle = name;
        reportOptions.count = false; // SQL already has COUNT(*)
        reportOptions.showGraphValues = true;
      }

      const report = await this.reportService.createCustomReport(reportOptions);

      // Validate by running
      const validation = await this.validateReport(report.id);

      if (validation.valid) {
        return { report, validated: true, usedFallback: false };
      }

      // Try to fix
      if (validation.fixedSql) {
        await this.fixReport(report.id, validation.fixedSql);
        const revalidation = await this.validateReport(report.id);
        if (revalidation.valid) {
          return { report, validated: true, usedFallback: false };
        }
      }

      // Delete failed report and try fallback
      await this.reportService.delete(report.id);
    } catch (error) {
      console.warn(`[Validator] Initial SQL failed: ${error}`);
    }

    // Try fallback template if available
    if (templateKey && VALIDATED_SQL_TEMPLATES[templateKey]) {
      try {
        const fallbackSql = VALIDATED_SQL_TEMPLATES[templateKey];
        const report = await this.reportService.createCustomReport({
          name,
          sqlQuery: fallbackSql,
          description: 'Auto-created for dashboard widget (using validated template)',
          category: 'Dashboard',
          isShared: true,
        });

        const validation = await this.validateReport(report.id);

        if (validation.valid) {
          console.log(`[Validator] Used validated fallback template for ${name}`);
          return { report, validated: true, usedFallback: true };
        }

        // Still failed - delete and give up
        await this.reportService.delete(report.id);
      } catch (fallbackError) {
        console.error(`[Validator] Fallback template also failed: ${fallbackError}`);
      }
    }

    return { report: null, validated: false, usedFallback: false };
  }

  /**
   * Get the validated SQL template for a widget type.
   */
  getValidatedSql(templateKey: keyof typeof VALIDATED_SQL_TEMPLATES): string | null {
    return VALIDATED_SQL_TEMPLATES[templateKey] || null;
  }

  /**
   * List all available validated SQL templates.
   */
  listValidatedTemplates(): string[] {
    return Object.keys(VALIDATED_SQL_TEMPLATES);
  }
}

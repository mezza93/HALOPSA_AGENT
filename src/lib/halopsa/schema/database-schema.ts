/**
 * HaloPSA Database Schema Reference
 *
 * This file provides schema information for generating SQL queries.
 * The schema is based on NOSC (HaloPSA cloud) database structure.
 */

/**
 * Key tables and views available in HaloPSA database.
 */
export const HALOPSA_SCHEMA = {
  /**
   * Request_View - Pre-joined view with all ticket data (RECOMMENDED for reports)
   * Column names contain spaces and must be quoted with [ ]
   */
  Request_View: {
    description: 'Pre-joined view combining tickets with related data. Best for dashboard reports.',
    columns: {
      '[Ticket Number]': 'int - Primary key for tickets',
      '[Customer Number]': 'int - FK to site/customer',
      '[Customer Name]': 'nvarchar - Customer/site name',
      '[Ticket Type]': 'nvarchar - Type of request',
      '[Ticket Summary]': 'nvarchar - Ticket summary/title',
      '[Ticket Details]': 'ntext - Full ticket description',
      '[Category]': 'nvarchar - Ticket category',
      '[User]': 'nvarchar - Reporting user name',
      '[Priority]': 'smallint - Priority ID',
      '[Priority Description]': 'nvarchar - Priority name',
      '[Date Logged]': 'datetime - When ticket was created',
      '[Time Taken]': 'float - Total time spent',
      '[SLA Hold Time]': 'float - Time on SLA hold',
      '[SLA Compliance]': 'nvarchar - SLA status (Met/Breached/etc)',
      '[Target Response Date]': 'datetime - SLA response target',
      '[Response Date]': 'datetime - Actual response date',
      '[Target Resolution Date]': 'datetime - SLA resolution target',
      '[Date Closed]': 'datetime - When ticket was closed',
      '[Response Time]': 'float - Response time in hours',
      '[Resolution Time]': 'float - Resolution time in hours',
      '[Status ID]': 'smallint - FK to TSTATUS',
      '[Status]': 'nvarchar - Status name',
      '[Site]': 'nvarchar - Site name',
      '[Request Type ID]': 'int - FK to REQUESTTYPE',
    },
    sampleQueries: {
      ticketsByPriority: `SELECT TOP 100
    COALESCE([Priority Description], 'No Priority') AS [Priority],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Status ID] NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))
GROUP BY [Priority Description]`,
      ticketsByClient: `SELECT TOP 10
    COALESCE([Customer Name], 'No Client') AS [Client],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -30, GETDATE())
GROUP BY [Customer Name]`,
    },
  },

  /**
   * FAULTS - Base tickets table
   */
  FAULTS: {
    description: 'Main tickets/requests table',
    columns: {
      'Faultid': 'int - Primary key',
      'username': 'nvarchar - User who reported',
      'Symptom': 'nvarchar - Ticket summary',
      'Status': 'smallint - FK to TSTATUS.Tstatus',
      'seriousness': 'smallint - Priority level',
      'sitenumber': 'int - FK to SITE.Ssitenum',
      'dateoccured': 'datetime - When issue occurred',
      'datereported': 'datetime - When reported',
      'datecreated': 'datetime - When ticket created',
      'datecleared': 'datetime - When closed',
      'Assignedtoint': 'smallint - FK to UNAME.Unum (assigned agent)',
      'Clearwhoint': 'smallint - FK to UNAME.Unum (agent who closed)',
      'FSLAonhold': 'bit - Whether SLA is on hold',
      'FResponseDate': 'datetime - First response date',
      'Requesttype': 'int - FK to REQUESTTYPE',
      'Areaint': 'int - FK to ticket area',
    },
  },

  /**
   * SITE - Customers/clients table
   */
  SITE: {
    description: 'Customers/clients/sites table',
    columns: {
      'Ssitenum': 'int - Primary key',
      'sdesc': 'nvarchar - Site/customer name',
      'Sslaid': 'int - FK to SLA',
      'SIsInactive': 'bit - Whether site is inactive',
    },
  },

  /**
   * UNAME - Agents/technicians table
   */
  UNAME: {
    description: 'Agents/technicians/users table',
    columns: {
      'Unum': 'int - Primary key',
      'uname': 'nvarchar - Agent name',
      'Uisdisabled': 'bit - Whether agent is disabled',
      'Udontassign': 'bit - Whether agent should not receive assignments',
    },
  },

  /**
   * TSTATUS - Ticket status lookup
   */
  TSTATUS: {
    description: 'Ticket status lookup table',
    columns: {
      'Tstatus': 'smallint - Primary key',
      'tstatusdesc': 'nvarchar - Status name',
      'TstatusType': 'int - Status type (1=open, 2=closed, 3=deleted)',
    },
    notes: 'TstatusType values: 1 = Open/Active, 2 = Closed, 3 = Deleted',
  },

  /**
   * USERS - End users (people who submit tickets)
   */
  USERS: {
    description: 'End users who submit tickets',
    columns: {
      'Uid': 'int - Primary key',
      'uname': 'nvarchar - User display name',
      'uemail': 'nvarchar - Email address',
      'usitefk': 'int - FK to SITE.Ssitenum',
    },
  },

  /**
   * REQUESTTYPE - Ticket types
   */
  REQUESTTYPE: {
    description: 'Ticket/request types',
    columns: {
      'RTid': 'int - Primary key',
      'RTname': 'nvarchar - Type name',
    },
  },

  /**
   * ACTIONS - Ticket actions/notes
   */
  ACTIONS: {
    description: 'Actions/notes on tickets',
    columns: {
      'Faultid': 'int - FK to FAULTS.Faultid',
      'Aaction': 'ntext - Action text',
      'Adate': 'datetime - Action date',
      'Awho': 'smallint - FK to UNAME.Unum',
      'Atimetaken': 'float - Time spent in hours',
    },
  },
};

/**
 * SQL Server syntax notes for HaloPSA queries
 */
export const SQL_SYNTAX_NOTES = {
  columnQuoting: 'Column names with spaces must be quoted with [ ] brackets',
  orderByRestriction: 'ORDER BY requires TOP, OFFSET, or FOR XML in subqueries and views',
  dateFunction: 'Use GETDATE() for current date/time',
  dateArithmetic: 'Use DATEADD(day, -30, GETDATE()) for date calculations',
  nullHandling: 'Use COALESCE(column, "default") for null handling',
  topClause: 'Always use TOP n to limit results and satisfy ORDER BY requirements',
};

/**
 * Common query patterns for dashboard widgets
 */
export const QUERY_PATTERNS = {
  countByField: (viewName: string, groupField: string, filterCondition?: string) => `
SELECT TOP 100
    COALESCE(${groupField}, 'Unknown') AS [Label],
    COUNT(*) AS [Count]
FROM ${viewName}
${filterCondition ? `WHERE ${filterCondition}` : ''}
GROUP BY ${groupField}`,

  openTicketsCount: `
SELECT COUNT(*) AS [Count]
FROM FAULTS f
WHERE f.Status NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))`,

  ticketsInPeriod: (days: number) => `
SELECT TOP 100
    CONVERT(varchar, [Date Logged], 23) AS [Date],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -${days}, GETDATE())
GROUP BY CONVERT(varchar, [Date Logged], 23)`,
};

/**
 * Get schema as text for AI context
 */
export function getSchemaContext(): string {
  const lines: string[] = [
    '=== HaloPSA Database Schema Reference ===',
    '',
    'IMPORTANT SQL Server Rules:',
    '- Column names with spaces MUST be quoted with [ ] brackets',
    '- ORDER BY requires TOP clause in SELECT',
    '- Use GETDATE() for current date',
    '- Use DATEADD(day, -N, GETDATE()) for date ranges',
    '- Use COALESCE() for null handling',
    '',
    '=== RECOMMENDED: Use Request_View for reports ===',
    'This view has pre-joined data with readable column names.',
    '',
    'Key columns in Request_View:',
  ];

  for (const [col, desc] of Object.entries(HALOPSA_SCHEMA.Request_View.columns)) {
    lines.push(`  ${col}: ${desc}`);
  }

  lines.push('');
  lines.push('=== Base Tables ===');
  lines.push('');
  lines.push('FAULTS: Main tickets table');
  lines.push('  - Faultid (int): Primary key');
  lines.push('  - Status (smallint): FK to TSTATUS');
  lines.push('  - Assignedtoint (smallint): FK to UNAME (agent)');
  lines.push('  - sitenumber (int): FK to SITE (customer)');
  lines.push('');
  lines.push('SITE: Customers table');
  lines.push('  - Ssitenum (int): Primary key');
  lines.push('  - sdesc (nvarchar): Customer name');
  lines.push('');
  lines.push('UNAME: Agents/technicians table');
  lines.push('  - Unum (int): Primary key');
  lines.push('  - uname (nvarchar): Agent name');
  lines.push('');
  lines.push('TSTATUS: Status lookup');
  lines.push('  - Tstatus (smallint): Primary key');
  lines.push('  - tstatusdesc (nvarchar): Status name');
  lines.push('  - TstatusType (int): 1=Open, 2=Closed, 3=Deleted');
  lines.push('');
  lines.push('=== Example Queries ===');
  lines.push('');
  lines.push('Tickets by Priority:');
  lines.push(HALOPSA_SCHEMA.Request_View.sampleQueries.ticketsByPriority);
  lines.push('');
  lines.push('Tickets by Client:');
  lines.push(HALOPSA_SCHEMA.Request_View.sampleQueries.ticketsByClient);

  return lines.join('\n');
}

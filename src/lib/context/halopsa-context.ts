/**
 * HaloPSA Context for AI Agent
 *
 * This module provides static HaloPSA documentation context
 * including database schema, SQL examples, variables, and reporting knowledge.
 */

/**
 * HaloPSA Database Schema Reference (NOSC Cloud)
 * CRITICAL: Use these exact table and column names for SQL queries.
 */
export const DATABASE_SCHEMA = `## HaloPSA Database Schema Reference

### CRITICAL SQL Server Rules
- Column names with spaces MUST be quoted with [ ] brackets
- ORDER BY requires TOP clause in SELECT statements
- Use GETDATE() for current date
- Use DATEADD(day, -N, GETDATE()) for date ranges
- Use COALESCE(column, 'default') for null handling
- NEVER use ORDER BY without TOP in the main SELECT

### RECOMMENDED: Use Request_View for Dashboard Reports
This view has pre-joined data with readable column names.

| Column Name | Type | Description |
|-------------|------|-------------|
| [Ticket Number] | int | Primary key |
| [Customer Number] | int | FK to customer/site |
| [Customer Name] | nvarchar | Customer name |
| [Ticket Type] | nvarchar | Type of request |
| [Ticket Summary] | nvarchar | Summary/title |
| [Category] | nvarchar | Ticket category |
| [User] | nvarchar | Reporting user |
| [Priority] | smallint | Priority ID |
| [Priority Description] | nvarchar | Priority name |
| [Date Logged] | datetime | Created date |
| [Date Closed] | datetime | Closed date |
| [Status ID] | smallint | Status ID |
| [Status] | nvarchar | Status name |
| [Site] | nvarchar | Site name |
| [SLA Compliance] | nvarchar | SLA status |
| [Response Time] | float | Response time hours |
| [Resolution Time] | float | Resolution time hours |

### Base Tables Reference

**FAULTS** - Main tickets table
- Faultid (int): Primary key
- Status (smallint): FK to TSTATUS.Tstatus
- seriousness (smallint): Priority level
- Assignedtoint (smallint): FK to UNAME.Unum (agent)
- Clearwhoint (smallint): Agent who closed
- sitenumber (int): FK to SITE.Ssitenum
- dateoccured (datetime): When issue occurred
- datecleared (datetime): When closed
- FSLAonhold (bit): SLA on hold

**SITE** - Customers/sites table
- Ssitenum (int): Primary key
- sdesc (nvarchar): Customer name

**UNAME** - Agents/technicians table
- Unum (int): Primary key
- uname (nvarchar): Agent name
- Uisdisabled (bit): Is disabled

**TSTATUS** - Status lookup table
- Tstatus (smallint): Primary key
- tstatusdesc (nvarchar): Status name
- TstatusType (int): 1=Open, 2=Closed, 3=Deleted

**USERS** - End users table
- Uid (int): Primary key
- uname (nvarchar): User name
- usitefk (int): FK to SITE

**ACTIONS** - Ticket actions/notes
- Faultid (int): FK to FAULTS
- Aaction (ntext): Action text
- Adate (datetime): Action date
- Awho (smallint): FK to UNAME
`;

/**
 * HaloPSA SQL Examples for custom reports and dashboards.
 * These examples use correct table/view names from NOSC schema.
 */
export const SQL_EXAMPLES = `## HaloPSA SQL Examples for Reports

### Tickets by Priority (using Request_View)
SELECT TOP 100
    COALESCE([Priority Description], 'No Priority') AS [Priority],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Status ID] NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))
GROUP BY [Priority Description]

### Tickets by Client (using Request_View)
SELECT TOP 10
    COALESCE([Customer Name], 'No Client') AS [Client],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -30, GETDATE())
GROUP BY [Customer Name]

### Agent Workload (using base tables)
SELECT TOP 20
    COALESCE(u.uname, 'Unassigned') AS [Agent],
    COUNT(*) AS [Open Tickets]
FROM FAULTS f
LEFT JOIN UNAME u ON f.Assignedtoint = u.Unum
WHERE f.Status NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))
GROUP BY u.uname

### Tickets Closed by Agent
SELECT TOP 10
    COALESCE(u.uname, 'Unknown') AS [Agent],
    COUNT(*) AS [Closed Tickets]
FROM FAULTS f
JOIN UNAME u ON f.Clearwhoint = u.Unum
WHERE f.datecleared >= DATEADD(day, -30, GETDATE())
GROUP BY u.uname

### Tickets by Status
SELECT TOP 100
    COALESCE([Status], 'Unknown') AS [Status],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -30, GETDATE())
GROUP BY [Status]

### Tickets Over Time (Daily)
SELECT TOP 30
    CONVERT(varchar, [Date Logged], 23) AS [Date],
    COUNT(*) AS [Ticket Count]
FROM Request_View
WHERE [Date Logged] >= DATEADD(day, -30, GETDATE())
GROUP BY CONVERT(varchar, [Date Logged], 23)

### SLA Performance
SELECT TOP 10
    COALESCE([SLA Compliance], 'Unknown') AS [SLA Status],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Status ID] NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))
GROUP BY [SLA Compliance]

### Agent Performance Report
SELECT TOP 50
    u.uname AS [Agent],
    (SELECT COUNT(*) FROM FAULTS WHERE Assignedtoint = u.Unum AND Status NOT IN
        (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))) AS [Open Tickets],
    (SELECT COUNT(*) FROM FAULTS WHERE Clearwhoint = u.Unum
        AND datecleared >= DATEADD(day, -30, GETDATE())) AS [Closed Last 30 Days]
FROM UNAME u
WHERE u.Uisdisabled = 0 AND u.Unum > 1

### Common Parameters
- @startdate - Report period start
- @enddate - Report period end
`;

/**
 * Common HaloPSA Variables for templates and automation.
 * Organized by category for easy reference.
 */
export const HALOPSA_VARIABLES = `## HaloPSA Template Variables

### Ticket Variables
- $FAULTID - Ticket ID
- $SYMPTOM - Ticket summary
- $SYMPTOM2 - Ticket details
- $STATUS - Current status
- $SERIOUSNESS2 - Priority description
- $REQUESTTYPE - Ticket type
- $SECTION - Team assigned
- $ASSIGNEDTO - Agent assigned
- $DATEREPORTED{} - Date reported (customizable format)
- $FIXBYDATE{} - Target fix date
- $RESPONDBYDATE{} - Target response date
- $TIMETAKEN - Total hours on ticket
- $ALLACTIONS - All public actions/notes
- $LASTACTION - Last agent action
- $CLEARANCE - Closure note

### Client Variables
- $AREA - Client name
- $CLIENT_ID - Client ID
- $SITE - Site name
- $ACCOUNTSEMAILADDRESS - Accounts email
- $PRIMARYAGENT - Primary agent

### User Variables
- $USERNAME - User name
- $FIRSTNAME - First name
- $LASTNAME - Surname
- $USEREMAILADDRESS - Email address
- $USERPHONENUMBER - Phone number

### Agent/Action Variables
- $ACTIONWHO - Who performed action
- $ACTIONNOTE - Action note text
- $ACTIONDATE - Action date/time
- $ACTIONTIMETAKEN - Time taken
- $SIGNATURE - Agent signature
- $GREETING - Time-based greeting

### Contract Variables
- $CONTRACTREF - Contract reference
- $CONTRACTSTARTDATE - Start date
- $CONTRACTENDDATE - End date
- $CONTRACTPERIODCHARGEAMOUNT - Period charge

### Invoice Variables
- $INVOICEID - Invoice ID
- $INVOICETOTAL - Total including tax
- $INVOICESUBTOTAL - Subtotal
- $DUEDATE - Due date
- $INVOICEPAIDSTATUS - Payment status

### SLA Variables
- $SLADESCRIPTION - SLA name
- $SLATIMELEFT - Time remaining
- $FIXBYDATE{} - Target fix date
- $RESPONDBYDATE{} - Target response date

### Links
- $LINKTOREQUESTUSER - User portal link
- $LINKTOREQUESTAGENT - Agent app link
- $CONFIRMCLOSURE - Closure confirmation link
- $PASSWORDRESETLINK - Password reset link
`;

/**
 * HaloPSA Dashboard and Reporting context.
 */
export const DASHBOARD_CONTEXT = `## HaloPSA Dashboard & Reporting

### Dashboard Widget Types
1. **Type 0** - Bar/Line Chart (requires report_id)
2. **Type 1** - Pie/Doughnut Chart (requires report_id)
3. **Type 2** - Counter from Report (requires report_id)
4. **Type 6** - List Widget (requires filter_id)
5. **Type 7** - Counter from Filter (requires filter_id + ticketarea_id)

### Smart Dashboard Layouts Available
- service_desk: Open tickets, unassigned, SLA hold, closed today, priority chart, agent workload
- management: Priority, status, agent workload, SLA performance, tickets over time
- sla_focused: SLA metrics, response times, priority breakdown
- client_focused: Client breakdown, top callers, categories
- minimal: Just the essentials (open, unassigned, priority, workload)

### Common Dashboard Metrics
- Open tickets by status/priority/team
- SLA compliance percentage
- Average response/resolution time
- Tickets opened vs closed trend
- Agent workload distribution
- Customer satisfaction scores
- Revenue and billable hours

### Report Types
1. **Standard Reports** - Pre-built reports
2. **Custom SQL Reports** - Write your own SQL (use Request_View)
3. **Scheduled Reports** - Auto-email reports
4. **Export Formats** - PDF, Excel, CSV

### Filtering Options
- Date range (@startdate, @enddate)
- Client/Site
- Agent/Team
- Ticket type/status/priority
- Category
`;

/**
 * HaloPSA API Reference - Comprehensive Endpoints
 * Source: HaloPSA OpenAPI Specification v2
 */
export const API_REFERENCE = `## HaloPSA API Endpoints Reference (OpenAPI v2)

### Ticket Operations
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Tickets | GET | List tickets | count, agent_id, client_id, status_id, priority_id, open_only, search, advanced_search |
| /Tickets | POST | Create ticket | (body: summary, details, client_id, tickettype_id, etc.) |
| /Tickets/{id} | GET | Get single ticket | includedetails, includediagramdetails |
| /Tickets/{id} | POST | Update ticket | (body with updated fields) |
| /Tickets/{id} | DELETE | Delete ticket | reason |

### Actions (Ticket Notes)
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Actions | GET | List actions | ticket_id, agent_only, count, startdate, enddate, excludeprivate |
| /Actions | POST | Add action | (body: ticket_id, note, outcome, timetaken, etc.) |
| /Actions/{id} | GET | Get single action | includedetails, includeemail |
| /Actions/{id} | DELETE | Delete action | |

### Clients & Sites
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Client | GET | List clients | count, search, activeinactive, domain, advanced_search |
| /Client | POST | Create client | (body: name, email, phone, etc.) |
| /Client/{id} | GET | Get client | includedetails, includeactivity |
| /Site | GET | List sites | client_id, count, activeinactive |
| /Site | POST | Create site | (body: client_id, name, address, etc.) |
| /Site/{id} | GET | Get site | includedetails |
| /Users | GET | List end-users | client_id, site_id, count, search |
| /Users | POST | Create user | (body: name, email, client_id, etc.) |
| /Users/{id} | GET | Get user | includedetails, includeusersassets |

### Agents & Teams
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Agent | GET | List agents | activeinactive, department_id, client_id, can_edit_only |
| /Agent | POST | Create/update agent | (body with agent details) |
| /Agent/{id} | GET | Get agent | includedetails, getholidayallowance |
| /Agent/me | GET | Get current agent | |
| /Team | GET | List teams | department_id, includeagentsforteams |
| /Team/{id} | GET | Get team | includeagents, includedetails |

### Assets
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Asset | GET | List assets | client_id, site_id, assettype_id, assetgroup_id, search, activeinactive |
| /Asset | POST | Create asset | (body: name, client_id, assettype_id, etc.) |
| /Asset/{id} | GET | Get asset | includedetails, includeactivity, includehierarchy |

### Contracts & Billing
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /ClientContract | GET | List contracts | client_id, count, includeinactive, excluderenewed |
| /ClientContract | POST | Create contract | (body: client_id, ref, startdate, enddate, etc.) |
| /ClientContract/{id} | GET | Get contract | includedetails, includeperiods |
| /Invoice | GET | List invoices | client_id, posted, count |
| /Invoice | POST | Create invoice | (body with invoice details) |
| /Invoice/{id} | GET | Get invoice | includedetails |

### Reports & Dashboards
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Report | GET | List reports | category, count, search |
| /Report | POST | Create report | (body: name, sql, category, isshared) |
| /Report/{id} | GET | Get report | includedetails |
| /Report/{id}/run | GET | Run report | startdate, enddate, client_id, agent_id |
| /DashboardLinks | GET | List dashboards | is_shared, count |
| /DashboardLinks/{id} | GET | Get dashboard | includewidgets |
| /DashboardLinks | POST | Create/update dashboard | (body with widgets array) |

### Knowledge Base
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /KBArticle | GET | List articles | category, search, count |
| /KBArticle | POST | Create article | (body: title, content, category, etc.) |
| /KBArticle/{id} | GET | Get article | includedetails |

### Configuration
| Endpoint | Method | Description | Key Parameters |
|----------|--------|-------------|----------------|
| /Status | GET | List ticket statuses | |
| /Priority | GET | List priorities | |
| /TicketType | GET | List ticket types | includedetails |
| /Category | GET | List categories | toplevel_id |
| /CustomField | GET | List custom fields | entity, type |
| /Workflow | GET | List workflows | type |
| /SLA | GET | List SLAs | |
| /EmailTemplate | GET | List email templates | |

### Additional Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /Appointment | GET/POST | Calendar appointments |
| /Opportunity | GET/POST | Sales opportunities |
| /Quote | GET/POST | Quotes/proposals |
| /Project | GET/POST | Projects |
| /Supplier | GET/POST | Suppliers |
| /Item | GET/POST | Inventory items |
| /TimeSheet | GET/POST | Timesheets |
| /Attachment | GET/POST | File attachments |

### Common Query Parameters (All Endpoints)
- count - Number of records (default: 50, max: 1000)
- page_no - Page number for pagination
- page_size - Records per page
- search - Text search
- order - Sort field name
- orderdesc - Sort descending (true/false)
- includedetails - Include full details
- advanced_search - Complex search JSON

### Ticket Filtering Parameters
- client_id - Filter by client ID
- site_id - Filter by site ID
- agent_id - Filter by assigned agent
- team - Filter by team name
- status_id - Filter by status ID
- priority_id - Filter by priority ID
- tickettype_id - Filter by ticket type
- category_1/2/3/4 - Filter by category levels
- open_only - Only open tickets (true/false)
- dateoccured_start - Created after date
- dateoccured_end - Created before date
- dateclosed_start - Closed after date
- dateclosed_end - Closed before date
- sla_status - SLA state (I=In, O=Out)
`;

/**
 * Get the full HaloPSA context for the AI agent.
 */
export function getHaloPSAContext(): string {
  return `
## HaloPSA Reference Documentation

${DATABASE_SCHEMA}

${SQL_EXAMPLES}

${HALOPSA_VARIABLES}

${DASHBOARD_CONTEXT}

${API_REFERENCE}

### Tips for Creating Reports and Dashboards
- ALWAYS use Request_View for simple dashboard reports - it has pre-joined data
- ALWAYS include TOP N clause when using GROUP BY to satisfy SQL Server requirements
- Use [square brackets] for column names with spaces
- For chart widgets, a valid report_id is required
- For counter widgets, you can use filter_id with ticketarea_id=1 (Tickets)
- Use smartBuildDashboard for automatic dashboard creation with pre-configured widgets
`;
}

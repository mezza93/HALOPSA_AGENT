/**
 * HaloPSA Context for AI Agent
 *
 * This module provides static HaloPSA documentation context
 * including SQL examples, variables, and reporting knowledge.
 */

/**
 * HaloPSA SQL Examples for custom reports and dashboards.
 * These examples show common patterns for querying HaloPSA database.
 */
export const SQL_EXAMPLES = `## HaloPSA SQL Examples for Reports

### Agent Performance Report
\`\`\`sql
SELECT uname AS [Agent]
  , (SELECT count(faultid) FROM faults WHERE status <> 9 AND assignedtoint = unum) AS 'Total_Open_Tickets'
  , (SELECT COUNT(faultid) FROM Faults WHERE takenby = uname AND dateoccured > @startdate AND dateoccured < @enddate) AS 'Tickets_Opened_Period'
  , (SELECT COUNT(faultid) FROM faults WHERE status = 9 AND clearwhoint = unum AND datecleared > @startdate AND datecleared < @enddate) AS 'Tickets_Closed_Period'
  , (SELECT count(faultid) FROM faults WHERE slastate = 'I' AND clearwhoint = unum AND datecleared > @startdate AND datecleared < @enddate AND status = 9) AS 'SLA_Met'
  , (SELECT count(faultid) FROM faults WHERE slastate = 'O' AND clearwhoint = unum AND datecleared > @startdate AND datecleared < @enddate AND status = 9) AS 'SLA_Missed'
FROM uname WHERE unum <> 1 AND uisdisabled = 0
\`\`\`

### Team Performance Report
\`\`\`sql
SELECT sdsectionname AS [Section]
  , (SELECT count(faultid) FROM faults WHERE SLAresponseState='I' AND sectio_=sdsectionname AND dateoccured>@startdate AND dateoccured<@enddate) AS [Response Met]
  , (SELECT count(faultid) FROM faults WHERE sectio_=sdsectionname AND datecleared>@startdate AND datecleared<@enddate) AS [Tickets Resolved]
  , round(isnull((SELECT avg(elapsedhrs) FROM faults WHERE sectio_=sdsectionname AND datecleared>@startdate AND datecleared<@enddate),0),2) AS [Avg Resolution Time (Hours)]
FROM sectiondetail WHERE sdforrequests=1
\`\`\`

### Ticket Status by Technician
\`\`\`sql
SELECT uname AS [Technician]
  , (SELECT count(faultid) FROM faults WHERE status=1 AND assignedtoint=unum) AS [OPEN]
  , (SELECT count(faultid) FROM faults WHERE status=9 AND clearwhoint=unum AND datecleared>@startdate) AS [CLOSED]
  , (SELECT count(faultid) FROM faults WHERE status<>9 AND assignedtoint=unum) AS [TOTAL]
FROM Uname WHERE uisdisabled != 'true'
\`\`\`

### Customer Satisfaction Report
\`\`\`sql
SELECT uname AS [Agent]
  , (SELECT count(fbid) FROM feedback WHERE fbscore IN (1) AND fbfaultid IN (SELECT faultid FROM faults WHERE assignedtoint=unum)) AS [Awesome]
  , (SELECT count(fbid) FROM feedback WHERE fbscore IN (2) AND fbfaultid IN (SELECT faults.faultid FROM faults WHERE assignedtoint=unum)) AS [Good]
  , (SELECT count(fbid) FROM feedback WHERE fbscore IN (3,4) AND fbfaultid IN (SELECT faultid FROM faults WHERE assignedtoint=unum)) AS [Bad]
FROM uname WHERE unum<>1
\`\`\`

### Contract/Invoice Revenue Report
\`\`\`sql
SELECT aareadesc AS [Customer]
  , format(IHInvoice_Date,'yyyy MMMM') AS [Date]
  , cast(IDNet_Amount AS money) AS [Revenue]
  , cast(IDNet_Amount-(IDUnit_Cost*IDQty_Order) AS money) AS [Profit]
FROM INVOICEHEADER
JOIN invoicedetail ON ihid=IdIHid
LEFT JOIN area ON IHaarea=Aarea
\`\`\`

### Key Database Tables
- \`faults\` - Tickets table (faultid = ticket ID)
- \`actions\` - Ticket actions/notes
- \`uname\` - Agents (unum = agent ID)
- \`area\` - Clients (aarea = client ID)
- \`feedback\` - Customer satisfaction scores
- \`sectiondetail\` - Teams
- \`requesttype\` - Ticket types
- \`tstatus\` - Ticket statuses
- \`contractheader\` - Contracts
- \`invoiceheader/invoicedetail\` - Invoices

### Common Parameters
- \`@startdate\` - Report period start
- \`@enddate\` - Report period end
`;

/**
 * Common HaloPSA Variables for templates and automation.
 * Organized by category for easy reference.
 */
export const HALOPSA_VARIABLES = `## HaloPSA Template Variables

### Ticket Variables
- \`$FAULTID\` - Ticket ID
- \`$SYMPTOM\` - Ticket summary
- \`$SYMPTOM2\` - Ticket details
- \`$STATUS\` - Current status
- \`$SERIOUSNESS2\` - Priority description
- \`$REQUESTTYPE\` - Ticket type
- \`$SECTION\` - Team assigned
- \`$ASSIGNEDTO\` - Agent assigned
- \`$DATEREPORTED{}\` - Date reported (customizable format)
- \`$FIXBYDATE{}\` - Target fix date
- \`$RESPONDBYDATE{}\` - Target response date
- \`$TIMETAKEN\` - Total hours on ticket
- \`$ALLACTIONS\` - All public actions/notes
- \`$LASTACTION\` - Last agent action
- \`$CLEARANCE\` - Closure note

### Client Variables
- \`$AREA\` - Client name
- \`$CLIENT_ID\` - Client ID
- \`$SITE\` - Site name
- \`$ACCOUNTSEMAILADDRESS\` - Accounts email
- \`$PRIMARYAGENT\` - Primary agent

### User Variables
- \`$USERNAME\` - User name
- \`$FIRSTNAME\` - First name
- \`$LASTNAME\` - Surname
- \`$USEREMAILADDRESS\` - Email address
- \`$USERPHONENUMBER\` - Phone number

### Agent/Action Variables
- \`$ACTIONWHO\` - Who performed action
- \`$ACTIONNOTE\` - Action note text
- \`$ACTIONDATE\` - Action date/time
- \`$ACTIONTIMETAKEN\` - Time taken
- \`$SIGNATURE\` - Agent signature
- \`$GREETING\` - Time-based greeting

### Contract Variables
- \`$CONTRACTREF\` - Contract reference
- \`$CONTRACTSTARTDATE\` - Start date
- \`$CONTRACTENDDATE\` - End date
- \`$CONTRACTPERIODCHARGEAMOUNT\` - Period charge

### Invoice Variables
- \`$INVOICEID\` - Invoice ID
- \`$INVOICETOTAL\` - Total including tax
- \`$INVOICESUBTOTAL\` - Subtotal
- \`$DUEDATE\` - Due date
- \`$INVOICEPAIDSTATUS\` - Payment status

### SLA Variables
- \`$SLADESCRIPTION\` - SLA name
- \`$SLATIMELEFT\` - Time remaining
- \`$FIXBYDATE{}\` - Target fix date
- \`$RESPONDBYDATE{}\` - Target response date

### Links
- \`$LINKTOREQUESTUSER\` - User portal link
- \`$LINKTOREQUESTAGENT\` - Agent app link
- \`$CONFIRMCLOSURE\` - Closure confirmation link
- \`$PASSWORDRESETLINK\` - Password reset link
`;

/**
 * HaloPSA Dashboard and Reporting context.
 */
export const DASHBOARD_CONTEXT = `## HaloPSA Dashboard & Reporting

### Dashboard Widget Types
1. **Chart Widgets** - Bar, line, pie, doughnut charts
2. **Stat Cards** - KPI numbers with trends
3. **Tables** - Data grids with filtering
4. **Gauges** - SLA compliance meters

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
2. **Custom SQL Reports** - Write your own SQL
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
 * HaloPSA API Reference - Key Endpoints
 */
export const API_REFERENCE = `## HaloPSA API Endpoints Reference

### Core Endpoints
| Endpoint | Methods | Description |
|----------|---------|-------------|
| /Tickets | GET, POST | List/search tickets, create tickets |
| /Tickets/{id} | GET, POST, DELETE | Get/update/delete specific ticket |
| /Actions | GET, POST | Ticket actions/notes |
| /Client | GET, POST | Client management |
| /Site | GET, POST | Site management |
| /Users | GET, POST | End-user management |
| /Agent | GET, POST | Agent management |
| /Team | GET | Team/department info |
| /Asset | GET, POST | Asset/device management |
| /Contract | GET, POST | Contract management |
| /Invoice | GET, POST | Invoice management |
| /Report | GET, POST | Report execution |
| /KBArticle | GET, POST | Knowledge base articles |

### Configuration Endpoints
| Endpoint | Description |
|----------|-------------|
| /Status | Ticket statuses |
| /Priority | Priorities |
| /TicketType | Ticket types |
| /Category | Categories |
| /CustomField | Custom fields |
| /Workflow | Automation workflows |
| /EmailTemplate | Email templates |
| /SLA | SLA definitions |

### Common Query Parameters
- \`count\` - Number of records to return (default: 50)
- \`page_no\` - Page number for pagination
- \`search\` - Text search across records
- \`order\` - Sort field
- \`orderdesc\` - Sort descending (true/false)
- \`ticketidonly\` - Return only ticket IDs (faster)

### Filtering Tickets
- \`client_id\` - Filter by client
- \`site_id\` - Filter by site
- \`agent_id\` - Filter by assigned agent
- \`status_id\` - Filter by status
- \`priority_id\` - Filter by priority
- \`tickettype_id\` - Filter by ticket type
- \`open_only\` - Only open tickets
- \`dateoccured_start/end\` - Date range filter
`;

/**
 * Get the full HaloPSA context for the AI agent.
 */
export function getHaloPSAContext(): string {
  return `
## HaloPSA Reference Documentation

${SQL_EXAMPLES}

${HALOPSA_VARIABLES}

${DASHBOARD_CONTEXT}

${API_REFERENCE}

### Tips for Users
- For reports, use the runReport or createReport tools
- For dashboards, use listDashboards and getDashboard tools
- Custom SQL reports can use the patterns shown above
- Variables can be used in email/ticket templates
`;
}

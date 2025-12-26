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
| /Report | POST | Create report | (body: name, sqlquery, category, etc.) |
| /Report/{id} | GET | Get report | includedetails |
| /Report/{id}/run | GET | Run report | startdate, enddate, client_id, agent_id |
| /Dashboard | GET | List dashboards | is_shared, count |
| /Dashboard/{id} | GET | Get dashboard | includewidgets |
| /DashboardWidget | POST | Add widget | (body: dashboard_id, widget_type, report_id, etc.) |

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
- \`count\` - Number of records (default: 50, max: 1000)
- \`page_no\` - Page number for pagination
- \`page_size\` - Records per page
- \`search\` - Text search
- \`order\` - Sort field name
- \`orderdesc\` - Sort descending (true/false)
- \`includedetails\` - Include full details
- \`advanced_search\` - Complex search JSON

### Ticket Filtering Parameters
- \`client_id\` - Filter by client ID
- \`site_id\` - Filter by site ID
- \`agent_id\` - Filter by assigned agent
- \`team\` - Filter by team name
- \`status_id\` - Filter by status ID
- \`priority_id\` - Filter by priority ID
- \`tickettype_id\` - Filter by ticket type
- \`category_1/2/3/4\` - Filter by category levels
- \`open_only\` - Only open tickets (true/false)
- \`dateoccured_start\` - Created after date
- \`dateoccured_end\` - Created before date
- \`dateclosed_start\` - Closed after date
- \`dateclosed_end\` - Closed before date
- \`sla_status\` - SLA state (I=In, O=Out)
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

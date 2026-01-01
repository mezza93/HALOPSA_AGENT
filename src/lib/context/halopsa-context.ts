/**
 * HaloPSA Context for AI Agent
 *
 * This module provides comprehensive HaloPSA documentation context
 * including product overview, features, database schema, SQL examples,
 * variables, and reporting knowledge.
 *
 * Sources:
 * - https://usehalo.com/halopsa/roadmap/
 * - https://usehalo.com/product-updates/whats-new-in-halopsa-q2-2025/
 * - https://usehalo.com/product-updates/halopsa-new-features-q1-2025/
 * - https://halopsa.com/guides/
 * - https://haloacademy.halopsa.com/apidoc/
 */

/**
 * HaloPSA Product Overview and Capabilities
 */
export const PRODUCT_OVERVIEW = `## HaloPSA Product Overview

### What is HaloPSA?
HaloPSA is an intuitive, all-inclusive Professional Services Automation (PSA) solution built to transform and modernize the delivery of managed IT services. It's part of the HALO ecosystem alongside HaloITSM (enterprise service management) and HaloCRM.

### Target Markets
- Managed Service Providers (MSPs)
- Telecommunications companies
- Cloud Solution Providers
- IT Consultancy firms
- Software companies
- Internal IT departments

### Core Modules

**Service Management:**
- Service Desk - Ticketing system designed for MSPs with full ITIL support
- Self-Service Portal - Customer self-help with customizable branding
- Knowledge Base - Searchable article repository with AI-powered suggestions

**Financial & Operations:**
- Billing & Invoicing - Streamlined billing with recurring invoices and payment tracking
- Contract Management - Agreement tracking with auto-renewal and SLA linking
- Stock Management - Centralized inventory tracking with warehouse support
- Time Tracking - Accurate billable hour recording with approval workflows

**Business Intelligence:**
- Reporting & Analytics - Custom SQL reports with scheduled delivery
- Dashboards - Real-time KPI visualization with drag-and-drop widgets
- AI Insights - AI-powered data analysis and recommendations

**Project Delivery:**
- Project Management - Full project lifecycle from initiation to completion
- Milestones & Budgets - Track progress against plans
- Resource Allocation - Agent capacity planning

**Sales & CRM:**
- Opportunities - Sales pipeline management
- Quotations - Quote generation with product catalog
- Sales Orders - Order fulfillment tracking

### ITIL Alignment
- Incident Management - Standard ticket handling
- Problem Management - Root cause analysis
- Change Management - Change requests with approval workflows
- Release Management - Software release tracking
- Service Catalog - Requestable service offerings
`;

/**
 * Recent HaloPSA Features (2025 Updates)
 */
export const RECENT_FEATURES = `## HaloPSA 2025 New Features

### Q2 2025 Updates

**Dedicated Chat Workspace**
Full-screen chat interface replacing floating bubbles with filtered views (My Conversations, Team Conversations, All Conversations, Active, Closed).

**Browser-Style Tabs**
Multi-tab navigation allowing agents to work across tickets, assets, and reports simultaneously while maintaining state.

**TimeGPT Forecasting**
Integration with Nixtla's TimeGPT to predict ticket demand based on historical data. Supports forecasts from hours to months with event tagging for campaigns and holidays.

**Invoice Follow-Ups**
"View filtered overdue invoices" feature with reminder emails. Tracks "Last Reminder Sent" dates.

**Flexible Billing Rules**
Enhanced granularity with custom field filters from tickets, actions, agents, roles for precise condition-based billing.

**Customer-Specific To-Do Groups**
Tailored to-do templates by customer ensuring only relevant items appear on tickets.

**Admin Mode**
Elevated privileges requiring 2FA activation, granting temporary access (default 1 hour) for administrator accounts.

**Secure Password Sharing**
One-time links with optional passphrases for sharing sensitive information, accessible only to ticket end users.

**Action Groups**
Organize ticket actions under labeled categories with custom colors and icons.

**Dashboard Repository**
Online repository of pre-built dashboards by consultants, searchable by report names.

### Q1 2025 Updates

**Refreshed User Interface**
Modernized design improving navigation speed and workflow fluidity across all modules.

**AI Report Analysis**
Analyzes reporting data with custom prompts, delivering actionable insights based on dataset patterns.

**AI Statement of Work Automation**
Transforms SOWs into structured ticket hierarchies automatically.

**AI Client Profiling**
Generates customer summaries from ticket history, flagging negative sentiment and churn risk.

**Enhanced MYOB Integration**
- Bill creation from purchase orders
- Payment syncing to specified accounts
- Recurring payment retrieval
- Automatic deletion sync

**SentinelOne Integration**
Bidirectional threat management - auto-close in SentinelOne when resolved in Halo.

**Custom Customer Areas**
Segmented customer database filtering cascading to sites and users.

**Drag & Drop Quote Lines**
Reordering functionality for flexible quote management.
`;

/**
 * HaloPSA AI Capabilities
 */
export const AI_CAPABILITIES = `## HaloPSA AI Capabilities

### Built-in AI Features

**AI Ticket Suggestions**
- Suggests similar tickets and KB articles when creating/viewing tickets
- Extended across ticket types (Incidents, Requests, Problems)
- Contextual hints displayed while logging actions

**AI Report Analysis**
- Custom prompts for analyzing report data
- Automatic insights and recommendations
- Pattern detection in datasets

**AI Client Profiling**
- Analyzes recent ticket history per customer
- Generates experience summaries for agents
- Flags negative sentiment and churn risk

**AI Statement of Work Processing**
- Transforms SOWs into structured ticket series
- Creates parent-child ticket relationships
- Automatic project setup

**AI Article Creation**
- Helps create knowledge base articles from ticket resolutions
- Suggests content structure and keywords

**AI Emotion Detection**
- Analyzes ticket and action text for sentiment
- Helps prioritize tickets with frustrated customers

### AI Integration Points
- OpenAI/Azure OpenAI for text generation
- TimeGPT (Nixtla) for demand forecasting
- Custom AI prompts in reports and dashboards
`;

/**
 * HaloPSA Integrations Overview
 */
export const INTEGRATIONS = `## HaloPSA Integrations

### RMM Tools
- ConnectWise Automate & Manage
- Datto RMM & Autotask
- NinjaRMM
- N-able N-central & N-sight
- Atera
- Kaseya VSA/BMS

### Communication
- Microsoft Teams (ticketing, notifications, chat)
- Slack integration
- 3CX, 8x8, RingCentral (VoIP/telephony)
- Email (Microsoft 365, Google Workspace, IMAP/SMTP)

### Cloud & Identity
- Microsoft Azure AD/Entra ID (SSO, sync)
- Microsoft Intune (device sync)
- AWS integration
- Google Workspace

### Accounting & Finance
- QuickBooks Online/Desktop
- Xero
- MYOB
- Sage
- Microsoft Dynamics 365

### Security & Monitoring
- SentinelOne
- CrowdStrike
- Webroot
- Acronis
- Veeam

### Remote Support
- ConnectWise ScreenConnect
- TeamViewer
- Splashtop
- AnyDesk

### Documentation
- IT Glue
- Hudu
- PassPortal

### Custom Integrations
- REST API (full CRUD operations)
- Webhooks (incoming and outgoing)
- Zapier/Power Automate connectors
- Custom workflow automations
`;

/**
 * HaloPSA Documentation Guide Categories
 */
export const GUIDE_CATEGORIES = `## HaloPSA Documentation & Guides

### Getting Started
- Setup and Configuration (12 guides)
- Basic Configuration (8 guides) - themes, custom fields, portal
- Email Configuration (17 guides) - mailbox setup, rules, templates, Azure/Google

### ITIL Processes
- Incident Management (10 guides) - ticket types, workflows, templates
- Problem Management
- Change Management - approvals, software releases

### Admin Guides
- Agent Configuration (8 guides) - roles, permissions, API
- Service Level Agreements (4 guides)
- Knowledge Base (2 guides)
- Asset Management (8 guides) - discovery, licensing, stock
- Developers (7 guides) - API, database, NHServer
- Project Management (6 guides) - milestones, billing

### Agent Guides (25+ topics)
- Time tracking and calendars
- Invoicing and contracts
- Notifications and search
- Client management

### Integrations (50+ documented)
- Cloud platforms, RMM tools, communication
- Accounting systems, security tools
- Custom API integrations

### Reporting (21 guides)
- Dashboards and charts
- SQL reports and scheduling
- Export and customization

### Resources
- HaloPSA Academy: academy.halopsa.com
- API Documentation: haloacademy.halopsa.com/apidoc
- Community forums and support portal
`;

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
| Type | Name | Requires | Use For |
|------|------|----------|---------|
| 0 | Bar Chart | report_id | Comparisons (agent workload, tickets by status) |
| 1 | Pie Chart | report_id | Proportions (priority distribution, category breakdown) |
| 2 | Counter (Report) | report_id | Single metrics from SQL (avg response time) |
| 6 | List Widget | filter_id | Ticket lists |
| 7 | Counter (Filter) | filter_id + ticketarea_id | Ticket counts (open tickets, unassigned) |

### CRITICAL: Chart Report Configuration
For charts to display properly, reports MUST have these fields set:
- **charttype**: 0=bar, 1=line, 2=pie, 3=doughnut
- **xaxis**: Column name from SQL for X-axis (e.g., 'Priority', 'Agent', 'Status')
- **yaxis**: Column name from SQL for Y-axis (e.g., 'Count', 'Open Tickets')
- **count**: true (to enable counting mode)
- **showgraphvalues**: true (to display values on chart)

**IMPORTANT**: The xaxis and yaxis values MUST exactly match the column aliases in your SQL query.

### SQL for Charts - Required Format
Charts require exactly 2 columns: a label and a count.

**Correct Example:**
\`\`\`sql
SELECT TOP 100
    COALESCE(p.Pdesc, 'No Priority') AS [Priority],  -- xaxis='Priority'
    COUNT(*) AS [Count]                               -- yaxis='Count'
FROM FAULTS f
LEFT JOIN POLICY p ON f.seriousness = p.Ppolicy
GROUP BY p.Pdesc
\`\`\`

### Smart Dashboard Layouts Available
| Layout | Widgets | Best For |
|--------|---------|----------|
| service_desk | Open/unassigned counters, priority chart, agent workload | Daily operations |
| management | Status, trends, SLA performance, agent metrics | Manager oversight |
| sla_focused | SLA counters, response times, priority breakdown | SLA monitoring |
| client_focused | Client breakdown, top callers, categories | Account management |
| minimal | Open, unassigned, priority, workload | Quick overview |

### Common Dashboard Metrics
- Open tickets by status/priority/team
- SLA compliance percentage
- Average response/resolution time
- Tickets opened vs closed trend
- Agent workload distribution

### Report Types
1. **Standard Reports** - Pre-built reports
2. **Custom SQL Reports** - Write your own SQL (use Request_View for simplicity)
3. **Scheduled Reports** - Auto-email reports
4. **Export Formats** - PDF, Excel, CSV
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
 * This comprehensive context includes product overview, features, technical details,
 * and best practices for working with HaloPSA.
 */
export function getHaloPSAContext(): string {
  return `
# HaloPSA Complete Reference Documentation

${PRODUCT_OVERVIEW}

${RECENT_FEATURES}

${AI_CAPABILITIES}

${INTEGRATIONS}

${GUIDE_CATEGORIES}

${DATABASE_SCHEMA}

${SQL_EXAMPLES}

${HALOPSA_VARIABLES}

${DASHBOARD_CONTEXT}

${API_REFERENCE}

## Critical Tips for Success

### Dashboard & Chart Creation
1. **Use smartBuildDashboard tool** - It handles report creation with proper chart config automatically
2. **Chart reports MUST have**: charttype, xaxis, yaxis (matching SQL column aliases exactly)
3. **Counter widgets (type 7)**: Use filter_id + ticketarea_id=1 (for tickets)
4. **Chart widgets (type 0, 1)**: Require valid report_id with chart configuration

### SQL Query Best Practices
1. ALWAYS include TOP N clause with ORDER BY or GROUP BY
2. Use [square brackets] for column names with spaces
3. For charts: Return exactly 2 columns - label and count
4. Column aliases MUST match xaxis/yaxis values exactly
5. Use Request_View for simple reports - has pre-joined readable columns

### Common Patterns
- Open tickets: TstatusType = 1 or Status NOT IN (closed status IDs)
- Non-deleted tickets: Fdeleted = fmergedintofaultid (NOT fdeleted = 0)
- Priority lookup: JOIN POLICY p ON f.seriousness = p.Ppolicy
- Agent lookup: JOIN UNAME u ON f.Assignedtoint = u.Unum
- Client lookup: JOIN AREA a ON f.Areaint = a.Aarea

### Error Handling
- If a widget shows no data, check if the report has charttype, xaxis, yaxis configured
- If report creation fails, check SQL syntax (TOP clause, brackets, valid JOINs)
- For filter-based counters, ensure filter_id and ticketarea_id are both > 0

### Useful Resources
- HaloPSA Academy: https://academy.halopsa.com
- API Documentation: https://haloacademy.halopsa.com/apidoc
- Guides: https://halopsa.com/guides/
- Product Updates: https://usehalo.com/product-updates/
- Roadmap: https://usehalo.com/halopsa/roadmap/
`;
}

/**
 * Get a condensed version of HaloPSA context for memory-constrained scenarios.
 */
export function getHaloPSAContextCondensed(): string {
  return `
# HaloPSA Quick Reference

${PRODUCT_OVERVIEW}

${AI_CAPABILITIES}

${DATABASE_SCHEMA}

${DASHBOARD_CONTEXT}

## Key Resources
- Academy: https://academy.halopsa.com
- API Docs: https://haloacademy.halopsa.com/apidoc
- Guides: https://halopsa.com/guides/
`;
}

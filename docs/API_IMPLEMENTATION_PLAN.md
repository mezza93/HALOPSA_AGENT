# HaloPSA API Complete Implementation Plan

**Created:** January 2026
**Status:** Planning Phase
**Total API Endpoints in HaloPSA:** 400+
**Currently Implemented:** 31 endpoints (8%)
**Target:** 100% coverage of business-critical endpoints

---

## Executive Summary

This document outlines the complete implementation plan to achieve full HaloPSA API coverage in the web application. The plan is organized into phases based on business priority and dependency requirements.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Phase 0: Critical Fixes](#phase-0-critical-fixes)
3. [Phase 1: Revenue & Sales (P0)](#phase-1-revenue--sales-p0)
4. [Phase 2: Operations & Scheduling (P1)](#phase-2-operations--scheduling-p1)
5. [Phase 3: ITIL & Service Management (P2)](#phase-3-itil--service-management-p2)
6. [Phase 4: Productivity & Automation (P2)](#phase-4-productivity--automation-p2)
7. [Phase 5: Integrations & Webhooks (P3)](#phase-5-integrations--webhooks-p3)
8. [Phase 6: Advanced Features (P3)](#phase-6-advanced-features-p3)
9. [Implementation Guidelines](#implementation-guidelines)
10. [File Structure](#file-structure)

---

## Current State Analysis

### Implemented Services (31 endpoints)

| Service | Endpoint | Tools | Status |
|---------|----------|-------|--------|
| TicketService | `/Tickets`, `/Actions` | 16 | ✅ Complete |
| ClientService | `/Client` | 5 | ✅ Complete |
| SiteService | `/Site` | 4 | ✅ Complete |
| UserService | `/Users` | 4 | ✅ Complete |
| AgentService | `/Agent` | 6 | ✅ Complete |
| TeamService | `/Team` | 4 | ✅ Complete |
| AssetService | `/Asset` | 8 | ✅ Complete |
| AssetTypeService | `/AssetType` | 2 | ✅ Complete |
| InvoiceService | `/Invoice` | 7 | ✅ Complete |
| ContractService | `/ClientContract` | 7 | ✅ Complete |
| SLAService | `/SLA` | 4 | ✅ Complete |
| KnowledgeBaseService | `/KBArticle` | 7 | ✅ Complete |
| FAQService | `/FAQLists` | 2 | ✅ Complete |
| ReportService | `/Report` | 8 | ✅ Complete |
| DashboardService | `/DashboardLinks` | 8 | ✅ Complete |
| AttachmentService | `/Attachment` | 5 | ✅ Complete |
| ConfigurationService | Various | 15 | ✅ Complete |

### Known Issues to Fix

1. **TimeEntryService** uses non-existent `/TimeEntry` - should use `/TimesheetEvent`
2. **ExpenseService** uses non-existent `/Expense` - needs removal or remapping
3. **RecurringServiceService** - should use `/RecurringInvoice`
4. Missing many query parameters in existing tools

---

## Phase 0: Critical Fixes

**Priority:** Immediate
**Effort:** 1-2 days
**Dependencies:** None

### 0.1 Fix TimeEntry → TimesheetEvent

**Current State:** Service incorrectly calls `/TimeEntry`
**Correct Endpoint:** `/TimesheetEvent`

```typescript
// File: src/lib/halopsa/services/billing.ts
// CHANGE FROM:
endpoint: '/TimeEntry'
// CHANGE TO:
endpoint: '/TimesheetEvent'
```

**API Parameters for `/TimesheetEvent`:**
- `agent_id` (int) - Filter by agent
- `agents` (string) - Comma-separated agent IDs
- `start_date` (string) - Start date filter
- `end_date` (string) - End date filter
- `utcoffset` (number) - UTC offset

**Additional endpoints:**
- `GET /Timesheet` - Get timesheet summary
- `GET /Timesheet/mine` - Get current agent's timesheet
- `GET /Timesheet/forecasting` - Get forecasting data
- `GET /Timesheet/{id}` - Get specific timesheet

### 0.2 Remove or Remap ExpenseService

**Current State:** No `/Expense` endpoint exists in HaloPSA API
**Options:**
1. Remove ExpenseService entirely
2. Map to a custom field or action type
3. Use project billing fields

**Recommendation:** Remove and document that expenses should be tracked via time entries with expense flags or project line items.

### 0.3 Fix RecurringService → RecurringInvoice

**Current State:** Service may not match actual API
**Correct Endpoint:** `/RecurringInvoice`

**API Endpoints:**
- `GET /RecurringInvoice` - List recurring invoices
- `GET /RecurringInvoice/{id}` - Get specific recurring invoice
- `POST /RecurringInvoice` - Create/update recurring invoice
- `DELETE /RecurringInvoice/{id}` - Delete
- `POST /RecurringInvoice/process` - Process recurring invoices
- `POST /RecurringInvoice/Lines` - Manage invoice lines
- `POST /RecurringInvoice/updatelines` - Update lines

---

## Phase 1: Revenue & Sales (P0)

**Priority:** Critical - Direct revenue impact
**Effort:** 2-3 weeks
**Dependencies:** Phase 0

### 1.1 Opportunities Service

**Endpoint:** `/Opportunities`
**Business Value:** Sales pipeline management

**Service: `OpportunityService`**

```typescript
// File: src/lib/halopsa/services/opportunities.ts

class OpportunityService extends BaseService<Opportunity> {
  protected endpoint = '/Opportunities';

  // List Methods
  async list(params?: ListParams): Promise<Opportunity[]>
  async listOpen(params?: { agentId?: number; clientId?: number; count?: number }): Promise<Opportunity[]>
  async listWon(params?: { startDate?: string; endDate?: string; count?: number }): Promise<Opportunity[]>
  async listLost(params?: { startDate?: string; endDate?: string; count?: number }): Promise<Opportunity[]>
  async listByStage(stageId: number, params?: ListParams): Promise<Opportunity[]>
  async listByAgent(agentId: number, params?: ListParams): Promise<Opportunity[]>
  async listByClient(clientId: number, params?: ListParams): Promise<Opportunity[]>

  // CRUD
  async get(id: number): Promise<Opportunity>
  async create(items: Partial<Opportunity>[]): Promise<Opportunity[]>
  async update(items: Partial<Opportunity>[]): Promise<Opportunity[]>
  async delete(id: number): Promise<void>

  // Pipeline Management
  async moveToStage(opportunityId: number, stageId: number, note?: string): Promise<Opportunity>
  async markAsWon(opportunityId: number, closingNote?: string): Promise<Opportunity>
  async markAsLost(opportunityId: number, lossReason?: string): Promise<Opportunity>

  // Statistics
  async getPipelineStats(params?: { agentId?: number }): Promise<PipelineStats>
  async getForecast(params?: { agentId?: number; period?: string }): Promise<Forecast>
}
```

**Query Parameters (from OpenAPI spec):**
- `agent` / `agent_id` - Filter by agent
- `asset_id` - Filter by asset
- `client_id` - Filter by client
- `open_only` - Only open opportunities
- `closed_only` - Only closed
- `won` - Only won
- `lost` - Only lost
- `stage_id` - Filter by stage
- `search` - Full-text search
- `startdate` / `enddate` - Date range
- `count` - Limit results
- `includedetails` - Include full details

**AI Tools:**

```typescript
// File: src/lib/ai/tools/opportunities.ts

export const opportunityTools = {
  listOpportunities: tool({
    description: 'List sales opportunities/deals with optional filters',
    parameters: z.object({
      status: z.enum(['open', 'won', 'lost', 'all']).optional().default('open'),
      agentId: z.number().optional(),
      clientId: z.number().optional(),
      stageId: z.number().optional(),
      search: z.string().optional(),
      count: z.number().optional().default(20),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),

  getOpportunity: tool({
    description: 'Get detailed opportunity information',
    parameters: z.object({
      opportunityId: z.number(),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),

  createOpportunity: tool({
    description: 'Create a new sales opportunity',
    parameters: z.object({
      name: z.string(),
      clientId: z.number(),
      value: z.number().optional(),
      probability: z.number().min(0).max(100).optional(),
      stageId: z.number().optional(),
      expectedCloseDate: z.string().optional(),
      description: z.string().optional(),
      agentId: z.number().optional(),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),

  updateOpportunity: tool({
    description: 'Update an existing opportunity',
    parameters: z.object({
      opportunityId: z.number(),
      name: z.string().optional(),
      value: z.number().optional(),
      probability: z.number().optional(),
      stageId: z.number().optional(),
      expectedCloseDate: z.string().optional(),
      description: z.string().optional(),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),

  moveOpportunityStage: tool({
    description: 'Move opportunity to a different pipeline stage',
    parameters: z.object({
      opportunityId: z.number(),
      stageId: z.number(),
      note: z.string().optional(),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),

  closeOpportunity: tool({
    description: 'Close an opportunity as won or lost',
    parameters: z.object({
      opportunityId: z.number(),
      outcome: z.enum(['won', 'lost']),
      note: z.string().optional(),
      lossReason: z.string().optional(),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),

  getPipelineStats: tool({
    description: 'Get sales pipeline statistics and forecasts',
    parameters: z.object({
      agentId: z.number().optional(),
      period: z.enum(['month', 'quarter', 'year']).optional().default('month'),
    }),
    execute: async (params, { services }) => { /* ... */ }
  }),
};
```

**Types:**

```typescript
// File: src/lib/halopsa/types/opportunity.ts

export interface Opportunity {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  value?: number;
  probability?: number;
  weighted_value?: number;
  stage_id?: number;
  stage_name?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  agent_id?: number;
  agent_name?: string;
  description?: string;
  is_won?: boolean;
  is_lost?: boolean;
  loss_reason?: string;
  created_at?: string;
  updated_at?: string;
  custom_fields?: CustomField[];
}

export interface PipelineStats {
  totalOpportunities: number;
  totalValue: number;
  weightedValue: number;
  byStage: { stageId: number; stageName: string; count: number; value: number }[];
  wonThisPeriod: number;
  lostThisPeriod: number;
  winRate: number;
}
```

---

### 1.2 Quotation Service

**Endpoint:** `/Quotation`
**Business Value:** Quote-to-cash process

**Service: `QuotationService`**

```typescript
// File: src/lib/halopsa/services/quotations.ts

class QuotationService extends BaseService<Quotation> {
  protected endpoint = '/Quotation';

  // List Methods
  async list(params?: ListParams): Promise<Quotation[]>
  async listByClient(clientId: number, params?: ListParams): Promise<Quotation[]>
  async listAwaitingApproval(params?: ListParams): Promise<Quotation[]>
  async listAccepted(params?: { startDate?: string; endDate?: string }): Promise<Quotation[]>
  async listExpired(params?: ListParams): Promise<Quotation[]>

  // CRUD
  async get(id: number, includeDetails?: boolean): Promise<Quotation>
  async create(items: Partial<Quotation>[]): Promise<Quotation[]>
  async update(items: Partial<Quotation>[]): Promise<Quotation[]>
  async delete(id: number): Promise<void>

  // Line Items
  async addLines(quotationId: number, lines: QuotationLine[]): Promise<Quotation>
  async updateLines(quotationId: number, lines: QuotationLine[]): Promise<Quotation>

  // Workflow
  async sendToClient(quotationId: number, emailOptions?: EmailOptions): Promise<void>
  async approve(quotationId: number): Promise<Quotation>
  async reject(quotationId: number, reason?: string): Promise<Quotation>
  async convertToSalesOrder(quotationId: number): Promise<SalesOrder>
  async convertToInvoice(quotationId: number): Promise<Invoice>

  // PDF Generation
  async generatePdf(quotationId: number, templateId?: number): Promise<{ url: string }>
}
```

**Query Parameters:**
- `client_id` - Filter by client
- `awaiting_approval` - Awaiting approval
- `closed` - Closed quotes
- `includelines` - Include line items
- `count` - Result limit

**AI Tools (8-10 tools):**
- `listQuotations` - List with filters
- `getQuotation` - Get details
- `createQuotation` - Create new quote
- `updateQuotation` - Update existing
- `addQuotationLine` - Add line item
- `sendQuotation` - Send to client
- `approveQuotation` - Approve quote
- `convertQuotationToOrder` - Convert to sales order
- `convertQuotationToInvoice` - Convert to invoice
- `getQuotationPdf` - Generate PDF

---

### 1.3 Sales Order Service

**Endpoint:** `/SalesOrder`
**Business Value:** Order fulfillment

**Service: `SalesOrderService`**

```typescript
// File: src/lib/halopsa/services/sales-orders.ts

class SalesOrderService extends BaseService<SalesOrder> {
  protected endpoint = '/SalesOrder';

  async list(params?: ListParams): Promise<SalesOrder[]>
  async listByClient(clientId: number, params?: ListParams): Promise<SalesOrder[]>
  async listPending(params?: ListParams): Promise<SalesOrder[]>
  async listFulfilled(params?: ListParams): Promise<SalesOrder[]>

  async get(id: number): Promise<SalesOrder>
  async create(items: Partial<SalesOrder>[]): Promise<SalesOrder[]>
  async update(items: Partial<SalesOrder>[]): Promise<SalesOrder[]>
  async delete(id: number): Promise<void>

  async markFulfilled(orderId: number): Promise<SalesOrder>
  async convertToInvoice(orderId: number): Promise<Invoice>
}
```

**AI Tools (6 tools):**
- `listSalesOrders`
- `getSalesOrder`
- `createSalesOrder`
- `updateSalesOrder`
- `fulfillSalesOrder`
- `invoiceSalesOrder`

---

### 1.4 Purchase Order Service

**Endpoint:** `/PurchaseOrder`
**Business Value:** Procurement management

**Service: `PurchaseOrderService`**

```typescript
// File: src/lib/halopsa/services/purchase-orders.ts

class PurchaseOrderService extends BaseService<PurchaseOrder> {
  protected endpoint = '/PurchaseOrder';

  async list(params?: ListParams): Promise<PurchaseOrder[]>
  async listBySupplier(supplierId: number): Promise<PurchaseOrder[]>
  async listPending(params?: ListParams): Promise<PurchaseOrder[]>
  async listReceived(params?: ListParams): Promise<PurchaseOrder[]>

  async get(id: number): Promise<PurchaseOrder>
  async create(items: Partial<PurchaseOrder>[]): Promise<PurchaseOrder[]>
  async update(items: Partial<PurchaseOrder>[]): Promise<PurchaseOrder[]>
  async delete(id: number): Promise<void>

  async confirmReceipt(orderId: number, receivedItems: ReceivedItem[]): Promise<PurchaseOrder>
}
```

**AI Tools (6 tools):**
- `listPurchaseOrders`
- `getPurchaseOrder`
- `createPurchaseOrder`
- `updatePurchaseOrder`
- `receivePurchaseOrder`
- `getPurchaseOrderStats`

---

### 1.5 Supplier Service

**Endpoint:** `/Supplier`
**Business Value:** Vendor management

**Service: `SupplierService`**

```typescript
// File: src/lib/halopsa/services/suppliers.ts

class SupplierService extends BaseService<Supplier> {
  protected endpoint = '/Supplier';

  contracts = new SupplierContractService(this.client);

  async list(params?: ListParams): Promise<Supplier[]>
  async listActive(params?: ListParams): Promise<Supplier[]>
  async search(query: string, count?: number): Promise<Supplier[]>

  async get(id: number): Promise<Supplier>
  async create(items: Partial<Supplier>[]): Promise<Supplier[]>
  async update(items: Partial<Supplier>[]): Promise<Supplier[]>
  async delete(id: number): Promise<void>
}
```

---

### 1.6 Item/Product Service

**Endpoint:** `/Item`
**Business Value:** Product catalog

**Service: `ItemService`**

```typescript
// File: src/lib/halopsa/services/items.ts

class ItemService extends BaseService<Item> {
  protected endpoint = '/Item';

  groups = new ItemGroupService(this.client);
  stock = new ItemStockService(this.client);

  async list(params?: ListParams): Promise<Item[]>
  async listByGroup(groupId: number): Promise<Item[]>
  async search(query: string): Promise<Item[]>
  async listActive(params?: ListParams): Promise<Item[]>

  async get(id: number): Promise<Item>
  async create(items: Partial<Item>[]): Promise<Item[]>
  async update(items: Partial<Item>[]): Promise<Item[]>
  async delete(id: number): Promise<void>

  async getStockLevels(itemId: number): Promise<StockLevel[]>
  async adjustStock(itemId: number, adjustment: StockAdjustment): Promise<ItemStock>
}
```

**AI Tools (8 tools):**
- `listItems`
- `getItem`
- `createItem`
- `updateItem`
- `searchItems`
- `getItemStock`
- `adjustItemStock`
- `listItemGroups`

---

## Phase 2: Operations & Scheduling (P1)

**Priority:** High - Operational efficiency
**Effort:** 2 weeks
**Dependencies:** Phase 1 (partial)

### 2.1 Appointment Service

**Endpoint:** `/Appointment`
**Business Value:** Calendar and booking management

**Service: `AppointmentService`**

```typescript
// File: src/lib/halopsa/services/appointments.ts

class AppointmentService extends BaseService<Appointment> {
  protected endpoint = '/Appointment';

  async list(params?: {
    agentId?: number;
    clientId?: number;
    siteId?: number;
    startDate?: string;
    endDate?: string;
    type?: number;
    count?: number;
  }): Promise<Appointment[]>

  async listByAgent(agentId: number, startDate?: string, endDate?: string): Promise<Appointment[]>
  async listByClient(clientId: number): Promise<Appointment[]>
  async listToday(agentId?: number): Promise<Appointment[]>
  async listUpcoming(agentId?: number, days?: number): Promise<Appointment[]>

  async get(id: number): Promise<Appointment>
  async create(items: Partial<Appointment>[]): Promise<Appointment[]>
  async update(items: Partial<Appointment>[]): Promise<Appointment[]>
  async delete(id: number): Promise<void>

  async book(params: BookingParams): Promise<Appointment>
  async reschedule(appointmentId: number, newStartTime: string, newEndTime: string): Promise<Appointment>
  async cancel(appointmentId: number, reason?: string): Promise<void>
  async complete(appointmentId: number, notes?: string): Promise<Appointment>

  async getAvailableSlots(params: AvailabilityParams): Promise<TimeSlot[]>
  async generateRecurring(appointmentId: number, pattern: RecurrencePattern): Promise<Appointment[]>
}
```

**Query Parameters:**
- `agent_id` - Filter by agent
- `agents` - Multiple agents
- `client_id` - Filter by client
- `site_id` - Filter by site
- `tickettypeid` - Filter by ticket type
- `startdateutc` / `enddateutc` - Date range
- `appointment_type` - Type filter
- `showall` - Include all statuses
- `includeallfields` - Full details

**AI Tools (10 tools):**
- `listAppointments`
- `getAppointment`
- `createAppointment`
- `updateAppointment`
- `bookAppointment`
- `rescheduleAppointment`
- `cancelAppointment`
- `completeAppointment`
- `getAvailableSlots`
- `createRecurringAppointment`

---

### 2.2 Timesheet Service (Proper Implementation)

**Endpoint:** `/Timesheet`, `/TimesheetEvent`
**Business Value:** Time tracking and billing

**Service: `TimesheetService`**

```typescript
// File: src/lib/halopsa/services/timesheets.ts

class TimesheetService {
  constructor(private client: HaloPSAClient) {}

  // Timesheet (weekly summary)
  async getTimesheet(id: number): Promise<Timesheet>
  async getMyTimesheet(): Promise<Timesheet>
  async submitForApproval(timesheetId: number): Promise<Timesheet>
  async approve(timesheetId: number, managerId?: number): Promise<Timesheet>
  async reject(timesheetId: number, reason: string): Promise<Timesheet>

  // Timesheet Events (individual entries)
  events = new TimesheetEventService(this.client);
}

class TimesheetEventService extends BaseService<TimesheetEvent> {
  protected endpoint = '/TimesheetEvent';

  async list(params?: {
    agentId?: number;
    agents?: number[];
    startDate?: string;
    endDate?: string;
  }): Promise<TimesheetEvent[]>

  async listMine(params?: { startDate?: string; endDate?: string }): Promise<TimesheetEvent[]>
  async listByTicket(ticketId: number): Promise<TimesheetEvent[]>
  async listByProject(projectId: number): Promise<TimesheetEvent[]>

  async get(id: number): Promise<TimesheetEvent>
  async create(items: Partial<TimesheetEvent>[]): Promise<TimesheetEvent[]>
  async update(items: Partial<TimesheetEvent>[]): Promise<TimesheetEvent[]>
  async delete(id: number): Promise<void>

  async createFromTicket(params: {
    ticketId: number;
    durationMinutes: number;
    note?: string;
    billable?: boolean;
    startTime?: string;
  }): Promise<TimesheetEvent>

  async getSummary(params?: {
    agentId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TimesheetSummary>
}
```

**AI Tools (10 tools):**
- `listTimesheetEvents`
- `getTimesheetEvent`
- `createTimesheetEvent`
- `updateTimesheetEvent`
- `deleteTimesheetEvent`
- `logTimeToTicket`
- `getTimesheetSummary`
- `submitTimesheet`
- `approveTimesheet`
- `getMyTimesheet`

---

### 2.3 ToDo Service

**Endpoint:** `/ToDo`, `/ToDoGroup`
**Business Value:** Task management

**Service: `ToDoService`**

```typescript
// File: src/lib/halopsa/services/todos.ts

class ToDoService extends BaseService<ToDo> {
  protected endpoint = '/ToDo';

  groups = new ToDoGroupService(this.client);

  async list(params?: {
    agentId?: number;
    ticketId?: number;
    projectId?: number;
    completed?: boolean;
    priority?: number;
    dueDate?: string;
    count?: number;
  }): Promise<ToDo[]>

  async listMine(includeCompleted?: boolean): Promise<ToDo[]>
  async listOverdue(agentId?: number): Promise<ToDo[]>
  async listByTicket(ticketId: number): Promise<ToDo[]>
  async listByProject(projectId: number): Promise<ToDo[]>

  async get(id: number): Promise<ToDo>
  async create(items: Partial<ToDo>[]): Promise<ToDo[]>
  async update(items: Partial<ToDo>[]): Promise<ToDo[]>
  async delete(id: number): Promise<void>

  async complete(todoId: number): Promise<ToDo>
  async reopen(todoId: number): Promise<ToDo>
  async assignTo(todoId: number, agentId: number): Promise<ToDo>
}
```

**AI Tools (8 tools):**
- `listTodos`
- `getTodo`
- `createTodo`
- `updateTodo`
- `completeTodo`
- `reopenTodo`
- `assignTodo`
- `listOverdueTodos`

---

### 2.4 Canned Text Service

**Endpoint:** `/CannedText`
**Business Value:** Response efficiency

**Service: `CannedTextService`**

```typescript
// File: src/lib/halopsa/services/canned-text.ts

class CannedTextService extends BaseService<CannedText> {
  protected endpoint = '/CannedText';

  async list(params?: ListParams): Promise<CannedText[]>
  async listFavorites(): Promise<CannedText[]>
  async search(query: string): Promise<CannedText[]>
  async listByCategory(categoryId: number): Promise<CannedText[]>

  async get(id: number): Promise<CannedText>
  async create(items: Partial<CannedText>[]): Promise<CannedText[]>
  async update(items: Partial<CannedText>[]): Promise<CannedText[]>
  async delete(id: number): Promise<void>

  async toggleFavorite(cannedTextId: number): Promise<CannedText>
}
```

**AI Tools (5 tools):**
- `listCannedResponses`
- `searchCannedResponses`
- `getCannedResponse`
- `createCannedResponse`
- `useCannedResponse` (apply to ticket)

---

## Phase 3: ITIL & Service Management (P2)

**Priority:** Medium - Process maturity
**Effort:** 2-3 weeks
**Dependencies:** Phases 1-2

### 3.1 Approval Process Service

**Endpoint:** `/ApprovalProcess`, `/ApprovalProcessRule`, `/TicketApproval`
**Business Value:** Governance and compliance

**Services:**

```typescript
// File: src/lib/halopsa/services/approvals.ts

class ApprovalProcessService extends BaseService<ApprovalProcess> {
  protected endpoint = '/ApprovalProcess';

  rules = new ApprovalProcessRuleService(this.client);

  async list(params?: ListParams): Promise<ApprovalProcess[]>
  async get(id: number): Promise<ApprovalProcess>
  async create(items: Partial<ApprovalProcess>[]): Promise<ApprovalProcess[]>
  async update(items: Partial<ApprovalProcess>[]): Promise<ApprovalProcess[]>
  async delete(id: number): Promise<void>
}

class TicketApprovalService extends BaseService<TicketApproval> {
  protected endpoint = '/TicketApproval';

  async listPending(agentId?: number): Promise<TicketApproval[]>
  async listByTicket(ticketId: number): Promise<TicketApproval[]>

  async approve(approvalId: number, comments?: string): Promise<TicketApproval>
  async reject(approvalId: number, reason: string): Promise<TicketApproval>
  async delegate(approvalId: number, toAgentId: number): Promise<TicketApproval>
}
```

**AI Tools (8 tools):**
- `listApprovalProcesses`
- `listPendingApprovals`
- `getApprovalDetails`
- `approveRequest`
- `rejectRequest`
- `delegateApproval`
- `createApprovalProcess`
- `getApprovalStats`

---

### 3.2 Release Management Service

**Endpoint:** `/Release`, `/ReleasePipeline`, `/ReleaseType`
**Business Value:** Change/release management

**Service: `ReleaseService`**

```typescript
// File: src/lib/halopsa/services/releases.ts

class ReleaseService extends BaseService<Release> {
  protected endpoint = '/Release';

  pipelines = new ReleasePipelineService(this.client);
  types = new ReleaseTypeService(this.client);

  async list(params?: ListParams): Promise<Release[]>
  async listByStatus(status: string): Promise<Release[]>
  async listUpcoming(days?: number): Promise<Release[]>

  async get(id: number): Promise<Release>
  async create(items: Partial<Release>[]): Promise<Release[]>
  async update(items: Partial<Release>[]): Promise<Release[]>
  async delete(id: number): Promise<void>

  async moveToStage(releaseId: number, stageId: number): Promise<Release>
  async addTicket(releaseId: number, ticketId: number): Promise<Release>
  async removeTicket(releaseId: number, ticketId: number): Promise<Release>
}
```

**AI Tools (8 tools):**
- `listReleases`
- `getRelease`
- `createRelease`
- `updateRelease`
- `moveReleaseStage`
- `linkTicketToRelease`
- `listReleasePipelines`
- `getReleaseCalendar`

---

### 3.3 CAB (Change Advisory Board) Service

**Endpoint:** `/CAB`, `/CABMember`, `/CABRole`
**Business Value:** Change governance

**Service: `CABService`**

```typescript
// File: src/lib/halopsa/services/cab.ts

class CABService extends BaseService<CAB> {
  protected endpoint = '/CAB';

  members = new CABMemberService(this.client);

  async list(params?: ListParams): Promise<CAB[]>
  async get(id: number): Promise<CAB>
  async create(items: Partial<CAB>[]): Promise<CAB[]>
  async update(items: Partial<CAB>[]): Promise<CAB[]>

  async scheduleReview(cabId: number, ticketId: number, scheduledDate: string): Promise<void>
  async recordDecision(cabId: number, ticketId: number, decision: 'approved' | 'rejected' | 'deferred', notes?: string): Promise<void>
}
```

---

### 3.4 Service Status Service

**Endpoint:** `/Service`, `/ServiceStatus`, `/ServiceAvailability`
**Business Value:** Service catalog and status

**Service: `ServiceCatalogService`**

```typescript
// File: src/lib/halopsa/services/service-catalog.ts

class ServiceCatalogService extends BaseService<Service> {
  protected endpoint = '/Service';

  statuses = new ServiceStatusService(this.client);
  availability = new ServiceAvailabilityService(this.client);

  async list(params?: ListParams): Promise<Service[]>
  async listActive(params?: ListParams): Promise<Service[]>
  async get(id: number): Promise<Service>

  async getStatus(serviceId: number): Promise<ServiceStatus>
  async updateStatus(serviceId: number, status: ServiceStatusUpdate): Promise<ServiceStatus>
  async getAvailability(serviceId: number, period?: string): Promise<AvailabilityReport>
}
```

---

## Phase 4: Productivity & Automation (P2)

**Priority:** Medium - Efficiency gains
**Effort:** 2 weeks
**Dependencies:** Phases 1-3 (partial)

### 4.1 Ticket Rules Service

**Endpoint:** `/TicketRules`
**Business Value:** Automation

**Service: `TicketRuleService`**

```typescript
// File: src/lib/halopsa/services/ticket-rules.ts

class TicketRuleService extends BaseService<TicketRule> {
  protected endpoint = '/TicketRules';

  async list(params?: { active?: boolean }): Promise<TicketRule[]>
  async get(id: number): Promise<TicketRule>
  async create(items: Partial<TicketRule>[]): Promise<TicketRule[]>
  async update(items: Partial<TicketRule>[]): Promise<TicketRule[]>
  async delete(id: number): Promise<void>

  async enable(ruleId: number): Promise<TicketRule>
  async disable(ruleId: number): Promise<TicketRule>
  async test(ruleId: number, testTicketId: number): Promise<RuleTestResult>
}
```

**AI Tools (6 tools):**
- `listTicketRules`
- `getTicketRule`
- `createTicketRule`
- `toggleTicketRule`
- `testTicketRule`
- `deleteTicketRule`

---

### 4.2 Webhook Service

**Endpoint:** `/Webhook`, `/WebhookEvent`, `/IncomingWebhook`
**Business Value:** Integration

**Service: `WebhookService`**

```typescript
// File: src/lib/halopsa/services/webhooks.ts

class WebhookService extends BaseService<Webhook> {
  protected endpoint = '/Webhook';

  events = new WebhookEventService(this.client);
  incoming = new IncomingWebhookService(this.client);

  async list(params?: ListParams): Promise<Webhook[]>
  async get(id: number): Promise<Webhook>
  async create(items: Partial<Webhook>[]): Promise<Webhook[]>
  async update(items: Partial<Webhook>[]): Promise<Webhook[]>
  async delete(id: number): Promise<void>

  async test(webhookId: number): Promise<WebhookTestResult>
  async getDeliveryHistory(webhookId: number, count?: number): Promise<WebhookDelivery[]>
}
```

**AI Tools (6 tools):**
- `listWebhooks`
- `getWebhook`
- `createWebhook`
- `updateWebhook`
- `testWebhook`
- `getWebhookHistory`

---

### 4.3 Global Search Service

**Endpoint:** `/Search`
**Business Value:** User experience

**Service: `SearchService`**

```typescript
// File: src/lib/halopsa/services/search.ts

class SearchService {
  constructor(private client: HaloPSAClient) {}

  async search(query: string, params?: {
    types?: ('ticket' | 'client' | 'user' | 'asset' | 'kb')[];
    count?: number;
  }): Promise<SearchResults>

  async searchTickets(query: string, count?: number): Promise<Ticket[]>
  async searchClients(query: string, count?: number): Promise<Client[]>
  async searchAssets(query: string, count?: number): Promise<Asset[]>
  async searchKB(query: string, count?: number): Promise<KBArticle[]>
}
```

**AI Tools (2 tools):**
- `globalSearch`
- `searchByType`

---

### 4.4 Audit Service

**Endpoint:** `/Audit`
**Business Value:** Compliance and tracking

**Service: `AuditService`**

```typescript
// File: src/lib/halopsa/services/audit.ts

class AuditService extends BaseService<AuditEntry> {
  protected endpoint = '/Audit';

  async list(params?: {
    entityType?: string;
    entityId?: number;
    agentId?: number;
    startDate?: string;
    endDate?: string;
    action?: string;
    count?: number;
  }): Promise<AuditEntry[]>

  async get(id: number): Promise<AuditEntry>
  async listByEntity(entityType: string, entityId: number): Promise<AuditEntry[]>
  async listByAgent(agentId: number, params?: { startDate?: string; endDate?: string }): Promise<AuditEntry[]>
}
```

**AI Tools (3 tools):**
- `getAuditLog`
- `getEntityHistory`
- `getAgentActivity`

---

### 4.5 Notification Service

**Endpoint:** `/Notification`, `/Notifications`
**Business Value:** Communication

**Service: `NotificationService`**

```typescript
// File: src/lib/halopsa/services/notifications.ts

class NotificationService extends BaseService<Notification> {
  protected endpoint = '/Notification';

  async list(params?: { read?: boolean; count?: number }): Promise<Notification[]>
  async listUnread(): Promise<Notification[]>
  async get(id: number): Promise<Notification>

  async markRead(notificationId: number): Promise<void>
  async markAllRead(): Promise<void>
  async delete(id: number): Promise<void>

  async getPreferences(): Promise<NotificationPreferences>
  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>
}
```

**AI Tools (4 tools):**
- `listNotifications`
- `markNotificationRead`
- `getNotificationPreferences`
- `updateNotificationPreferences`

---

## Phase 5: Integrations & Webhooks (P3)

**Priority:** Lower - Extended functionality
**Effort:** 3-4 weeks
**Dependencies:** All previous phases

### 5.1 Integration Services

For each major integration, create a dedicated service:

```typescript
// Generic pattern for integration services
class IntegrationService<T> {
  constructor(
    private client: HaloPSAClient,
    private integrationName: string
  ) {}

  async getConfig(): Promise<IntegrationConfig>
  async updateConfig(config: Partial<IntegrationConfig>): Promise<IntegrationConfig>
  async sync(): Promise<SyncResult>
  async getSyncStatus(): Promise<SyncStatus>
  async getErrors(): Promise<IntegrationError[]>
}
```

**Integration Endpoints to Implement:**
- `/IntegrationData/Get/AzureAD` - Azure AD sync
- `/IntegrationData/Get/MicrosoftCSP` - Microsoft CSP
- `/IntegrationData/Get/Intune` - Intune devices
- `/IntegrationData/Get/ConnectWise` - ConnectWise
- `/IntegrationData/Get/Jira` - Jira integration
- `/IntegrationData/Get/Slack` - Slack
- `/IntegrationData/Get/NinjaRMM` - NinjaRMM
- `/IntegrationData/Get/Datto` - Datto

---

## Phase 6: Advanced Features (P3)

**Priority:** Nice-to-have
**Effort:** 2-3 weeks
**Dependencies:** All previous phases

### 6.1 Additional Services to Implement

| Service | Endpoint | Tools |
|---------|----------|-------|
| CurrencyService | `/Currency` | 3 |
| TaxService | `/Tax`, `/TaxRule` | 4 |
| HolidayService | `/Holiday` | 3 |
| CostCentreService | `/CostCentres` | 4 |
| BudgetTypeService | `/BudgetType` | 3 |
| QualificationService | `/Qualification` | 4 |
| RoadmapService | `/Roadmap` | 3 |
| PasswordFieldService | `/PasswordField` | 3 |
| BookmarkService | `/Bookmark` | 3 |
| MailCampaignService | `/MailCampaign` | 5 |
| DocumentCreationService | `/DocumentCreation` | 3 |
| PdfTemplateService | `/PdfTemplate` | 4 |
| ExternalLinkService | `/ExternalLink` | 3 |
| PopupNoteService | `/PopupNote` | 3 |

---

## Implementation Guidelines

### Service Implementation Pattern

Every service should follow this pattern:

```typescript
// src/lib/halopsa/services/{service-name}.ts

import { BaseService } from './base';
import { HaloPSAClient } from '../client';
import { ListParams } from '../types/common';
import { ServiceEntity } from '../types/{entity}';

export class ServiceNameService extends BaseService<ServiceEntity> {
  protected endpoint = '/EndpointName';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  // Standard CRUD operations inherited from BaseService
  // async list(params?: ListParams): Promise<ServiceEntity[]>
  // async get(id: number, params?: ListParams): Promise<ServiceEntity>
  // async create(items: Partial<ServiceEntity>[]): Promise<ServiceEntity[]>
  // async update(items: Partial<ServiceEntity>[]): Promise<ServiceEntity[]>
  // async delete(id: number): Promise<void>

  // Custom operations specific to this service
  async customOperation(params: CustomParams): Promise<Result> {
    return this.client.get<Result>(`${this.endpoint}/custom`, params);
  }
}
```

### AI Tool Implementation Pattern

Every tool should follow this pattern:

```typescript
// src/lib/ai/tools/{tool-category}.ts

import { tool } from 'ai';
import { z } from 'zod';
import { createToolExecutor } from './utils';

export const categoryTools = {
  toolName: tool({
    description: 'Clear description of what the tool does',
    parameters: z.object({
      requiredParam: z.number().describe('Description of param'),
      optionalParam: z.string().optional().describe('Description'),
    }),
    execute: createToolExecutor(async (params, { services }) => {
      const result = await services.serviceName.operation(params);
      return {
        success: true,
        data: transformForAI(result),
      };
    }),
  }),
};
```

### Type Definition Pattern

```typescript
// src/lib/halopsa/types/{entity}.ts

export interface EntityName {
  id: number;
  // Required fields
  name: string;

  // Optional fields
  description?: string;
  created_at?: string;
  updated_at?: string;

  // Nested objects
  related?: RelatedEntity;
  custom_fields?: CustomField[];
}

export interface EntityCreateParams {
  // Only fields needed for creation
}

export interface EntityUpdateParams {
  id: number;
  // Fields that can be updated
}

// Response transformers
export function transformEntityResponse(raw: unknown): EntityName {
  // Transform snake_case to camelCase
  // Validate required fields
  // Return typed entity
}
```

---

## File Structure

### New Files to Create

```
src/lib/halopsa/
├── services/
│   ├── opportunities.ts      # Phase 1
│   ├── quotations.ts         # Phase 1
│   ├── sales-orders.ts       # Phase 1
│   ├── purchase-orders.ts    # Phase 1
│   ├── suppliers.ts          # Phase 1
│   ├── items.ts              # Phase 1
│   ├── appointments.ts       # Phase 2
│   ├── timesheets.ts         # Phase 2 (replaces billing.ts TimeEntry)
│   ├── todos.ts              # Phase 2
│   ├── canned-text.ts        # Phase 2
│   ├── approvals.ts          # Phase 3
│   ├── releases.ts           # Phase 3
│   ├── cab.ts                # Phase 3
│   ├── service-catalog.ts    # Phase 3
│   ├── ticket-rules.ts       # Phase 4
│   ├── webhooks.ts           # Phase 4
│   ├── search.ts             # Phase 4
│   ├── audit.ts              # Phase 4
│   ├── notifications.ts      # Phase 4
│   └── index.ts              # Update exports
├── types/
│   ├── opportunity.ts
│   ├── quotation.ts
│   ├── sales-order.ts
│   ├── purchase-order.ts
│   ├── supplier.ts
│   ├── item.ts
│   ├── appointment.ts
│   ├── timesheet.ts
│   ├── todo.ts
│   ├── canned-text.ts
│   ├── approval.ts
│   ├── release.ts
│   ├── cab.ts
│   ├── service.ts
│   ├── ticket-rule.ts
│   ├── webhook.ts
│   ├── audit.ts
│   ├── notification.ts
│   └── index.ts              # Update exports

src/lib/ai/tools/
├── opportunities.ts          # Phase 1
├── quotations.ts             # Phase 1
├── sales-orders.ts           # Phase 1
├── purchase-orders.ts        # Phase 1
├── suppliers.ts              # Phase 1
├── items.ts                  # Phase 1
├── appointments.ts           # Phase 2
├── timesheets.ts             # Phase 2
├── todos.ts                  # Phase 2
├── canned-text.ts            # Phase 2
├── approvals.ts              # Phase 3
├── releases.ts               # Phase 3
├── cab.ts                    # Phase 3
├── service-catalog.ts        # Phase 3
├── ticket-rules.ts           # Phase 4
├── webhooks.ts               # Phase 4
├── search.ts                 # Phase 4
├── audit.ts                  # Phase 4
├── notifications.ts          # Phase 4
└── index.ts                  # Update to include all tools
```

---

## Summary

### Phase Effort Estimates

| Phase | Priority | New Services | New Tools | Effort |
|-------|----------|--------------|-----------|--------|
| 0: Critical Fixes | Immediate | 0 (fixes) | 0 | 1-2 days |
| 1: Revenue & Sales | P0 | 6 | ~40 | 2-3 weeks |
| 2: Operations | P1 | 4 | ~35 | 2 weeks |
| 3: ITIL | P2 | 4 | ~25 | 2-3 weeks |
| 4: Productivity | P2 | 5 | ~25 | 2 weeks |
| 5: Integrations | P3 | 8+ | ~20 | 3-4 weeks |
| 6: Advanced | P3 | 14 | ~45 | 2-3 weeks |

**Total New Services:** ~41
**Total New AI Tools:** ~190
**Total Effort:** 12-17 weeks

### Coverage After Full Implementation

- **API Endpoints Covered:** 150+ (from current 31)
- **AI Tools Available:** 320+ (from current 129)
- **Business Process Coverage:** 95%+

---

## Next Steps

1. **Immediate:** Complete Phase 0 (Critical Fixes)
2. **Week 1-3:** Implement Phase 1 (Revenue & Sales)
3. **Week 4-5:** Implement Phase 2 (Operations)
4. **Week 6-8:** Implement Phase 3 (ITIL)
5. **Week 9-10:** Implement Phase 4 (Productivity)
6. **Week 11-14:** Implement Phase 5 (Integrations)
7. **Week 15-17:** Implement Phase 6 (Advanced)

---

*Document maintained by: Development Team*
*Last Updated: January 2026*

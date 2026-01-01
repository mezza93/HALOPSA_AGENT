/**
 * Test data factories for HaloPSA entities.
 */

import type {
  Report,
  Dashboard,
  DashboardWidget,
  ScheduledReport,
  Ticket,
  Action,
  TicketStats,
  MergeResult,
  DuplicateCandidate,
  Client,
  Site,
  User,
  Agent,
  AgentWorkload,
  Team,
} from '@/lib/halopsa/types';

let idCounter = 1000;

const nextId = () => idCounter++;

export const resetFactoryIds = () => {
  idCounter = 1000;
};

/**
 * Create a mock Report object.
 */
export function createReport(overrides: Partial<Report> = {}): Report {
  return {
    id: nextId(),
    name: `Test Report ${Date.now()}`,
    description: 'A test report',
    category: 'Tickets',
    sqlQuery: 'SELECT * FROM Faults',
    isShared: false,
    authorId: 1,
    authorName: 'Test User',
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock DashboardWidget object.
 */
export function createWidget(overrides: Partial<DashboardWidget> = {}): DashboardWidget {
  const id = nextId();
  return {
    id,
    dashboardId: overrides.dashboardId ?? 1,
    name: `Widget ${id}`,
    widgetType: 'chart',
    reportId: 1,
    width: 4,
    height: 2,
    positionX: 0,
    positionY: 0,
    ...overrides,
  };
}

/**
 * Create a mock Dashboard object.
 */
export function createDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: nextId(),
    name: `Test Dashboard ${Date.now()}`,
    description: 'A test dashboard',
    isShared: false,
    isDefault: false,
    authorId: 1,
    authorName: 'Test User',
    widgets: [],
    ...overrides,
  };
}

/**
 * Create a mock ScheduledReport object.
 */
export function createScheduledReport(overrides: Partial<ScheduledReport> = {}): ScheduledReport {
  return {
    id: nextId(),
    name: `Scheduled Report ${Date.now()}`,
    reportId: 1,
    reportName: 'Test Report',
    frequency: 'daily',
    recipients: ['test@example.com'],
    outputFormat: 'pdf',
    timeOfDay: '08:00',
    isActive: true,
    nextRun: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock Action object.
 */
export function createAction(overrides: Partial<Action> = {}): Action {
  return {
    id: nextId(),
    ticketId: overrides.ticketId ?? 1,
    note: 'Test action note',
    who: 'Test User',
    whoType: 1,
    outcome: 'Updated',
    outcomeId: 1,
    actionTime: new Date().toISOString(),
    timeTaken: 15,
    hiddenFromUser: false,
    ...overrides,
  };
}

/**
 * Create a mock Ticket object.
 */
export function createTicket(overrides: Partial<Ticket> = {}): Ticket {
  const id = overrides.id ?? nextId();
  return {
    id,
    summary: `Test Ticket ${id}`,
    details: 'Test ticket details',
    ticketTypeId: 1,
    ticketTypeName: 'Incident',
    category1: 'Hardware',
    category2: 'Laptop',
    statusId: 1,
    statusName: 'Open',
    priorityId: 3,
    priorityName: 'P3 - Medium',
    clientId: 1,
    clientName: 'Test Client',
    siteId: 1,
    siteName: 'Main Office',
    userId: 1,
    userName: 'Test User',
    agentId: 1,
    agentName: 'Test Agent',
    teamId: 1,
    teamName: 'Support Team',
    dateCreated: new Date().toISOString(),
    dateClosed: undefined,
    slaResponseState: 1,
    slaFixState: 1,
    actions: [],
    ...overrides,
  };
}

/**
 * Create mock TicketStats object.
 */
export function createTicketStats(overrides: Partial<TicketStats> = {}): TicketStats {
  return {
    total: 100,
    open: 75,
    closed: 25,
    slaBreached: 5,
    byStatus: { Open: 50, 'In Progress': 25, Closed: 25 },
    byPriority: { 'P1 - Critical': 5, 'P2 - High': 20, 'P3 - Medium': 50, 'P4 - Low': 25 },
    byAgent: { 'Agent 1': 30, 'Agent 2': 40, 'Agent 3': 30 },
    byClient: { 'Client A': 40, 'Client B': 35, 'Client C': 25 },
    ...overrides,
  };
}

/**
 * Create mock MergeResult object.
 */
export function createMergeResult(overrides: Partial<MergeResult> = {}): MergeResult {
  return {
    primaryTicketId: 1,
    mergedTickets: [
      { id: 2, summary: 'Merged Ticket 1', actionsCopied: 3 },
      { id: 3, summary: 'Merged Ticket 2', actionsCopied: 2 },
    ],
    actionsCopied: 5,
    errors: [],
    ...overrides,
  };
}

/**
 * Create mock DuplicateCandidate object.
 */
export function createDuplicateCandidate(overrides: Partial<DuplicateCandidate> = {}): DuplicateCandidate {
  return {
    ticketId: nextId(),
    summary: 'Potential duplicate ticket',
    status: 'Open',
    created: new Date().toISOString(),
    similarityScore: 0.85,
    matchingWords: ['issue', 'laptop', 'slow'],
    ...overrides,
  };
}

/**
 * Create a mock Client object.
 */
export function createClient(overrides: Partial<Client> = {}): Client {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `Test Client ${id}`,
    accountsEmailAddress: `client${id}@example.com`,
    inactive: false,
    notes: 'Test client notes',
    openTicketCount: 5,
    pritech: 1,
    pritechName: 'Primary Tech',
    accountManagerTech: 2,
    accountManagerTechName: 'Account Manager',
    ...overrides,
  };
}

/**
 * Create a mock Site object.
 */
export function createSite(overrides: Partial<Site> = {}): Site {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `Test Site ${id}`,
    clientId: overrides.clientId ?? 1,
    line1: '123 Test Street',
    line2: 'Suite 100',
    line3: 'Test City',
    postcode: '12345',
    country: 'USA',
    phoneNumber: '555-1234',
    inactive: false,
    mainSite: false,
    ...overrides,
  };
}

/**
 * Create a mock User object.
 */
export function createUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `Test User ${id}`,
    emailAddress: `user${id}@example.com`,
    phoneNumber: '555-5678',
    clientId: overrides.clientId ?? 1,
    clientName: 'Test Client',
    siteId: overrides.siteId ?? 1,
    siteName: 'Test Site',
    inactive: false,
    isImportantContact: false,
    neverSendEmails: false,
    isServiceAccount: false,
    ...overrides,
  };
}

/**
 * Create a mock Agent object.
 */
export function createAgent(overrides: Partial<Agent> = {}): Agent {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `Test Agent ${id}`,
    email: `agent${id}@example.com`,
    phoneNumber: '555-0001',
    mobileNumber: '555-0002',
    inactive: false,
    isEnabledForUnifiedWrite: true,
    isAdmin: false,
    teams: [],
    teamNames: ['Support Team'],
    role: 'Technician',
    departmentName: 'IT Department',
    ...overrides,
  };
}

/**
 * Create a mock AgentWorkload object.
 */
export function createAgentWorkload(overrides: Partial<AgentWorkload> = {}): AgentWorkload {
  return {
    agentId: overrides.agentId ?? 1,
    agentName: 'Test Agent',
    openTickets: 10,
    overdueTickets: 2,
    ticketsClosedToday: 5,
    ticketsClosedThisWeek: 25,
    averageResponseTime: 30,
    averageResolutionTime: 120,
    ...overrides,
  };
}

/**
 * Create a mock Team object.
 */
export function createTeam(overrides: Partial<Team> = {}): Team {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `Test Team ${id}`,
    description: 'A test team',
    inactive: false,
    agentCount: 5,
    departmentName: 'IT Department',
    openTicketCount: 15,
    ...overrides,
  };
}

/**
 * Create a mock HaloContext for testing tools.
 */
export function createMockHaloContext() {
  const mockReports = [
    createReport({ id: 1, name: 'Tickets by Priority', category: 'Tickets' }),
    createReport({ id: 2, name: 'Tickets by Status', category: 'Tickets' }),
    createReport({ id: 3, name: 'Agent Workload', category: 'Agents' }),
  ];

  const mockDashboards = [
    createDashboard({
      id: 1,
      name: 'Service Desk Dashboard',
      widgets: [
        createWidget({ id: 1, dashboardId: 1, name: 'Open Tickets', widgetType: 'counter' }),
        createWidget({ id: 2, dashboardId: 1, name: 'Priority Chart', widgetType: 'chart', reportId: 1 }),
      ],
    }),
  ];

  return {
    client: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
    reports: {
      list: vi.fn().mockResolvedValue(mockReports),
      get: vi.fn().mockImplementation((id: number) => {
        const report = mockReports.find(r => r.id === id);
        return Promise.resolve(report || mockReports[0]);
      }),
      search: vi.fn().mockImplementation((query: string) => {
        return Promise.resolve(mockReports.filter(r =>
          r.name.toLowerCase().includes(query.toLowerCase())
        ));
      }),
      run: vi.fn().mockResolvedValue({
        reportId: 1,
        reportName: 'Test Report',
        columns: ['Priority', 'Count'],
        rows: [{ Priority: 'High', Count: 10 }],
        rowCount: 1,
        executedAt: new Date().toISOString(),
      }),
      export: vi.fn().mockResolvedValue('Priority,Count\nHigh,10'),
      createCustomReport: vi.fn().mockImplementation((data) => {
        const report = createReport({ name: data.name, sqlQuery: data.sqlQuery });
        return Promise.resolve(report);
      }),
      update: vi.fn().mockImplementation((data) => {
        return Promise.resolve([createReport(data[0])]);
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockImplementation((id: number, newName?: string) => {
        const original = mockReports.find(r => r.id === id) || mockReports[0];
        return Promise.resolve(createReport({
          name: newName || `${original.name} (Copy)`,
          sqlQuery: original.sqlQuery,
        }));
      }),
      preview: vi.fn().mockResolvedValue({
        columns: ['Column1', 'Column2'],
        rows: [{ Column1: 'Value1', Column2: 100 }],
        rowCount: 1,
      }),
      getColumns: vi.fn().mockResolvedValue({
        columns: [{ name: 'Priority' }, { name: 'Count' }],
      }),
      listByCategory: vi.fn().mockImplementation((category: string) => {
        return Promise.resolve(mockReports.filter(r => r.category === category));
      }),
      scheduledReports: {
        list: vi.fn().mockResolvedValue([createScheduledReport()]),
        listByReport: vi.fn().mockResolvedValue([createScheduledReport()]),
        schedule: vi.fn().mockImplementation((data) => {
          return Promise.resolve(createScheduledReport(data));
        }),
      },
      dashboards: {
        list: vi.fn().mockResolvedValue(mockDashboards),
        listShared: vi.fn().mockResolvedValue(mockDashboards),
        get: vi.fn().mockImplementation((id: number) => {
          const dashboard = mockDashboards.find(d => d.id === id);
          return Promise.resolve(dashboard || mockDashboards[0]);
        }),
        createDashboard: vi.fn().mockImplementation((data) => {
          return Promise.resolve(createDashboard({ name: data.name, description: data.description }));
        }),
        updateDashboard: vi.fn().mockImplementation((id: number, data) => {
          const dashboard = mockDashboards.find(d => d.id === id) || mockDashboards[0];
          return Promise.resolve({ ...dashboard, ...data });
        }),
        deleteDashboard: vi.fn().mockResolvedValue(undefined),
        cloneDashboard: vi.fn().mockImplementation((id: number, newName?: string) => {
          const original = mockDashboards.find(d => d.id === id) || mockDashboards[0];
          return Promise.resolve(createDashboard({
            name: newName || `${original.name} (Copy)`,
            widgets: [...original.widgets],
          }));
        }),
        addWidget: vi.fn().mockImplementation((dashboardId: number, widget) => {
          const dashboard = mockDashboards.find(d => d.id === dashboardId) || mockDashboards[0];
          const newWidget = createWidget({ ...widget, dashboardId });
          return Promise.resolve({
            ...dashboard,
            widgets: [...dashboard.widgets, newWidget],
          });
        }),
        updateWidget: vi.fn().mockImplementation((dashboardId: number, widgetIndex: number, updates) => {
          const dashboard = mockDashboards.find(d => d.id === dashboardId) || mockDashboards[0];
          const widgets = [...dashboard.widgets];
          widgets[widgetIndex] = { ...widgets[widgetIndex], ...updates };
          return Promise.resolve({ ...dashboard, widgets });
        }),
        removeWidget: vi.fn().mockImplementation((dashboardId: number, widgetIndex: number) => {
          const dashboard = mockDashboards.find(d => d.id === dashboardId) || mockDashboards[0];
          const widgets = dashboard.widgets.filter((_, i) => i !== widgetIndex);
          return Promise.resolve({ ...dashboard, widgets });
        }),
        getWidgets: vi.fn().mockImplementation((dashboardId: number) => {
          const dashboard = mockDashboards.find(d => d.id === dashboardId) || mockDashboards[0];
          return Promise.resolve(dashboard.widgets);
        }),
        setShared: vi.fn().mockImplementation((dashboardId: number, isShared: boolean) => {
          const dashboard = mockDashboards.find(d => d.id === dashboardId) || mockDashboards[0];
          return Promise.resolve({ ...dashboard, isShared });
        }),
      },
    },
    reportRepository: {
      list: vi.fn().mockResolvedValue([
        { id: 1, name: 'Tickets by Priority', chartType: 0 },
        { id: 2, name: 'Agent Workload', chartType: 0 },
      ]),
      search: vi.fn().mockResolvedValue([
        { id: 1, name: 'Tickets by Priority', chartType: 0 },
      ]),
      get: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Tickets by Priority',
        sql: 'SELECT Priority, COUNT(*) as Count FROM Faults GROUP BY Priority',
        chartType: 0,
        xAxis: 'Priority',
        yAxis: 'Count',
      }),
      getCategories: vi.fn().mockResolvedValue([
        { id: 1, name: 'Tickets' },
        { id: 2, name: 'Agents' },
      ]),
      importReport: vi.fn().mockImplementation((id: number, reportService, options) => {
        return Promise.resolve(createReport({
          name: options.name || `Imported Report ${id}`,
        }));
      }),
      findAndImport: vi.fn().mockImplementation((keywords) => {
        return Promise.resolve(createReport({
          name: `Imported: ${keywords[0]}`,
        }));
      }),
    },
    // === TICKET SERVICE MOCKS ===
    tickets: {
      list: vi.fn().mockImplementation((params = {}) => {
        const tickets = [
          createTicket({ id: 1, summary: 'Server down', priorityName: 'P1 - Critical', statusName: 'Open' }),
          createTicket({ id: 2, summary: 'Email not working', priorityName: 'P2 - High', statusName: 'In Progress' }),
          createTicket({ id: 3, summary: 'Printer issue', priorityName: 'P3 - Medium', statusName: 'Open' }),
        ];
        if (params.client_id) {
          return Promise.resolve(tickets.filter(t => t.clientId === params.client_id));
        }
        if (params.agent_id) {
          return Promise.resolve(tickets.filter(t => t.agentId === params.agent_id));
        }
        return Promise.resolve(tickets);
      }),
      get: vi.fn().mockImplementation((id: number) => {
        return Promise.resolve(createTicket({ id, summary: `Ticket ${id}` }));
      }),
      getWithActions: vi.fn().mockImplementation((id: number) => {
        return Promise.resolve(createTicket({
          id,
          summary: `Ticket ${id}`,
          actions: [
            createAction({ id: 1, ticketId: id, note: 'Initial contact' }),
            createAction({ id: 2, ticketId: id, note: 'Investigating issue' }),
          ],
        }));
      }),
      search: vi.fn().mockImplementation((query: string, limit: number) => {
        return Promise.resolve([
          createTicket({ id: 1, summary: `${query} - matching ticket` }),
        ]);
      }),
      listOpen: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve([
          createTicket({ id: 1, summary: 'Open ticket 1', statusName: 'Open' }),
          createTicket({ id: 2, summary: 'Open ticket 2', statusName: 'In Progress' }),
        ]);
      }),
      listClosed: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve([
          createTicket({ id: 10, summary: 'Closed ticket', statusName: 'Closed', dateClosed: new Date().toISOString() }),
        ]);
      }),
      listSlaBreached: vi.fn().mockImplementation((count: number) => {
        return Promise.resolve([
          createTicket({ id: 5, summary: 'SLA Breached ticket', slaResponseState: 2 }),
        ]);
      }),
      listUnassigned: vi.fn().mockImplementation((count: number) => {
        return Promise.resolve([
          createTicket({ id: 7, summary: 'Unassigned ticket', agentId: undefined, agentName: undefined }),
        ]);
      }),
      getSummaryStats: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve(createTicketStats());
      }),
      create: vi.fn().mockImplementation((ticketData: Record<string, unknown>[]) => {
        const data = ticketData[0];
        return Promise.resolve([createTicket({
          summary: data.summary as string,
          details: data.details as string,
          clientId: data.clientId as number,
          clientName: 'Test Client',
          statusName: 'New',
        })]);
      }),
      update: vi.fn().mockImplementation((ticketData: Record<string, unknown>[]) => {
        const data = ticketData[0];
        return Promise.resolve([createTicket({
          id: data.id as number,
          summary: data.summary as string || 'Updated Ticket',
          statusName: data.statusId ? 'Updated Status' : 'Open',
          priorityName: data.priorityId ? 'Updated Priority' : 'P3 - Medium',
          agentName: data.agentId ? 'Assigned Agent' : undefined,
          teamName: data.teamId ? 'Assigned Team' : undefined,
        })]);
      }),
      addAction: vi.fn().mockImplementation((ticketId: number, note: string, options = {}) => {
        return Promise.resolve(createAction({ ticketId, note, hiddenFromUser: options.hiddenFromUser || false }));
      }),
      assign: vi.fn().mockImplementation((ticketId: number, params: { agentId?: number; teamId?: number }) => {
        return Promise.resolve(createTicket({
          id: ticketId,
          agentId: params.agentId,
          agentName: params.agentId ? `Agent ${params.agentId}` : undefined,
          teamId: params.teamId,
          teamName: params.teamId ? `Team ${params.teamId}` : undefined,
        }));
      }),
      close: vi.fn().mockImplementation((ticketId: number, note?: string) => {
        return Promise.resolve(createTicket({
          id: ticketId,
          statusName: 'Closed',
          dateClosed: new Date().toISOString(),
        }));
      }),
      mergeTickets: vi.fn().mockImplementation((primaryId: number, secondaryIds: number[], note?: string) => {
        return Promise.resolve(createMergeResult({
          primaryTicketId: primaryId,
          mergedTickets: secondaryIds.map(id => ({ id, summary: `Ticket ${id}`, actionsCopied: 2 })),
          actionsCopied: secondaryIds.length * 2,
          errors: [],
        }));
      }),
      findDuplicates: vi.fn().mockImplementation((ticketId: number, options = {}) => {
        return Promise.resolve({
          sourceTicket: { id: ticketId, summary: `Ticket ${ticketId}` },
          duplicates: [
            createDuplicateCandidate({ ticketId: 100, similarityScore: 0.9 }),
            createDuplicateCandidate({ ticketId: 101, similarityScore: 0.75 }),
          ],
        });
      }),
    },
    // === CLIENT SERVICE MOCKS ===
    clients: {
      list: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve([
          createClient({ id: 1, name: 'Acme Corp', openTicketCount: 10 }),
          createClient({ id: 2, name: 'TechStart Inc', openTicketCount: 5 }),
          createClient({ id: 3, name: 'Old Company', inactive: true, openTicketCount: 0 }),
        ]);
      }),
      listActive: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve([
          createClient({ id: 1, name: 'Acme Corp', openTicketCount: 10 }),
          createClient({ id: 2, name: 'TechStart Inc', openTicketCount: 5 }),
        ]);
      }),
      get: vi.fn().mockImplementation((id: number) => {
        return Promise.resolve(createClient({ id, name: `Client ${id}` }));
      }),
      search: vi.fn().mockImplementation((query: string, params = {}) => {
        return Promise.resolve([
          createClient({ id: 1, name: `${query} - matching client` }),
        ]);
      }),
      create: vi.fn().mockImplementation((clientData: Record<string, unknown>[]) => {
        const data = clientData[0];
        return Promise.resolve([createClient({
          name: data.name as string,
          accountsEmailAddress: data.accountsemailaddress as string,
          notes: data.notes as string,
        })]);
      }),
      update: vi.fn().mockImplementation((clientData: Record<string, unknown>[]) => {
        const data = clientData[0];
        return Promise.resolve([createClient({
          id: data.id as number,
          name: data.name as string || 'Updated Client',
          inactive: data.inactive as boolean,
        })]);
      }),
      sites: {
        listByClient: vi.fn().mockImplementation((clientId: number, params = {}) => {
          return Promise.resolve([
            createSite({ id: 1, clientId, name: 'Main Office', mainSite: true }),
            createSite({ id: 2, clientId, name: 'Branch Office' }),
          ]);
        }),
        get: vi.fn().mockImplementation((id: number) => {
          return Promise.resolve(createSite({ id, name: `Site ${id}` }));
        }),
        create: vi.fn().mockImplementation((siteData: Record<string, unknown>[]) => {
          const data = siteData[0];
          return Promise.resolve([createSite({
            name: data.name as string,
            clientId: data.client_id as number,
            mainSite: data.mainsite as boolean,
          })]);
        }),
        update: vi.fn().mockImplementation((siteData: Record<string, unknown>[]) => {
          const data = siteData[0];
          return Promise.resolve([createSite({
            id: data.id as number,
            name: data.name as string || 'Updated Site',
          })]);
        }),
      },
      users: {
        listByClient: vi.fn().mockImplementation((clientId: number, params = {}) => {
          return Promise.resolve([
            createUser({ id: 1, clientId, name: 'John Doe', isImportantContact: true }),
            createUser({ id: 2, clientId, name: 'Jane Smith' }),
          ]);
        }),
        listBySite: vi.fn().mockImplementation((siteId: number, params = {}) => {
          return Promise.resolve([
            createUser({ id: 1, siteId, name: 'Site User 1' }),
          ]);
        }),
        get: vi.fn().mockImplementation((id: number) => {
          return Promise.resolve(createUser({ id, name: `User ${id}` }));
        }),
        create: vi.fn().mockImplementation((userData: Record<string, unknown>[]) => {
          const data = userData[0];
          return Promise.resolve([createUser({
            name: data.name as string,
            clientId: data.client_id as number,
            emailAddress: data.emailaddress as string,
            isImportantContact: data.isimportantcontact as boolean,
          })]);
        }),
        update: vi.fn().mockImplementation((userData: Record<string, unknown>[]) => {
          const data = userData[0];
          return Promise.resolve([createUser({
            id: data.id as number,
            name: data.name as string || 'Updated User',
          })]);
        }),
      },
    },
    // === AGENT SERVICE MOCKS ===
    agents: {
      list: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve([
          createAgent({ id: 1, name: 'John Agent' }),
          createAgent({ id: 2, name: 'Jane Agent' }),
          createAgent({ id: 3, name: 'Inactive Agent', inactive: true }),
        ]);
      }),
      listActive: vi.fn().mockImplementation((count: number) => {
        return Promise.resolve([
          createAgent({ id: 1, name: 'John Agent' }),
          createAgent({ id: 2, name: 'Jane Agent' }),
        ]);
      }),
      listByTeam: vi.fn().mockImplementation((teamId: number) => {
        return Promise.resolve([
          createAgent({ id: 1, name: 'Team Member 1' }),
          createAgent({ id: 2, name: 'Team Member 2' }),
        ]);
      }),
      get: vi.fn().mockImplementation((id: number) => {
        return Promise.resolve(createAgent({ id, name: `Agent ${id}` }));
      }),
      getWorkloadStats: vi.fn().mockImplementation(() => {
        return Promise.resolve([
          createAgentWorkload({ agentId: 1, openTickets: 10, overdueTickets: 2 }),
          createAgentWorkload({ agentId: 2, openTickets: 8, overdueTickets: 1 }),
        ]);
      }),
      getAgentWorkload: vi.fn().mockImplementation((agentId: number) => {
        return Promise.resolve(createAgentWorkload({ agentId }));
      }),
      getAvailability: vi.fn().mockImplementation((agentId: number, params = {}) => {
        return Promise.resolve({
          agentId,
          agentName: `Agent ${agentId}`,
          startDate: params.startDate,
          endDate: params.endDate,
          isAvailable: true,
          slots: [
            { start: '09:00', end: '12:00', available: true },
            { start: '13:00', end: '17:00', available: true },
          ],
        });
      }),
      getCalendarEvents: vi.fn().mockImplementation((agentId: number, params = {}) => {
        return Promise.resolve([
          {
            id: 1,
            title: 'Team Meeting',
            startDateTime: '2024-01-15T10:00:00Z',
            endDateTime: '2024-01-15T11:00:00Z',
            eventType: 'meeting',
          },
          {
            id: 2,
            title: 'Client Call',
            startDateTime: '2024-01-15T14:00:00Z',
            endDateTime: '2024-01-15T15:00:00Z',
            eventType: 'appointment',
          },
        ]);
      }),
      createCalendarEvent: vi.fn().mockImplementation((agentId: number, eventData) => {
        return Promise.resolve({
          id: nextId(),
          ...eventData,
        });
      }),
      findAvailable: vi.fn().mockImplementation((params = {}) => {
        return Promise.resolve([
          { id: 1, name: 'Available Agent 1', email: 'agent1@example.com' },
          { id: 2, name: 'Available Agent 2', email: 'agent2@example.com' },
        ]);
      }),
      teams: {
        list: vi.fn().mockImplementation(() => {
          return Promise.resolve([
            createTeam({ id: 1, name: 'Support Team' }),
            createTeam({ id: 2, name: 'Development Team' }),
            createTeam({ id: 3, name: 'Inactive Team', inactive: true }),
          ]);
        }),
        listActive: vi.fn().mockImplementation(() => {
          return Promise.resolve([
            createTeam({ id: 1, name: 'Support Team' }),
            createTeam({ id: 2, name: 'Development Team' }),
          ]);
        }),
        get: vi.fn().mockImplementation((id: number) => {
          return Promise.resolve(createTeam({ id, name: `Team ${id}` }));
        }),
        getAvailability: vi.fn().mockImplementation((teamId: number, params = {}) => {
          return Promise.resolve({
            teamId,
            teamName: `Team ${teamId}`,
            date: params.date,
            totalAgents: 5,
            availableAgents: 4,
            agents: [
              { id: 1, name: 'Agent 1', isAvailable: true },
              { id: 2, name: 'Agent 2', isAvailable: true },
            ],
          });
        }),
      },
    },
    assets: { list: vi.fn(), get: vi.fn() },
    kb: { list: vi.fn(), search: vi.fn() },
    timeEntries: { list: vi.fn() },
    invoices: { list: vi.fn() },
    projects: { list: vi.fn() },
    contracts: { list: vi.fn() },
    configuration: {},
    attachments: { list: vi.fn() },
    opportunities: { list: vi.fn() },
    pipelineStages: { list: vi.fn() },
    quotations: { list: vi.fn() },
    salesOrders: { list: vi.fn() },
    suppliers: { list: vi.fn() },
    purchaseOrders: { list: vi.fn() },
    products: { list: vi.fn() },
    appointments: { list: vi.fn() },
    timesheets: { list: vi.fn() },
    timesheetEvents: { list: vi.fn() },
    activityTypes: { list: vi.fn() },
    todos: { list: vi.fn() },
    todoGroups: { list: vi.fn() },
    cannedTexts: { list: vi.fn() },
    cannedTextCategories: { list: vi.fn() },
    approvalProcesses: { list: vi.fn() },
    approvalProcessRules: { list: vi.fn() },
    ticketApprovals: { list: vi.fn() },
    releases: { list: vi.fn() },
    releaseTypes: { list: vi.fn() },
    releasePipelines: { list: vi.fn() },
    releasePipelineStages: { list: vi.fn() },
    cabs: { list: vi.fn() },
    cabMembers: { list: vi.fn() },
    cabRoles: { list: vi.fn() },
    cabMeetings: { list: vi.fn() },
    cabReviewItems: { list: vi.fn() },
    serviceCatalog: { list: vi.fn() },
    serviceCategories: { list: vi.fn() },
    serviceStatuses: { list: vi.fn() },
    serviceAvailability: { list: vi.fn() },
    scheduledMaintenance: { list: vi.fn() },
    serviceSubscribers: { list: vi.fn() },
    ticketRules: { list: vi.fn() },
    webhooks: { list: vi.fn() },
    webhookEvents: { list: vi.fn() },
    incomingWebhooks: { list: vi.fn() },
    search: { globalSearch: vi.fn() },
    savedSearches: { list: vi.fn() },
    recentSearches: { list: vi.fn() },
    audit: { list: vi.fn() },
    auditPolicies: { list: vi.fn() },
    entityHistory: { list: vi.fn() },
    securityEvents: { list: vi.fn() },
    notifications: { list: vi.fn() },
    notificationTemplates: { list: vi.fn() },
    notificationPreferences: { get: vi.fn() },
    notificationSubscriptions: { list: vi.fn() },
    notificationStats: { get: vi.fn() },
    integrations: { list: vi.fn() },
    integrationMappings: { list: vi.fn() },
    integrationSync: { trigger: vi.fn() },
    integrationLogs: { list: vi.fn() },
    externalEntities: { list: vi.fn() },
    azureAD: { getConfig: vi.fn() },
    intune: { getConfig: vi.fn() },
    slack: { getConfig: vi.fn() },
    teams: { getConfig: vi.fn() },
    ninjaRMM: { getConfig: vi.fn() },
    datto: { getConfig: vi.fn() },
    nAble: { getConfig: vi.fn() },
    currencies: { list: vi.fn() },
    taxes: { list: vi.fn() },
    taxRules: { list: vi.fn() },
    holidays: { list: vi.fn() },
    costCentres: { list: vi.fn() },
    budgetTypes: { list: vi.fn() },
    qualifications: { list: vi.fn() },
    agentQualifications: { list: vi.fn() },
    roadmaps: { list: vi.fn() },
    passwordFields: { list: vi.fn() },
    bookmarks: { list: vi.fn() },
    mailCampaigns: { list: vi.fn() },
    documentCreation: { list: vi.fn() },
    pdfTemplates: { list: vi.fn() },
    externalLinks: { list: vi.fn() },
    popupNotes: { list: vi.fn() },
  };
}

// Re-export vi for tests
import { vi } from 'vitest';

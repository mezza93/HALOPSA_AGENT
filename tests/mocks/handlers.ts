/**
 * MSW handlers for HaloPSA API mocking.
 */

import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://test.halopsa.com';

// Mock data factories
export const createMockReport = (overrides: Partial<{
  id: number;
  name: string;
  description: string;
  category: string;
  sql_query: string;
  is_shared: boolean;
}> = {}) => ({
  id: overrides.id ?? 1,
  name: overrides.name ?? 'Test Report',
  description: overrides.description ?? 'Test report description',
  category: overrides.category ?? 'Tickets',
  sql_query: overrides.sql_query ?? 'SELECT * FROM Faults',
  is_shared: overrides.is_shared ?? false,
  author_id: 1,
  author_name: 'Test User',
  datecreated: '2024-01-01T00:00:00Z',
  datemodified: '2024-01-01T00:00:00Z',
});

export const createMockDashboard = (overrides: Partial<{
  id: number;
  name: string;
  description: string;
  is_shared: boolean;
  widgets: Array<Record<string, unknown>>;
}> = {}) => ({
  id: overrides.id ?? 1,
  name: overrides.name ?? 'Test Dashboard',
  description: overrides.description ?? 'Test dashboard description',
  is_shared: overrides.is_shared ?? false,
  is_default: false,
  author_id: 1,
  author_name: 'Test User',
  widgets: overrides.widgets ?? [],
});

export const createMockWidget = (overrides: Partial<{
  id: number;
  i: string;
  title: string;
  type: number;
  report_id: number;
  filter_id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}> = {}) => ({
  id: overrides.id ?? 1,
  i: overrides.i ?? '1',
  title: overrides.title ?? 'Test Widget',
  type: overrides.type ?? 0,
  report_id: overrides.report_id ?? 1,
  filter_id: overrides.filter_id,
  x: overrides.x ?? 0,
  y: overrides.y ?? 0,
  w: overrides.w ?? 4,
  h: overrides.h ?? 2,
});

// State for tracking created entities (reset between tests)
let reports: Record<string, unknown>[] = [];
let dashboards: Record<string, unknown>[] = [];
let nextReportId = 1;
let nextDashboardId = 1;

export const resetMockState = () => {
  reports = [
    createMockReport({ id: 1, name: 'Tickets by Priority', category: 'Tickets' }),
    createMockReport({ id: 2, name: 'Tickets by Status', category: 'Tickets' }),
    createMockReport({ id: 3, name: 'Agent Workload', category: 'Agents' }),
  ];
  dashboards = [
    createMockDashboard({
      id: 1,
      name: 'Service Desk Dashboard',
      widgets: [
        createMockWidget({ id: 1, i: '1', title: 'Open Tickets', type: 7 }),
        createMockWidget({ id: 2, i: '2', title: 'Priority Chart', type: 0, report_id: 1 }),
      ],
    }),
  ];
  nextReportId = 100;
  nextDashboardId = 100;
};

// Initialize with default data
resetMockState();

export const haloHandlers = [
  // Auth endpoint
  http.post(`${BASE_URL}/auth/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }),

  // ========== REPORT ENDPOINTS ==========

  // List reports
  http.get(`${BASE_URL}/api/Report`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const category = url.searchParams.get('category');
    const count = parseInt(url.searchParams.get('count') || '50');

    let filtered = [...reports];

    if (search) {
      filtered = filtered.filter(r =>
        (r.name as string).toLowerCase().includes(search) ||
        (r.description as string)?.toLowerCase().includes(search)
      );
    }

    if (category) {
      filtered = filtered.filter(r => r.category === category);
    }

    return HttpResponse.json(filtered.slice(0, count));
  }),

  // Get single report
  http.get(`${BASE_URL}/api/Report/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const report = reports.find(r => r.id === id);

    if (!report) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return HttpResponse.json(report);
  }),

  // Create/update report
  http.post(`${BASE_URL}/api/Report`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>[];
    const data = body[0];

    if (data.id) {
      // Update existing
      const index = reports.findIndex(r => r.id === data.id);
      if (index >= 0) {
        reports[index] = { ...reports[index], ...data };
        return HttpResponse.json([reports[index]]);
      }
    }

    // Create new
    const newReport = createMockReport({
      id: nextReportId++,
      name: data.name as string,
      description: data.description as string,
      category: data.category as string,
      sql_query: data.sql as string,
      is_shared: data.isshared as boolean,
    });
    reports.push(newReport);
    return HttpResponse.json([newReport]);
  }),

  // Delete report
  http.delete(`${BASE_URL}/api/Report/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    reports = reports.filter(r => r.id !== id);
    return HttpResponse.json({ success: true });
  }),

  // Run report
  http.get(`${BASE_URL}/api/Report/:id/run`, ({ params }) => {
    const id = parseInt(params.id as string);
    const report = reports.find(r => r.id === id);

    if (!report) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return HttpResponse.json({
      columns: ['Priority', 'Count'],
      rows: [
        { Priority: 'High', Count: 10 },
        { Priority: 'Medium', Count: 25 },
        { Priority: 'Low', Count: 15 },
      ],
      record_count: 3,
    });
  }),

  // Export report
  http.get(`${BASE_URL}/api/Report/:id/export`, () => {
    return HttpResponse.text('Priority,Count\nHigh,10\nMedium,25\nLow,15');
  }),

  // Preview SQL
  http.post(`${BASE_URL}/api/Report/preview`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const sql = body.sql as string;

    // Simulate SQL validation
    if (sql.toLowerCase().includes('invalid')) {
      return HttpResponse.json({
        columns: [],
        rows: [],
        record_count: 0,
        error: 'Invalid SQL syntax',
      });
    }

    return HttpResponse.json({
      columns: ['Column1', 'Column2'],
      rows: [
        { Column1: 'Value1', Column2: 100 },
        { Column1: 'Value2', Column2: 200 },
      ],
      record_count: 2,
    });
  }),

  // ========== DASHBOARD ENDPOINTS ==========

  // List dashboards
  http.get(`${BASE_URL}/api/DashboardLinks`, ({ request }) => {
    const url = new URL(request.url);
    const isShared = url.searchParams.get('is_shared');
    const count = parseInt(url.searchParams.get('count') || '50');

    let filtered = [...dashboards];

    if (isShared === 'true') {
      filtered = filtered.filter(d => d.is_shared === true);
    }

    return HttpResponse.json(filtered.slice(0, count));
  }),

  // Get single dashboard
  http.get(`${BASE_URL}/api/DashboardLinks/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const dashboard = dashboards.find(d => d.id === id);

    if (!dashboard) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return HttpResponse.json(dashboard);
  }),

  // Create/update dashboard
  http.post(`${BASE_URL}/api/DashboardLinks`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>[];
    const data = body[0];

    if (data.id) {
      // Update existing
      const index = dashboards.findIndex(d => d.id === data.id);
      if (index >= 0) {
        dashboards[index] = { ...dashboards[index], ...data };
        return HttpResponse.json([dashboards[index]]);
      }
    }

    // Create new
    const newDashboard = createMockDashboard({
      id: nextDashboardId++,
      name: data.name as string,
      description: data.description as string,
      is_shared: data.is_shared as boolean,
      widgets: data.widgets as Array<Record<string, unknown>>,
    });
    dashboards.push(newDashboard);
    return HttpResponse.json([newDashboard]);
  }),

  // Delete dashboard
  http.delete(`${BASE_URL}/api/DashboardLinks/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    dashboards = dashboards.filter(d => d.id !== id);
    return HttpResponse.json({ success: true });
  }),

  // ========== SCHEDULED REPORT ENDPOINTS ==========

  http.get(`${BASE_URL}/api/ScheduledReport`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Daily Ticket Report',
        report_id: 1,
        report_name: 'Tickets by Priority',
        frequency: 'daily',
        recipients: ['admin@test.com'],
        output_format: 'pdf',
        is_active: true,
        next_run: '2024-01-02T08:00:00Z',
      },
    ]);
  }),

  http.post(`${BASE_URL}/api/ScheduledReport`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>[];
    const data = body[0];

    return HttpResponse.json([{
      id: 100,
      name: data.name,
      report_id: data.report_id,
      frequency: data.frequency,
      recipients: data.recipients,
      output_format: data.output_format,
      is_active: true,
      next_run: '2024-01-02T08:00:00Z',
    }]);
  }),

  // ========== REPORT REPOSITORY ENDPOINTS ==========

  http.get(`${BASE_URL}/api/ReportRepository`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();

    const repoReports = [
      { id: 1, name: 'Tickets by Priority', description: 'Show ticket counts by priority', charttype: 0, category: 'Tickets', sql: 'SELECT Priority, COUNT(*) as Count FROM Faults GROUP BY Priority' },
      { id: 2, name: 'Agent Workload Report', description: 'Show agent ticket counts', charttype: 0, category: 'Agents', sql: 'SELECT Agent, COUNT(*) as Count FROM Faults GROUP BY Agent' },
      { id: 3, name: 'SLA Performance', description: 'SLA compliance metrics', charttype: 1, category: 'SLA', sql: 'SELECT Status, COUNT(*) as Count FROM Faults GROUP BY Status' },
    ];

    let filtered = repoReports;
    if (search) {
      filtered = repoReports.filter(r =>
        r.name.toLowerCase().includes(search) ||
        r.description?.toLowerCase().includes(search)
      );
    }

    return HttpResponse.json(filtered);
  }),

  http.get(`${BASE_URL}/api/ReportRepository/:id`, ({ params }) => {
    return HttpResponse.json({
      id: parseInt(params.id as string),
      name: 'Repository Report',
      description: 'A report from the repository',
      sql: 'SELECT Priority, COUNT(*) as Count FROM Faults GROUP BY Priority',
      charttype: 0,
      xaxis: 'Priority',
      yaxis: 'Count',
    });
  }),

  http.get(`${BASE_URL}/api/ReportRepository/ReportCategories`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Tickets' },
      { id: 2, name: 'Agents' },
      { id: 3, name: 'SLA' },
      { id: 4, name: 'Clients' },
    ]);
  }),
];

// Export for tests that need to access mock data
export const getMockReports = () => [...reports];
export const getMockDashboards = () => [...dashboards];

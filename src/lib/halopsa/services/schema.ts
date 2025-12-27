/**
 * HaloPSA Schema Service
 *
 * Fetches actual database schema information from the HaloPSA API
 * to provide accurate table/column names for SQL report generation.
 */

import { HaloPSAClient } from '../client';

export interface LookupTable {
  id: number;
  name: string;
  group: string;
  lookupcodestart?: number;
  codebasedlookup?: boolean;
  showcode?: boolean;
  lookupcode?: string;
}

export interface LookupValue {
  id: number;
  name: string;
  lookup_id?: number;
  isarchived?: boolean;
  colour?: string;
}

export interface FieldDefinition {
  id: number;
  name: string;
  label?: string;
  type?: string;
  fieldtype?: number;
  entitytype?: number;
  isrequired?: boolean;
  isreadonly?: boolean;
  lookup_id?: number;
  characterlimit?: number;
}

export interface ReportableColumn {
  name: string;
  sqlName: string;
  dataType: string;
  description: string;
  table: string;
}

export interface SchemaInfo {
  lookupTables: LookupTable[];
  fields: FieldDefinition[];
  reportableViews: string[];
  commonTables: ReportableColumn[];
  lastUpdated: string;
}

/**
 * Service to fetch and cache HaloPSA schema information.
 */
export class SchemaService {
  private client: HaloPSAClient;
  private schemaCache: SchemaInfo | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor(client: HaloPSAClient) {
    this.client = client;
  }

  /**
   * Check if cache is valid.
   */
  private isCacheValid(): boolean {
    return this.schemaCache !== null && this.cacheExpiry !== null && new Date() < this.cacheExpiry;
  }

  /**
   * Fetch all lookup tables (reference data like statuses, priorities, etc.)
   */
  async getLookupTables(): Promise<LookupTable[]> {
    try {
      const response = await this.client.get<{ lookups?: LookupTable[] } | LookupTable[]>('/Lookup', {
        count: 500,
      });

      // Handle both array response and object with lookups property
      const lookups = Array.isArray(response) ? response : (response.lookups || []);

      return lookups.map((l) => ({
        id: (l as { id?: number }).id ?? 0,
        name: (l as { name?: string }).name ?? '',
        group: (l as { group?: string }).group || 'General',
        lookupcodestart: (l as { lookupcodestart?: number }).lookupcodestart,
        codebasedlookup: (l as { codebasedlookup?: boolean }).codebasedlookup,
        showcode: (l as { showcode?: boolean }).showcode,
        lookupcode: (l as { lookupcode?: string }).lookupcode,
      }));
    } catch (error) {
      console.error('[SchemaService] Failed to fetch lookup tables:', error);
      return [];
    }
  }

  /**
   * Fetch values for a specific lookup table.
   */
  async getLookupValues(lookupId: number): Promise<LookupValue[]> {
    try {
      const response = await this.client.get<LookupValue[]>(`/Lookup/${lookupId}`, {
        includedetails: true,
      });

      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`[SchemaService] Failed to fetch lookup values for ${lookupId}:`, error);
      return [];
    }
  }

  /**
   * Fetch custom field definitions.
   */
  async getFieldDefinitions(): Promise<FieldDefinition[]> {
    try {
      const response = await this.client.get<{ fields?: FieldDefinition[] } | FieldDefinition[]>('/Field', {
        count: 500,
      });

      const fields = Array.isArray(response) ? response : (response.fields || []);

      return fields.map((f) => ({
        id: (f as { id?: number }).id ?? 0,
        name: (f as { name?: string }).name ?? '',
        label: (f as { label?: string }).label,
        type: (f as { type?: string }).type,
        fieldtype: (f as { fieldtype?: number }).fieldtype,
        entitytype: (f as { entitytype?: number }).entitytype,
        isrequired: (f as { isrequired?: boolean }).isrequired,
        isreadonly: (f as { isreadonly?: boolean }).isreadonly,
        lookup_id: (f as { lookup_id?: number }).lookup_id,
        characterlimit: (f as { characterlimit?: number }).characterlimit,
      }));
    } catch (error) {
      console.error('[SchemaService] Failed to fetch field definitions:', error);
      return [];
    }
  }

  /**
   * Get information about available ticket statuses.
   */
  async getTicketStatuses(): Promise<Array<{ id: number; name: string; type: number }>> {
    try {
      const response = await this.client.get<Array<{ id: number; name: string; status_type?: number; tstatustype?: number }>>('/Status', {
        count: 100,
      });

      return (Array.isArray(response) ? response : []).map(s => ({
        id: s.id,
        name: s.name,
        type: s.status_type ?? s.tstatustype ?? 1, // 1=Open, 2=Closed, 3=Deleted
      }));
    } catch (error) {
      console.error('[SchemaService] Failed to fetch statuses:', error);
      return [];
    }
  }

  /**
   * Get information about priorities.
   */
  async getPriorities(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response = await this.client.get<Array<{ id: number; name: string }>>('/Priority', {
        count: 100,
      });

      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('[SchemaService] Failed to fetch priorities:', error);
      return [];
    }
  }

  /**
   * Get the known reportable columns for SQL queries.
   * These are columns that are confirmed to exist in HaloPSA.
   */
  getReportableColumns(): ReportableColumn[] {
    return [
      // Request_View columns (confirmed to exist)
      { name: 'Ticket Number', sqlName: '[Ticket Number]', dataType: 'int', description: 'Ticket ID', table: 'Request_View' },
      { name: 'Customer Name', sqlName: '[Customer Name]', dataType: 'nvarchar', description: 'Client/customer name', table: 'Request_View' },
      { name: 'Ticket Summary', sqlName: '[Ticket Summary]', dataType: 'nvarchar', description: 'Ticket title', table: 'Request_View' },
      { name: 'Priority Description', sqlName: '[Priority Description]', dataType: 'nvarchar', description: 'Priority name', table: 'Request_View' },
      { name: 'Status', sqlName: '[Status]', dataType: 'nvarchar', description: 'Status name', table: 'Request_View' },
      { name: 'Status ID', sqlName: '[Status ID]', dataType: 'smallint', description: 'Status ID', table: 'Request_View' },
      { name: 'Date Logged', sqlName: '[Date Logged]', dataType: 'datetime', description: 'When ticket was created', table: 'Request_View' },
      { name: 'Date Closed', sqlName: '[Date Closed]', dataType: 'datetime', description: 'When ticket was closed', table: 'Request_View' },
      { name: 'Category', sqlName: '[Category]', dataType: 'nvarchar', description: 'Ticket category', table: 'Request_View' },
      { name: 'User', sqlName: '[User]', dataType: 'nvarchar', description: 'Reporting user', table: 'Request_View' },
      { name: 'Site', sqlName: '[Site]', dataType: 'nvarchar', description: 'Site name', table: 'Request_View' },
      { name: 'SLA Compliance', sqlName: '[SLA Compliance]', dataType: 'nvarchar', description: 'SLA status', table: 'Request_View' },
      { name: 'Response Time', sqlName: '[Response Time]', dataType: 'float', description: 'Response time in hours', table: 'Request_View' },
      { name: 'Resolution Time', sqlName: '[Resolution Time]', dataType: 'float', description: 'Resolution time in hours', table: 'Request_View' },
      { name: 'Time Taken', sqlName: '[Time Taken]', dataType: 'float', description: 'Total time spent in hours', table: 'Request_View' },

      // FAULTS table columns
      { name: 'Faultid', sqlName: 'Faultid', dataType: 'int', description: 'Ticket ID', table: 'FAULTS' },
      { name: 'Status', sqlName: 'Status', dataType: 'smallint', description: 'Status ID (FK to TSTATUS)', table: 'FAULTS' },
      { name: 'seriousness', sqlName: 'seriousness', dataType: 'smallint', description: 'Priority level', table: 'FAULTS' },
      { name: 'dateoccured', sqlName: 'dateoccured', dataType: 'datetime', description: 'When issue occurred', table: 'FAULTS' },
      { name: 'datecleared', sqlName: 'datecleared', dataType: 'datetime', description: 'When closed', table: 'FAULTS' },
      { name: 'Assignedtoint', sqlName: 'Assignedtoint', dataType: 'smallint', description: 'Assigned agent ID', table: 'FAULTS' },
      { name: 'Clearwhoint', sqlName: 'Clearwhoint', dataType: 'smallint', description: 'Agent who closed', table: 'FAULTS' },
      { name: 'sitenumber', sqlName: 'sitenumber', dataType: 'int', description: 'Customer/site ID', table: 'FAULTS' },
      { name: 'Fdeleted', sqlName: 'Fdeleted', dataType: 'int', description: 'Deletion marker', table: 'FAULTS' },
      { name: 'fmergedintofaultid', sqlName: 'fmergedintofaultid', dataType: 'int', description: 'Merge target ID', table: 'FAULTS' },

      // UNAME table columns
      { name: 'Unum', sqlName: 'Unum', dataType: 'int', description: 'Agent ID', table: 'UNAME' },
      { name: 'uname', sqlName: 'uname', dataType: 'nvarchar', description: 'Agent name', table: 'UNAME' },
      { name: 'Uisdisabled', sqlName: 'Uisdisabled', dataType: 'bit', description: 'Is agent disabled', table: 'UNAME' },

      // SITE/AREA table columns
      { name: 'Ssitenum', sqlName: 'Ssitenum', dataType: 'int', description: 'Site/customer ID', table: 'SITE' },
      { name: 'sdesc', sqlName: 'sdesc', dataType: 'nvarchar', description: 'Site/customer name', table: 'SITE' },
      { name: 'Aarea', sqlName: 'Aarea', dataType: 'int', description: 'Area ID', table: 'AREA' },
      { name: 'Aaession', sqlName: 'Aaession', dataType: 'nvarchar', description: 'Area/client name', table: 'AREA' },

      // TSTATUS table columns
      { name: 'Tstatus', sqlName: 'Tstatus', dataType: 'smallint', description: 'Status ID', table: 'TSTATUS' },
      { name: 'tstatusdesc', sqlName: 'tstatusdesc', dataType: 'nvarchar', description: 'Status name', table: 'TSTATUS' },
      { name: 'TstatusType', sqlName: 'TstatusType', dataType: 'int', description: 'Status type (1=Open, 2=Closed, 3=Deleted)', table: 'TSTATUS' },

      // POLICY table columns (Priority)
      { name: 'Ppolicy', sqlName: 'Ppolicy', dataType: 'smallint', description: 'Priority ID', table: 'POLICY' },
      { name: 'Pdesc', sqlName: 'Pdesc', dataType: 'nvarchar', description: 'Priority name', table: 'POLICY' },

      // ACTIONS table columns
      { name: 'Atimetaken', sqlName: 'Atimetaken', dataType: 'float', description: 'Time taken for action', table: 'ACTIONS' },
      { name: 'Adate', sqlName: 'Adate', dataType: 'datetime', description: 'Action date', table: 'ACTIONS' },
      { name: 'Awho', sqlName: 'Awho', dataType: 'smallint', description: 'Agent who did action', table: 'ACTIONS' },
    ];
  }

  /**
   * Get complete schema information.
   */
  async getSchemaInfo(): Promise<SchemaInfo> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      return this.schemaCache!;
    }

    // Fetch fresh data
    const [lookupTables, fields] = await Promise.all([
      this.getLookupTables(),
      this.getFieldDefinitions(),
    ]);

    this.schemaCache = {
      lookupTables,
      fields,
      reportableViews: ['Request_View', 'Action_View', 'Asset_View'],
      commonTables: this.getReportableColumns(),
      lastUpdated: new Date().toISOString(),
    };

    this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL_MS);

    return this.schemaCache;
  }

  /**
   * Get SQL context for the AI including real schema information.
   */
  async getSqlContext(): Promise<string> {
    const schemaInfo = await this.getSchemaInfo();
    const statuses = await this.getTicketStatuses();
    const priorities = await this.getPriorities();

    const lines: string[] = [
      '=== HaloPSA SQL Report Context ===',
      '',
      'IMPORTANT: Only use tables and columns listed below. Other names will cause errors.',
      '',
      '=== RECOMMENDED: Use Request_View for most reports ===',
      'This view has pre-joined data with readable column names.',
      '',
      '### Request_View Columns (use [ ] for column names with spaces):',
    ];

    // Group columns by table
    const requestViewCols = schemaInfo.commonTables.filter(c => c.table === 'Request_View');
    for (const col of requestViewCols) {
      lines.push(`  ${col.sqlName}: ${col.dataType} - ${col.description}`);
    }

    lines.push('');
    lines.push('### Base Tables (for complex queries):');
    lines.push('');
    lines.push('FAULTS - Main tickets table:');
    const faultsCols = schemaInfo.commonTables.filter(c => c.table === 'FAULTS');
    for (const col of faultsCols) {
      lines.push(`  ${col.sqlName}: ${col.dataType} - ${col.description}`);
    }

    lines.push('');
    lines.push('UNAME - Agents table:');
    const unameCols = schemaInfo.commonTables.filter(c => c.table === 'UNAME');
    for (const col of unameCols) {
      lines.push(`  ${col.sqlName}: ${col.dataType} - ${col.description}`);
    }

    lines.push('');
    lines.push('TSTATUS - Status lookup:');
    const statusCols = schemaInfo.commonTables.filter(c => c.table === 'TSTATUS');
    for (const col of statusCols) {
      lines.push(`  ${col.sqlName}: ${col.dataType} - ${col.description}`);
    }

    lines.push('');
    lines.push('POLICY - Priority lookup:');
    const policyCols = schemaInfo.commonTables.filter(c => c.table === 'POLICY');
    for (const col of policyCols) {
      lines.push(`  ${col.sqlName}: ${col.dataType} - ${col.description}`);
    }

    // Add actual status values
    if (statuses.length > 0) {
      lines.push('');
      lines.push('### Your Ticket Statuses:');
      for (const s of statuses) {
        const typeLabel = s.type === 1 ? 'Open' : s.type === 2 ? 'Closed' : 'Deleted';
        lines.push(`  ID ${s.id}: "${s.name}" (${typeLabel})`);
      }
    }

    // Add actual priority values
    if (priorities.length > 0) {
      lines.push('');
      lines.push('### Your Priorities:');
      for (const p of priorities) {
        lines.push(`  ID ${p.id}: "${p.name}"`);
      }
    }

    lines.push('');
    lines.push('=== SQL Server Syntax Rules ===');
    lines.push('- Column names with spaces MUST use [ ] brackets: [Customer Name]');
    lines.push('- ORDER BY requires TOP clause: SELECT TOP 100 ... ORDER BY ...');
    lines.push('- Use GETDATE() for current date');
    lines.push('- Use DATEADD(day, -30, GETDATE()) for date ranges');
    lines.push('- Use COALESCE(column, \'default\') for null handling');
    lines.push('- Non-deleted tickets: WHERE Fdeleted = fmergedintofaultid');
    lines.push('- Open tickets: WHERE Status NOT IN (closed status IDs)');
    lines.push('');
    lines.push('=== Example Queries ===');
    lines.push('');
    lines.push('-- Tickets by Priority');
    lines.push(`SELECT TOP 100
    COALESCE([Priority Description], 'No Priority') AS [Priority],
    COUNT(*) AS [Count]
FROM Request_View
WHERE [Status ID] NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))
GROUP BY [Priority Description]`);
    lines.push('');
    lines.push('-- Agent Workload');
    lines.push(`SELECT TOP 20
    COALESCE(u.uname, 'Unassigned') AS [Agent],
    COUNT(*) AS [Open Tickets]
FROM FAULTS f
LEFT JOIN UNAME u ON f.Assignedtoint = u.Unum
WHERE f.Status NOT IN (SELECT Tstatus FROM TSTATUS WHERE TstatusType IN (2, 3))
    AND f.Fdeleted = f.fmergedintofaultid
GROUP BY u.uname`);

    return lines.join('\n');
  }

  /**
   * Clear the schema cache.
   */
  clearCache(): void {
    this.schemaCache = null;
    this.cacheExpiry = null;
  }
}

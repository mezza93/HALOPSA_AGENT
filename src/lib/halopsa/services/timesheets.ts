/**
 * Timesheet service for HaloPSA API.
 * Enhanced time tracking with approval workflows.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Timesheet,
  TimesheetApiResponse,
  TimesheetStatus,
  TimesheetEvent,
  TimesheetEventApiResponse,
  TimesheetSummary,
  ActivityType,
  ActivityTypeApiResponse,
  transformTimesheet,
  transformTimesheetEvent,
  transformActivityType,
} from '../types/timesheet';
import type { ListParams } from '../types';

/**
 * Service for managing timesheets.
 */
export class TimesheetService extends BaseService<Timesheet, TimesheetApiResponse> {
  protected endpoint = '/Timesheet';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: TimesheetApiResponse): Timesheet {
    return transformTimesheet(data);
  }

  /**
   * List timesheets with filters.
   */
  async listFiltered(params: {
    agentId?: number;
    status?: TimesheetStatus;
    periodStart?: string;
    periodEnd?: string;
    count?: number;
  }): Promise<Timesheet[]> {
    const queryParams: ListParams = {};

    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.status) queryParams.status = params.status;
    if (params.periodStart) queryParams.period_start = params.periodStart;
    if (params.periodEnd) queryParams.period_end = params.periodEnd;
    if (params.count) queryParams.count = params.count;

    return this.list(queryParams);
  }

  /**
   * Get the current timesheet for an agent.
   */
  async getCurrent(agentId: number): Promise<Timesheet | null> {
    const timesheets = await this.listFiltered({
      agentId,
      status: 'draft',
      count: 1,
    });
    return timesheets.length > 0 ? timesheets[0] : null;
  }

  /**
   * Submit a timesheet for approval.
   */
  async submit(timesheetId: number, notes?: string): Promise<Timesheet> {
    const updateData: Partial<Timesheet> = {
      id: timesheetId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    if (notes) {
      updateData.notes = notes;
    }

    const timesheets = await this.update([updateData]);
    if (timesheets.length === 0) {
      throw new Error('Failed to submit timesheet');
    }
    return timesheets[0];
  }

  /**
   * Approve a timesheet.
   */
  async approve(timesheetId: number, approverId: number, notes?: string): Promise<Timesheet> {
    const updateData: Partial<Timesheet> = {
      id: timesheetId,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: approverId,
    };
    if (notes) {
      updateData.notes = notes;
    }

    const timesheets = await this.update([updateData]);
    if (timesheets.length === 0) {
      throw new Error('Failed to approve timesheet');
    }
    return timesheets[0];
  }

  /**
   * Reject a timesheet.
   */
  async reject(timesheetId: number, reason: string): Promise<Timesheet> {
    const timesheets = await this.update([{
      id: timesheetId,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
    } as Partial<Timesheet>]);
    if (timesheets.length === 0) {
      throw new Error('Failed to reject timesheet');
    }
    return timesheets[0];
  }

  /**
   * Get pending timesheets awaiting approval.
   */
  async getPendingApproval(count?: number): Promise<Timesheet[]> {
    return this.listFiltered({
      status: 'submitted',
      count,
    });
  }
}

/**
 * Service for managing timesheet events (time entries).
 */
export class TimesheetEventService extends BaseService<TimesheetEvent, TimesheetEventApiResponse> {
  protected endpoint = '/TimesheetEvent';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: TimesheetEventApiResponse): TimesheetEvent {
    return transformTimesheetEvent(data);
  }

  /**
   * List timesheet events with filters.
   */
  async listFiltered(params: {
    timesheetId?: number;
    agentId?: number;
    ticketId?: number;
    clientId?: number;
    projectId?: number;
    startDate?: string;
    endDate?: string;
    isBillable?: boolean;
    count?: number;
  }): Promise<TimesheetEvent[]> {
    const queryParams: ListParams = {};

    if (params.timesheetId) queryParams.timesheet_id = params.timesheetId;
    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.ticketId) queryParams.ticket_id = params.ticketId;
    if (params.clientId) queryParams.client_id = params.clientId;
    if (params.projectId) queryParams.project_id = params.projectId;
    if (params.startDate) queryParams.start_date = params.startDate;
    if (params.endDate) queryParams.end_date = params.endDate;
    if (params.isBillable !== undefined) queryParams.is_billable = params.isBillable;
    if (params.count) queryParams.count = params.count;

    return this.list(queryParams);
  }

  /**
   * Log time for a ticket.
   */
  async logTime(data: {
    agentId: number;
    ticketId?: number;
    clientId?: number;
    projectId?: number;
    date: string;
    duration: number;
    description?: string;
    isBillable?: boolean;
    activityId?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<TimesheetEvent> {
    const entryData: Record<string, unknown> = {
      agent_id: data.agentId,
      date: data.date,
      duration: data.duration,
      duration_minutes: data.duration * 60,
      is_billable: data.isBillable ?? true,
    };

    if (data.ticketId) entryData.ticket_id = data.ticketId;
    if (data.clientId) entryData.client_id = data.clientId;
    if (data.projectId) entryData.project_id = data.projectId;
    if (data.description) entryData.description = data.description;
    if (data.activityId) entryData.activity_id = data.activityId;
    if (data.startTime) entryData.start_time = data.startTime;
    if (data.endTime) entryData.end_time = data.endTime;

    const events = await this.create([entryData as Partial<TimesheetEvent>]);
    if (events.length === 0) {
      throw new Error('Failed to log time');
    }
    return events[0];
  }

  /**
   * Start a timer for real-time tracking.
   */
  async startTimer(data: {
    agentId: number;
    ticketId?: number;
    clientId?: number;
    projectId?: number;
    description?: string;
    activityId?: number;
  }): Promise<TimesheetEvent> {
    const now = new Date();
    const entryData: Record<string, unknown> = {
      agent_id: data.agentId,
      date: now.toISOString().split('T')[0],
      start_time: now.toISOString(),
      duration: 0,
      is_billable: true,
    };

    if (data.ticketId) entryData.ticket_id = data.ticketId;
    if (data.clientId) entryData.client_id = data.clientId;
    if (data.projectId) entryData.project_id = data.projectId;
    if (data.description) entryData.description = data.description;
    if (data.activityId) entryData.activity_id = data.activityId;

    const events = await this.create([entryData as Partial<TimesheetEvent>]);
    if (events.length === 0) {
      throw new Error('Failed to start timer');
    }
    return events[0];
  }

  /**
   * Stop a running timer.
   */
  async stopTimer(eventId: number): Promise<TimesheetEvent> {
    const event = await this.get(eventId);
    if (!event.startTime) {
      throw new Error('Timer not started');
    }

    const startTime = new Date(event.startTime);
    const endTime = new Date();
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

    const events = await this.update([{
      id: eventId,
      endTime: endTime.toISOString(),
      duration: durationMinutes / 60,
      durationMinutes: Math.round(durationMinutes),
    } as Partial<TimesheetEvent>]);

    if (events.length === 0) {
      throw new Error('Failed to stop timer');
    }
    return events[0];
  }

  /**
   * Get summary of time entries for a period.
   */
  async getSummary(params: {
    agentId: number;
    startDate: string;
    endDate: string;
  }): Promise<TimesheetSummary> {
    const events = await this.listFiltered({
      agentId: params.agentId,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    const totalHours = events.reduce((sum, e) => sum + e.duration, 0);
    const billableHours = events.filter(e => e.isBillable).reduce((sum, e) => sum + e.duration, 0);
    const overtimeHours = events.filter(e => e.isOvertime).reduce((sum, e) => sum + e.duration, 0);

    // Group by client
    const byClientMap = new Map<number, { clientId: number; clientName: string; hours: number; billableHours: number; amount: number }>();
    for (const event of events) {
      if (event.clientId) {
        if (!byClientMap.has(event.clientId)) {
          byClientMap.set(event.clientId, {
            clientId: event.clientId,
            clientName: event.clientName || '',
            hours: 0,
            billableHours: 0,
            amount: 0,
          });
        }
        const entry = byClientMap.get(event.clientId)!;
        entry.hours += event.duration;
        if (event.isBillable) entry.billableHours += event.duration;
        if (event.amount) entry.amount += event.amount;
      }
    }

    // Group by project
    const byProjectMap = new Map<number, { projectId: number; projectName: string; hours: number; billableHours: number; amount: number }>();
    for (const event of events) {
      if (event.projectId) {
        if (!byProjectMap.has(event.projectId)) {
          byProjectMap.set(event.projectId, {
            projectId: event.projectId,
            projectName: event.projectName || '',
            hours: 0,
            billableHours: 0,
            amount: 0,
          });
        }
        const entry = byProjectMap.get(event.projectId)!;
        entry.hours += event.duration;
        if (event.isBillable) entry.billableHours += event.duration;
        if (event.amount) entry.amount += event.amount;
      }
    }

    // Group by activity
    const byActivityMap = new Map<number, { activityId: number; activityName: string; hours: number }>();
    for (const event of events) {
      if (event.activityId) {
        if (!byActivityMap.has(event.activityId)) {
          byActivityMap.set(event.activityId, {
            activityId: event.activityId,
            activityName: event.activityName || '',
            hours: 0,
          });
        }
        byActivityMap.get(event.activityId)!.hours += event.duration;
      }
    }

    // Group by day
    const byDayMap = new Map<string, { date: string; hours: number; billableHours: number; entryCount: number }>();
    for (const event of events) {
      if (!byDayMap.has(event.date)) {
        byDayMap.set(event.date, {
          date: event.date,
          hours: 0,
          billableHours: 0,
          entryCount: 0,
        });
      }
      const entry = byDayMap.get(event.date)!;
      entry.hours += event.duration;
      if (event.isBillable) entry.billableHours += event.duration;
      entry.entryCount += 1;
    }

    const totalAmount = events.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      agentId: params.agentId,
      periodStart: params.startDate,
      periodEnd: params.endDate,
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      overtimeHours,
      totalAmount: totalAmount || undefined,
      byClient: Array.from(byClientMap.values()),
      byProject: Array.from(byProjectMap.values()),
      byActivity: Array.from(byActivityMap.values()),
      byDay: Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}

/**
 * Service for managing activity types.
 */
export class ActivityTypeService extends BaseService<ActivityType, ActivityTypeApiResponse> {
  protected endpoint = '/ActivityType';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: ActivityTypeApiResponse): ActivityType {
    return transformActivityType(data);
  }

  /**
   * List active activity types.
   */
  async listActive(): Promise<ActivityType[]> {
    const activities = await this.list();
    return activities.filter(a => a.isActive);
  }

  /**
   * List billable activity types.
   */
  async listBillable(): Promise<ActivityType[]> {
    const activities = await this.list();
    return activities.filter(a => a.isActive && a.isBillable);
  }
}

/**
 * Appointment/Calendar service for HaloPSA API.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Appointment,
  AppointmentApiResponse,
  AppointmentStatus,
  AgentAvailability,
  CalendarView,
  transformAppointment,
} from '../types/appointment';
import type { ListParams } from '../types';

/**
 * Service for managing appointments and calendar entries.
 */
export class AppointmentService extends BaseService<Appointment, AppointmentApiResponse> {
  protected endpoint = '/Appointment';

  constructor(client: HaloPSAClient) {
    super(client);
  }

  protected transform(data: AppointmentApiResponse): Appointment {
    return transformAppointment(data);
  }

  /**
   * List appointments with filters.
   */
  async listFiltered(params: {
    agentId?: number;
    clientId?: number;
    ticketId?: number;
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    search?: string;
    count?: number;
  }): Promise<Appointment[]> {
    const queryParams: ListParams = {};

    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.clientId) queryParams.client_id = params.clientId;
    if (params.ticketId) queryParams.ticket_id = params.ticketId;
    if (params.startDate) queryParams.start_date = params.startDate;
    if (params.endDate) queryParams.end_date = params.endDate;
    if (params.status) queryParams.status = params.status;
    if (params.search) queryParams.search = params.search;
    if (params.count) queryParams.count = params.count;

    return this.list(queryParams);
  }

  /**
   * Get appointments for a specific date range (calendar view).
   */
  async getCalendarView(params: {
    startDate: string;
    endDate: string;
    agentId?: number;
    teamId?: number;
    clientId?: number;
  }): Promise<CalendarView> {
    const queryParams: ListParams = {
      start_date: params.startDate,
      end_date: params.endDate,
    };

    if (params.agentId) queryParams.agent_id = params.agentId;
    if (params.teamId) queryParams.team_id = params.teamId;
    if (params.clientId) queryParams.client_id = params.clientId;

    const appointments = await this.list(queryParams);

    // Group by agent
    const byAgentMap = new Map<number, { agentId: number; agentName: string; appointments: Appointment[] }>();
    for (const apt of appointments) {
      if (apt.agentId) {
        if (!byAgentMap.has(apt.agentId)) {
          byAgentMap.set(apt.agentId, {
            agentId: apt.agentId,
            agentName: apt.agentName || '',
            appointments: [],
          });
        }
        byAgentMap.get(apt.agentId)!.appointments.push(apt);
      }
    }

    // Group by client
    const byClientMap = new Map<number, { clientId: number; clientName: string; appointments: Appointment[] }>();
    for (const apt of appointments) {
      if (apt.clientId) {
        if (!byClientMap.has(apt.clientId)) {
          byClientMap.set(apt.clientId, {
            clientId: apt.clientId,
            clientName: apt.clientName || '',
            appointments: [],
          });
        }
        byClientMap.get(apt.clientId)!.appointments.push(apt);
      }
    }

    return {
      startDate: params.startDate,
      endDate: params.endDate,
      appointments,
      byAgent: Array.from(byAgentMap.values()),
      byClient: Array.from(byClientMap.values()),
    };
  }

  /**
   * Get agent availability for a date range.
   */
  async getAgentAvailability(params: {
    agentId: number;
    date: string;
    slotDurationMinutes?: number;
  }): Promise<AgentAvailability> {
    // Get appointments for that day
    const appointments = await this.listFiltered({
      agentId: params.agentId,
      startDate: params.date,
      endDate: params.date,
    });

    const slotDuration = params.slotDurationMinutes || 30;
    const workdayStart = 9; // 9 AM
    const workdayEnd = 17; // 5 PM
    const slots: AgentAvailability['slots'] = [];

    // Generate slots
    for (let hour = workdayStart; hour < workdayEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + slotDuration;
        const endHour = hour + Math.floor(endMinute / 60);
        const slotEnd = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;

        // Check if slot conflicts with any appointment
        const conflictingAppointment = appointments.find(apt => {
          if (!apt.startDate || !apt.endDate) return false;
          const aptStartTime = apt.startDate.split('T')[1]?.substring(0, 5) || '00:00';
          const aptEndTime = apt.endDate.split('T')[1]?.substring(0, 5) || '23:59';
          return slotStart < aptEndTime && slotEnd > aptStartTime;
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          isAvailable: !conflictingAppointment,
          appointmentId: conflictingAppointment?.id,
        });
      }
    }

    const totalMinutes = (workdayEnd - workdayStart) * 60;
    const bookedMinutes = appointments.reduce((sum, apt) => {
      const startTime = new Date(apt.startDate);
      const endTime = new Date(apt.endDate);
      return sum + (endTime.getTime() - startTime.getTime()) / 60000;
    }, 0);

    return {
      agentId: params.agentId,
      agentName: appointments[0]?.agentName || '',
      date: params.date,
      slots,
      totalAvailableMinutes: totalMinutes - bookedMinutes,
      totalBookedMinutes: bookedMinutes,
    };
  }

  /**
   * Schedule a new appointment.
   */
  async schedule(data: {
    subject: string;
    startDate: string;
    endDate: string;
    agentId?: number;
    clientId?: number;
    ticketId?: number;
    description?: string;
    location?: string;
    allDay?: boolean;
    reminderMinutes?: number;
    isPrivate?: boolean;
  }): Promise<Appointment> {
    const appointmentData: Record<string, unknown> = {
      subject: data.subject,
      start_date: data.startDate,
      end_date: data.endDate,
      all_day: data.allDay ?? false,
      is_private: data.isPrivate ?? false,
    };

    if (data.agentId) appointmentData.agent_id = data.agentId;
    if (data.clientId) appointmentData.client_id = data.clientId;
    if (data.ticketId) appointmentData.ticket_id = data.ticketId;
    if (data.description) appointmentData.description = data.description;
    if (data.location) appointmentData.location = data.location;
    if (data.reminderMinutes) appointmentData.reminder_minutes = data.reminderMinutes;

    const appointments = await this.create([appointmentData as Partial<Appointment>]);
    if (appointments.length === 0) {
      throw new Error('Failed to create appointment');
    }
    return appointments[0];
  }

  /**
   * Reschedule an appointment.
   */
  async reschedule(
    appointmentId: number,
    newStartDate: string,
    newEndDate: string
  ): Promise<Appointment> {
    const appointments = await this.update([{
      id: appointmentId,
      startDate: newStartDate,
      endDate: newEndDate,
    } as Partial<Appointment>]);
    if (appointments.length === 0) {
      throw new Error('Failed to reschedule appointment');
    }
    return appointments[0];
  }

  /**
   * Cancel an appointment.
   */
  async cancel(appointmentId: number, reason?: string): Promise<Appointment> {
    const updateData: Partial<Appointment> = {
      id: appointmentId,
      status: 'cancelled',
    };
    if (reason) {
      updateData.notes = reason;
    }

    const appointments = await this.update([updateData]);
    if (appointments.length === 0) {
      throw new Error('Failed to cancel appointment');
    }
    return appointments[0];
  }

  /**
   * Complete an appointment.
   */
  async complete(appointmentId: number, notes?: string): Promise<Appointment> {
    const updateData: Partial<Appointment> = {
      id: appointmentId,
      status: 'completed',
    };
    if (notes) {
      updateData.notes = notes;
    }

    const appointments = await this.update([updateData]);
    if (appointments.length === 0) {
      throw new Error('Failed to complete appointment');
    }
    return appointments[0];
  }

  /**
   * Confirm an appointment.
   */
  async confirm(appointmentId: number): Promise<Appointment> {
    const appointments = await this.update([{
      id: appointmentId,
      status: 'confirmed',
    } as Partial<Appointment>]);
    if (appointments.length === 0) {
      throw new Error('Failed to confirm appointment');
    }
    return appointments[0];
  }

  /**
   * Get upcoming appointments for an agent.
   */
  async getUpcoming(agentId: number, days: number = 7): Promise<Appointment[]> {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.listFiltered({
      agentId,
      startDate,
      endDate,
      status: 'scheduled',
    });
  }

  /**
   * Get overdue appointments (past appointments still marked as scheduled).
   */
  async getOverdue(agentId?: number): Promise<Appointment[]> {
    const now = new Date().toISOString();
    const appointments = await this.listFiltered({
      agentId,
      endDate: now.split('T')[0],
      status: 'scheduled',
    });

    return appointments.filter(apt => apt.endDate && apt.endDate < now);
  }
}

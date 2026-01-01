/**
 * Appointment/Calendar types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * Appointment status.
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/**
 * Appointment type (category).
 */
export type AppointmentType = 'onsite' | 'remote' | 'phone' | 'meeting' | 'training' | 'other';

/**
 * Appointment entity.
 */
export interface Appointment extends HaloBaseEntity {
  subject: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  status: AppointmentStatus;
  type?: AppointmentType;
  ticketId?: number;
  ticketNumber?: string;
  clientId?: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;
  userId?: number;
  userName?: string;
  agentId?: number;
  agentName?: string;
  teamId?: number;
  teamName?: string;
  location?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string;
  reminderMinutes?: number;
  notes?: string;
  color?: string;
  isPrivate: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw appointment from API.
 */
export interface AppointmentApiResponse {
  id: number;
  subject?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
  status?: string;
  type?: string;
  ticket_id?: number;
  ticket_number?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  user_id?: number;
  user_name?: string;
  agent_id?: number;
  agent_name?: string;
  team_id?: number;
  team_name?: string;
  location?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  reminder_minutes?: number;
  notes?: string;
  color?: string;
  is_private?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Appointment slot for availability checking.
 */
export interface AppointmentSlot {
  startDate: string;
  endDate: string;
  agentId?: number;
  agentName?: string;
  isAvailable: boolean;
}

/**
 * Agent availability for a date range.
 */
export interface AgentAvailability {
  agentId: number;
  agentName: string;
  date: string;
  slots: {
    start: string;
    end: string;
    isAvailable: boolean;
    appointmentId?: number;
  }[];
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
}

/**
 * Appointment calendar view data.
 */
export interface CalendarView {
  startDate: string;
  endDate: string;
  appointments: Appointment[];
  byAgent?: {
    agentId: number;
    agentName: string;
    appointments: Appointment[];
  }[];
  byClient?: {
    clientId: number;
    clientName: string;
    appointments: Appointment[];
  }[];
}

/**
 * Transform API response to Appointment interface.
 */
export function transformAppointment(data: AppointmentApiResponse): Appointment {
  const statusMap: Record<string, AppointmentStatus> = {
    scheduled: 'scheduled',
    confirmed: 'confirmed',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show',
  };

  const typeMap: Record<string, AppointmentType> = {
    onsite: 'onsite',
    remote: 'remote',
    phone: 'phone',
    meeting: 'meeting',
    training: 'training',
    other: 'other',
  };

  return {
    id: data.id,
    subject: data.subject || '',
    description: data.description,
    startDate: data.start_date || '',
    endDate: data.end_date || '',
    allDay: data.all_day ?? false,
    status: statusMap[data.status || ''] || 'scheduled',
    type: typeMap[data.type || ''],
    ticketId: data.ticket_id,
    ticketNumber: data.ticket_number,
    clientId: data.client_id,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    userId: data.user_id,
    userName: data.user_name,
    agentId: data.agent_id,
    agentName: data.agent_name,
    teamId: data.team_id,
    teamName: data.team_name,
    location: data.location,
    isRecurring: data.is_recurring ?? false,
    recurrencePattern: data.recurrence_pattern,
    recurrenceEndDate: data.recurrence_end_date,
    reminderMinutes: data.reminder_minutes,
    notes: data.notes,
    color: data.color,
    isPrivate: data.is_private ?? false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

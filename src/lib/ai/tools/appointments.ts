/**
 * Appointment/Calendar AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Appointment } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createAppointmentTools(ctx: HaloContext) {
  return {
    // === APPOINTMENT OPERATIONS ===
    listAppointments: tool({
      description: 'List appointments/calendar entries with optional filters.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
        ticketId: z.number().optional().describe('Filter by ticket ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional().describe('Filter by status'),
        search: z.string().optional().describe('Search appointments'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ agentId, clientId, ticketId, startDate, endDate, status, search, count }) => {
        try {
          const appointments = await ctx.appointments.listFiltered({
            agentId,
            clientId,
            ticketId,
            startDate,
            endDate,
            status,
            search,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: appointments.length,
            data: appointments.map((a: Appointment) => ({
              id: a.id,
              subject: a.subject,
              startDate: a.startDate,
              endDate: a.endDate,
              status: a.status,
              client: a.clientName,
              agent: a.agentName,
              location: a.location,
              ticketId: a.ticketId,
            })),
          };
        } catch (error) {
          return formatError(error, 'listAppointments');
        }
      },
    }),

    getAppointment: tool({
      description: 'Get detailed information about an appointment.',
      parameters: z.object({
        appointmentId: z.number().describe('The appointment ID'),
      }),
      execute: async ({ appointmentId }) => {
        try {
          const apt = await ctx.appointments.get(appointmentId);
          return {
            success: true,
            id: apt.id,
            subject: apt.subject,
            description: apt.description,
            startDate: apt.startDate,
            endDate: apt.endDate,
            allDay: apt.allDay,
            status: apt.status,
            type: apt.type,
            client: apt.clientName,
            clientId: apt.clientId,
            agent: apt.agentName,
            agentId: apt.agentId,
            location: apt.location,
            ticketId: apt.ticketId,
            ticketNumber: apt.ticketNumber,
            isRecurring: apt.isRecurring,
            notes: apt.notes,
          };
        } catch (error) {
          return formatError(error, 'getAppointment');
        }
      },
    }),

    scheduleAppointment: tool({
      description: 'Schedule a new appointment.',
      parameters: z.object({
        subject: z.string().describe('Appointment subject/title'),
        startDate: z.string().describe('Start date and time (ISO format)'),
        endDate: z.string().describe('End date and time (ISO format)'),
        agentId: z.number().optional().describe('Agent ID'),
        clientId: z.number().optional().describe('Client ID'),
        ticketId: z.number().optional().describe('Related ticket ID'),
        description: z.string().optional().describe('Appointment description'),
        location: z.string().optional().describe('Location'),
        allDay: z.boolean().optional().describe('Whether this is an all-day event'),
        reminderMinutes: z.number().optional().describe('Reminder before appointment in minutes'),
        isPrivate: z.boolean().optional().describe('Whether appointment is private'),
      }),
      execute: async ({ subject, startDate, endDate, agentId, clientId, ticketId, description, location, allDay, reminderMinutes, isPrivate }) => {
        try {
          const apt = await ctx.appointments.schedule({
            subject,
            startDate,
            endDate,
            agentId,
            clientId,
            ticketId,
            description,
            location,
            allDay,
            reminderMinutes,
            isPrivate,
          });

          return {
            success: true,
            appointmentId: apt.id,
            subject: apt.subject,
            startDate: apt.startDate,
            message: `Appointment "${apt.subject}" scheduled successfully`,
          };
        } catch (error) {
          return formatError(error, 'scheduleAppointment');
        }
      },
    }),

    rescheduleAppointment: tool({
      description: 'Reschedule an existing appointment to a new time.',
      parameters: z.object({
        appointmentId: z.number().describe('The appointment ID'),
        newStartDate: z.string().describe('New start date and time (ISO format)'),
        newEndDate: z.string().describe('New end date and time (ISO format)'),
      }),
      execute: async ({ appointmentId, newStartDate, newEndDate }) => {
        try {
          const apt = await ctx.appointments.reschedule(appointmentId, newStartDate, newEndDate);
          return {
            success: true,
            appointmentId: apt.id,
            newStartDate: apt.startDate,
            newEndDate: apt.endDate,
            message: `Appointment rescheduled to ${apt.startDate}`,
          };
        } catch (error) {
          return formatError(error, 'rescheduleAppointment');
        }
      },
    }),

    cancelAppointment: tool({
      description: 'Cancel an appointment.',
      parameters: z.object({
        appointmentId: z.number().describe('The appointment ID'),
        reason: z.string().optional().describe('Cancellation reason'),
      }),
      execute: async ({ appointmentId, reason }) => {
        try {
          const apt = await ctx.appointments.cancel(appointmentId, reason);
          return {
            success: true,
            appointmentId: apt.id,
            status: apt.status,
            message: 'Appointment cancelled successfully',
          };
        } catch (error) {
          return formatError(error, 'cancelAppointment');
        }
      },
    }),

    confirmAppointment: tool({
      description: 'Confirm an appointment.',
      parameters: z.object({
        appointmentId: z.number().describe('The appointment ID'),
      }),
      execute: async ({ appointmentId }) => {
        try {
          const apt = await ctx.appointments.confirm(appointmentId);
          return {
            success: true,
            appointmentId: apt.id,
            status: apt.status,
            message: 'Appointment confirmed',
          };
        } catch (error) {
          return formatError(error, 'confirmAppointment');
        }
      },
    }),

    completeAppointment: tool({
      description: 'Mark an appointment as completed.',
      parameters: z.object({
        appointmentId: z.number().describe('The appointment ID'),
        notes: z.string().optional().describe('Completion notes'),
      }),
      execute: async ({ appointmentId, notes }) => {
        try {
          const apt = await ctx.appointments.complete(appointmentId, notes);
          return {
            success: true,
            appointmentId: apt.id,
            status: apt.status,
            message: 'Appointment marked as completed',
          };
        } catch (error) {
          return formatError(error, 'completeAppointment');
        }
      },
    }),

    getCalendarView: tool({
      description: 'Get a calendar view of appointments for a date range.',
      parameters: z.object({
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().describe('End date (YYYY-MM-DD)'),
        agentId: z.number().optional().describe('Filter by agent ID'),
        teamId: z.number().optional().describe('Filter by team ID'),
        clientId: z.number().optional().describe('Filter by client ID'),
      }),
      execute: async ({ startDate, endDate, agentId, teamId, clientId }) => {
        try {
          const calendar = await ctx.appointments.getCalendarView({
            startDate,
            endDate,
            agentId,
            teamId,
            clientId,
          });

          return {
            success: true,
            startDate: calendar.startDate,
            endDate: calendar.endDate,
            totalAppointments: calendar.appointments.length,
            appointments: calendar.appointments.map((a: Appointment) => ({
              id: a.id,
              subject: a.subject,
              startDate: a.startDate,
              endDate: a.endDate,
              status: a.status,
              agent: a.agentName,
            })),
            byAgent: calendar.byAgent?.map((group: { agentId: number; agentName: string; appointments: Appointment[] }) => ({
              agent: group.agentName,
              appointmentCount: group.appointments.length,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCalendarView');
        }
      },
    }),

    getAgentAvailability: tool({
      description: 'Check agent availability for a specific date.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        date: z.string().describe('Date to check (YYYY-MM-DD)'),
        slotDurationMinutes: z.number().optional().default(30).describe('Slot duration in minutes'),
      }),
      execute: async ({ agentId, date, slotDurationMinutes }) => {
        try {
          const availability = await ctx.appointments.getAgentAvailability({
            agentId,
            date,
            slotDurationMinutes,
          });

          type Slot = { start: string; end: string; isAvailable: boolean; appointmentId?: number };
          const availableSlots = availability.slots.filter((s: Slot) => s.isAvailable);

          return {
            success: true,
            agentId: availability.agentId,
            agentName: availability.agentName,
            date: availability.date,
            totalAvailableMinutes: availability.totalAvailableMinutes,
            totalBookedMinutes: availability.totalBookedMinutes,
            availableSlotCount: availableSlots.length,
            availableSlots: availableSlots.slice(0, 10).map((s: Slot) => ({
              start: s.start,
              end: s.end,
            })),
          };
        } catch (error) {
          return formatError(error, 'getAgentAvailability');
        }
      },
    }),

    getUpcomingAppointments: tool({
      description: 'Get upcoming appointments for an agent.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        days: z.number().optional().default(7).describe('Number of days to look ahead'),
      }),
      execute: async ({ agentId, days }) => {
        try {
          const appointments = await ctx.appointments.getUpcoming(agentId, days);

          return {
            success: true,
            count: appointments.length,
            data: appointments.map((a: Appointment) => ({
              id: a.id,
              subject: a.subject,
              startDate: a.startDate,
              endDate: a.endDate,
              client: a.clientName,
              location: a.location,
            })),
          };
        } catch (error) {
          return formatError(error, 'getUpcomingAppointments');
        }
      },
    }),

    getOverdueAppointments: tool({
      description: 'Get overdue appointments that are still marked as scheduled.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
      }),
      execute: async ({ agentId }) => {
        try {
          const appointments = await ctx.appointments.getOverdue(agentId);

          return {
            success: true,
            count: appointments.length,
            data: appointments.map((a: Appointment) => ({
              id: a.id,
              subject: a.subject,
              endDate: a.endDate,
              client: a.clientName,
              agent: a.agentName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getOverdueAppointments');
        }
      },
    }),
  };
}

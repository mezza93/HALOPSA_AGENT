/**
 * Contract and SLA-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Contract, SLA, RecurringService } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const DEFAULT_EXPIRING_DAYS = 30;

export function createContractTools(ctx: HaloContext) {
  return {
    // === CONTRACT OPERATIONS ===
    listContracts: tool({
      description: 'List contracts with optional filters.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional().describe('Filter by status'),
        expiringWithinDays: z.number().optional().describe('Filter contracts expiring within N days'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, status, expiringWithinDays, count }) => {
        let contracts: Contract[];
        if (status === 'active') {
          contracts = await ctx.contracts.listActive({ clientId, count: count || DEFAULT_COUNT });
        } else if (expiringWithinDays) {
          contracts = await ctx.contracts.listExpiring({
            days: expiringWithinDays,
            count: count || DEFAULT_COUNT,
          });
        } else {
          contracts = await ctx.contracts.listFiltered({
            clientId,
            status,
            count: count || DEFAULT_COUNT,
          });
        }

        return contracts.map((c: Contract) => ({
          id: c.id,
          name: c.name,
          client: c.clientName,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
        }));
      },
    }),

    getContract: tool({
      description: 'Get detailed information about a contract.',
      parameters: z.object({
        contractId: z.number().describe('The contract ID'),
      }),
      execute: async ({ contractId }) => {
        const contract = await ctx.contracts.get(contractId);
        const prepaidRemaining = contract.prepaidHours && contract.prepaidHoursUsed
          ? contract.prepaidHours - contract.prepaidHoursUsed
          : undefined;
        return {
          id: contract.id,
          name: contract.name,
          client: contract.clientName,
          status: contract.status,
          type: contract.contractType,
          startDate: contract.startDate,
          endDate: contract.endDate,
          recurringAmount: contract.recurringAmount,
          billingCycle: contract.billingCycle,
          prepaidHours: contract.prepaidHours,
          prepaidHoursUsed: contract.prepaidHoursUsed,
          prepaidHoursRemaining: prepaidRemaining,
          slaId: contract.slaId,
          slaName: contract.slaName,
          autoRenew: contract.autoRenew,
          notes: contract.notes,
        };
      },
    }),

    createContract: tool({
      description: 'Create a new contract.',
      parameters: z.object({
        name: z.string().describe('Contract name'),
        clientId: z.number().describe('Client ID'),
        startDate: z.string().describe('Start date (YYYY-MM-DD)'),
        contractType: z.string().optional().describe('Contract type'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        recurringAmount: z.number().optional().describe('Recurring billing amount'),
        billingCycle: z.enum(['monthly', 'quarterly', 'yearly']).optional().describe('Billing cycle'),
        prepaidHours: z.number().optional().describe('Prepaid hours included'),
        slaId: z.number().optional().describe('SLA ID to apply'),
        autoRenew: z.boolean().optional().default(false).describe('Whether to auto-renew'),
        notes: z.string().optional().describe('Contract notes'),
      }),
      execute: async ({ name, clientId, startDate, contractType, endDate, recurringAmount, billingCycle, prepaidHours, slaId, autoRenew, notes }) => {
        const contractData: Record<string, unknown> = {
          name,
          clientId,
          startDate,
          autoRenew: autoRenew || false,
        };

        if (contractType) contractData.type = contractType;
        if (endDate) contractData.endDate = endDate;
        if (recurringAmount) contractData.recurringAmount = recurringAmount;
        if (billingCycle) contractData.billingCycle = billingCycle;
        if (prepaidHours) contractData.prepaidHours = prepaidHours;
        if (slaId) contractData.slaId = slaId;
        if (notes) contractData.notes = notes;

        const contracts = await ctx.contracts.create([contractData]);
        if (contracts && contracts.length > 0) {
          return {
            success: true,
            contractId: contracts[0].id,
            name: contracts[0].name,
          };
        }
        return { success: false, error: 'Failed to create contract' };
      },
    }),

    updateContract: tool({
      description: 'Update an existing contract.',
      parameters: z.object({
        contractId: z.number().describe('The contract ID'),
        name: z.string().optional().describe('New name'),
        status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional().describe('New status'),
        endDate: z.string().optional().describe('New end date'),
        recurringAmount: z.number().optional().describe('New recurring amount'),
        autoRenew: z.boolean().optional().describe('New auto-renew setting'),
      }),
      execute: async ({ contractId, name, status, endDate, recurringAmount, autoRenew }) => {
        const updateData: Record<string, unknown> = { id: contractId };

        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (endDate !== undefined) updateData.endDate = endDate;
        if (recurringAmount !== undefined) updateData.recurringAmount = recurringAmount;
        if (autoRenew !== undefined) updateData.autoRenew = autoRenew;

        const contracts = await ctx.contracts.update([updateData]);
        if (contracts && contracts.length > 0) {
          return {
            success: true,
            contractId: contracts[0].id,
            name: contracts[0].name,
          };
        }
        return { success: false, error: 'Failed to update contract' };
      },
    }),

    renewContract: tool({
      description: 'Renew a contract with a new end date.',
      parameters: z.object({
        contractId: z.number().describe('The contract ID to renew'),
        newEndDate: z.string().describe('New end date (YYYY-MM-DD)'),
        resetPrepaidHours: z.boolean().optional().default(true).describe('Reset prepaid hours counter'),
      }),
      execute: async ({ contractId, newEndDate, resetPrepaidHours }) => {
        const contract = await ctx.contracts.renew(contractId, {
          newEndDate,
          resetPrepaidHours: resetPrepaidHours !== false,
        });

        return {
          success: true,
          contractId: contract.id,
          newEndDate: contract.endDate,
        };
      },
    }),

    getExpiringContracts: tool({
      description: 'Get contracts that are expiring soon.',
      parameters: z.object({
        days: z.number().optional().default(DEFAULT_EXPIRING_DAYS).describe('Days to look ahead'),
      }),
      execute: async ({ days }) => {
        const contracts = await ctx.contracts.listExpiring({
          days: days || DEFAULT_EXPIRING_DAYS,
        });

        return contracts.map((c: Contract) => {
          const daysUntil = c.endDate
            ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : undefined;
          return {
            id: c.id,
            name: c.name,
            client: c.clientName,
            endDate: c.endDate,
            daysUntilExpiry: daysUntil,
          };
        });
      },
    }),

    getContractSummary: tool({
      description: 'Get contract statistics and summary.',
      parameters: z.object({}),
      execute: async () => {
        return ctx.contracts.getSummary();
      },
    }),

    // === SLA OPERATIONS ===
    listSlas: tool({
      description: 'List all SLAs (Service Level Agreements).',
      parameters: z.object({
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ isActive }) => {
        const slas = isActive !== false
          ? await ctx.contracts.slas.listActive()
          : await ctx.contracts.slas.list();

        return slas.map((s: SLA) => ({
          id: s.id,
          name: s.name,
          isDefault: s.isDefault,
          isActive: s.isActive,
        }));
      },
    }),

    getSla: tool({
      description: 'Get detailed information about an SLA including response/resolution targets.',
      parameters: z.object({
        slaId: z.number().describe('The SLA ID'),
      }),
      execute: async ({ slaId }) => {
        const sla = await ctx.contracts.slas.get(slaId);
        return {
          id: sla.id,
          name: sla.name,
          description: sla.description,
          isDefault: sla.isDefault,
          isActive: sla.isActive,
          targets: sla.targets,
        };
      },
    }),

    createSla: tool({
      description: 'Create a new SLA (Service Level Agreement).',
      parameters: z.object({
        name: z.string().describe('SLA name'),
        description: z.string().optional().describe('SLA description'),
        isDefault: z.boolean().optional().default(false).describe('Whether this is the default SLA'),
        isActive: z.boolean().optional().default(true).describe('Whether SLA is active'),
      }),
      execute: async ({ name, description, isDefault, isActive }) => {
        const slaData: Record<string, unknown> = {
          name,
          isDefault: isDefault || false,
          isActive: isActive !== false,
        };
        if (description) slaData.description = description;

        const slas = await ctx.contracts.slas.create([slaData]);
        if (slas && slas.length > 0) {
          return {
            success: true,
            slaId: slas[0].id,
            name: slas[0].name,
            message: `SLA '${name}' created successfully`,
          };
        }
        return { success: false, error: 'Failed to create SLA' };
      },
    }),

    createSlaTarget: tool({
      description: 'Create a new SLA target for a specific priority.',
      parameters: z.object({
        slaId: z.number().describe('The SLA ID'),
        priorityId: z.number().describe('Priority ID'),
        responseTimeMinutes: z.number().optional().describe('Response time target in minutes'),
        resolutionTimeMinutes: z.number().optional().describe('Resolution time target in minutes'),
        escalationTimeMinutes: z.number().optional().describe('Escalation time in minutes'),
      }),
      execute: async ({ slaId, priorityId, responseTimeMinutes, resolutionTimeMinutes, escalationTimeMinutes }) => {
        const target = await ctx.contracts.slas.createTarget(slaId, {
          priorityId,
          responseTimeMinutes,
          resolutionTimeMinutes,
          escalationTimeMinutes,
        });

        return {
          success: true,
          targetId: target.id,
        };
      },
    }),

    // === RECURRING SERVICE OPERATIONS ===
    listRecurringServices: tool({
      description: 'List recurring services (e.g., monthly maintenance).',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        contractId: z.number().optional().describe('Filter by contract ID'),
        isActive: z.boolean().optional().describe('Filter by active status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, contractId, isActive, count }) => {
        let services;
        if (clientId) {
          services = await ctx.contracts.recurringServices.listByClient(clientId, { count: count || DEFAULT_COUNT });
        } else if (contractId) {
          services = await ctx.contracts.recurringServices.listByContract(contractId, { count: count || DEFAULT_COUNT });
        } else if (isActive !== false) {
          services = await ctx.contracts.recurringServices.listActive({ count: count || DEFAULT_COUNT });
        } else {
          services = await ctx.contracts.recurringServices.list({ count: count || DEFAULT_COUNT });
        }

        return services.map((s: RecurringService) => ({
          id: s.id,
          name: s.name,
          client: s.clientName,
          totalPrice: s.unitPrice * s.quantity,
          billingFrequency: s.billingFrequency,
        }));
      },
    }),

    createRecurringService: tool({
      description: 'Create a new recurring service.',
      parameters: z.object({
        name: z.string().describe('Service name'),
        clientId: z.number().describe('Client ID'),
        unitPrice: z.number().describe('Price per unit'),
        quantity: z.number().optional().default(1).describe('Quantity'),
        billingFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional().default('monthly').describe('Billing frequency'),
        contractId: z.number().optional().describe('Associated contract ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        description: z.string().optional().describe('Service description'),
      }),
      execute: async ({ name, clientId, unitPrice, quantity, billingFrequency, contractId, startDate, description }) => {
        const serviceData: Record<string, unknown> = {
          name,
          clientId,
          unitPrice,
          quantity: quantity || 1,
          billingFrequency: billingFrequency || 'monthly',
        };

        if (contractId) serviceData.contractId = contractId;
        if (startDate) serviceData.startDate = startDate;
        if (description) serviceData.description = description;

        const services = await ctx.contracts.recurringServices.create([serviceData]);
        if (services && services.length > 0) {
          return {
            success: true,
            serviceId: services[0].id,
            name: services[0].name,
          };
        }
        return { success: false, error: 'Failed to create recurring service' };
      },
    }),
  };
}

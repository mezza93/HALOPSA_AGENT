/**
 * Advanced Feature AI tools for HaloPSA.
 * Phase 6: Advanced Features
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type {
  Currency,
  Tax,
  TaxRule,
  Holiday,
  CostCentre,
  BudgetType,
  Qualification,
  AgentQualification,
  Roadmap,
  PasswordField,
  Bookmark,
  MailCampaign,
  DocumentTemplate,
  GeneratedDocument,
  PdfTemplate,
  ExternalLink,
  PopupNote,
} from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createAdvancedTools(ctx: HaloContext) {
  return {
    // ========================================================================
    // CURRENCY TOOLS
    // ========================================================================
    listCurrencies: tool({
      description: 'List available currencies.',
      parameters: z.object({
        isActive: z.boolean().optional().describe('Filter by active status'),
        search: z.string().optional().describe('Search by name or code'),
      }),
      execute: async ({ isActive, search }) => {
        try {
          const currencies = await ctx.currencies.list({ isActive, search });
          return {
            success: true,
            count: currencies.length,
            data: currencies.map((c: Currency) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              symbol: c.symbol,
              exchangeRate: c.exchangeRate,
              isDefault: c.isDefault,
              isActive: c.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCurrencies');
        }
      },
    }),

    getDefaultCurrency: tool({
      description: 'Get the default currency.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const currency = await ctx.currencies.getDefault();
          return {
            success: true,
            id: currency.id,
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            exchangeRate: currency.exchangeRate,
          };
        } catch (error) {
          return formatError(error, 'getDefaultCurrency');
        }
      },
    }),

    updateExchangeRate: tool({
      description: 'Update currency exchange rate.',
      parameters: z.object({
        currencyId: z.number().describe('Currency ID'),
        rate: z.number().positive().describe('New exchange rate'),
      }),
      execute: async ({ currencyId, rate }) => {
        try {
          const currency = await ctx.currencies.updateExchangeRate(currencyId, rate);
          return {
            success: true,
            message: `Exchange rate updated for ${currency.code}`,
            newRate: currency.exchangeRate,
          };
        } catch (error) {
          return formatError(error, 'updateExchangeRate');
        }
      },
    }),

    // ========================================================================
    // TAX TOOLS
    // ========================================================================
    listTaxes: tool({
      description: 'List tax rates.',
      parameters: z.object({
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ isActive }) => {
        try {
          const taxes = await ctx.taxes.list({ isActive });
          return {
            success: true,
            count: taxes.length,
            data: taxes.map((t: Tax) => ({
              id: t.id,
              name: t.name,
              code: t.code,
              rate: t.rate,
              isDefault: t.isDefault,
              isActive: t.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTaxes');
        }
      },
    }),

    getDefaultTax: tool({
      description: 'Get the default tax rate.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const tax = await ctx.taxes.getDefault();
          return {
            success: true,
            id: tax.id,
            name: tax.name,
            code: tax.code,
            rate: tax.rate,
          };
        } catch (error) {
          return formatError(error, 'getDefaultTax');
        }
      },
    }),

    createTax: tool({
      description: 'Create a new tax rate.',
      parameters: z.object({
        name: z.string().describe('Tax name'),
        code: z.string().describe('Tax code'),
        rate: z.number().min(0).max(100).describe('Tax rate percentage'),
        description: z.string().optional().describe('Description'),
      }),
      execute: async ({ name, code, rate, description }) => {
        try {
          const tax = await ctx.taxes.create({ name, code, rate, description, isActive: true });
          return {
            success: true,
            message: `Tax "${tax.name}" created`,
            taxId: tax.id,
          };
        } catch (error) {
          return formatError(error, 'createTax');
        }
      },
    }),

    listTaxRules: tool({
      description: 'List tax rules.',
      parameters: z.object({
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ isActive }) => {
        try {
          const rules = await ctx.taxRules.list({ isActive });
          return {
            success: true,
            count: rules.length,
            data: rules.map((r: TaxRule) => ({
              id: r.id,
              name: r.name,
              taxId: r.taxId,
              taxName: r.taxName,
              entityType: r.entityType,
              priority: r.priority,
              isActive: r.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTaxRules');
        }
      },
    }),

    // ========================================================================
    // HOLIDAY TOOLS
    // ========================================================================
    listHolidays: tool({
      description: 'List holidays.',
      parameters: z.object({
        year: z.number().optional().describe('Filter by year'),
        countryCode: z.string().optional().describe('Filter by country code'),
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ year, countryCode, isActive }) => {
        try {
          const holidays = await ctx.holidays.list({ year, countryCode, isActive });
          return {
            success: true,
            count: holidays.length,
            data: holidays.map((h: Holiday) => ({
              id: h.id,
              name: h.name,
              date: h.date,
              endDate: h.endDate,
              isRecurring: h.isRecurring,
              countryCode: h.countryCode,
              isActive: h.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listHolidays');
        }
      },
    }),

    getUpcomingHolidays: tool({
      description: 'Get upcoming holidays.',
      parameters: z.object({
        days: z.number().optional().default(30).describe('Number of days to look ahead'),
      }),
      execute: async ({ days }) => {
        try {
          const holidays = await ctx.holidays.getUpcoming(days);
          return {
            success: true,
            count: holidays.length,
            data: holidays.map((h: Holiday) => ({
              id: h.id,
              name: h.name,
              date: h.date,
              isRecurring: h.isRecurring,
            })),
          };
        } catch (error) {
          return formatError(error, 'getUpcomingHolidays');
        }
      },
    }),

    createHoliday: tool({
      description: 'Create a new holiday.',
      parameters: z.object({
        name: z.string().describe('Holiday name'),
        date: z.string().describe('Holiday date (ISO format)'),
        endDate: z.string().optional().describe('End date for multi-day holidays'),
        isRecurring: z.boolean().optional().describe('Whether holiday recurs annually'),
        affectsAllAgents: z.boolean().optional().default(true).describe('Affects all agents'),
        countryCode: z.string().optional().describe('Country code'),
      }),
      execute: async ({ name, date, endDate, isRecurring, affectsAllAgents, countryCode }) => {
        try {
          const holiday = await ctx.holidays.create({
            name,
            date,
            endDate,
            isRecurring,
            affectsAllAgents,
            countryCode,
            isActive: true,
          });
          return {
            success: true,
            message: `Holiday "${holiday.name}" created`,
            holidayId: holiday.id,
          };
        } catch (error) {
          return formatError(error, 'createHoliday');
        }
      },
    }),

    // ========================================================================
    // COST CENTRE TOOLS
    // ========================================================================
    listCostCentres: tool({
      description: 'List cost centres.',
      parameters: z.object({
        parentId: z.number().optional().describe('Filter by parent ID'),
        isActive: z.boolean().optional().describe('Filter by active status'),
        search: z.string().optional().describe('Search by name or code'),
        includeChildren: z.boolean().optional().describe('Include child cost centres'),
      }),
      execute: async ({ parentId, isActive, search, includeChildren }) => {
        try {
          const costCentres = await ctx.costCentres.list({ parentId, isActive, search, includeChildren });
          return {
            success: true,
            count: costCentres.length,
            data: costCentres.map((c: CostCentre) => ({
              id: c.id,
              name: c.name,
              code: c.code,
              parentId: c.parentId,
              parentName: c.parentName,
              budget: c.budget,
              budgetPeriod: c.budgetPeriod,
              isActive: c.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listCostCentres');
        }
      },
    }),

    getCostCentreTree: tool({
      description: 'Get cost centre hierarchy tree.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const tree = await ctx.costCentres.getTree();
          return {
            success: true,
            count: tree.length,
            data: tree.map((c: CostCentre) => ({
              id: c.id,
              name: c.name,
              code: c.code,
              childCount: c.children?.length || 0,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCostCentreTree');
        }
      },
    }),

    createCostCentre: tool({
      description: 'Create a new cost centre.',
      parameters: z.object({
        name: z.string().describe('Cost centre name'),
        code: z.string().describe('Cost centre code'),
        description: z.string().optional().describe('Description'),
        parentId: z.number().optional().describe('Parent cost centre ID'),
        managerId: z.number().optional().describe('Manager agent ID'),
        budget: z.number().optional().describe('Budget amount'),
        budgetPeriod: z.string().optional().describe('Budget period'),
      }),
      execute: async ({ name, code, description, parentId, managerId, budget, budgetPeriod }) => {
        try {
          const costCentre = await ctx.costCentres.create({
            name,
            code,
            description,
            parentId,
            managerId,
            budget,
            budgetPeriod,
            isActive: true,
          });
          return {
            success: true,
            message: `Cost centre "${costCentre.name}" created`,
            costCentreId: costCentre.id,
          };
        } catch (error) {
          return formatError(error, 'createCostCentre');
        }
      },
    }),

    // ========================================================================
    // BUDGET TYPE TOOLS
    // ========================================================================
    listBudgetTypes: tool({
      description: 'List budget types.',
      parameters: z.object({
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ isActive }) => {
        try {
          const types = await ctx.budgetTypes.list({ isActive });
          return {
            success: true,
            count: types.length,
            data: types.map((t: BudgetType) => ({
              id: t.id,
              name: t.name,
              period: t.period,
              defaultAmount: t.defaultAmount,
              trackActuals: t.trackActuals,
              alertThreshold: t.alertThreshold,
              isActive: t.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listBudgetTypes');
        }
      },
    }),

    createBudgetType: tool({
      description: 'Create a new budget type.',
      parameters: z.object({
        name: z.string().describe('Budget type name'),
        description: z.string().optional().describe('Description'),
        period: z.enum(['monthly', 'quarterly', 'yearly', 'project']).describe('Budget period'),
        defaultAmount: z.number().optional().describe('Default budget amount'),
        trackActuals: z.boolean().optional().default(true).describe('Track actual spending'),
        alertThreshold: z.number().optional().describe('Alert threshold percentage'),
      }),
      execute: async ({ name, description, period, defaultAmount, trackActuals, alertThreshold }) => {
        try {
          const budgetType = await ctx.budgetTypes.create({
            name,
            description,
            period,
            defaultAmount,
            trackActuals,
            alertThreshold,
            isActive: true,
          });
          return {
            success: true,
            message: `Budget type "${budgetType.name}" created`,
            budgetTypeId: budgetType.id,
          };
        } catch (error) {
          return formatError(error, 'createBudgetType');
        }
      },
    }),

    // ========================================================================
    // QUALIFICATION TOOLS
    // ========================================================================
    listQualifications: tool({
      description: 'List qualifications.',
      parameters: z.object({
        category: z.string().optional().describe('Filter by category'),
        isActive: z.boolean().optional().describe('Filter by active status'),
        search: z.string().optional().describe('Search by name'),
      }),
      execute: async ({ category, isActive, search }) => {
        try {
          const qualifications = await ctx.qualifications.list({ category, isActive, search });
          return {
            success: true,
            count: qualifications.length,
            data: qualifications.map((q: Qualification) => ({
              id: q.id,
              name: q.name,
              category: q.category,
              level: q.level,
              expiryMonths: q.expiryMonths,
              requiresRenewal: q.requiresRenewal,
              isActive: q.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listQualifications');
        }
      },
    }),

    createQualification: tool({
      description: 'Create a new qualification.',
      parameters: z.object({
        name: z.string().describe('Qualification name'),
        description: z.string().optional().describe('Description'),
        category: z.string().optional().describe('Category'),
        level: z.number().optional().describe('Level'),
        expiryMonths: z.number().optional().describe('Months until expiry'),
        requiresRenewal: z.boolean().optional().default(false).describe('Requires renewal'),
      }),
      execute: async ({ name, description, category, level, expiryMonths, requiresRenewal }) => {
        try {
          const qualification = await ctx.qualifications.create({
            name,
            description,
            category,
            level,
            expiryMonths,
            requiresRenewal,
            isActive: true,
          });
          return {
            success: true,
            message: `Qualification "${qualification.name}" created`,
            qualificationId: qualification.id,
          };
        } catch (error) {
          return formatError(error, 'createQualification');
        }
      },
    }),

    listAgentQualifications: tool({
      description: 'List agent qualifications.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        qualificationId: z.number().optional().describe('Filter by qualification ID'),
        isExpired: z.boolean().optional().describe('Filter by expired status'),
        isExpiringSoon: z.boolean().optional().describe('Filter by expiring soon'),
      }),
      execute: async ({ agentId, qualificationId, isExpired, isExpiringSoon }) => {
        try {
          const qualifications = await ctx.agentQualifications.list({
            agentId,
            qualificationId,
            isExpired,
            isExpiringSoon,
          });
          return {
            success: true,
            count: qualifications.length,
            data: qualifications.map((q: AgentQualification) => ({
              id: q.id,
              agentId: q.agentId,
              agentName: q.agentName,
              qualificationId: q.qualificationId,
              qualificationName: q.qualificationName,
              obtainedDate: q.obtainedDate,
              expiryDate: q.expiryDate,
              isExpired: q.isExpired,
              isExpiringSoon: q.isExpiringSoon,
            })),
          };
        } catch (error) {
          return formatError(error, 'listAgentQualifications');
        }
      },
    }),

    getExpiringQualifications: tool({
      description: 'Get qualifications expiring soon.',
      parameters: z.object({
        days: z.number().optional().default(30).describe('Days until expiry'),
      }),
      execute: async ({ days }) => {
        try {
          const qualifications = await ctx.agentQualifications.getExpiring(days);
          return {
            success: true,
            count: qualifications.length,
            data: qualifications.map((q: AgentQualification) => ({
              id: q.id,
              agentName: q.agentName,
              qualificationName: q.qualificationName,
              expiryDate: q.expiryDate,
            })),
          };
        } catch (error) {
          return formatError(error, 'getExpiringQualifications');
        }
      },
    }),

    assignQualification: tool({
      description: 'Assign a qualification to an agent.',
      parameters: z.object({
        agentId: z.number().describe('Agent ID'),
        qualificationId: z.number().describe('Qualification ID'),
        obtainedDate: z.string().describe('Date obtained (ISO format)'),
        expiryDate: z.string().optional().describe('Expiry date (ISO format)'),
        certificateNumber: z.string().optional().describe('Certificate number'),
        notes: z.string().optional().describe('Notes'),
      }),
      execute: async ({ agentId, qualificationId, obtainedDate, expiryDate, certificateNumber, notes }) => {
        try {
          const qualification = await ctx.agentQualifications.assign(agentId, qualificationId, {
            obtainedDate,
            expiryDate,
            certificateNumber,
            notes,
          });
          return {
            success: true,
            message: `Qualification assigned to agent`,
            id: qualification.id,
          };
        } catch (error) {
          return formatError(error, 'assignQualification');
        }
      },
    }),

    // ========================================================================
    // ROADMAP TOOLS
    // ========================================================================
    listRoadmaps: tool({
      description: 'List roadmaps.',
      parameters: z.object({
        status: z.enum(['draft', 'active', 'completed', 'archived']).optional().describe('Filter by status'),
        ownerId: z.number().optional().describe('Filter by owner ID'),
        isPublic: z.boolean().optional().describe('Filter by public status'),
      }),
      execute: async ({ status, ownerId, isPublic }) => {
        try {
          const roadmaps = await ctx.roadmaps.list({ status, ownerId, isPublic });
          return {
            success: true,
            count: roadmaps.length,
            data: roadmaps.map((r: Roadmap) => ({
              id: r.id,
              name: r.name,
              status: r.status,
              startDate: r.startDate,
              endDate: r.endDate,
              ownerId: r.ownerId,
              ownerName: r.ownerName,
              milestoneCount: r.milestones?.length || 0,
              isPublic: r.isPublic,
            })),
          };
        } catch (error) {
          return formatError(error, 'listRoadmaps');
        }
      },
    }),

    getRoadmap: tool({
      description: 'Get roadmap details with milestones.',
      parameters: z.object({
        roadmapId: z.number().describe('Roadmap ID'),
      }),
      execute: async ({ roadmapId }) => {
        try {
          const roadmap = await ctx.roadmaps.get(roadmapId);
          return {
            success: true,
            id: roadmap.id,
            name: roadmap.name,
            description: roadmap.description,
            status: roadmap.status,
            startDate: roadmap.startDate,
            endDate: roadmap.endDate,
            ownerName: roadmap.ownerName,
            isPublic: roadmap.isPublic,
            milestones: roadmap.milestones?.map((m: { id: number; name: string; targetDate: string; status: string; progress: number }) => ({
              id: m.id,
              name: m.name,
              targetDate: m.targetDate,
              status: m.status,
              progress: m.progress,
            })),
          };
        } catch (error) {
          return formatError(error, 'getRoadmap');
        }
      },
    }),

    createRoadmap: tool({
      description: 'Create a new roadmap.',
      parameters: z.object({
        name: z.string().describe('Roadmap name'),
        description: z.string().optional().describe('Description'),
        startDate: z.string().optional().describe('Start date (ISO format)'),
        endDate: z.string().optional().describe('End date (ISO format)'),
        ownerId: z.number().optional().describe('Owner agent ID'),
        isPublic: z.boolean().optional().default(false).describe('Is publicly visible'),
      }),
      execute: async ({ name, description, startDate, endDate, ownerId, isPublic }) => {
        try {
          const roadmap = await ctx.roadmaps.create({
            name,
            description,
            startDate,
            endDate,
            ownerId,
            isPublic,
            status: 'draft',
          });
          return {
            success: true,
            message: `Roadmap "${roadmap.name}" created`,
            roadmapId: roadmap.id,
          };
        } catch (error) {
          return formatError(error, 'createRoadmap');
        }
      },
    }),

    addRoadmapMilestone: tool({
      description: 'Add a milestone to a roadmap.',
      parameters: z.object({
        roadmapId: z.number().describe('Roadmap ID'),
        name: z.string().describe('Milestone name'),
        description: z.string().optional().describe('Description'),
        targetDate: z.string().describe('Target date (ISO format)'),
      }),
      execute: async ({ roadmapId, name, description, targetDate }) => {
        try {
          const roadmap = await ctx.roadmaps.addMilestone(roadmapId, { name, description, targetDate });
          return {
            success: true,
            message: `Milestone "${name}" added`,
            milestoneCount: roadmap.milestones?.length || 0,
          };
        } catch (error) {
          return formatError(error, 'addRoadmapMilestone');
        }
      },
    }),

    // ========================================================================
    // PASSWORD FIELD TOOLS
    // ========================================================================
    listPasswordFields: tool({
      description: 'List password fields for an entity.',
      parameters: z.object({
        entityType: z.string().optional().describe('Entity type'),
        entityId: z.number().optional().describe('Entity ID'),
        isExpired: z.boolean().optional().describe('Filter by expired status'),
        search: z.string().optional().describe('Search by name'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ entityType, entityId, isExpired, search, count }) => {
        try {
          const fields = await ctx.passwordFields.list({ entityType, entityId, isExpired, search, pageSize: count });
          return {
            success: true,
            count: fields.length,
            data: fields.map((f: PasswordField) => ({
              id: f.id,
              name: f.name,
              entityType: f.entityType,
              entityId: f.entityId,
              username: f.username,
              url: f.url,
              lastRotated: f.lastRotated,
              isExpired: f.isExpired,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPasswordFields');
        }
      },
    }),

    createPasswordField: tool({
      description: 'Create a password field for an entity.',
      parameters: z.object({
        name: z.string().describe('Password field name'),
        entityType: z.string().describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        username: z.string().optional().describe('Username'),
        password: z.string().describe('Password'),
        url: z.string().optional().describe('URL'),
        notes: z.string().optional().describe('Notes'),
        expiryDays: z.number().optional().describe('Days until password expires'),
      }),
      execute: async ({ name, entityType, entityId, username, password, url, notes, expiryDays }) => {
        try {
          const field = await ctx.passwordFields.create({
            name,
            entityType,
            entityId,
            username,
            password,
            url,
            notes,
            expiryDays,
          });
          return {
            success: true,
            message: `Password field "${field.name}" created`,
            passwordFieldId: field.id,
          };
        } catch (error) {
          return formatError(error, 'createPasswordField');
        }
      },
    }),

    rotatePassword: tool({
      description: 'Rotate a password.',
      parameters: z.object({
        passwordFieldId: z.number().describe('Password field ID'),
        newPassword: z.string().describe('New password'),
      }),
      execute: async ({ passwordFieldId, newPassword }) => {
        try {
          const field = await ctx.passwordFields.rotate(passwordFieldId, newPassword);
          return {
            success: true,
            message: `Password rotated for "${field.name}"`,
            lastRotated: field.lastRotated,
          };
        } catch (error) {
          return formatError(error, 'rotatePassword');
        }
      },
    }),

    // ========================================================================
    // BOOKMARK TOOLS
    // ========================================================================
    listBookmarks: tool({
      description: 'List bookmarks.',
      parameters: z.object({
        agentId: z.number().optional().describe('Filter by agent ID'),
        category: z.string().optional().describe('Filter by category'),
        isGlobal: z.boolean().optional().describe('Filter by global status'),
      }),
      execute: async ({ agentId, category, isGlobal }) => {
        try {
          const bookmarks = await ctx.bookmarks.list({ agentId, category, isGlobal });
          return {
            success: true,
            count: bookmarks.length,
            data: bookmarks.map((b: Bookmark) => ({
              id: b.id,
              name: b.name,
              url: b.url,
              category: b.category,
              isGlobal: b.isGlobal,
            })),
          };
        } catch (error) {
          return formatError(error, 'listBookmarks');
        }
      },
    }),

    createBookmark: tool({
      description: 'Create a new bookmark.',
      parameters: z.object({
        name: z.string().describe('Bookmark name'),
        url: z.string().describe('URL'),
        description: z.string().optional().describe('Description'),
        category: z.string().optional().describe('Category'),
        isGlobal: z.boolean().optional().default(false).describe('Is global bookmark'),
      }),
      execute: async ({ name, url, description, category, isGlobal }) => {
        try {
          const bookmark = await ctx.bookmarks.create({ name, url, description, category, isGlobal });
          return {
            success: true,
            message: `Bookmark "${bookmark.name}" created`,
            bookmarkId: bookmark.id,
          };
        } catch (error) {
          return formatError(error, 'createBookmark');
        }
      },
    }),

    deleteBookmark: tool({
      description: 'Delete a bookmark.',
      parameters: z.object({
        bookmarkId: z.number().describe('Bookmark ID'),
      }),
      execute: async ({ bookmarkId }) => {
        try {
          await ctx.bookmarks.delete(bookmarkId);
          return {
            success: true,
            message: `Bookmark ${bookmarkId} deleted`,
          };
        } catch (error) {
          return formatError(error, 'deleteBookmark');
        }
      },
    }),

    // ========================================================================
    // MAIL CAMPAIGN TOOLS
    // ========================================================================
    listMailCampaigns: tool({
      description: 'List mail campaigns.',
      parameters: z.object({
        status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).optional().describe('Filter by status'),
        search: z.string().optional().describe('Search by name'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Max results'),
      }),
      execute: async ({ status, search, count }) => {
        try {
          const campaigns = await ctx.mailCampaigns.list({ status, search, pageSize: count });
          return {
            success: true,
            count: campaigns.length,
            data: campaigns.map((c: MailCampaign) => ({
              id: c.id,
              name: c.name,
              subject: c.subject,
              status: c.status,
              scheduledAt: c.scheduledAt,
              sentAt: c.sentAt,
              recipientCount: c.recipientCount,
              sentCount: c.sentCount,
              openedCount: c.openedCount,
            })),
          };
        } catch (error) {
          return formatError(error, 'listMailCampaigns');
        }
      },
    }),

    getMailCampaignStats: tool({
      description: 'Get mail campaign statistics.',
      parameters: z.object({
        campaignId: z.number().describe('Campaign ID'),
      }),
      execute: async ({ campaignId }) => {
        try {
          const stats = await ctx.mailCampaigns.getStats(campaignId);
          return {
            success: true,
            ...stats,
          };
        } catch (error) {
          return formatError(error, 'getMailCampaignStats');
        }
      },
    }),

    createMailCampaign: tool({
      description: 'Create a new mail campaign.',
      parameters: z.object({
        name: z.string().describe('Campaign name'),
        subject: z.string().describe('Email subject'),
        body: z.string().describe('Email body'),
        recipientType: z.enum(['clients', 'users', 'agents', 'custom']).describe('Recipient type'),
      }),
      execute: async ({ name, subject, body, recipientType }) => {
        try {
          const campaign = await ctx.mailCampaigns.create({ name, subject, body, recipientType });
          return {
            success: true,
            message: `Campaign "${campaign.name}" created as draft`,
            campaignId: campaign.id,
          };
        } catch (error) {
          return formatError(error, 'createMailCampaign');
        }
      },
    }),

    sendMailCampaign: tool({
      description: 'Send a mail campaign immediately.',
      parameters: z.object({
        campaignId: z.number().describe('Campaign ID'),
      }),
      execute: async ({ campaignId }) => {
        try {
          const campaign = await ctx.mailCampaigns.send(campaignId);
          return {
            success: true,
            message: `Campaign "${campaign.name}" is being sent`,
            status: campaign.status,
          };
        } catch (error) {
          return formatError(error, 'sendMailCampaign');
        }
      },
    }),

    scheduleMailCampaign: tool({
      description: 'Schedule a mail campaign.',
      parameters: z.object({
        campaignId: z.number().describe('Campaign ID'),
        scheduledAt: z.string().describe('Scheduled date/time (ISO format)'),
      }),
      execute: async ({ campaignId, scheduledAt }) => {
        try {
          const campaign = await ctx.mailCampaigns.schedule(campaignId, scheduledAt);
          return {
            success: true,
            message: `Campaign "${campaign.name}" scheduled`,
            scheduledAt: campaign.scheduledAt,
          };
        } catch (error) {
          return formatError(error, 'scheduleMailCampaign');
        }
      },
    }),

    // ========================================================================
    // DOCUMENT CREATION TOOLS
    // ========================================================================
    listDocumentTemplates: tool({
      description: 'List document templates.',
      parameters: z.object({
        templateType: z.enum(['word', 'excel', 'pdf', 'html']).optional().describe('Filter by type'),
        entityType: z.string().optional().describe('Filter by entity type'),
        isActive: z.boolean().optional().describe('Filter by active status'),
        search: z.string().optional().describe('Search by name'),
      }),
      execute: async ({ templateType, entityType, isActive, search }) => {
        try {
          const templates = await ctx.documentCreation.listTemplates({ templateType, entityType, isActive, search });
          return {
            success: true,
            count: templates.length,
            data: templates.map((t: DocumentTemplate) => ({
              id: t.id,
              name: t.name,
              templateType: t.templateType,
              entityType: t.entityType,
              variableCount: t.variables?.length || 0,
              isActive: t.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listDocumentTemplates');
        }
      },
    }),

    generateDocument: tool({
      description: 'Generate a document from a template.',
      parameters: z.object({
        templateId: z.number().describe('Template ID'),
        entityType: z.string().describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        variables: z.record(z.unknown()).optional().describe('Template variables'),
      }),
      execute: async ({ templateId, entityType, entityId, variables }) => {
        try {
          const document = await ctx.documentCreation.generate(templateId, entityType, entityId, variables);
          return {
            success: true,
            message: `Document "${document.name}" generated`,
            documentId: document.id,
            fileUrl: document.fileUrl,
          };
        } catch (error) {
          return formatError(error, 'generateDocument');
        }
      },
    }),

    listGeneratedDocuments: tool({
      description: 'List generated documents for an entity.',
      parameters: z.object({
        entityType: z.string().describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
      }),
      execute: async ({ entityType, entityId }) => {
        try {
          const documents = await ctx.documentCreation.listGenerated(entityType, entityId);
          return {
            success: true,
            count: documents.length,
            data: documents.map((d: GeneratedDocument) => ({
              id: d.id,
              name: d.name,
              templateName: d.templateName,
              format: d.format,
              fileUrl: d.fileUrl,
              generatedAt: d.generatedAt,
              generatedByName: d.generatedByName,
            })),
          };
        } catch (error) {
          return formatError(error, 'listGeneratedDocuments');
        }
      },
    }),

    // ========================================================================
    // PDF TEMPLATE TOOLS
    // ========================================================================
    listPdfTemplates: tool({
      description: 'List PDF templates.',
      parameters: z.object({
        entityType: z.string().optional().describe('Filter by entity type'),
        isActive: z.boolean().optional().describe('Filter by active status'),
        search: z.string().optional().describe('Search by name'),
      }),
      execute: async ({ entityType, isActive, search }) => {
        try {
          const templates = await ctx.pdfTemplates.list({ entityType, isActive, search });
          return {
            success: true,
            count: templates.length,
            data: templates.map((t: PdfTemplate) => ({
              id: t.id,
              name: t.name,
              entityType: t.entityType,
              pageSize: t.pageSize,
              orientation: t.orientation,
              isDefault: t.isDefault,
              isActive: t.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPdfTemplates');
        }
      },
    }),

    getDefaultPdfTemplate: tool({
      description: 'Get the default PDF template for an entity type.',
      parameters: z.object({
        entityType: z.string().describe('Entity type'),
      }),
      execute: async ({ entityType }) => {
        try {
          const template = await ctx.pdfTemplates.getDefault(entityType);
          if (!template) {
            return { success: false, error: `No default PDF template for ${entityType}` };
          }
          return {
            success: true,
            id: template.id,
            name: template.name,
            pageSize: template.pageSize,
            orientation: template.orientation,
          };
        } catch (error) {
          return formatError(error, 'getDefaultPdfTemplate');
        }
      },
    }),

    previewPdfTemplate: tool({
      description: 'Preview a PDF template with entity data.',
      parameters: z.object({
        templateId: z.number().describe('Template ID'),
        entityType: z.string().describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
      }),
      execute: async ({ templateId, entityType, entityId }) => {
        try {
          const result = await ctx.pdfTemplates.preview(templateId, entityType, entityId);
          return {
            success: true,
            previewUrl: result.url,
          };
        } catch (error) {
          return formatError(error, 'previewPdfTemplate');
        }
      },
    }),

    // ========================================================================
    // EXTERNAL LINK TOOLS
    // ========================================================================
    listExternalLinks: tool({
      description: 'List external links for an entity.',
      parameters: z.object({
        entityType: z.string().optional().describe('Entity type'),
        entityId: z.number().optional().describe('Entity ID'),
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ entityType, entityId, isActive }) => {
        try {
          const links = await ctx.externalLinks.list({ entityType, entityId, isActive });
          return {
            success: true,
            count: links.length,
            data: links.map((l: ExternalLink) => ({
              id: l.id,
              name: l.name,
              url: l.url,
              entityType: l.entityType,
              entityId: l.entityId,
              openInNewTab: l.openInNewTab,
              isActive: l.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listExternalLinks');
        }
      },
    }),

    createExternalLink: tool({
      description: 'Create an external link for an entity.',
      parameters: z.object({
        name: z.string().describe('Link name'),
        url: z.string().describe('URL'),
        entityType: z.string().describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        description: z.string().optional().describe('Description'),
        openInNewTab: z.boolean().optional().default(true).describe('Open in new tab'),
      }),
      execute: async ({ name, url, entityType, entityId, description, openInNewTab }) => {
        try {
          const link = await ctx.externalLinks.create({
            name,
            url,
            entityType,
            entityId,
            description,
            openInNewTab,
            isActive: true,
          });
          return {
            success: true,
            message: `External link "${link.name}" created`,
            linkId: link.id,
          };
        } catch (error) {
          return formatError(error, 'createExternalLink');
        }
      },
    }),

    // ========================================================================
    // POPUP NOTE TOOLS
    // ========================================================================
    listPopupNotes: tool({
      description: 'List popup notes for an entity.',
      parameters: z.object({
        entityType: z.string().optional().describe('Entity type'),
        entityId: z.number().optional().describe('Entity ID'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Filter by priority'),
        isActive: z.boolean().optional().describe('Filter by active status'),
      }),
      execute: async ({ entityType, entityId, priority, isActive }) => {
        try {
          const notes = await ctx.popupNotes.list({ entityType, entityId, priority, isActive });
          return {
            success: true,
            count: notes.length,
            data: notes.map((n: PopupNote) => ({
              id: n.id,
              title: n.title,
              entityType: n.entityType,
              entityId: n.entityId,
              priority: n.priority,
              requireAcknowledgement: n.requireAcknowledgement,
              expiresAt: n.expiresAt,
              isActive: n.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPopupNotes');
        }
      },
    }),

    getCriticalPopupNotes: tool({
      description: 'Get critical priority popup notes.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const notes = await ctx.popupNotes.getCritical();
          return {
            success: true,
            count: notes.length,
            data: notes.map((n: PopupNote) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              entityType: n.entityType,
              entityId: n.entityId,
              createdByName: n.createdByName,
            })),
          };
        } catch (error) {
          return formatError(error, 'getCriticalPopupNotes');
        }
      },
    }),

    createPopupNote: tool({
      description: 'Create a popup note for an entity.',
      parameters: z.object({
        title: z.string().describe('Note title'),
        content: z.string().describe('Note content'),
        entityType: z.string().describe('Entity type'),
        entityId: z.number().describe('Entity ID'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium').describe('Priority'),
        showOnLoad: z.boolean().optional().default(true).describe('Show on entity load'),
        requireAcknowledgement: z.boolean().optional().default(false).describe('Require acknowledgement'),
        expiresAt: z.string().optional().describe('Expiry date (ISO format)'),
      }),
      execute: async ({ title, content, entityType, entityId, priority, showOnLoad, requireAcknowledgement, expiresAt }) => {
        try {
          const note = await ctx.popupNotes.create({
            title,
            content,
            entityType,
            entityId,
            priority,
            showOnLoad,
            requireAcknowledgement,
            expiresAt,
            isActive: true,
          });
          return {
            success: true,
            message: `Popup note "${note.title}" created`,
            noteId: note.id,
          };
        } catch (error) {
          return formatError(error, 'createPopupNote');
        }
      },
    }),

    acknowledgePopupNote: tool({
      description: 'Acknowledge a popup note.',
      parameters: z.object({
        noteId: z.number().describe('Popup note ID'),
        agentId: z.number().describe('Agent ID acknowledging'),
      }),
      execute: async ({ noteId, agentId }) => {
        try {
          const note = await ctx.popupNotes.acknowledge(noteId, agentId);
          return {
            success: true,
            message: `Note "${note.title}" acknowledged`,
          };
        } catch (error) {
          return formatError(error, 'acknowledgePopupNote');
        }
      },
    }),
  };
}

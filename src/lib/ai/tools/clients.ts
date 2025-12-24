/**
 * Client-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Client, Site, User } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const MAX_PAGE_SIZE = 100;

function formatSiteAddress(site: Site): string | undefined {
  const parts = [site.line1, site.line2, site.line3, site.line4, site.postcode, site.country]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function createClientTools(ctx: HaloContext) {
  return {
    listClients: tool({
      description: 'List clients/customers from HaloPSA.',
      parameters: z.object({
        search: z.string().optional().describe('Search term for client name'),
        isActive: z.boolean().optional().default(true).describe('Filter by active status'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number of clients to return'),
      }),
      execute: async ({ search, isActive, count }) => {
        const limit = Math.min(count || DEFAULT_COUNT, MAX_PAGE_SIZE);

        let clients: Client[];
        if (search) {
          clients = await ctx.clients.search(search, { count: limit });
        } else if (isActive) {
          clients = await ctx.clients.listActive({ count: limit });
        } else {
          clients = await ctx.clients.list({ count: limit });
        }

        return clients.map((c: Client) => ({
          id: c.id,
          name: c.name,
          email: c.accountsEmailAddress,
          isActive: !c.inactive,
          openTickets: c.openTicketCount,
        }));
      },
    }),

    getClient: tool({
      description: 'Get detailed information about a specific client.',
      parameters: z.object({
        clientId: z.number().describe('The client ID to retrieve'),
      }),
      execute: async ({ clientId }) => {
        const client = await ctx.clients.get(clientId);
        return {
          id: client.id,
          name: client.name,
          email: client.accountsEmailAddress,
          isActive: !client.inactive,
          notes: client.notes,
          openTickets: client.openTicketCount,
          primaryTechId: client.pritech,
          primaryTechName: client.pritechName,
          accountManagerId: client.accountManagerTech,
          accountManagerName: client.accountManagerTechName,
        };
      },
    }),

    createClient: tool({
      description: 'Create a new client in HaloPSA.',
      parameters: z.object({
        name: z.string().describe('Client/company name'),
        accountsEmail: z.string().optional().describe('Accounts email address'),
        notes: z.string().optional().describe('Additional notes'),
      }),
      execute: async ({ name, accountsEmail, notes }) => {
        const clientData: Record<string, unknown> = { name };
        if (accountsEmail) clientData.accountsemailaddress = accountsEmail;
        if (notes) clientData.notes = notes;

        const clients = await ctx.clients.create([clientData]);
        if (clients && clients.length > 0) {
          const c = clients[0];
          return {
            success: true,
            clientId: c.id,
            name: c.name,
            message: `Client '${c.name}' (ID: ${c.id}) created successfully`,
          };
        }
        return { success: false, error: 'Failed to create client' };
      },
    }),

    updateClient: tool({
      description: 'Update an existing client in HaloPSA.',
      parameters: z.object({
        clientId: z.number().describe('The client ID to update'),
        name: z.string().optional().describe('New name'),
        accountsEmail: z.string().optional().describe('New accounts email'),
        notes: z.string().optional().describe('New notes'),
        inactive: z.boolean().optional().describe('Inactive status'),
      }),
      execute: async ({ clientId, name, accountsEmail, notes, inactive }) => {
        const updateData: Record<string, unknown> = { id: clientId };
        if (name !== undefined) updateData.name = name;
        if (accountsEmail !== undefined) updateData.accountsemailaddress = accountsEmail;
        if (notes !== undefined) updateData.notes = notes;
        if (inactive !== undefined) updateData.inactive = inactive;

        const clients = await ctx.clients.update([updateData]);
        if (clients && clients.length > 0) {
          const c = clients[0];
          return {
            success: true,
            clientId: c.id,
            name: c.name,
            message: `Client '${c.name}' updated successfully`,
          };
        }
        return { success: false, error: 'Failed to update client' };
      },
    }),

    listSites: tool({
      description: 'List sites/locations for a client.',
      parameters: z.object({
        clientId: z.number().describe('The client ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, count }) => {
        const sites = await ctx.clients.sites.listByClient(clientId, { count: count || DEFAULT_COUNT });
        return sites.map((s: Site) => ({
          id: s.id,
          name: s.name,
          address: formatSiteAddress(s),
          phone: s.phoneNumber,
          isActive: !s.inactive,
          isMainSite: s.mainSite,
        }));
      },
    }),

    listUsers: tool({
      description: 'List users/contacts for a client.',
      parameters: z.object({
        clientId: z.number().describe('The client ID'),
        siteId: z.number().optional().describe('Filter by site ID'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, siteId, count }) => {
        let users: User[];
        if (siteId) {
          users = await ctx.clients.users.listBySite(siteId, { count: count || DEFAULT_COUNT });
        } else {
          users = await ctx.clients.users.listByClient(clientId, { count: count || DEFAULT_COUNT });
        }

        return users.map((u: User) => ({
          id: u.id,
          name: u.name,
          email: u.emailAddress,
          phone: u.phoneNumber,
          isActive: !u.inactive,
          siteId: u.siteId,
          siteName: u.siteName,
          isVip: u.isImportantContact,
        }));
      },
    }),

    createUser: tool({
      description: 'Create a new user/contact for a client.',
      parameters: z.object({
        clientId: z.number().describe('The client ID'),
        name: z.string().describe('User full name'),
        email: z.string().optional().describe('Email address'),
        phone: z.string().optional().describe('Phone number'),
        siteId: z.number().optional().describe('Site ID'),
        isVip: z.boolean().optional().describe('Whether this is a VIP user'),
      }),
      execute: async ({ clientId, name, email, phone, siteId, isVip }) => {
        const userData: Record<string, unknown> = { client_id: clientId, name };
        if (email) userData.emailaddress = email;
        if (phone) userData.phonenumber = phone;
        if (siteId) userData.site_id = siteId;
        if (isVip) userData.isimportantcontact = isVip;

        const users = await ctx.clients.users.create([userData]);
        if (users && users.length > 0) {
          const u = users[0];
          return {
            success: true,
            userId: u.id,
            name: u.name,
            message: `User '${u.name}' created successfully`,
          };
        }
        return { success: false, error: 'Failed to create user' };
      },
    }),
  };
}

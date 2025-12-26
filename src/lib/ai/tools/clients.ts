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

    updateUser: tool({
      description: 'Update an existing user/contact.',
      parameters: z.object({
        userId: z.number().describe('The user ID to update'),
        name: z.string().optional().describe('New name'),
        email: z.string().optional().describe('New email address'),
        phone: z.string().optional().describe('New phone number'),
        siteId: z.number().optional().describe('New site ID'),
        isVip: z.boolean().optional().describe('Whether this is a VIP user'),
        inactive: z.boolean().optional().describe('Inactive status'),
      }),
      execute: async ({ userId, name, email, phone, siteId, isVip, inactive }) => {
        const updateData: Record<string, unknown> = { id: userId };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.emailaddress = email;
        if (phone !== undefined) updateData.phonenumber = phone;
        if (siteId !== undefined) updateData.site_id = siteId;
        if (isVip !== undefined) updateData.isimportantcontact = isVip;
        if (inactive !== undefined) updateData.inactive = inactive;

        const users = await ctx.clients.users.update([updateData]);
        if (users && users.length > 0) {
          const u = users[0];
          return {
            success: true,
            userId: u.id,
            name: u.name,
            message: `User '${u.name}' updated successfully`,
          };
        }
        return { success: false, error: 'Failed to update user' };
      },
    }),

    getUser: tool({
      description: 'Get detailed information about a specific user/contact.',
      parameters: z.object({
        userId: z.number().describe('The user ID to retrieve'),
      }),
      execute: async ({ userId }) => {
        const user = await ctx.clients.users.get(userId);
        return {
          id: user.id,
          name: user.name,
          email: user.emailAddress,
          phone: user.phoneNumber,
          clientId: user.clientId,
          clientName: user.clientName,
          siteId: user.siteId,
          siteName: user.siteName,
          isActive: !user.inactive,
          isVip: user.isImportantContact,
        };
      },
    }),

    createSite: tool({
      description: 'Create a new site/location for a client.',
      parameters: z.object({
        clientId: z.number().describe('The client ID'),
        name: z.string().describe('Site name'),
        line1: z.string().optional().describe('Address line 1'),
        line2: z.string().optional().describe('Address line 2'),
        city: z.string().optional().describe('City'),
        postcode: z.string().optional().describe('Postal/ZIP code'),
        country: z.string().optional().describe('Country'),
        phone: z.string().optional().describe('Phone number'),
        isMainSite: z.boolean().optional().describe('Whether this is the main site'),
      }),
      execute: async ({ clientId, name, line1, line2, city, postcode, country, phone, isMainSite }) => {
        const siteData: Record<string, unknown> = { client_id: clientId, name };
        if (line1) siteData.line1 = line1;
        if (line2) siteData.line2 = line2;
        if (city) siteData.line3 = city;
        if (postcode) siteData.postcode = postcode;
        if (country) siteData.country = country;
        if (phone) siteData.phonenumber = phone;
        if (isMainSite) siteData.mainsite = isMainSite;

        const sites = await ctx.clients.sites.create([siteData]);
        if (sites && sites.length > 0) {
          const s = sites[0];
          return {
            success: true,
            siteId: s.id,
            name: s.name,
            message: `Site '${s.name}' created successfully`,
          };
        }
        return { success: false, error: 'Failed to create site' };
      },
    }),

    updateSite: tool({
      description: 'Update an existing site/location.',
      parameters: z.object({
        siteId: z.number().describe('The site ID to update'),
        name: z.string().optional().describe('New name'),
        line1: z.string().optional().describe('Address line 1'),
        line2: z.string().optional().describe('Address line 2'),
        city: z.string().optional().describe('City'),
        postcode: z.string().optional().describe('Postal/ZIP code'),
        country: z.string().optional().describe('Country'),
        phone: z.string().optional().describe('Phone number'),
        inactive: z.boolean().optional().describe('Inactive status'),
      }),
      execute: async ({ siteId, name, line1, line2, city, postcode, country, phone, inactive }) => {
        const updateData: Record<string, unknown> = { id: siteId };
        if (name !== undefined) updateData.name = name;
        if (line1 !== undefined) updateData.line1 = line1;
        if (line2 !== undefined) updateData.line2 = line2;
        if (city !== undefined) updateData.line3 = city;
        if (postcode !== undefined) updateData.postcode = postcode;
        if (country !== undefined) updateData.country = country;
        if (phone !== undefined) updateData.phonenumber = phone;
        if (inactive !== undefined) updateData.inactive = inactive;

        const sites = await ctx.clients.sites.update([updateData]);
        if (sites && sites.length > 0) {
          const s = sites[0];
          return {
            success: true,
            siteId: s.id,
            name: s.name,
            message: `Site '${s.name}' updated successfully`,
          };
        }
        return { success: false, error: 'Failed to update site' };
      },
    }),

    getSite: tool({
      description: 'Get detailed information about a specific site.',
      parameters: z.object({
        siteId: z.number().describe('The site ID to retrieve'),
      }),
      execute: async ({ siteId }) => {
        const site = await ctx.clients.sites.get(siteId);
        return {
          id: site.id,
          name: site.name,
          clientId: site.clientId,
          address: formatSiteAddress(site),
          phone: site.phoneNumber,
          isActive: !site.inactive,
          isMainSite: site.mainSite,
        };
      },
    }),

    getClientStats: tool({
      description: 'Get summary statistics about clients including active/inactive counts and top clients by open tickets.',
      parameters: z.object({}),
      execute: async () => {
        const [activeClients, allClients] = await Promise.all([
          ctx.clients.listActive({ count: 100 }),
          ctx.clients.list({ count: 100 }),
        ]);

        const activeCount = activeClients.length;
        const inactiveCount = allClients.filter((c: Client) => c.inactive).length;
        const topByTickets = allClients
          .filter((c: Client) => !c.inactive && (c.openTicketCount || 0) > 0)
          .sort((a: Client, b: Client) => (b.openTicketCount || 0) - (a.openTicketCount || 0))
          .slice(0, 10)
          .map((c: Client) => ({
            id: c.id,
            name: c.name,
            openTickets: c.openTicketCount,
          }));

        return {
          totalActive: activeCount,
          totalInactive: inactiveCount,
          totalClients: activeCount + inactiveCount,
          topClientsByOpenTickets: topByTickets,
        };
      },
    }),
  };
}

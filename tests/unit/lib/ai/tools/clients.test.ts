// @ts-nocheck - Vitest tool execute() returns union types that require verbose narrowing
/**
 * Comprehensive tests for Client AI Tools.
 *
 * Note: TypeScript checking disabled because:
 * 1. Vitest tool execute() returns union types (success | error)
 * 2. Tests verify runtime behavior which is correct
 * 3. Type narrowing would add unnecessary verbosity to tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClientTools } from '@/lib/ai/tools/clients';
import {
  createMockHaloContext,
  createClient,
  createSite,
  createUser,
  resetFactoryIds,
} from '../../../../mocks/factories';
import type { HaloContext } from '@/lib/ai/tools/context';

// Helper types for tool results (avoids union type issues in tests)
type SuccessResult = Record<string, unknown> & { success: true };
type ErrorResult = { success: false; error: string };

describe('Client AI Tools', () => {
  let ctx: ReturnType<typeof createMockHaloContext>;
  let tools: ReturnType<typeof createClientTools>;

  beforeEach(() => {
    resetFactoryIds();
    ctx = createMockHaloContext();
    tools = createClientTools(ctx as unknown as HaloContext);
  });

  // === CLIENT OPERATIONS ===

  describe('listClients', () => {
    it('should list active clients by default', async () => {
      const result = await tools.listClients.execute(
        { isActive: true, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect(result.clients).toBeDefined();
      expect(ctx.clients.listActive).toHaveBeenCalled();
    });

    it('should list all clients when isActive is false', async () => {
      const result = await tools.listClients.execute(
        { isActive: false, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.list).toHaveBeenCalled();
    });

    it('should search clients when search term provided', async () => {
      const result = await tools.listClients.execute(
        { search: 'acme', isActive: true, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.search).toHaveBeenCalledWith('acme', expect.objectContaining({ count: expect.any(Number) }));
    });

    it('should respect count parameter', async () => {
      const result = await tools.listClients.execute(
        { isActive: true, count: 5 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.listActive).toHaveBeenCalledWith(expect.objectContaining({ count: 5 }));
    });

    it('should return client details in response', async () => {
      const result = await tools.listClients.execute(
        { isActive: true, count: 50 },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      ) as SuccessResult;

      expect(result.success).toBe(true);
      expect((result.clients as unknown[])[0]).toHaveProperty('id');
      expect((result.clients as unknown[])[0]).toHaveProperty('name');
      expect((result.clients as unknown[])[0]).toHaveProperty('email');
      expect((result.clients as unknown[])[0]).toHaveProperty('isActive');
      expect((result.clients as unknown[])[0]).toHaveProperty('openTickets');
    });
  });

  describe('getClient', () => {
    it('should get a specific client', async () => {
      const result = await tools.getClient.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(ctx.clients.get).toHaveBeenCalledWith(1);
    });

    it('should include all client details', async () => {
      const result = await tools.getClient.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('notes');
      expect(result).toHaveProperty('openTickets');
      expect(result).toHaveProperty('primaryTechName');
      expect(result).toHaveProperty('accountManagerName');
    });
  });

  describe('createClient', () => {
    it('should create a new client', async () => {
      const result = await tools.createClient.execute(
        { name: 'New Client Inc' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.clientId).toBeDefined();
      expect(result.message).toContain('created successfully');
      expect(ctx.clients.create).toHaveBeenCalledWith([expect.objectContaining({ name: 'New Client Inc' })]);
    });

    it('should create client with all optional fields', async () => {
      const result = await tools.createClient.execute(
        {
          name: 'Full Client',
          accountsEmail: 'accounts@fullclient.com',
          notes: 'Test notes',
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.create).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Full Client',
          accountsemailaddress: 'accounts@fullclient.com',
          notes: 'Test notes',
        }),
      ]);
    });

    it('should handle create failure', async () => {
      ctx.clients.create.mockResolvedValueOnce([]);

      const result = await tools.createClient.execute(
        { name: 'Failed Client' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('no response');
    });
  });

  describe('updateClient', () => {
    it('should update a client', async () => {
      const result = await tools.updateClient.execute(
        { clientId: 1, name: 'Updated Name' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');
      expect(ctx.clients.update).toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const result = await tools.updateClient.execute(
        {
          clientId: 1,
          name: 'New Name',
          accountsEmail: 'new@email.com',
          notes: 'Updated notes',
          inactive: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.update).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          name: 'New Name',
          accountsemailaddress: 'new@email.com',
          notes: 'Updated notes',
          inactive: true,
        }),
      ]);
    });

    it('should handle update failure', async () => {
      ctx.clients.update.mockResolvedValueOnce([]);

      const result = await tools.updateClient.execute(
        { clientId: 1, name: 'Update' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update');
    });
  });

  // === SITE OPERATIONS ===

  describe('listSites', () => {
    it('should list sites for a client', async () => {
      const result = await tools.listSites.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.sites).toBeDefined();
      expect(ctx.clients.sites.listByClient).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should include site details', async () => {
      const result = await tools.listSites.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.sites[0]).toHaveProperty('id');
      expect(result.sites[0]).toHaveProperty('name');
      expect(result.sites[0]).toHaveProperty('address');
      expect(result.sites[0]).toHaveProperty('isActive');
      expect(result.sites[0]).toHaveProperty('isMainSite');
    });
  });

  describe('getSite', () => {
    it('should get a specific site', async () => {
      const result = await tools.getSite.execute({ siteId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(ctx.clients.sites.get).toHaveBeenCalledWith(1);
    });

    it('should include all site details', async () => {
      const result = await tools.getSite.execute({ siteId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('isMainSite');
    });
  });

  describe('createSite', () => {
    it('should create a new site', async () => {
      const result = await tools.createSite.execute(
        { clientId: 1, name: 'New Site' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.siteId).toBeDefined();
      expect(result.message).toContain('created successfully');
    });

    it('should create site with address fields', async () => {
      const result = await tools.createSite.execute(
        {
          clientId: 1,
          name: 'Full Site',
          line1: '123 Main St',
          line2: 'Suite 100',
          city: 'New York',
          postcode: '10001',
          country: 'USA',
          phone: '555-1234',
          isMainSite: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.sites.create).toHaveBeenCalledWith([
        expect.objectContaining({
          client_id: 1,
          name: 'Full Site',
          line1: '123 Main St',
          line2: 'Suite 100',
          line3: 'New York',
          postcode: '10001',
          country: 'USA',
          phonenumber: '555-1234',
          mainsite: true,
        }),
      ]);
    });
  });

  describe('updateSite', () => {
    it('should update a site', async () => {
      const result = await tools.updateSite.execute(
        { siteId: 1, name: 'Updated Site' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');
    });

    it('should update multiple site fields', async () => {
      const result = await tools.updateSite.execute(
        {
          siteId: 1,
          name: 'New Name',
          line1: 'New Address',
          postcode: '54321',
          inactive: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.sites.update).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          name: 'New Name',
          line1: 'New Address',
          postcode: '54321',
          inactive: true,
        }),
      ]);
    });
  });

  // === USER OPERATIONS ===

  describe('listUsers', () => {
    it('should list users for a client', async () => {
      const result = await tools.listUsers.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.users).toBeDefined();
      expect(ctx.clients.users.listByClient).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should list users filtered by site', async () => {
      const result = await tools.listUsers.execute({ clientId: 1, siteId: 2 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(ctx.clients.users.listBySite).toHaveBeenCalledWith(2, expect.any(Object));
    });

    it('should include user details', async () => {
      const result = await tools.listUsers.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.users[0]).toHaveProperty('id');
      expect(result.users[0]).toHaveProperty('name');
      expect(result.users[0]).toHaveProperty('email');
      expect(result.users[0]).toHaveProperty('isActive');
      expect(result.users[0]).toHaveProperty('isVip');
    });
  });

  describe('getUser', () => {
    it('should get a specific user', async () => {
      const result = await tools.getUser.execute({ userId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(ctx.clients.users.get).toHaveBeenCalledWith(1);
    });

    it('should include all user details', async () => {
      const result = await tools.getUser.execute({ userId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('clientId');
      expect(result).toHaveProperty('siteId');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('isVip');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await tools.createUser.execute(
        { clientId: 1, name: 'New User' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.message).toContain('created successfully');
    });

    it('should create user with all fields', async () => {
      const result = await tools.createUser.execute(
        {
          clientId: 1,
          name: 'Full User',
          email: 'user@example.com',
          phone: '555-1234',
          siteId: 2,
          isVip: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.users.create).toHaveBeenCalledWith([
        expect.objectContaining({
          client_id: 1,
          name: 'Full User',
          emailaddress: 'user@example.com',
          phonenumber: '555-1234',
          site_id: 2,
          isimportantcontact: true,
        }),
      ]);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const result = await tools.updateUser.execute(
        { userId: 1, name: 'Updated User' },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated successfully');
    });

    it('should update multiple user fields', async () => {
      const result = await tools.updateUser.execute(
        {
          userId: 1,
          name: 'New Name',
          email: 'newemail@example.com',
          phone: '555-9999',
          siteId: 3,
          isVip: true,
          inactive: true,
        },
        { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal }
      );

      expect(result.success).toBe(true);
      expect(ctx.clients.users.update).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          name: 'New Name',
          emailaddress: 'newemail@example.com',
          phonenumber: '555-9999',
          site_id: 3,
          isimportantcontact: true,
          inactive: true,
        }),
      ]);
    });
  });

  // === STATISTICS ===

  describe('getClientStats', () => {
    it('should get client statistics', async () => {
      const result = await tools.getClientStats.execute({}, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(true);
      expect(result.totalActive).toBeDefined();
      expect(result.totalInactive).toBeDefined();
      expect(result.totalClients).toBeDefined();
      expect(result.topClientsByOpenTickets).toBeDefined();
    });
  });

  // === ERROR HANDLING ===

  describe('Error Handling', () => {
    it('should handle client list errors', async () => {
      ctx.clients.listActive.mockRejectedValueOnce(new Error('Network error'));

      const result = await tools.listClients.execute({ isActive: true }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle client not found', async () => {
      ctx.clients.get.mockRejectedValueOnce(new Error('Client not found'));

      const result = await tools.getClient.execute({ clientId: 999 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle site errors', async () => {
      ctx.clients.sites.listByClient.mockRejectedValueOnce(new Error('Site error'));

      const result = await tools.listSites.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Site error');
    });

    it('should handle user errors', async () => {
      ctx.clients.users.listByClient.mockRejectedValueOnce(new Error('User error'));

      const result = await tools.listUsers.execute({ clientId: 1 }, { toolCallId: 'test', messages: [], abortSignal: undefined as unknown as AbortSignal });

      expect(result.success).toBe(false);
      expect(result.error).toContain('User error');
    });
  });

  // === TOOL DESCRIPTIONS ===

  describe('Tool Descriptions', () => {
    it('should have descriptions for all tools', () => {
      expect(tools.listClients.description).toBeDefined();
      expect(tools.getClient.description).toBeDefined();
      expect(tools.createClient.description).toBeDefined();
      expect(tools.updateClient.description).toBeDefined();
      expect(tools.listSites.description).toBeDefined();
      expect(tools.getSite.description).toBeDefined();
      expect(tools.createSite.description).toBeDefined();
      expect(tools.updateSite.description).toBeDefined();
      expect(tools.listUsers.description).toBeDefined();
      expect(tools.getUser.description).toBeDefined();
      expect(tools.createUser.description).toBeDefined();
      expect(tools.updateUser.description).toBeDefined();
      expect(tools.getClientStats.description).toBeDefined();
    });
  });
});

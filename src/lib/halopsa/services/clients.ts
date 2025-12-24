/**
 * Client service for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Client,
  ClientApiResponse,
  Site,
  SiteApiResponse,
  User,
  UserApiResponse,
  ClientStats,
  transformClient,
  transformSite,
  transformUser,
} from '../types/client';
import { ListParams } from '../types/common';

/**
 * Service for site operations.
 */
export class SiteService extends BaseService<Site, SiteApiResponse> {
  protected endpoint = '/Site';

  protected transform(data: SiteApiResponse): Site {
    return transformSite(data);
  }

  /**
   * List sites for a specific client.
   */
  async listByClient(clientId: number, params: ListParams = {}): Promise<Site[]> {
    return this.list({ client_id: clientId, ...params });
  }
}

/**
 * Service for end user operations.
 */
export class UserService extends BaseService<User, UserApiResponse> {
  protected endpoint = '/Users';

  protected transform(data: UserApiResponse): User {
    return transformUser(data);
  }

  /**
   * List users for a specific client.
   */
  async listByClient(
    clientId: number,
    options: { includeInactive?: boolean } = {},
    params: ListParams = {}
  ): Promise<User[]> {
    const { includeInactive = false } = options;

    return this.list({
      client_id: clientId,
      includeactive: true,
      includeinactive: includeInactive,
      ...params,
    });
  }

  /**
   * List users for a specific site.
   */
  async listBySite(siteId: number, params: ListParams = {}): Promise<User[]> {
    return this.list({ site_id: siteId, ...params });
  }

  /**
   * Search users by name or email.
   */
  async search(query: string, count = 50, params: ListParams = {}): Promise<User[]> {
    return this.list({ search: query, count, ...params });
  }
}

/**
 * Service for client/customer operations.
 */
export class ClientService extends BaseService<Client, ClientApiResponse> {
  protected endpoint = '/Client';

  public sites: SiteService;
  public users: UserService;

  constructor(client: HaloPSAClient) {
    super(client);
    this.sites = new SiteService(client);
    this.users = new UserService(client);
  }

  protected transform(data: ClientApiResponse): Client {
    return transformClient(data);
  }

  /**
   * List active clients.
   */
  async listActive(count = 100, params: ListParams = {}): Promise<Client[]> {
    return this.list({
      includeactive: true,
      includeinactive: false,
      count,
      ...params,
    });
  }

  /**
   * List inactive clients.
   */
  async listInactive(count = 100, params: ListParams = {}): Promise<Client[]> {
    return this.list({
      includeactive: false,
      includeinactive: true,
      count,
      ...params,
    });
  }

  /**
   * Search clients by name.
   */
  async search(query: string, count = 50, params: ListParams = {}): Promise<Client[]> {
    return this.list({ search: query, count, ...params });
  }

  /**
   * Get a client with sites and users populated.
   */
  async getWithDetails(id: number): Promise<Client> {
    const client = await this.get(id, { includedetails: true });
    client.sites = await this.sites.listByClient(id);
    client.users = await this.users.listByClient(id);
    return client;
  }

  /**
   * Get summary statistics for clients.
   */
  async getSummaryStats(): Promise<ClientStats> {
    const allClients = await this.list({ count: 1000 });
    const activeClients = allClients.filter((c) => !c.inactive);
    const inactiveClients = allClients.filter((c) => c.inactive);

    // Calculate tickets
    const totalOpenTickets = activeClients.reduce(
      (sum, c) => sum + (c.openTicketCount || 0),
      0
    );

    // Get top by tickets
    const topByTickets = activeClients
      .map((c) => ({ name: c.name, count: c.openTicketCount || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: allClients.length,
      active: activeClients.length,
      inactive: inactiveClients.length,
      totalOpenTickets,
      topByTickets,
    };
  }
}

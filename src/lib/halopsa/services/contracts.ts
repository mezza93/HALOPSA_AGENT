/**
 * Contract and SLA services for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Contract,
  ContractApiResponse,
  SLA,
  SLAApiResponse,
  RecurringService,
  RecurringServiceApiResponse,
  ContractStatus,
  ContractSummary,
  transformContract,
  transformSLA,
  transformRecurringService,
  isContractExpiring,
} from '../types/contracts';
import { ListParams } from '../types/common';

/**
 * Service for SLA operations.
 */
export class SLAService extends BaseService<SLA, SLAApiResponse> {
  protected endpoint = '/SLA';

  protected transform(data: SLAApiResponse): SLA {
    return transformSLA(data);
  }

  /**
   * List active SLAs.
   */
  async listActive(params: ListParams = {}): Promise<SLA[]> {
    const slas = await this.list(params);
    return slas.filter((s) => s.isActive);
  }

  /**
   * Get the default SLA.
   */
  async getDefault(): Promise<SLA | null> {
    const slas = await this.list();
    return slas.find((s) => s.isDefault) || null;
  }

  /**
   * Create an SLA target for a priority level.
   */
  async createTarget(slaId: number, target: {
    priorityId: number;
    responseTimeMinutes?: number;
    resolutionTimeMinutes?: number;
    escalationTimeMinutes?: number;
  }): Promise<SLA> {
    await this.client.post(`${this.endpoint}/${slaId}/Target`, {
      priority_id: target.priorityId,
      response_time_minutes: target.responseTimeMinutes,
      resolution_time_minutes: target.resolutionTimeMinutes,
      escalation_time_minutes: target.escalationTimeMinutes,
    });
    return this.get(slaId);
  }
}

/**
 * Service for recurring invoice operations.
 *
 * IMPORTANT: HaloPSA API uses /RecurringInvoice, not /RecurringService.
 * The class is named RecurringServiceService for backwards compatibility
 * but uses the correct API endpoint.
 */
export class RecurringServiceService extends BaseService<RecurringService, RecurringServiceApiResponse> {
  protected endpoint = '/RecurringInvoice';

  protected transform(data: RecurringServiceApiResponse): RecurringService {
    return transformRecurringService(data);
  }

  /**
   * List recurring services for a client.
   */
  async listByClient(clientId: number, params: ListParams = {}): Promise<RecurringService[]> {
    return this.list({ client_id: clientId, ...params });
  }

  /**
   * List recurring services for a contract.
   */
  async listByContract(contractId: number, params: ListParams = {}): Promise<RecurringService[]> {
    return this.list({ contract_id: contractId, ...params });
  }

  /**
   * List active recurring services.
   */
  async listActive(count = 100, params: ListParams = {}): Promise<RecurringService[]> {
    return this.list({ is_active: true, count, ...params });
  }
}

/**
 * Service for contract operations.
 */
export class ContractService extends BaseService<Contract, ContractApiResponse> {
  protected endpoint = '/Contract';

  public slas: SLAService;
  public recurringServices: RecurringServiceService;

  constructor(client: HaloPSAClient) {
    super(client);
    this.slas = new SLAService(client);
    this.recurringServices = new RecurringServiceService(client);
  }

  protected transform(data: ContractApiResponse): Contract {
    return transformContract(data);
  }

  /**
   * List contracts with filters.
   */
  async listFiltered(options: {
    clientId?: number;
    status?: ContractStatus;
    expiringWithinDays?: number;
    count?: number;
  } = {}): Promise<Contract[]> {
    const { clientId, status, expiringWithinDays, count = 50 } = options;

    const params: ListParams = { count };
    if (clientId) params.client_id = clientId;
    if (status) params.status = status;

    let contracts = await this.list(params);

    // Filter by expiring within days (client-side filter)
    if (expiringWithinDays) {
      contracts = contracts.filter((c) => isContractExpiring(c, expiringWithinDays));
    }

    return contracts;
  }

  /**
   * List active contracts.
   */
  async listActive(count = 100, params: ListParams = {}): Promise<Contract[]> {
    return this.list({ status: 'active', count, ...params });
  }

  /**
   * List contracts expiring soon.
   */
  async listExpiring(days = 30): Promise<Contract[]> {
    return this.listFiltered({ status: 'active', expiringWithinDays: days });
  }

  /**
   * Renew a contract.
   */
  async renew(contractId: number, options: {
    newEndDate: Date | string;
    resetPrepaidHours?: boolean;
  }): Promise<Contract> {
    const { newEndDate, resetPrepaidHours = true } = options;

    const updateData: Partial<Contract> = {
      id: contractId,
      endDate: newEndDate instanceof Date ? newEndDate.toISOString() : newEndDate,
    };

    if (resetPrepaidHours) {
      updateData.prepaidHoursUsed = 0;
    }

    const results = await this.update([updateData]);
    return results[0];
  }

  /**
   * Get contract summary statistics.
   */
  async getSummary(): Promise<ContractSummary> {
    const contracts = await this.list({ count: 1000 });

    const byStatus: Record<ContractStatus, number> = {
      active: 0,
      expired: 0,
      cancelled: 0,
      pending: 0,
    };

    let totalRecurringRevenue = 0;
    const expiringContracts = contracts.filter((c) =>
      c.status === 'active' && isContractExpiring(c, 30)
    );

    for (const contract of contracts) {
      byStatus[contract.status] = (byStatus[contract.status] || 0) + 1;
      if (contract.status === 'active' && contract.recurringAmount) {
        totalRecurringRevenue += contract.recurringAmount;
      }
    }

    return {
      totalContracts: contracts.length,
      activeContracts: byStatus.active,
      expiringContracts: expiringContracts.length,
      totalRecurringRevenue,
      byStatus,
    };
  }
}

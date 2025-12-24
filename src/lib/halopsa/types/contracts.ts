/**
 * Contract and SLA-related types for HaloPSA.
 */

import { HaloBaseEntity } from './common';

/**
 * Contract status.
 */
export type ContractStatus = 'active' | 'expired' | 'cancelled' | 'pending';

/**
 * Billing cycle.
 */
export type BillingCycle = 'monthly' | 'quarterly' | 'annually' | 'one_time';

/**
 * Contract entity.
 */
export interface Contract extends HaloBaseEntity {
  name: string;
  clientId: number;
  clientName?: string;
  status: ContractStatus;
  contractType?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  recurringAmount?: number;
  billingCycle?: BillingCycle;
  prepaidHours?: number;
  prepaidHoursUsed?: number;
  slaId?: number;
  slaName?: string;
  autoRenew: boolean;
  notes?: string;
  dateCreated?: Date | string;
}

/**
 * Raw contract from API.
 */
export interface ContractApiResponse {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  status?: string;
  contract_type?: string;
  start_date?: string;
  end_date?: string;
  recurring_amount?: number;
  billing_cycle?: string;
  prepaid_hours?: number;
  prepaid_hours_used?: number;
  sla_id?: number;
  sla_name?: string;
  auto_renew?: boolean;
  notes?: string;
  datecreated?: string;
  [key: string]: unknown;
}

/**
 * SLA target for a priority level.
 */
export interface SLATarget {
  priorityId: number;
  priorityName?: string;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  escalationTimeMinutes?: number;
}

/**
 * SLA definition.
 */
export interface SLA extends HaloBaseEntity {
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  businessHoursId?: number;
  targets: SLATarget[];
}

/**
 * Raw SLA from API.
 */
export interface SLAApiResponse {
  id: number;
  name: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  business_hours_id?: number;
  targets?: Array<{
    priority_id?: number;
    priority_name?: string;
    response_time_minutes?: number;
    resolution_time_minutes?: number;
    escalation_time_minutes?: number;
  }>;
  [key: string]: unknown;
}

/**
 * Recurring service/subscription.
 */
export interface RecurringService extends HaloBaseEntity {
  name: string;
  clientId: number;
  clientName?: string;
  contractId?: number;
  unitPrice: number;
  quantity: number;
  billingFrequency: BillingCycle;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive: boolean;
  nextBillingDate?: Date | string;
}

/**
 * Raw recurring service from API.
 */
export interface RecurringServiceApiResponse {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  contract_id?: number;
  unit_price?: number;
  quantity?: number;
  billing_frequency?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  next_billing_date?: string;
  [key: string]: unknown;
}

/**
 * Contract summary statistics.
 */
export interface ContractSummary {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalRecurringRevenue: number;
  byStatus: Record<ContractStatus, number>;
}

/**
 * Transform API response to Contract interface.
 */
export function transformContract(data: ContractApiResponse): Contract {
  return {
    id: data.id,
    name: data.name,
    clientId: data.client_id,
    clientName: data.client_name,
    status: (data.status as ContractStatus) || 'pending',
    contractType: data.contract_type,
    startDate: data.start_date,
    endDate: data.end_date,
    recurringAmount: data.recurring_amount,
    billingCycle: data.billing_cycle as BillingCycle,
    prepaidHours: data.prepaid_hours,
    prepaidHoursUsed: data.prepaid_hours_used,
    slaId: data.sla_id,
    slaName: data.sla_name,
    autoRenew: data.auto_renew ?? false,
    notes: data.notes,
    dateCreated: data.datecreated,
  };
}

/**
 * Transform API response to SLA interface.
 */
export function transformSLA(data: SLAApiResponse): SLA {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isDefault: data.is_default ?? false,
    isActive: data.is_active ?? true,
    businessHoursId: data.business_hours_id,
    targets: (data.targets || []).map((t) => ({
      priorityId: t.priority_id || 0,
      priorityName: t.priority_name,
      responseTimeMinutes: t.response_time_minutes,
      resolutionTimeMinutes: t.resolution_time_minutes,
      escalationTimeMinutes: t.escalation_time_minutes,
    })),
  };
}

/**
 * Transform API response to RecurringService interface.
 */
export function transformRecurringService(data: RecurringServiceApiResponse): RecurringService {
  return {
    id: data.id,
    name: data.name,
    clientId: data.client_id,
    clientName: data.client_name,
    contractId: data.contract_id,
    unitPrice: data.unit_price || 0,
    quantity: data.quantity || 1,
    billingFrequency: (data.billing_frequency as BillingCycle) || 'monthly',
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    isActive: data.is_active ?? true,
    nextBillingDate: data.next_billing_date,
  };
}

/**
 * Check if contract is expiring within N days.
 */
export function isContractExpiring(contract: Contract, days: number): boolean {
  if (!contract.endDate) return false;
  const endDate = new Date(contract.endDate);
  const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return endDate <= cutoffDate && endDate > new Date();
}

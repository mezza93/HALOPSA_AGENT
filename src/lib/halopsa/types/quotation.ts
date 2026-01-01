/**
 * Quotation types for HaloPSA API.
 */

import { HaloBaseEntity } from './common';

/**
 * Quotation status.
 */
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

/**
 * Quotation line item.
 */
export interface QuotationLine {
  id?: number;
  lineNumber?: number;
  itemId?: number;
  itemName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountPercent?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal: number;
  isTaxable?: boolean;
  isOptional?: boolean;
  notes?: string;
}

/**
 * Quotation line from API.
 */
export interface QuotationLineApiResponse {
  id?: number;
  line_number?: number;
  item_id?: number;
  item_name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  discount?: number;
  discount_percent?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total?: number;
  is_taxable?: boolean;
  is_optional?: boolean;
  notes?: string;
  [key: string]: unknown;
}

/**
 * Quotation entity.
 */
export interface Quotation extends HaloBaseEntity {
  quotationNumber: string;
  clientId: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;
  opportunityId?: number;
  status: QuotationStatus;
  dateCreated: string;
  dateIssued?: string;
  dateExpiry?: string;
  dateAccepted?: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currencyCode?: string;
  notes?: string;
  termsAndConditions?: string;
  agentId?: number;
  agentName?: string;
  lines: QuotationLine[];
  templateId?: number;
  pdfUrl?: string;
  acceptanceSignature?: string;
  acceptanceDate?: string;
  declineReason?: string;
}

/**
 * Raw quotation from API.
 */
export interface QuotationApiResponse {
  id: number;
  quotation_number?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  opportunity_id?: number;
  status?: string;
  date_created?: string;
  date_issued?: string;
  date_expiry?: string;
  date_accepted?: string;
  subtotal?: number;
  tax_total?: number;
  discount_total?: number;
  total?: number;
  currency_code?: string;
  notes?: string;
  terms_and_conditions?: string;
  agent_id?: number;
  agent_name?: string;
  lines?: QuotationLineApiResponse[];
  template_id?: number;
  pdf_url?: string;
  acceptance_signature?: string;
  acceptance_date?: string;
  decline_reason?: string;
  [key: string]: unknown;
}

/**
 * Transform quotation line from API.
 */
export function transformQuotationLine(data: QuotationLineApiResponse): QuotationLine {
  return {
    id: data.id,
    lineNumber: data.line_number,
    itemId: data.item_id,
    itemName: data.item_name,
    description: data.description || '',
    quantity: data.quantity || 1,
    unitPrice: data.unit_price || 0,
    discount: data.discount,
    discountPercent: data.discount_percent,
    taxRate: data.tax_rate,
    taxAmount: data.tax_amount,
    lineTotal: data.line_total || 0,
    isTaxable: data.is_taxable,
    isOptional: data.is_optional,
    notes: data.notes,
  };
}

/**
 * Transform API response to Quotation interface.
 */
export function transformQuotation(data: QuotationApiResponse): Quotation {
  const status = (data.status as QuotationStatus) || 'draft';

  return {
    id: data.id,
    quotationNumber: data.quotation_number || '',
    clientId: data.client_id || 0,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    opportunityId: data.opportunity_id,
    status,
    dateCreated: data.date_created || new Date().toISOString(),
    dateIssued: data.date_issued,
    dateExpiry: data.date_expiry,
    dateAccepted: data.date_accepted,
    subtotal: data.subtotal || 0,
    taxTotal: data.tax_total || 0,
    discountTotal: data.discount_total || 0,
    total: data.total || 0,
    currencyCode: data.currency_code,
    notes: data.notes,
    termsAndConditions: data.terms_and_conditions,
    agentId: data.agent_id,
    agentName: data.agent_name,
    lines: (data.lines || []).map(transformQuotationLine),
    templateId: data.template_id,
    pdfUrl: data.pdf_url,
    acceptanceSignature: data.acceptance_signature,
    acceptanceDate: data.acceptance_date,
    declineReason: data.decline_reason,
  };
}

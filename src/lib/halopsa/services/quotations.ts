/**
 * Quotation services for HaloPSA API operations.
 */

import { BaseService } from './base';
import {
  Quotation,
  QuotationApiResponse,
  QuotationStatus,
  QuotationLine,
  transformQuotation,
} from '../types/quotation';
import { ListParams } from '../types/common';

/**
 * Service for quotation operations.
 */
export class QuotationService extends BaseService<Quotation, QuotationApiResponse> {
  protected endpoint = '/Quotation';

  protected transform(data: QuotationApiResponse): Quotation {
    return transformQuotation(data);
  }

  /**
   * List quotations with filters.
   */
  async listFiltered(options: {
    clientId?: number;
    status?: QuotationStatus;
    agentId?: number;
    opportunityId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    count?: number;
  } = {}): Promise<Quotation[]> {
    const { clientId, status, agentId, opportunityId, startDate, endDate, search, count = 50 } = options;

    const params: ListParams = { count };

    if (clientId) params.client_id = clientId;
    if (status) params.status = status;
    if (agentId) params.agent_id = agentId;
    if (opportunityId) params.opportunity_id = opportunityId;
    if (startDate) params.startdate = startDate;
    if (endDate) params.enddate = endDate;
    if (search) params.search = search;

    return this.list(params);
  }

  /**
   * List quotations by client.
   */
  async listByClient(clientId: number, count = 50): Promise<Quotation[]> {
    return this.listFiltered({ clientId, count });
  }

  /**
   * List quotations awaiting approval/response.
   */
  async listAwaitingResponse(count = 50): Promise<Quotation[]> {
    return this.listFiltered({ status: 'sent', count });
  }

  /**
   * List accepted quotations.
   */
  async listAccepted(options: {
    startDate?: string;
    endDate?: string;
    count?: number;
  } = {}): Promise<Quotation[]> {
    return this.listFiltered({ ...options, status: 'accepted' });
  }

  /**
   * List expired quotations.
   */
  async listExpired(count = 50): Promise<Quotation[]> {
    return this.listFiltered({ status: 'expired', count });
  }

  /**
   * List draft quotations.
   */
  async listDrafts(count = 50): Promise<Quotation[]> {
    return this.listFiltered({ status: 'draft', count });
  }

  /**
   * Get quotation with full details.
   */
  async getWithDetails(quotationId: number): Promise<Quotation> {
    const response = await this.client.get<QuotationApiResponse>(`${this.endpoint}/${quotationId}`, {
      includedetails: true,
    });
    return this.transform(response);
  }

  /**
   * Add line items to a quotation.
   */
  async addLines(quotationId: number, lines: Partial<QuotationLine>[]): Promise<Quotation> {
    const formattedLines = lines.map(line => ({
      quotation_id: quotationId,
      description: line.description,
      quantity: line.quantity || 1,
      unit_price: line.unitPrice,
      item_id: line.itemId,
      discount: line.discount,
      discount_percent: line.discountPercent,
      is_taxable: line.isTaxable,
      is_optional: line.isOptional,
      notes: line.notes,
    }));

    await this.client.post(`${this.endpoint}/Lines`, formattedLines);
    return this.get(quotationId);
  }

  /**
   * Update line items on a quotation.
   */
  async updateLines(quotationId: number, lines: QuotationLine[]): Promise<Quotation> {
    const formattedLines = lines.map(line => ({
      id: line.id,
      quotation_id: quotationId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      item_id: line.itemId,
      discount: line.discount,
      discount_percent: line.discountPercent,
      is_taxable: line.isTaxable,
      is_optional: line.isOptional,
      notes: line.notes,
    }));

    await this.client.post(`${this.endpoint}/updatelines`, formattedLines);
    return this.get(quotationId);
  }

  /**
   * Delete a line item from a quotation.
   */
  async deleteLine(quotationId: number, lineId: number): Promise<Quotation> {
    await this.client.delete(`${this.endpoint}/Lines/${lineId}`);
    return this.get(quotationId);
  }

  /**
   * Send quotation to client via email.
   */
  async sendToClient(quotationId: number, options: {
    emailAddresses?: string[];
    ccAddresses?: string[];
    message?: string;
    templateId?: number;
  } = {}): Promise<void> {
    const { emailAddresses, ccAddresses, message, templateId } = options;

    await this.client.post(`${this.endpoint}/${quotationId}/send`, {
      email_addresses: emailAddresses,
      cc_addresses: ccAddresses,
      message,
      template_id: templateId,
    });
  }

  /**
   * Mark quotation as sent (without actually sending email).
   */
  async markAsSent(quotationId: number): Promise<Quotation> {
    const results = await this.update([{
      id: quotationId,
      status: 'sent',
      dateIssued: new Date().toISOString(),
    } as Partial<Quotation>]);
    return results[0];
  }

  /**
   * Accept a quotation.
   */
  async accept(quotationId: number, options: {
    signature?: string;
    acceptanceDate?: string;
    notes?: string;
  } = {}): Promise<Quotation> {
    const { signature, acceptanceDate, notes } = options;

    const updateData: Record<string, unknown> = {
      id: quotationId,
      status: 'accepted',
      acceptance_date: acceptanceDate || new Date().toISOString(),
    };

    if (signature) updateData.acceptance_signature = signature;
    if (notes) updateData.notes = notes;

    const results = await this.update([updateData as Partial<Quotation>]);
    return results[0];
  }

  /**
   * Decline a quotation.
   */
  async decline(quotationId: number, reason?: string): Promise<Quotation> {
    const updateData: Record<string, unknown> = {
      id: quotationId,
      status: 'declined',
    };

    if (reason) updateData.decline_reason = reason;

    const results = await this.update([updateData as Partial<Quotation>]);
    return results[0];
  }

  /**
   * Convert quotation to sales order.
   */
  async convertToSalesOrder(quotationId: number): Promise<{ salesOrderId: number }> {
    const response = await this.client.post<{ id: number }>(`${this.endpoint}/${quotationId}/converttosalesorder`, {});
    return { salesOrderId: response.id };
  }

  /**
   * Convert quotation to invoice.
   */
  async convertToInvoice(quotationId: number): Promise<{ invoiceId: number }> {
    const response = await this.client.post<{ id: number }>(`${this.endpoint}/${quotationId}/converttoinvoice`, {});
    return { invoiceId: response.id };
  }

  /**
   * Generate PDF for quotation.
   */
  async generatePdf(quotationId: number, templateId?: number): Promise<{ url: string }> {
    const params: Record<string, unknown> = {};
    if (templateId) params.template_id = templateId;

    const response = await this.client.post<{ pdf_url: string }>(`${this.endpoint}/${quotationId}/pdf`, params);
    return { url: response.pdf_url };
  }

  /**
   * Clone/duplicate a quotation.
   */
  async clone(quotationId: number, options: {
    clientId?: number;
    newExpiryDate?: string;
  } = {}): Promise<Quotation> {
    const { clientId, newExpiryDate } = options;

    const params: Record<string, unknown> = {};
    if (clientId) params.client_id = clientId;
    if (newExpiryDate) params.date_expiry = newExpiryDate;

    const response = await this.client.post<QuotationApiResponse>(`${this.endpoint}/${quotationId}/clone`, params);
    return this.transform(response);
  }

  /**
   * Create quotation from opportunity.
   */
  async createFromOpportunity(opportunityId: number, options: {
    expiryDays?: number;
    templateId?: number;
  } = {}): Promise<Quotation> {
    const { expiryDays = 30, templateId } = options;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const quotationData: Record<string, unknown> = {
      opportunity_id: opportunityId,
      date_expiry: expiryDate.toISOString(),
    };

    if (templateId) quotationData.template_id = templateId;

    const results = await this.create([quotationData as Partial<Quotation>]);
    return results[0];
  }
}

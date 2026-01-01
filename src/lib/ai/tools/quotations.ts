/**
 * Quotation AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Quotation, QuotationLine } from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createQuotationTools(ctx: HaloContext) {
  return {
    // === QUOTATION OPERATIONS ===
    listQuotations: tool({
      description: 'List quotations/quotes with optional filters.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired', 'converted']).optional().describe('Filter by status'),
        agentId: z.number().optional().describe('Filter by agent ID'),
        opportunityId: z.number().optional().describe('Filter by opportunity ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        search: z.string().optional().describe('Search quotations'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, status, agentId, opportunityId, startDate, endDate, search, count }) => {
        try {
          const quotations = await ctx.quotations.listFiltered({
            clientId,
            status,
            agentId,
            opportunityId,
            startDate,
            endDate,
            search,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: quotations.length,
            data: quotations.map((q: Quotation) => ({
              id: q.id,
              quotationNumber: q.quotationNumber,
              client: q.clientName,
              status: q.status,
              total: q.total,
              dateIssued: q.dateIssued,
              dateExpiry: q.dateExpiry,
              agent: q.agentName,
            })),
          };
        } catch (error) {
          return formatError(error, 'listQuotations');
        }
      },
    }),

    getQuotation: tool({
      description: 'Get detailed information about a quotation including line items.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
      }),
      execute: async ({ quotationId }) => {
        try {
          const quote = await ctx.quotations.getWithDetails(quotationId);
          return {
            success: true,
            id: quote.id,
            quotationNumber: quote.quotationNumber,
            client: quote.clientName,
            clientId: quote.clientId,
            status: quote.status,
            subtotal: quote.subtotal,
            taxTotal: quote.taxTotal,
            discountTotal: quote.discountTotal,
            total: quote.total,
            dateCreated: quote.dateCreated,
            dateIssued: quote.dateIssued,
            dateExpiry: quote.dateExpiry,
            dateAccepted: quote.dateAccepted,
            agent: quote.agentName,
            notes: quote.notes,
            lines: quote.lines.map((l: QuotationLine) => ({
              id: l.id,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
              isOptional: l.isOptional,
            })),
          };
        } catch (error) {
          return formatError(error, 'getQuotation');
        }
      },
    }),

    createQuotation: tool({
      description: 'Create a new quotation for a client.',
      parameters: z.object({
        clientId: z.number().describe('Client ID'),
        opportunityId: z.number().optional().describe('Related opportunity ID'),
        expiryDays: z.number().optional().default(30).describe('Number of days until expiry'),
        notes: z.string().optional().describe('Quotation notes'),
        termsAndConditions: z.string().optional().describe('Terms and conditions'),
        lines: z.array(z.object({
          description: z.string().describe('Line item description'),
          quantity: z.number().optional().default(1).describe('Quantity'),
          unitPrice: z.number().describe('Unit price'),
          itemId: z.number().optional().describe('Product/Item ID'),
          isOptional: z.boolean().optional().describe('Whether line is optional'),
        })).optional().describe('Line items'),
      }),
      execute: async ({ clientId, opportunityId, expiryDays, notes, termsAndConditions, lines }) => {
        try {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30));

          const quoteData: Record<string, unknown> = {
            client_id: clientId,
            date_expiry: expiryDate.toISOString(),
          };

          if (opportunityId) quoteData.opportunity_id = opportunityId;
          if (notes) quoteData.notes = notes;
          if (termsAndConditions) quoteData.terms_and_conditions = termsAndConditions;

          if (lines && lines.length > 0) {
            quoteData.lines = lines.map(l => ({
              description: l.description,
              quantity: l.quantity || 1,
              unit_price: l.unitPrice,
              item_id: l.itemId,
              is_optional: l.isOptional,
            }));
          }

          const quotes = await ctx.quotations.create([quoteData]);
          if (quotes && quotes.length > 0) {
            return {
              success: true,
              quotationId: quotes[0].id,
              quotationNumber: quotes[0].quotationNumber,
              total: quotes[0].total,
              message: `Quotation ${quotes[0].quotationNumber} created successfully`,
            };
          }
          return { success: false, error: 'Failed to create quotation' };
        } catch (error) {
          return formatError(error, 'createQuotation');
        }
      },
    }),

    addQuotationLines: tool({
      description: 'Add line items to an existing quotation.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
        lines: z.array(z.object({
          description: z.string().describe('Line item description'),
          quantity: z.number().optional().default(1).describe('Quantity'),
          unitPrice: z.number().describe('Unit price'),
          itemId: z.number().optional().describe('Product/Item ID'),
          isOptional: z.boolean().optional().describe('Whether line is optional'),
          notes: z.string().optional().describe('Line notes'),
        })).describe('Line items to add'),
      }),
      execute: async ({ quotationId, lines }) => {
        try {
          const quote = await ctx.quotations.addLines(quotationId, lines.map(l => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            itemId: l.itemId,
            isOptional: l.isOptional,
            notes: l.notes,
          })));

          return {
            success: true,
            quotationId: quote.id,
            linesAdded: lines.length,
            newTotal: quote.total,
            message: `${lines.length} line(s) added to quotation`,
          };
        } catch (error) {
          return formatError(error, 'addQuotationLines');
        }
      },
    }),

    sendQuotation: tool({
      description: 'Send a quotation to the client via email.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
        emailAddresses: z.array(z.string()).optional().describe('Email addresses to send to'),
        ccAddresses: z.array(z.string()).optional().describe('CC email addresses'),
        message: z.string().optional().describe('Custom message'),
      }),
      execute: async ({ quotationId, emailAddresses, ccAddresses, message }) => {
        try {
          await ctx.quotations.sendToClient(quotationId, {
            emailAddresses,
            ccAddresses,
            message,
          });

          return {
            success: true,
            quotationId,
            message: 'Quotation sent successfully',
          };
        } catch (error) {
          return formatError(error, 'sendQuotation');
        }
      },
    }),

    acceptQuotation: tool({
      description: 'Mark a quotation as accepted.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
        notes: z.string().optional().describe('Acceptance notes'),
      }),
      execute: async ({ quotationId, notes }) => {
        try {
          const quote = await ctx.quotations.accept(quotationId, { notes });
          return {
            success: true,
            quotationId: quote.id,
            status: quote.status,
            message: `Quotation ${quote.quotationNumber} accepted`,
          };
        } catch (error) {
          return formatError(error, 'acceptQuotation');
        }
      },
    }),

    declineQuotation: tool({
      description: 'Mark a quotation as declined.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
        reason: z.string().optional().describe('Decline reason'),
      }),
      execute: async ({ quotationId, reason }) => {
        try {
          const quote = await ctx.quotations.decline(quotationId, reason);
          return {
            success: true,
            quotationId: quote.id,
            status: quote.status,
            message: `Quotation ${quote.quotationNumber} declined`,
          };
        } catch (error) {
          return formatError(error, 'declineQuotation');
        }
      },
    }),

    convertQuotationToInvoice: tool({
      description: 'Convert an accepted quotation to an invoice.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
      }),
      execute: async ({ quotationId }) => {
        try {
          const result = await ctx.quotations.convertToInvoice(quotationId);
          return {
            success: true,
            quotationId,
            invoiceId: result.invoiceId,
            message: `Quotation converted to invoice #${result.invoiceId}`,
          };
        } catch (error) {
          return formatError(error, 'convertQuotationToInvoice');
        }
      },
    }),

    convertQuotationToSalesOrder: tool({
      description: 'Convert an accepted quotation to a sales order.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
      }),
      execute: async ({ quotationId }) => {
        try {
          const result = await ctx.quotations.convertToSalesOrder(quotationId);
          return {
            success: true,
            quotationId,
            salesOrderId: result.salesOrderId,
            message: `Quotation converted to sales order #${result.salesOrderId}`,
          };
        } catch (error) {
          return formatError(error, 'convertQuotationToSalesOrder');
        }
      },
    }),

    cloneQuotation: tool({
      description: 'Clone/duplicate a quotation.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID to clone'),
        clientId: z.number().optional().describe('New client ID (optional)'),
        newExpiryDays: z.number().optional().default(30).describe('Days until new quote expires'),
      }),
      execute: async ({ quotationId, clientId, newExpiryDays }) => {
        try {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + (newExpiryDays || 30));

          const quote = await ctx.quotations.clone(quotationId, {
            clientId,
            newExpiryDate: expiryDate.toISOString(),
          });

          return {
            success: true,
            originalId: quotationId,
            newQuotationId: quote.id,
            quotationNumber: quote.quotationNumber,
            message: `Quotation cloned to ${quote.quotationNumber}`,
          };
        } catch (error) {
          return formatError(error, 'cloneQuotation');
        }
      },
    }),

    generateQuotationPdf: tool({
      description: 'Generate a PDF for a quotation.',
      parameters: z.object({
        quotationId: z.number().describe('The quotation ID'),
        templateId: z.number().optional().describe('PDF template ID'),
      }),
      execute: async ({ quotationId, templateId }) => {
        try {
          const result = await ctx.quotations.generatePdf(quotationId, templateId);
          return {
            success: true,
            quotationId,
            pdfUrl: result.url,
            message: 'PDF generated successfully',
          };
        } catch (error) {
          return formatError(error, 'generateQuotationPdf');
        }
      },
    }),
  };
}

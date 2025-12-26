/**
 * Attachment-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Attachment } from '@/lib/halopsa/services/attachments';

export function createAttachmentTools(ctx: HaloContext) {
  return {
    listTicketAttachments: tool({
      description: 'List all attachments for a specific ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to list attachments for'),
      }),
      execute: async ({ ticketId }) => {
        const attachments = await ctx.attachments.listByTicket(ticketId);
        return attachments.map((a: Attachment) => ({
          id: a.id,
          fileName: a.fileName,
          fileSize: a.fileSize,
          contentType: a.contentType,
          dateCreated: a.dateCreated,
          createdBy: a.createdBy,
        }));
      },
    }),

    getAttachment: tool({
      description: 'Get details about a specific attachment.',
      parameters: z.object({
        attachmentId: z.number().describe('The attachment ID'),
      }),
      execute: async ({ attachmentId }) => {
        const attachment = await ctx.attachments.get(attachmentId);
        return {
          id: attachment.id,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          contentType: attachment.contentType,
          dateCreated: attachment.dateCreated,
          createdBy: attachment.createdBy,
          url: attachment.url,
        };
      },
    }),

    deleteAttachment: tool({
      description: 'Delete an attachment from a ticket.',
      parameters: z.object({
        attachmentId: z.number().describe('The attachment ID to delete'),
      }),
      execute: async ({ attachmentId }) => {
        await ctx.attachments.delete(attachmentId);
        return {
          success: true,
          message: `Attachment ${attachmentId} deleted successfully`,
        };
      },
    }),

    copyAttachments: tool({
      description: 'Copy attachments from one ticket to another.',
      parameters: z.object({
        sourceTicketId: z.number().describe('The source ticket ID'),
        targetTicketId: z.number().describe('The target ticket ID'),
        attachmentIds: z.array(z.number()).optional().describe('Specific attachment IDs to copy (all if not specified)'),
      }),
      execute: async ({ sourceTicketId, targetTicketId, attachmentIds }) => {
        const result = await ctx.attachments.copyToTicket(sourceTicketId, targetTicketId, attachmentIds);
        return {
          success: result.errors.length === 0,
          copied: result.copied,
          errors: result.errors,
          message: `Copied ${result.copied} attachments from ticket #${sourceTicketId} to #${targetTicketId}`,
        };
      },
    }),
  };
}

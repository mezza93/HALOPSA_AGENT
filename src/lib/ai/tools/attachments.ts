/**
 * Attachment-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Attachment } from '@/lib/halopsa/services/attachments';
import { formatError } from './utils';

export function createAttachmentTools(ctx: HaloContext) {
  return {
    listTicketAttachments: tool({
      description: 'List all attachments for a specific ticket.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to list attachments for'),
      }),
      execute: async ({ ticketId }) => {
        try {
          const attachments = await ctx.attachments.listByTicket(ticketId);
          return {
            success: true,
            attachments: attachments.map((a: Attachment) => ({
              id: a.id,
              fileName: a.fileName,
              fileSize: a.fileSize,
              contentType: a.contentType,
              dateCreated: a.dateCreated,
              createdBy: a.createdBy,
            })),
          };
        } catch (error) {
          return formatError(error, 'listTicketAttachments');
        }
      },
    }),

    getAttachment: tool({
      description: 'Get details about a specific attachment.',
      parameters: z.object({
        attachmentId: z.number().describe('The attachment ID'),
      }),
      execute: async ({ attachmentId }) => {
        try {
          const attachment = await ctx.attachments.get(attachmentId);
          return {
            success: true,
            id: attachment.id,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            contentType: attachment.contentType,
            dateCreated: attachment.dateCreated,
            createdBy: attachment.createdBy,
            url: attachment.url,
          };
        } catch (error) {
          return formatError(error, 'getAttachment');
        }
      },
    }),

    deleteAttachment: tool({
      description: 'Delete an attachment from a ticket.',
      parameters: z.object({
        attachmentId: z.number().describe('The attachment ID to delete'),
      }),
      execute: async ({ attachmentId }) => {
        try {
          await ctx.attachments.delete(attachmentId);
          return {
            success: true,
            message: `Attachment ${attachmentId} deleted successfully`,
          };
        } catch (error) {
          return formatError(error, 'deleteAttachment');
        }
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
        try {
          const result = await ctx.attachments.copyToTicket(sourceTicketId, targetTicketId, attachmentIds);
          return {
            success: result.errors.length === 0,
            copied: result.copied,
            errors: result.errors,
            message: `Copied ${result.copied} attachments from ticket #${sourceTicketId} to #${targetTicketId}`,
          };
        } catch (error) {
          return formatError(error, 'copyAttachments');
        }
      },
    }),

    uploadAttachment: tool({
      description: 'Upload an attachment to a ticket. Accepts base64-encoded file content.',
      parameters: z.object({
        ticketId: z.number().describe('The ticket ID to attach the file to'),
        fileName: z.string().describe('Name of the file including extension'),
        contentBase64: z.string().describe('Base64-encoded file content'),
        contentType: z.string().optional().describe('MIME type of the file (e.g., "image/png", "application/pdf")'),
        description: z.string().optional().describe('Optional description for the attachment'),
      }),
      execute: async ({ ticketId, fileName, contentBase64, contentType, description }) => {
        try {
          const result = await ctx.attachments.upload(ticketId, {
            fileName,
            contentBase64,
            contentType,
            description,
          });
          return {
            success: true,
            attachmentId: result.id,
            fileName: result.fileName,
            fileSize: result.fileSize,
            message: `File '${fileName}' uploaded successfully to ticket #${ticketId}`,
          };
        } catch (error) {
          return formatError(error, 'uploadAttachment');
        }
      },
    }),
  };
}

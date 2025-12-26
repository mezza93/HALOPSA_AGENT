/**
 * Attachment service for HaloPSA file operations.
 */

import { HaloPSAClient } from '../client';
import { ListParams, PaginatedResponse } from '../types/common';

export interface Attachment {
  id: number;
  ticketId?: number;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  dateCreated?: string;
  createdBy?: string;
  isInline?: boolean;
  url?: string;
}

export interface AttachmentApiResponse {
  id: number;
  ticket_id?: number;
  filename: string;
  filesize?: number;
  contenttype?: string;
  datecreated?: string;
  createdby?: string;
  isinline?: boolean;
  _url?: string;
}

function transformAttachment(data: AttachmentApiResponse): Attachment {
  return {
    id: data.id,
    ticketId: data.ticket_id,
    fileName: data.filename,
    fileSize: data.filesize,
    contentType: data.contenttype,
    dateCreated: data.datecreated,
    createdBy: data.createdby,
    isInline: data.isinline,
    url: data._url,
  };
}

/**
 * Service for attachment operations.
 */
export class AttachmentService {
  private client: HaloPSAClient;

  constructor(client: HaloPSAClient) {
    this.client = client;
  }

  /**
   * List attachments for a ticket.
   */
  async listByTicket(ticketId: number, params: ListParams = {}): Promise<Attachment[]> {
    const response = await this.client.get<PaginatedResponse<AttachmentApiResponse> | AttachmentApiResponse[]>(
      '/Attachment',
      { ticket_id: ticketId, count: params.count || 50, ...params }
    );
    const records = Array.isArray(response) ? response : response.records || [];
    return records.map(transformAttachment);
  }

  /**
   * Get a specific attachment.
   */
  async get(id: number): Promise<Attachment> {
    const response = await this.client.get<AttachmentApiResponse>(`/Attachment/${id}`);
    return transformAttachment(response);
  }

  /**
   * Delete an attachment.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/Attachment/${id}`);
  }

  /**
   * Upload an attachment to a ticket.
   * Note: For actual file uploads, you typically need to use multipart/form-data
   * This method creates an attachment record - actual file upload may need different handling
   */
  async create(ticketId: number, data: {
    fileName: string;
    fileData?: string; // Base64 encoded file data
    isInline?: boolean;
  }): Promise<Attachment[]> {
    const attachmentData = {
      ticket_id: ticketId,
      filename: data.fileName,
      filedata: data.fileData,
      isinline: data.isInline || false,
    };

    const response = await this.client.post<AttachmentApiResponse[]>('/Attachment', [attachmentData]);
    return response.map(transformAttachment);
  }

  /**
   * Upload an attachment to a ticket with full metadata.
   */
  async upload(ticketId: number, data: {
    fileName: string;
    contentBase64: string;
    contentType?: string;
    description?: string;
  }): Promise<Attachment> {
    const attachmentData = {
      ticket_id: ticketId,
      filename: data.fileName,
      filedata: data.contentBase64,
      contenttype: data.contentType,
      description: data.description,
      isinline: false,
    };

    const response = await this.client.post<AttachmentApiResponse[]>('/Attachment', [attachmentData]);
    if (response && response.length > 0) {
      return transformAttachment(response[0]);
    }
    throw new Error('Failed to upload attachment');
  }

  /**
   * Copy attachments from one ticket to another.
   */
  async copyToTicket(
    sourceTicketId: number,
    targetTicketId: number,
    attachmentIds?: number[]
  ): Promise<{ copied: number; errors: string[] }> {
    const result = { copied: 0, errors: [] as string[] };

    // Get attachments from source ticket
    const attachments = await this.listByTicket(sourceTicketId);
    const toCopy = attachmentIds
      ? attachments.filter((a) => attachmentIds.includes(a.id))
      : attachments;

    for (const attachment of toCopy) {
      try {
        // Create a copy reference - actual implementation depends on HaloPSA API
        await this.client.post('/Attachment', [{
          ticket_id: targetTicketId,
          filename: attachment.fileName,
          source_attachment_id: attachment.id,
        }]);
        result.copied++;
      } catch (error) {
        result.errors.push(`Failed to copy ${attachment.fileName}: ${error}`);
      }
    }

    return result;
  }
}

/**
 * Canned Text/Quick Response types for HaloPSA API.
 */

import type { HaloBaseEntity } from './common';

/**
 * Canned text usage scope.
 */
export type CannedTextScope = 'ticket' | 'email' | 'chat' | 'note' | 'all';

/**
 * Canned text entity - predefined response templates.
 */
export interface CannedText extends HaloBaseEntity {
  name: string;
  shortcut?: string;
  content: string;
  htmlContent?: string;
  scope: CannedTextScope;
  categoryId?: number;
  categoryName?: string;
  agentId?: number;
  agentName?: string;
  teamId?: number;
  teamName?: string;
  isGlobal: boolean;
  isActive: boolean;
  usageCount?: number;
  lastUsedAt?: string;
  variables?: string[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw canned text from API.
 */
export interface CannedTextApiResponse {
  id: number;
  name?: string;
  shortcut?: string;
  content?: string;
  html_content?: string;
  scope?: string;
  category_id?: number;
  category_name?: string;
  agent_id?: number;
  agent_name?: string;
  team_id?: number;
  team_name?: string;
  is_global?: boolean;
  is_active?: boolean;
  usage_count?: number;
  last_used_at?: string;
  variables?: string[];
  order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Canned text category for organization.
 */
export interface CannedTextCategory extends HaloBaseEntity {
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  order?: number;
  textCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw canned text category from API.
 */
export interface CannedTextCategoryApiResponse {
  id: number;
  name?: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  order?: number;
  text_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Variable that can be used in canned text templates.
 */
export interface CannedTextVariable {
  name: string;
  displayName: string;
  description?: string;
  scope: CannedTextScope | 'all';
  example?: string;
}

/**
 * Available canned text variables by scope.
 */
export const CANNED_TEXT_VARIABLES: CannedTextVariable[] = [
  // Ticket variables
  { name: '{{ticket.id}}', displayName: 'Ticket ID', scope: 'ticket', example: '12345' },
  { name: '{{ticket.summary}}', displayName: 'Ticket Summary', scope: 'ticket', example: 'Cannot connect to VPN' },
  { name: '{{ticket.status}}', displayName: 'Ticket Status', scope: 'ticket', example: 'Open' },
  { name: '{{ticket.priority}}', displayName: 'Ticket Priority', scope: 'ticket', example: 'High' },

  // Client variables
  { name: '{{client.name}}', displayName: 'Client Name', scope: 'all', example: 'Acme Corp' },
  { name: '{{client.contact}}', displayName: 'Client Contact', scope: 'all', example: 'John Doe' },

  // User variables
  { name: '{{user.name}}', displayName: 'User Name', scope: 'all', example: 'Jane Smith' },
  { name: '{{user.email}}', displayName: 'User Email', scope: 'all', example: 'jane@example.com' },

  // Agent variables
  { name: '{{agent.name}}', displayName: 'Agent Name', scope: 'all', example: 'Support Agent' },
  { name: '{{agent.email}}', displayName: 'Agent Email', scope: 'all', example: 'agent@company.com' },
  { name: '{{agent.phone}}', displayName: 'Agent Phone', scope: 'all', example: '+1 555-0123' },

  // Date/time variables
  { name: '{{date.today}}', displayName: 'Today\'s Date', scope: 'all', example: '2024-01-15' },
  { name: '{{date.time}}', displayName: 'Current Time', scope: 'all', example: '14:30' },
  { name: '{{date.datetime}}', displayName: 'Date and Time', scope: 'all', example: '2024-01-15 14:30' },
];

/**
 * Transform API response to CannedText interface.
 */
export function transformCannedText(data: CannedTextApiResponse): CannedText {
  const scopeMap: Record<string, CannedTextScope> = {
    ticket: 'ticket',
    email: 'email',
    chat: 'chat',
    note: 'note',
    all: 'all',
  };

  return {
    id: data.id,
    name: data.name || '',
    shortcut: data.shortcut,
    content: data.content || '',
    htmlContent: data.html_content,
    scope: scopeMap[data.scope || ''] || 'all',
    categoryId: data.category_id,
    categoryName: data.category_name,
    agentId: data.agent_id,
    agentName: data.agent_name,
    teamId: data.team_id,
    teamName: data.team_name,
    isGlobal: data.is_global ?? false,
    isActive: data.is_active ?? true,
    usageCount: data.usage_count,
    lastUsedAt: data.last_used_at,
    variables: data.variables,
    order: data.order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Transform API response to CannedTextCategory interface.
 */
export function transformCannedTextCategory(data: CannedTextCategoryApiResponse): CannedTextCategory {
  return {
    id: data.id,
    name: data.name || '',
    description: data.description,
    parentId: data.parent_id,
    parentName: data.parent_name,
    order: data.order,
    textCount: data.text_count,
    isActive: data.is_active ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Replace variables in canned text content.
 */
export function replaceCannedTextVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

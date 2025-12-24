/**
 * Asset/device-related types for HaloPSA.
 */

import { HaloBaseEntity, CustomField } from './common';

/**
 * Asset type definition.
 */
export interface AssetType extends HaloBaseEntity {
  name: string;
  description?: string;
  assetGroupId?: number;
  assetGroupName?: string;
  inactive: boolean;
}

/**
 * Asset status definition.
 */
export interface AssetStatus extends HaloBaseEntity {
  name: string;
  colour?: string;
  isActive: boolean;
}

/**
 * Asset/device in HaloPSA.
 */
export interface Asset extends HaloBaseEntity {
  // Basic info
  inventoryNumber?: string;
  deviceName?: string;
  keyField?: string;
  keyField2?: string;
  keyField3?: string;

  // Type and status
  assetTypeId?: number;
  assetTypeName?: string;
  statusId?: number;
  statusName?: string;

  // Client/Site relationship
  clientId?: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;

  // User relationship
  userId?: number;
  userName?: string;

  // Contract
  contractId?: number;
  contractName?: string;

  // Hardware info
  manufacturer?: string;
  model?: string;
  serialNumber?: string;

  // Network info
  ipAddress?: string;
  macAddress?: string;

  // Status
  inactive: boolean;
  bookmarked: boolean;

  // Dates
  purchaseDate?: Date | string;
  warrantyExpiry?: Date | string;
  lastAuditDate?: Date | string;
  dateCreated?: Date | string;

  // Financial
  purchasePrice?: number;
  monthlyCost?: number;

  // Notes
  notes?: string;

  // Custom fields
  customFields?: CustomField[];

  // Linked tickets count
  openTicketCount?: number;
}

/**
 * Raw asset data from API.
 */
export interface AssetApiResponse {
  id: number;
  inventory_number?: string;
  devicename?: string;
  key_field?: string;
  key_field2?: string;
  key_field3?: string;
  assettype_id?: number;
  assettype_name?: string;
  status_id?: number;
  status_name?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  user_id?: number;
  user_name?: string;
  contract_id?: number;
  contract_name?: string;
  manufacturer?: string;
  model?: string;
  serialnumber?: string;
  ipaddress?: string;
  macaddress?: string;
  inactive?: boolean;
  bookmarked?: boolean;
  purchasedate?: string;
  warrantyexpiry?: string;
  lastauditdate?: string;
  datecreated?: string;
  purchaseprice?: number;
  monthlycost?: number;
  notes?: string;
  customfields?: CustomField[];
  open_ticket_count?: number;
  [key: string]: unknown;
}

/**
 * Raw asset type data from API.
 */
export interface AssetTypeApiResponse {
  id: number;
  name: string;
  description?: string;
  assetgroup_id?: number;
  assetgroup_name?: string;
  inactive?: boolean;
  [key: string]: unknown;
}

/**
 * Asset summary statistics.
 */
export interface AssetStats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
  warrantyExpired: number;
  warrantyExpiring30d: number;
  topByClient: Record<string, number>;
}

/**
 * Transform API response to Asset interface.
 */
export function transformAsset(data: AssetApiResponse): Asset {
  return {
    id: data.id,
    inventoryNumber: data.inventory_number,
    deviceName: data.devicename,
    keyField: data.key_field,
    keyField2: data.key_field2,
    keyField3: data.key_field3,
    assetTypeId: data.assettype_id,
    assetTypeName: data.assettype_name,
    statusId: data.status_id,
    statusName: data.status_name,
    clientId: data.client_id,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    userId: data.user_id,
    userName: data.user_name,
    contractId: data.contract_id,
    contractName: data.contract_name,
    manufacturer: data.manufacturer,
    model: data.model,
    serialNumber: data.serialnumber,
    ipAddress: data.ipaddress,
    macAddress: data.macaddress,
    inactive: data.inactive ?? false,
    bookmarked: data.bookmarked ?? false,
    purchaseDate: data.purchasedate,
    warrantyExpiry: data.warrantyexpiry,
    lastAuditDate: data.lastauditdate,
    dateCreated: data.datecreated,
    purchasePrice: data.purchaseprice,
    monthlyCost: data.monthlycost,
    notes: data.notes,
    customFields: data.customfields,
    openTicketCount: data.open_ticket_count,
  };
}

/**
 * Transform API response to AssetType interface.
 */
export function transformAssetType(data: AssetTypeApiResponse): AssetType {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    assetGroupId: data.assetgroup_id,
    assetGroupName: data.assetgroup_name,
    inactive: data.inactive ?? false,
  };
}

/**
 * Get display name for asset.
 */
export function getAssetDisplayName(asset: Asset): string {
  if (asset.deviceName) return asset.deviceName;
  if (asset.keyField) return asset.keyField;
  if (asset.inventoryNumber) return `Asset #${asset.inventoryNumber}`;
  return `Asset ${asset.id}`;
}

/**
 * Check if asset is active.
 */
export function isAssetActive(asset: Asset): boolean {
  return !asset.inactive;
}

/**
 * Check if warranty has expired.
 */
export function isWarrantyExpired(asset: Asset): boolean {
  if (!asset.warrantyExpiry) return false;
  const expiryDate = new Date(asset.warrantyExpiry);
  return new Date() > expiryDate;
}

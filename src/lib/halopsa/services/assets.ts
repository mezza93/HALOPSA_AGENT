/**
 * Asset/device service for HaloPSA API operations.
 */

import { HaloPSAClient } from '../client';
import { BaseService } from './base';
import {
  Asset,
  AssetApiResponse,
  AssetType,
  AssetTypeApiResponse,
  AssetStats,
  transformAsset,
  transformAssetType,
  isAssetActive,
  isWarrantyExpired,
} from '../types/asset';
import { ListParams } from '../types/common';

/**
 * Service for asset type operations.
 */
export class AssetTypeService extends BaseService<AssetType, AssetTypeApiResponse> {
  protected endpoint = '/AssetType';

  protected transform(data: AssetTypeApiResponse): AssetType {
    return transformAssetType(data);
  }

  /**
   * List active asset types.
   */
  async listActive(params: ListParams = {}): Promise<AssetType[]> {
    const types = await this.list(params);
    return types.filter((t) => !t.inactive);
  }
}

/**
 * Service for asset/device operations.
 */
export class AssetService extends BaseService<Asset, AssetApiResponse> {
  protected endpoint = '/Asset';

  public assetTypes: AssetTypeService;

  constructor(client: HaloPSAClient) {
    super(client);
    this.assetTypes = new AssetTypeService(client);
  }

  protected transform(data: AssetApiResponse): Asset {
    return transformAsset(data);
  }

  /**
   * List active assets.
   */
  async listActive(count = 100, params: ListParams = {}): Promise<Asset[]> {
    return this.list({
      includeactive: true,
      includeinactive: false,
      count,
      ...params,
    });
  }

  /**
   * List assets for a specific client.
   */
  async listByClient(clientId: number, params: ListParams = {}): Promise<Asset[]> {
    return this.list({ client_id: clientId, ...params });
  }

  /**
   * List assets at a specific site.
   */
  async listBySite(siteId: number, params: ListParams = {}): Promise<Asset[]> {
    return this.list({ site_id: siteId, ...params });
  }

  /**
   * List assets of a specific type.
   */
  async listByType(assetTypeId: number, params: ListParams = {}): Promise<Asset[]> {
    return this.list({ assettype_id: assetTypeId, ...params });
  }

  /**
   * List assets assigned to a user.
   */
  async listByUser(userId: number, params: ListParams = {}): Promise<Asset[]> {
    return this.list({ user_id: userId, ...params });
  }

  /**
   * Search assets by name, serial number, etc.
   */
  async search(query: string, count = 50, params: ListParams = {}): Promise<Asset[]> {
    return this.list({ search: query, count, ...params });
  }

  /**
   * List assets with warranties expiring soon.
   */
  async listWarrantyExpiring(days = 30, count = 100, params: ListParams = {}): Promise<Asset[]> {
    const allAssets = await this.listActive(count, params);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiring = allAssets.filter((asset) => {
      if (!asset.warrantyExpiry) return false;
      const expiryDate = new Date(asset.warrantyExpiry);
      return now < expiryDate && expiryDate <= cutoffDate;
    });

    return expiring.sort((a, b) => {
      const aDate = a.warrantyExpiry ? new Date(a.warrantyExpiry).getTime() : Infinity;
      const bDate = b.warrantyExpiry ? new Date(b.warrantyExpiry).getTime() : Infinity;
      return aDate - bDate;
    });
  }

  /**
   * List assets with expired warranties.
   */
  async listWarrantyExpired(count = 100, params: ListParams = {}): Promise<Asset[]> {
    const allAssets = await this.listActive(count, params);
    return allAssets.filter(isWarrantyExpired);
  }

  /**
   * Get summary statistics for assets.
   */
  async getSummaryStats(clientId?: number): Promise<AssetStats> {
    const params: ListParams = { count: 1000 };
    if (clientId) params.client_id = clientId;

    const allAssets = await this.list(params);
    const activeAssets = allAssets.filter(isAssetActive);
    const inactiveAssets = allAssets.filter((a) => !isAssetActive(a));

    // Group by type
    const byType: Record<string, number> = {};
    for (const asset of activeAssets) {
      const typeName = asset.assetTypeName || 'Unknown';
      byType[typeName] = (byType[typeName] || 0) + 1;
    }

    // Warranty stats
    const warrantyExpired = activeAssets.filter(isWarrantyExpired).length;
    const warrantyExpiring30d = (await this.listWarrantyExpiring(30)).length;

    // Top by client
    const topByClient = this.groupByField(activeAssets, 'clientName');

    return {
      total: allAssets.length,
      active: activeAssets.length,
      inactive: inactiveAssets.length,
      byType,
      warrantyExpired,
      warrantyExpiring30d,
      topByClient,
    };
  }

  /**
   * Group assets by a field and count.
   */
  private groupByField(assets: Asset[], field: keyof Asset): Record<string, number> {
    const result: Record<string, number> = {};

    for (const asset of assets) {
      const value = (asset[field] as string) || 'Unknown';
      result[value] = (result[value] || 0) + 1;
    }

    // Sort by count and take top 10
    return Object.fromEntries(
      Object.entries(result)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    );
  }
}

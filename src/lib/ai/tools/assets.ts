/**
 * Asset-related AI tools for HaloPSA.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type { Asset, AssetType } from '@/lib/halopsa/types';

const DEFAULT_COUNT = 20;
const DEFAULT_WARRANTY_DAYS = 30;

function getAssetName(asset: Asset): string {
  return asset.deviceName || asset.keyField || asset.inventoryNumber || `Asset ${asset.id}`;
}

export function createAssetTools(ctx: HaloContext) {
  return {
    listAssets: tool({
      description: 'List assets/devices from HaloPSA with optional filters.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        siteId: z.number().optional().describe('Filter by site ID'),
        assetTypeId: z.number().optional().describe('Filter by asset type ID'),
        search: z.string().optional().describe('Search term for asset name/serial'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, siteId, assetTypeId, search, count }) => {
        const limit = count || DEFAULT_COUNT;

        let assets: Asset[];
        if (search) {
          assets = await ctx.assets.search(search, { count: limit });
        } else if (clientId) {
          assets = await ctx.assets.listByClient(clientId, { count: limit });
        } else if (siteId) {
          assets = await ctx.assets.listBySite(siteId, { count: limit });
        } else if (assetTypeId) {
          assets = await ctx.assets.listByType(assetTypeId, { count: limit });
        } else {
          assets = await ctx.assets.listActive({ count: limit });
        }

        return assets.map((a: Asset) => ({
          id: a.id,
          name: getAssetName(a),
          type: a.assetTypeName,
          client: a.clientName,
          serial: a.serialNumber,
          warrantyExpires: a.warrantyExpiry,
        }));
      },
    }),

    getAsset: tool({
      description: 'Get detailed information about a specific asset.',
      parameters: z.object({
        assetId: z.number().describe('The asset ID to retrieve'),
      }),
      execute: async ({ assetId }) => {
        const asset = await ctx.assets.get(assetId);
        const isExpired = asset.warrantyExpiry ? new Date() > new Date(asset.warrantyExpiry) : false;
        return {
          id: asset.id,
          name: getAssetName(asset),
          inventoryNumber: asset.inventoryNumber,
          type: asset.assetTypeName,
          status: asset.statusName,
          client: asset.clientName,
          site: asset.siteName,
          user: asset.userName,
          manufacturer: asset.manufacturer,
          model: asset.model,
          serial: asset.serialNumber,
          ipAddress: asset.ipAddress,
          purchaseDate: asset.purchaseDate,
          warrantyExpires: asset.warrantyExpiry,
          isWarrantyExpired: isExpired,
          notes: asset.notes,
        };
      },
    }),

    getAssetStats: tool({
      description: 'Get asset statistics including counts by type, status, warranty status.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter stats by client ID'),
      }),
      execute: async ({ clientId }) => {
        return ctx.assets.getSummaryStats({ clientId });
      },
    }),

    listWarrantyExpiring: tool({
      description: 'List assets with warranties expiring soon.',
      parameters: z.object({
        days: z.number().optional().default(DEFAULT_WARRANTY_DAYS).describe('Days to look ahead for expiring warranties'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ days, count }) => {
        const assets = await ctx.assets.listWarrantyExpiring({
          days: days || DEFAULT_WARRANTY_DAYS,
          count: count || DEFAULT_COUNT,
        });

        return assets.map((a: Asset) => ({
          id: a.id,
          name: getAssetName(a),
          type: a.assetTypeName,
          client: a.clientName,
          warrantyExpires: a.warrantyExpiry,
        }));
      },
    }),

    listWarrantyExpired: tool({
      description: 'List assets with expired warranties.',
      parameters: z.object({
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ count }) => {
        const assets = await ctx.assets.listWarrantyExpired({ count: count || DEFAULT_COUNT });

        return assets.map((a: Asset) => ({
          id: a.id,
          name: getAssetName(a),
          type: a.assetTypeName,
          client: a.clientName,
          warrantyExpires: a.warrantyExpiry,
        }));
      },
    }),

    createAsset: tool({
      description: 'Create a new asset in HaloPSA.',
      parameters: z.object({
        inventoryNumber: z.string().describe('Unique inventory number'),
        clientId: z.number().describe('Client ID'),
        siteId: z.number().optional().describe('Site ID'),
        assetTypeId: z.number().optional().describe('Asset type ID'),
        manufacturer: z.string().optional().describe('Manufacturer name'),
        model: z.string().optional().describe('Model name'),
        serialNumber: z.string().optional().describe('Serial number'),
        userId: z.number().optional().describe('Assigned user ID'),
        notes: z.string().optional().describe('Additional notes'),
      }),
      execute: async ({ inventoryNumber, clientId, siteId, assetTypeId, manufacturer, model, serialNumber, userId, notes }) => {
        const assetData: Record<string, unknown> = {
          inventoryNumber,
          clientId,
        };

        if (siteId) assetData.siteId = siteId;
        if (assetTypeId) assetData.assettypeId = assetTypeId;
        if (manufacturer) assetData.manufacturer = manufacturer;
        if (model) assetData.model = model;
        if (serialNumber) assetData.serialNumber = serialNumber;
        if (userId) assetData.userId = userId;
        if (notes) assetData.notes = notes;

        const assets = await ctx.assets.create([assetData]);
        if (assets && assets.length > 0) {
          const a = assets[0];
          const name = getAssetName(a);
          return {
            success: true,
            assetId: a.id,
            name,
            inventoryNumber: a.inventoryNumber,
            message: `Asset '${name}' (ID: ${a.id}) created successfully`,
          };
        }
        return { success: false, error: 'Failed to create asset' };
      },
    }),

    updateAsset: tool({
      description: 'Update an existing asset in HaloPSA.',
      parameters: z.object({
        assetId: z.number().describe('The asset ID to update'),
        inventoryNumber: z.string().optional().describe('New inventory number'),
        assetTypeId: z.number().optional().describe('New asset type ID'),
        manufacturer: z.string().optional().describe('New manufacturer'),
        model: z.string().optional().describe('New model'),
        serialNumber: z.string().optional().describe('New serial number'),
        userId: z.number().optional().describe('New assigned user ID'),
        siteId: z.number().optional().describe('New site ID'),
        statusId: z.number().optional().describe('New status ID'),
        notes: z.string().optional().describe('New notes'),
      }),
      execute: async ({ assetId, inventoryNumber, assetTypeId, manufacturer, model, serialNumber, userId, siteId, statusId, notes }) => {
        const updateData: Record<string, unknown> = { id: assetId };

        if (inventoryNumber !== undefined) updateData.inventoryNumber = inventoryNumber;
        if (assetTypeId !== undefined) updateData.assettypeId = assetTypeId;
        if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
        if (model !== undefined) updateData.model = model;
        if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
        if (userId !== undefined) updateData.userId = userId;
        if (siteId !== undefined) updateData.siteId = siteId;
        if (statusId !== undefined) updateData.statusId = statusId;
        if (notes !== undefined) updateData.notes = notes;

        const assets = await ctx.assets.update([updateData]);
        if (assets && assets.length > 0) {
          const a = assets[0];
          const name = getAssetName(a);
          return {
            success: true,
            assetId: a.id,
            name,
            message: `Asset '${name}' updated successfully`,
          };
        }
        return { success: false, error: 'Failed to update asset' };
      },
    }),

    listAssetTypes: tool({
      description: 'List available asset types.',
      parameters: z.object({}),
      execute: async () => {
        const types = await ctx.assets.types.list();
        return types.map((t: AssetType) => ({
          id: t.id,
          name: t.name,
          description: t.description,
        }));
      },
    }),
  };
}

/**
 * Sales-related services for HaloPSA API operations.
 * Includes SalesOrder, Supplier, PurchaseOrder, and Product services.
 */

import { BaseService } from './base';
import {
  SalesOrder,
  SalesOrderApiResponse,
  SalesOrderStatus,
  SalesOrderLine,
  Supplier,
  SupplierApiResponse,
  PurchaseOrder,
  PurchaseOrderApiResponse,
  PurchaseOrderStatus,
  PurchaseOrderLine,
  Product,
  ProductApiResponse,
  ProductType,
  transformSalesOrder,
  transformSupplier,
  transformPurchaseOrder,
  transformProduct,
} from '../types/sales';
import { ListParams } from '../types/common';

// ============================================
// SALES ORDER SERVICE
// ============================================

/**
 * Service for sales order operations.
 */
export class SalesOrderService extends BaseService<SalesOrder, SalesOrderApiResponse> {
  protected endpoint = '/SalesOrder';

  protected transform(data: SalesOrderApiResponse): SalesOrder {
    return transformSalesOrder(data);
  }

  /**
   * List sales orders with filters.
   */
  async listFiltered(options: {
    clientId?: number;
    status?: SalesOrderStatus;
    agentId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    count?: number;
  } = {}): Promise<SalesOrder[]> {
    const { clientId, status, agentId, startDate, endDate, search, count = 50 } = options;

    const params: ListParams = { count };

    if (clientId) params.client_id = clientId;
    if (status) params.status = status;
    if (agentId) params.agent_id = agentId;
    if (startDate) params.startdate = startDate;
    if (endDate) params.enddate = endDate;
    if (search) params.search = search;

    return this.list(params);
  }

  /**
   * List sales orders by client.
   */
  async listByClient(clientId: number, count = 50): Promise<SalesOrder[]> {
    return this.listFiltered({ clientId, count });
  }

  /**
   * List pending sales orders.
   */
  async listPending(count = 50): Promise<SalesOrder[]> {
    return this.listFiltered({ status: 'pending', count });
  }

  /**
   * List processing sales orders.
   */
  async listProcessing(count = 50): Promise<SalesOrder[]> {
    return this.listFiltered({ status: 'processing', count });
  }

  /**
   * Get sales order with full details.
   */
  async getWithDetails(orderId: number): Promise<SalesOrder> {
    const response = await this.client.get<SalesOrderApiResponse>(`${this.endpoint}/${orderId}`, {
      includedetails: true,
    });
    return this.transform(response);
  }

  /**
   * Add line items to a sales order.
   */
  async addLines(orderId: number, lines: Partial<SalesOrderLine>[]): Promise<SalesOrder> {
    const formattedLines = lines.map(line => ({
      sales_order_id: orderId,
      description: line.description,
      quantity: line.quantity || 1,
      unit_price: line.unitPrice,
      item_id: line.itemId,
      discount: line.discount,
    }));

    await this.client.post(`${this.endpoint}/Lines`, formattedLines);
    return this.get(orderId);
  }

  /**
   * Update order status.
   */
  async updateStatus(orderId: number, status: SalesOrderStatus, notes?: string): Promise<SalesOrder> {
    const updateData: Record<string, unknown> = {
      id: orderId,
      status,
    };
    if (notes) updateData.notes = notes;

    const results = await this.update([updateData as Partial<SalesOrder>]);
    return results[0];
  }

  /**
   * Approve a sales order.
   */
  async approve(orderId: number): Promise<SalesOrder> {
    return this.updateStatus(orderId, 'approved');
  }

  /**
   * Start processing a sales order.
   */
  async startProcessing(orderId: number): Promise<SalesOrder> {
    return this.updateStatus(orderId, 'processing');
  }

  /**
   * Mark sales order as fulfilled.
   */
  async markFulfilled(orderId: number): Promise<SalesOrder> {
    const updateData: Record<string, unknown> = {
      id: orderId,
      status: 'fulfilled',
      date_fulfilled: new Date().toISOString(),
    };

    const results = await this.update([updateData as Partial<SalesOrder>]);
    return results[0];
  }

  /**
   * Cancel a sales order.
   */
  async cancel(orderId: number, reason?: string): Promise<SalesOrder> {
    return this.updateStatus(orderId, 'cancelled', reason);
  }

  /**
   * Convert sales order to invoice.
   */
  async convertToInvoice(orderId: number): Promise<{ invoiceId: number }> {
    const response = await this.client.post<{ id: number }>(`${this.endpoint}/${orderId}/converttoinvoice`, {});
    return { invoiceId: response.id };
  }

  /**
   * Create from quotation.
   */
  async createFromQuotation(quotationId: number): Promise<SalesOrder> {
    const orderData: Record<string, unknown> = {
      quotation_id: quotationId,
    };

    const results = await this.create([orderData as Partial<SalesOrder>]);
    return results[0];
  }
}

// ============================================
// SUPPLIER SERVICE
// ============================================

/**
 * Service for supplier/vendor operations.
 */
export class SupplierService extends BaseService<Supplier, SupplierApiResponse> {
  protected endpoint = '/Supplier';

  protected transform(data: SupplierApiResponse): Supplier {
    return transformSupplier(data);
  }

  /**
   * List suppliers with filters.
   */
  async listFiltered(options: {
    search?: string;
    activeOnly?: boolean;
    count?: number;
  } = {}): Promise<Supplier[]> {
    const { search, activeOnly = false, count = 100 } = options;

    const params: ListParams = { count };

    if (search) params.search = search;
    if (activeOnly) params.is_active = true;

    return this.list(params);
  }

  /**
   * List active suppliers.
   */
  async listActive(count = 100): Promise<Supplier[]> {
    return this.listFiltered({ activeOnly: true, count });
  }

  /**
   * Search suppliers by name or code.
   */
  async search(query: string, count = 20): Promise<Supplier[]> {
    return this.listFiltered({ search: query, count });
  }

  /**
   * Get supplier by code.
   */
  async getByCode(code: string): Promise<Supplier | null> {
    const suppliers = await this.list({ code });
    return suppliers[0] || null;
  }

  /**
   * Activate a supplier.
   */
  async activate(supplierId: number): Promise<Supplier> {
    const results = await this.update([{ id: supplierId, isActive: true } as Partial<Supplier>]);
    return results[0];
  }

  /**
   * Deactivate a supplier.
   */
  async deactivate(supplierId: number): Promise<Supplier> {
    const results = await this.update([{ id: supplierId, isActive: false } as Partial<Supplier>]);
    return results[0];
  }

  /**
   * Get purchase orders for a supplier.
   */
  async getPurchaseOrders(supplierId: number, count = 50): Promise<PurchaseOrder[]> {
    const poService = new PurchaseOrderService(this.client);
    return poService.listBySupplier(supplierId, count);
  }
}

// ============================================
// PURCHASE ORDER SERVICE
// ============================================

/**
 * Service for purchase order operations.
 */
export class PurchaseOrderService extends BaseService<PurchaseOrder, PurchaseOrderApiResponse> {
  protected endpoint = '/PurchaseOrder';

  protected transform(data: PurchaseOrderApiResponse): PurchaseOrder {
    return transformPurchaseOrder(data);
  }

  /**
   * List purchase orders with filters.
   */
  async listFiltered(options: {
    supplierId?: number;
    status?: PurchaseOrderStatus;
    agentId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    count?: number;
  } = {}): Promise<PurchaseOrder[]> {
    const { supplierId, status, agentId, startDate, endDate, search, count = 50 } = options;

    const params: ListParams = { count };

    if (supplierId) params.supplier_id = supplierId;
    if (status) params.status = status;
    if (agentId) params.agent_id = agentId;
    if (startDate) params.startdate = startDate;
    if (endDate) params.enddate = endDate;
    if (search) params.search = search;

    return this.list(params);
  }

  /**
   * List purchase orders by supplier.
   */
  async listBySupplier(supplierId: number, count = 50): Promise<PurchaseOrder[]> {
    return this.listFiltered({ supplierId, count });
  }

  /**
   * List pending approval purchase orders.
   */
  async listPendingApproval(count = 50): Promise<PurchaseOrder[]> {
    return this.listFiltered({ status: 'pending', count });
  }

  /**
   * List ordered (awaiting delivery) purchase orders.
   */
  async listOrdered(count = 50): Promise<PurchaseOrder[]> {
    return this.listFiltered({ status: 'ordered', count });
  }

  /**
   * Get purchase order with full details.
   */
  async getWithDetails(orderId: number): Promise<PurchaseOrder> {
    const response = await this.client.get<PurchaseOrderApiResponse>(`${this.endpoint}/${orderId}`, {
      includedetails: true,
    });
    return this.transform(response);
  }

  /**
   * Add line items to a purchase order.
   */
  async addLines(orderId: number, lines: Partial<PurchaseOrderLine>[]): Promise<PurchaseOrder> {
    const formattedLines = lines.map(line => ({
      purchase_order_id: orderId,
      description: line.description,
      quantity: line.quantity || 1,
      unit_cost: line.unitCost,
      item_id: line.itemId,
    }));

    await this.client.post(`${this.endpoint}/Lines`, formattedLines);
    return this.get(orderId);
  }

  /**
   * Submit for approval.
   */
  async submitForApproval(orderId: number): Promise<PurchaseOrder> {
    const results = await this.update([{
      id: orderId,
      status: 'pending',
    } as Partial<PurchaseOrder>]);
    return results[0];
  }

  /**
   * Approve a purchase order.
   */
  async approve(orderId: number, approverId?: number): Promise<PurchaseOrder> {
    const updateData: Record<string, unknown> = {
      id: orderId,
      status: 'approved',
      approval_date: new Date().toISOString(),
    };
    if (approverId) updateData.approved_by_id = approverId;

    const results = await this.update([updateData as Partial<PurchaseOrder>]);
    return results[0];
  }

  /**
   * Mark as ordered (sent to supplier).
   */
  async markOrdered(orderId: number, expectedDeliveryDate?: string): Promise<PurchaseOrder> {
    const updateData: Record<string, unknown> = {
      id: orderId,
      status: 'ordered',
      date_ordered: new Date().toISOString(),
    };
    if (expectedDeliveryDate) updateData.date_expected_delivery = expectedDeliveryDate;

    const results = await this.update([updateData as Partial<PurchaseOrder>]);
    return results[0];
  }

  /**
   * Mark as received.
   */
  async markReceived(orderId: number): Promise<PurchaseOrder> {
    const updateData: Record<string, unknown> = {
      id: orderId,
      status: 'received',
      date_received: new Date().toISOString(),
    };

    const results = await this.update([updateData as Partial<PurchaseOrder>]);
    return results[0];
  }

  /**
   * Partially receive items.
   */
  async receiveItems(orderId: number, lineItems: { lineId: number; quantityReceived: number }[]): Promise<PurchaseOrder> {
    const formattedLines = lineItems.map(item => ({
      id: item.lineId,
      quantity_received: item.quantityReceived,
    }));

    await this.client.post(`${this.endpoint}/${orderId}/receive`, { lines: formattedLines });
    return this.get(orderId);
  }

  /**
   * Cancel a purchase order.
   */
  async cancel(orderId: number, reason?: string): Promise<PurchaseOrder> {
    const updateData: Record<string, unknown> = {
      id: orderId,
      status: 'cancelled',
    };
    if (reason) updateData.notes = reason;

    const results = await this.update([updateData as Partial<PurchaseOrder>]);
    return results[0];
  }

  /**
   * Create purchase order for a ticket.
   */
  async createForTicket(ticketId: number, supplierId: number, lines: Partial<PurchaseOrderLine>[]): Promise<PurchaseOrder> {
    const formattedLines = lines.map(line => ({
      description: line.description,
      quantity: line.quantity || 1,
      unit_cost: line.unitCost,
      item_id: line.itemId,
    }));

    const orderData: Record<string, unknown> = {
      ticket_id: ticketId,
      supplier_id: supplierId,
      lines: formattedLines,
    };

    const results = await this.create([orderData as Partial<PurchaseOrder>]);
    return results[0];
  }
}

// ============================================
// PRODUCT SERVICE
// ============================================

/**
 * Service for product/item operations.
 */
export class ProductService extends BaseService<Product, ProductApiResponse> {
  protected endpoint = '/Item';

  protected transform(data: ProductApiResponse): Product {
    return transformProduct(data);
  }

  /**
   * List products with filters.
   */
  async listFiltered(options: {
    type?: ProductType;
    categoryId?: number;
    supplierId?: number;
    search?: string;
    activeOnly?: boolean;
    lowStock?: boolean;
    count?: number;
  } = {}): Promise<Product[]> {
    const { type, categoryId, supplierId, search, activeOnly = false, lowStock = false, count = 100 } = options;

    const params: ListParams = { count };

    if (type) params.type = type;
    if (categoryId) params.category_id = categoryId;
    if (supplierId) params.supplier_id = supplierId;
    if (search) params.search = search;
    if (activeOnly) params.is_active = true;
    if (lowStock) params.low_stock = true;

    return this.list(params);
  }

  /**
   * List active products.
   */
  async listActive(count = 100): Promise<Product[]> {
    return this.listFiltered({ activeOnly: true, count });
  }

  /**
   * List sellable products.
   */
  async listSellable(count = 100): Promise<Product[]> {
    const products = await this.listFiltered({ activeOnly: true, count });
    return products.filter(p => p.isSellable);
  }

  /**
   * List purchasable products.
   */
  async listPurchasable(count = 100): Promise<Product[]> {
    const products = await this.listFiltered({ activeOnly: true, count });
    return products.filter(p => p.isPurchasable);
  }

  /**
   * List products by category.
   */
  async listByCategory(categoryId: number, count = 100): Promise<Product[]> {
    return this.listFiltered({ categoryId, count });
  }

  /**
   * List products by supplier.
   */
  async listBySupplier(supplierId: number, count = 100): Promise<Product[]> {
    return this.listFiltered({ supplierId, count });
  }

  /**
   * Search products by name, code, or SKU.
   */
  async search(query: string, count = 20): Promise<Product[]> {
    return this.listFiltered({ search: query, count });
  }

  /**
   * Get product by code.
   */
  async getByCode(code: string): Promise<Product | null> {
    const products = await this.list({ code });
    return products[0] || null;
  }

  /**
   * Get product by SKU.
   */
  async getBySku(sku: string): Promise<Product | null> {
    const products = await this.list({ sku });
    return products[0] || null;
  }

  /**
   * List low stock products.
   */
  async listLowStock(count = 100): Promise<Product[]> {
    return this.listFiltered({ lowStock: true, activeOnly: true, count });
  }

  /**
   * Update stock level.
   */
  async updateStockLevel(productId: number, stockLevel: number): Promise<Product> {
    const results = await this.update([{
      id: productId,
      stockLevel,
    } as Partial<Product>]);
    return results[0];
  }

  /**
   * Adjust stock level (add or subtract).
   */
  async adjustStock(productId: number, adjustment: number, reason?: string): Promise<Product> {
    const product = await this.get(productId);
    const newLevel = (product.stockLevel || 0) + adjustment;

    const updateData: Record<string, unknown> = {
      id: productId,
      stock_level: Math.max(0, newLevel),
    };
    if (reason) updateData.stock_adjustment_reason = reason;

    const results = await this.update([updateData as Partial<Product>]);
    return results[0];
  }

  /**
   * Activate a product.
   */
  async activate(productId: number): Promise<Product> {
    const results = await this.update([{ id: productId, isActive: true } as Partial<Product>]);
    return results[0];
  }

  /**
   * Deactivate a product.
   */
  async deactivate(productId: number): Promise<Product> {
    const results = await this.update([{ id: productId, isActive: false } as Partial<Product>]);
    return results[0];
  }
}

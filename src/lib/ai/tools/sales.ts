/**
 * Sales-related AI tools for HaloPSA.
 * Covers sales orders, suppliers, purchase orders, and products.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { HaloContext } from './context';
import type {
  SalesOrder,
  SalesOrderLine,
  Supplier,
  PurchaseOrder,
  PurchaseOrderLine,
  Product,
} from '@/lib/halopsa/types';
import { formatError, TOOL_DEFAULTS } from './utils';

const { DEFAULT_COUNT } = TOOL_DEFAULTS;

export function createSalesTools(ctx: HaloContext) {
  return {
    // ============================================
    // SALES ORDER OPERATIONS
    // ============================================
    listSalesOrders: tool({
      description: 'List sales orders with optional filters.',
      parameters: z.object({
        clientId: z.number().optional().describe('Filter by client ID'),
        status: z.enum(['draft', 'pending', 'approved', 'processing', 'fulfilled', 'cancelled']).optional().describe('Filter by status'),
        agentId: z.number().optional().describe('Filter by agent ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ clientId, status, agentId, startDate, endDate, count }) => {
        try {
          const orders = await ctx.salesOrders.listFiltered({
            clientId,
            status,
            agentId,
            startDate,
            endDate,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: orders.length,
            data: orders.map((o: SalesOrder) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              client: o.clientName,
              status: o.status,
              total: o.total,
              dateOrdered: o.dateOrdered,
              dateDue: o.dateDue,
            })),
          };
        } catch (error) {
          return formatError(error, 'listSalesOrders');
        }
      },
    }),

    getSalesOrder: tool({
      description: 'Get detailed information about a sales order.',
      parameters: z.object({
        orderId: z.number().describe('The sales order ID'),
      }),
      execute: async ({ orderId }) => {
        try {
          const order = await ctx.salesOrders.getWithDetails(orderId);
          return {
            success: true,
            id: order.id,
            orderNumber: order.orderNumber,
            client: order.clientName,
            status: order.status,
            subtotal: order.subtotal,
            taxTotal: order.taxTotal,
            total: order.total,
            dateOrdered: order.dateOrdered,
            dateDue: order.dateDue,
            dateFulfilled: order.dateFulfilled,
            shippingAddress: order.shippingAddress,
            lines: order.lines.map((l: SalesOrderLine) => ({
              id: l.id,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
              quantityFulfilled: l.quantityFulfilled,
            })),
          };
        } catch (error) {
          return formatError(error, 'getSalesOrder');
        }
      },
    }),

    createSalesOrder: tool({
      description: 'Create a new sales order.',
      parameters: z.object({
        clientId: z.number().describe('Client ID'),
        quotationId: z.number().optional().describe('Create from quotation'),
        dateDue: z.string().optional().describe('Due date (YYYY-MM-DD)'),
        shippingAddress: z.string().optional().describe('Shipping address'),
        notes: z.string().optional().describe('Order notes'),
        lines: z.array(z.object({
          description: z.string().describe('Line description'),
          quantity: z.number().optional().default(1).describe('Quantity'),
          unitPrice: z.number().describe('Unit price'),
          itemId: z.number().optional().describe('Product ID'),
        })).optional().describe('Order line items'),
      }),
      execute: async ({ clientId, quotationId, dateDue, shippingAddress, notes, lines }) => {
        try {
          let order;

          if (quotationId) {
            order = await ctx.salesOrders.createFromQuotation(quotationId);
          } else {
            const orderData: Record<string, unknown> = {
              client_id: clientId,
            };

            if (dateDue) orderData.date_due = dateDue;
            if (shippingAddress) orderData.shipping_address = shippingAddress;
            if (notes) orderData.notes = notes;
            if (lines) {
              orderData.lines = lines.map(l => ({
                description: l.description,
                quantity: l.quantity || 1,
                unit_price: l.unitPrice,
                item_id: l.itemId,
              }));
            }

            const orders = await ctx.salesOrders.create([orderData]);
            order = orders[0];
          }

          return {
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            message: `Sales order ${order.orderNumber} created`,
          };
        } catch (error) {
          return formatError(error, 'createSalesOrder');
        }
      },
    }),

    updateSalesOrderStatus: tool({
      description: 'Update sales order status (approve, process, fulfill, cancel).',
      parameters: z.object({
        orderId: z.number().describe('The sales order ID'),
        action: z.enum(['approve', 'process', 'fulfill', 'cancel']).describe('Action to perform'),
        reason: z.string().optional().describe('Reason for cancellation'),
      }),
      execute: async ({ orderId, action, reason }) => {
        try {
          let order;
          switch (action) {
            case 'approve':
              order = await ctx.salesOrders.approve(orderId);
              break;
            case 'process':
              order = await ctx.salesOrders.startProcessing(orderId);
              break;
            case 'fulfill':
              order = await ctx.salesOrders.markFulfilled(orderId);
              break;
            case 'cancel':
              order = await ctx.salesOrders.cancel(orderId, reason);
              break;
          }

          return {
            success: true,
            orderId: order.id,
            status: order.status,
            message: `Sales order ${action}ed successfully`,
          };
        } catch (error) {
          return formatError(error, 'updateSalesOrderStatus');
        }
      },
    }),

    convertSalesOrderToInvoice: tool({
      description: 'Convert a sales order to an invoice.',
      parameters: z.object({
        orderId: z.number().describe('The sales order ID'),
      }),
      execute: async ({ orderId }) => {
        try {
          const result = await ctx.salesOrders.convertToInvoice(orderId);
          return {
            success: true,
            orderId,
            invoiceId: result.invoiceId,
            message: `Sales order converted to invoice #${result.invoiceId}`,
          };
        } catch (error) {
          return formatError(error, 'convertSalesOrderToInvoice');
        }
      },
    }),

    // ============================================
    // SUPPLIER OPERATIONS
    // ============================================
    listSuppliers: tool({
      description: 'List suppliers/vendors.',
      parameters: z.object({
        search: z.string().optional().describe('Search by name or code'),
        activeOnly: z.boolean().optional().default(true).describe('Only show active suppliers'),
        count: z.number().optional().default(50).describe('Maximum number to return'),
      }),
      execute: async ({ search, activeOnly, count }) => {
        try {
          const suppliers = await ctx.suppliers.listFiltered({
            search,
            activeOnly,
            count: count || 50,
          });

          return {
            success: true,
            count: suppliers.length,
            data: suppliers.map((s: Supplier) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              email: s.email,
              phone: s.phone,
              contactName: s.contactName,
              isActive: s.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listSuppliers');
        }
      },
    }),

    getSupplier: tool({
      description: 'Get detailed supplier information.',
      parameters: z.object({
        supplierId: z.number().describe('The supplier ID'),
      }),
      execute: async ({ supplierId }) => {
        try {
          const supplier = await ctx.suppliers.get(supplierId);
          return {
            success: true,
            id: supplier.id,
            name: supplier.name,
            code: supplier.code,
            email: supplier.email,
            phone: supplier.phone,
            website: supplier.website,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            country: supplier.country,
            contactName: supplier.contactName,
            contactEmail: supplier.contactEmail,
            contactPhone: supplier.contactPhone,
            paymentTerms: supplier.paymentTerms,
            isActive: supplier.isActive,
          };
        } catch (error) {
          return formatError(error, 'getSupplier');
        }
      },
    }),

    createSupplier: tool({
      description: 'Create a new supplier/vendor.',
      parameters: z.object({
        name: z.string().describe('Supplier name'),
        code: z.string().optional().describe('Supplier code'),
        email: z.string().optional().describe('Email address'),
        phone: z.string().optional().describe('Phone number'),
        website: z.string().optional().describe('Website URL'),
        address: z.string().optional().describe('Street address'),
        city: z.string().optional().describe('City'),
        state: z.string().optional().describe('State/Province'),
        country: z.string().optional().describe('Country'),
        contactName: z.string().optional().describe('Primary contact name'),
        contactEmail: z.string().optional().describe('Primary contact email'),
        paymentTerms: z.string().optional().describe('Payment terms'),
      }),
      execute: async (params) => {
        try {
          const supplierData: Record<string, unknown> = {
            name: params.name,
            is_active: true,
          };

          if (params.code) supplierData.code = params.code;
          if (params.email) supplierData.email = params.email;
          if (params.phone) supplierData.phone = params.phone;
          if (params.website) supplierData.website = params.website;
          if (params.address) supplierData.address = params.address;
          if (params.city) supplierData.city = params.city;
          if (params.state) supplierData.state = params.state;
          if (params.country) supplierData.country = params.country;
          if (params.contactName) supplierData.contact_name = params.contactName;
          if (params.contactEmail) supplierData.contact_email = params.contactEmail;
          if (params.paymentTerms) supplierData.payment_terms = params.paymentTerms;

          const suppliers = await ctx.suppliers.create([supplierData]);
          return {
            success: true,
            supplierId: suppliers[0].id,
            name: suppliers[0].name,
            message: `Supplier "${suppliers[0].name}" created`,
          };
        } catch (error) {
          return formatError(error, 'createSupplier');
        }
      },
    }),

    // ============================================
    // PURCHASE ORDER OPERATIONS
    // ============================================
    listPurchaseOrders: tool({
      description: 'List purchase orders.',
      parameters: z.object({
        supplierId: z.number().optional().describe('Filter by supplier ID'),
        status: z.enum(['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled']).optional().describe('Filter by status'),
        agentId: z.number().optional().describe('Filter by agent ID'),
        startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
        count: z.number().optional().default(DEFAULT_COUNT).describe('Maximum number to return'),
      }),
      execute: async ({ supplierId, status, agentId, startDate, endDate, count }) => {
        try {
          const orders = await ctx.purchaseOrders.listFiltered({
            supplierId,
            status,
            agentId,
            startDate,
            endDate,
            count: count || DEFAULT_COUNT,
          });

          return {
            success: true,
            count: orders.length,
            data: orders.map((o: PurchaseOrder) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              supplier: o.supplierName,
              status: o.status,
              total: o.total,
              dateOrdered: o.dateOrdered,
              expectedDelivery: o.dateExpectedDelivery,
            })),
          };
        } catch (error) {
          return formatError(error, 'listPurchaseOrders');
        }
      },
    }),

    getPurchaseOrder: tool({
      description: 'Get detailed purchase order information.',
      parameters: z.object({
        orderId: z.number().describe('The purchase order ID'),
      }),
      execute: async ({ orderId }) => {
        try {
          const order = await ctx.purchaseOrders.getWithDetails(orderId);
          return {
            success: true,
            id: order.id,
            orderNumber: order.orderNumber,
            supplier: order.supplierName,
            status: order.status,
            subtotal: order.subtotal,
            taxTotal: order.taxTotal,
            total: order.total,
            dateOrdered: order.dateOrdered,
            expectedDelivery: order.dateExpectedDelivery,
            dateReceived: order.dateReceived,
            approvedBy: order.approvedByName,
            lines: order.lines.map((l: PurchaseOrderLine) => ({
              id: l.id,
              description: l.description,
              quantity: l.quantity,
              unitCost: l.unitCost,
              lineTotal: l.lineTotal,
              quantityReceived: l.quantityReceived,
            })),
          };
        } catch (error) {
          return formatError(error, 'getPurchaseOrder');
        }
      },
    }),

    createPurchaseOrder: tool({
      description: 'Create a new purchase order.',
      parameters: z.object({
        supplierId: z.number().describe('Supplier ID'),
        ticketId: z.number().optional().describe('Related ticket ID'),
        projectId: z.number().optional().describe('Related project ID'),
        expectedDeliveryDate: z.string().optional().describe('Expected delivery date (YYYY-MM-DD)'),
        notes: z.string().optional().describe('Order notes'),
        lines: z.array(z.object({
          description: z.string().describe('Line description'),
          quantity: z.number().optional().default(1).describe('Quantity'),
          unitCost: z.number().describe('Unit cost'),
          itemId: z.number().optional().describe('Product ID'),
        })).describe('Order line items'),
      }),
      execute: async ({ supplierId, ticketId, projectId, expectedDeliveryDate, notes, lines }) => {
        try {
          const orderData: Record<string, unknown> = {
            supplier_id: supplierId,
            lines: lines.map(l => ({
              description: l.description,
              quantity: l.quantity || 1,
              unit_cost: l.unitCost,
              item_id: l.itemId,
            })),
          };

          if (ticketId) orderData.ticket_id = ticketId;
          if (projectId) orderData.project_id = projectId;
          if (expectedDeliveryDate) orderData.date_expected_delivery = expectedDeliveryDate;
          if (notes) orderData.notes = notes;

          const orders = await ctx.purchaseOrders.create([orderData]);
          return {
            success: true,
            orderId: orders[0].id,
            orderNumber: orders[0].orderNumber,
            message: `Purchase order ${orders[0].orderNumber} created`,
          };
        } catch (error) {
          return formatError(error, 'createPurchaseOrder');
        }
      },
    }),

    updatePurchaseOrderStatus: tool({
      description: 'Update purchase order status (submit, approve, order, receive, cancel).',
      parameters: z.object({
        orderId: z.number().describe('The purchase order ID'),
        action: z.enum(['submit', 'approve', 'order', 'receive', 'cancel']).describe('Action to perform'),
        expectedDeliveryDate: z.string().optional().describe('Expected delivery date (for order action)'),
        reason: z.string().optional().describe('Reason for cancellation'),
      }),
      execute: async ({ orderId, action, expectedDeliveryDate, reason }) => {
        try {
          let order;
          switch (action) {
            case 'submit':
              order = await ctx.purchaseOrders.submitForApproval(orderId);
              break;
            case 'approve':
              order = await ctx.purchaseOrders.approve(orderId);
              break;
            case 'order':
              order = await ctx.purchaseOrders.markOrdered(orderId, expectedDeliveryDate);
              break;
            case 'receive':
              order = await ctx.purchaseOrders.markReceived(orderId);
              break;
            case 'cancel':
              order = await ctx.purchaseOrders.cancel(orderId, reason);
              break;
          }

          return {
            success: true,
            orderId: order.id,
            status: order.status,
            message: `Purchase order ${action === 'submit' ? 'submitted for approval' : action + 'ed'}`,
          };
        } catch (error) {
          return formatError(error, 'updatePurchaseOrderStatus');
        }
      },
    }),

    // ============================================
    // PRODUCT OPERATIONS
    // ============================================
    listProducts: tool({
      description: 'List products/items in the catalog.',
      parameters: z.object({
        type: z.enum(['product', 'service', 'subscription', 'bundle']).optional().describe('Filter by product type'),
        categoryId: z.number().optional().describe('Filter by category ID'),
        supplierId: z.number().optional().describe('Filter by supplier ID'),
        search: z.string().optional().describe('Search by name, code, or SKU'),
        activeOnly: z.boolean().optional().default(true).describe('Only show active products'),
        lowStock: z.boolean().optional().describe('Only show low stock items'),
        count: z.number().optional().default(50).describe('Maximum number to return'),
      }),
      execute: async ({ type, categoryId, supplierId, search, activeOnly, lowStock, count }) => {
        try {
          const products = await ctx.products.listFiltered({
            type,
            categoryId,
            supplierId,
            search,
            activeOnly,
            lowStock,
            count: count || 50,
          });

          return {
            success: true,
            count: products.length,
            data: products.map((p: Product) => ({
              id: p.id,
              name: p.name,
              code: p.code,
              sku: p.sku,
              type: p.type,
              unitPrice: p.unitPrice,
              stockLevel: p.stockLevel,
              isActive: p.isActive,
            })),
          };
        } catch (error) {
          return formatError(error, 'listProducts');
        }
      },
    }),

    getProduct: tool({
      description: 'Get detailed product information.',
      parameters: z.object({
        productId: z.number().describe('The product ID'),
      }),
      execute: async ({ productId }) => {
        try {
          const product = await ctx.products.get(productId);
          return {
            success: true,
            id: product.id,
            name: product.name,
            code: product.code,
            sku: product.sku,
            type: product.type,
            description: product.description,
            category: product.categoryName,
            unitPrice: product.unitPrice,
            unitCost: product.unitCost,
            stockLevel: product.stockLevel,
            reorderLevel: product.reorderLevel,
            supplier: product.supplierName,
            isTaxable: product.isTaxable,
            isActive: product.isActive,
            isSellable: product.isSellable,
            isPurchasable: product.isPurchasable,
          };
        } catch (error) {
          return formatError(error, 'getProduct');
        }
      },
    }),

    createProduct: tool({
      description: 'Create a new product in the catalog.',
      parameters: z.object({
        name: z.string().describe('Product name'),
        type: z.enum(['product', 'service', 'subscription', 'bundle']).optional().default('product').describe('Product type'),
        code: z.string().optional().describe('Product code'),
        sku: z.string().optional().describe('SKU'),
        description: z.string().optional().describe('Description'),
        unitPrice: z.number().describe('Unit sell price'),
        unitCost: z.number().optional().describe('Unit cost'),
        categoryId: z.number().optional().describe('Category ID'),
        supplierId: z.number().optional().describe('Supplier ID'),
        stockLevel: z.number().optional().describe('Initial stock level'),
        reorderLevel: z.number().optional().describe('Reorder threshold'),
        isTaxable: z.boolean().optional().default(true).describe('Whether taxable'),
        isSellable: z.boolean().optional().default(true).describe('Can be sold'),
        isPurchasable: z.boolean().optional().default(true).describe('Can be purchased'),
      }),
      execute: async (params) => {
        try {
          const productData: Record<string, unknown> = {
            name: params.name,
            type: params.type || 'product',
            unit_price: params.unitPrice,
            is_active: true,
            is_taxable: params.isTaxable ?? true,
            is_sellable: params.isSellable ?? true,
            is_purchasable: params.isPurchasable ?? true,
          };

          if (params.code) productData.code = params.code;
          if (params.sku) productData.sku = params.sku;
          if (params.description) productData.description = params.description;
          if (params.unitCost) productData.unit_cost = params.unitCost;
          if (params.categoryId) productData.category_id = params.categoryId;
          if (params.supplierId) productData.supplier_id = params.supplierId;
          if (params.stockLevel !== undefined) productData.stock_level = params.stockLevel;
          if (params.reorderLevel !== undefined) productData.reorder_level = params.reorderLevel;

          const products = await ctx.products.create([productData]);
          return {
            success: true,
            productId: products[0].id,
            name: products[0].name,
            message: `Product "${products[0].name}" created`,
          };
        } catch (error) {
          return formatError(error, 'createProduct');
        }
      },
    }),

    updateProductStock: tool({
      description: 'Update product stock level.',
      parameters: z.object({
        productId: z.number().describe('The product ID'),
        adjustment: z.number().describe('Stock adjustment (positive to add, negative to remove)'),
        reason: z.string().optional().describe('Reason for adjustment'),
      }),
      execute: async ({ productId, adjustment, reason }) => {
        try {
          const product = await ctx.products.adjustStock(productId, adjustment, reason);
          return {
            success: true,
            productId: product.id,
            name: product.name,
            newStockLevel: product.stockLevel,
            message: `Stock ${adjustment >= 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)}`,
          };
        } catch (error) {
          return formatError(error, 'updateProductStock');
        }
      },
    }),

    searchProducts: tool({
      description: 'Search for products by name, code, or SKU.',
      parameters: z.object({
        query: z.string().describe('Search query'),
        count: z.number().optional().default(20).describe('Maximum number to return'),
      }),
      execute: async ({ query, count }) => {
        try {
          const products = await ctx.products.search(query, count || 20);
          return {
            success: true,
            count: products.length,
            data: products.map((p: Product) => ({
              id: p.id,
              name: p.name,
              code: p.code,
              sku: p.sku,
              unitPrice: p.unitPrice,
              stockLevel: p.stockLevel,
            })),
          };
        } catch (error) {
          return formatError(error, 'searchProducts');
        }
      },
    }),
  };
}

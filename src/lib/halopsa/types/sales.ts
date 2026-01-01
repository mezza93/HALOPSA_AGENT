/**
 * Sales-related types for HaloPSA API.
 * Includes SalesOrder, Supplier, PurchaseOrder, and Product types.
 */

import { HaloBaseEntity } from './common';

// ============================================
// SALES ORDER TYPES
// ============================================

/**
 * Sales order status.
 */
export type SalesOrderStatus = 'draft' | 'pending' | 'approved' | 'processing' | 'fulfilled' | 'cancelled';

/**
 * Sales order line item.
 */
export interface SalesOrderLine {
  id?: number;
  lineNumber?: number;
  itemId?: number;
  itemName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal: number;
  quantityFulfilled?: number;
  isFulfilled?: boolean;
}

/**
 * Sales order entity.
 */
export interface SalesOrder extends HaloBaseEntity {
  orderNumber: string;
  clientId: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;
  quotationId?: number;
  opportunityId?: number;
  status: SalesOrderStatus;
  dateCreated: string;
  dateOrdered?: string;
  dateDue?: string;
  dateFulfilled?: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currencyCode?: string;
  notes?: string;
  shippingAddress?: string;
  billingAddress?: string;
  agentId?: number;
  agentName?: string;
  lines: SalesOrderLine[];
}

/**
 * Raw sales order from API.
 */
export interface SalesOrderApiResponse {
  id: number;
  order_number?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  quotation_id?: number;
  opportunity_id?: number;
  status?: string;
  date_created?: string;
  date_ordered?: string;
  date_due?: string;
  date_fulfilled?: string;
  subtotal?: number;
  tax_total?: number;
  discount_total?: number;
  total?: number;
  currency_code?: string;
  notes?: string;
  shipping_address?: string;
  billing_address?: string;
  agent_id?: number;
  agent_name?: string;
  lines?: SalesOrderLineApiResponse[];
  [key: string]: unknown;
}

/**
 * Sales order line from API.
 */
export interface SalesOrderLineApiResponse {
  id?: number;
  line_number?: number;
  item_id?: number;
  item_name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total?: number;
  quantity_fulfilled?: number;
  is_fulfilled?: boolean;
  [key: string]: unknown;
}

// ============================================
// SUPPLIER TYPES
// ============================================

/**
 * Supplier entity.
 */
export interface Supplier extends HaloBaseEntity {
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  accountNumber?: string;
  taxId?: string;
  currencyCode?: string;
}

/**
 * Raw supplier from API.
 */
export interface SupplierApiResponse {
  id: number;
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
  account_number?: string;
  tax_id?: string;
  currency_code?: string;
  [key: string]: unknown;
}

// ============================================
// PURCHASE ORDER TYPES
// ============================================

/**
 * Purchase order status.
 */
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';

/**
 * Purchase order line item.
 */
export interface PurchaseOrderLine {
  id?: number;
  lineNumber?: number;
  itemId?: number;
  itemName?: string;
  description: string;
  quantity: number;
  unitCost: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal: number;
  quantityReceived?: number;
  isReceived?: boolean;
}

/**
 * Purchase order entity.
 */
export interface PurchaseOrder extends HaloBaseEntity {
  orderNumber: string;
  supplierId: number;
  supplierName?: string;
  status: PurchaseOrderStatus;
  dateCreated: string;
  dateOrdered?: string;
  dateExpectedDelivery?: string;
  dateReceived?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  currencyCode?: string;
  notes?: string;
  shippingAddress?: string;
  agentId?: number;
  agentName?: string;
  approvedById?: number;
  approvedByName?: string;
  approvalDate?: string;
  lines: PurchaseOrderLine[];
  // Related entities
  ticketId?: number;
  projectId?: number;
  clientId?: number;
}

/**
 * Raw purchase order from API.
 */
export interface PurchaseOrderApiResponse {
  id: number;
  order_number?: string;
  supplier_id?: number;
  supplier_name?: string;
  status?: string;
  date_created?: string;
  date_ordered?: string;
  date_expected_delivery?: string;
  date_received?: string;
  subtotal?: number;
  tax_total?: number;
  total?: number;
  currency_code?: string;
  notes?: string;
  shipping_address?: string;
  agent_id?: number;
  agent_name?: string;
  approved_by_id?: number;
  approved_by_name?: string;
  approval_date?: string;
  lines?: PurchaseOrderLineApiResponse[];
  ticket_id?: number;
  project_id?: number;
  client_id?: number;
  [key: string]: unknown;
}

/**
 * Purchase order line from API.
 */
export interface PurchaseOrderLineApiResponse {
  id?: number;
  line_number?: number;
  item_id?: number;
  item_name?: string;
  description?: string;
  quantity?: number;
  unit_cost?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total?: number;
  quantity_received?: number;
  is_received?: boolean;
  [key: string]: unknown;
}

// ============================================
// PRODUCT/ITEM TYPES
// ============================================

/**
 * Product type.
 */
export type ProductType = 'product' | 'service' | 'subscription' | 'bundle';

/**
 * Product/Item entity.
 */
export interface Product extends HaloBaseEntity {
  name: string;
  code?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  type: ProductType;
  categoryId?: number;
  categoryName?: string;
  unitPrice: number;
  unitCost?: number;
  taxRate?: number;
  isTaxable: boolean;
  isActive: boolean;
  isSellable: boolean;
  isPurchasable: boolean;
  stockLevel?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  supplierId?: number;
  supplierName?: string;
  supplierPartNumber?: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
  imageUrl?: string;
}

/**
 * Raw product from API.
 */
export interface ProductApiResponse {
  id: number;
  name?: string;
  code?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  type?: string;
  category_id?: number;
  category_name?: string;
  unit_price?: number;
  unit_cost?: number;
  tax_rate?: number;
  is_taxable?: boolean;
  is_active?: boolean;
  is_sellable?: boolean;
  is_purchasable?: boolean;
  stock_level?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  supplier_id?: number;
  supplier_name?: string;
  supplier_part_number?: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
  image_url?: string;
  [key: string]: unknown;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

/**
 * Transform sales order line from API.
 */
export function transformSalesOrderLine(data: SalesOrderLineApiResponse): SalesOrderLine {
  return {
    id: data.id,
    lineNumber: data.line_number,
    itemId: data.item_id,
    itemName: data.item_name,
    description: data.description || '',
    quantity: data.quantity || 1,
    unitPrice: data.unit_price || 0,
    discount: data.discount,
    taxRate: data.tax_rate,
    taxAmount: data.tax_amount,
    lineTotal: data.line_total || 0,
    quantityFulfilled: data.quantity_fulfilled,
    isFulfilled: data.is_fulfilled,
  };
}

/**
 * Transform API response to SalesOrder interface.
 */
export function transformSalesOrder(data: SalesOrderApiResponse): SalesOrder {
  return {
    id: data.id,
    orderNumber: data.order_number || '',
    clientId: data.client_id || 0,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    quotationId: data.quotation_id,
    opportunityId: data.opportunity_id,
    status: (data.status as SalesOrderStatus) || 'draft',
    dateCreated: data.date_created || new Date().toISOString(),
    dateOrdered: data.date_ordered,
    dateDue: data.date_due,
    dateFulfilled: data.date_fulfilled,
    subtotal: data.subtotal || 0,
    taxTotal: data.tax_total || 0,
    discountTotal: data.discount_total || 0,
    total: data.total || 0,
    currencyCode: data.currency_code,
    notes: data.notes,
    shippingAddress: data.shipping_address,
    billingAddress: data.billing_address,
    agentId: data.agent_id,
    agentName: data.agent_name,
    lines: (data.lines || []).map(transformSalesOrderLine),
  };
}

/**
 * Transform API response to Supplier interface.
 */
export function transformSupplier(data: SupplierApiResponse): Supplier {
  return {
    id: data.id,
    name: data.name || '',
    code: data.code,
    email: data.email,
    phone: data.phone,
    website: data.website,
    address: data.address,
    city: data.city,
    state: data.state,
    postcode: data.postcode,
    country: data.country,
    contactName: data.contact_name,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    paymentTerms: data.payment_terms,
    notes: data.notes,
    isActive: data.is_active ?? true,
    accountNumber: data.account_number,
    taxId: data.tax_id,
    currencyCode: data.currency_code,
  };
}

/**
 * Transform purchase order line from API.
 */
export function transformPurchaseOrderLine(data: PurchaseOrderLineApiResponse): PurchaseOrderLine {
  return {
    id: data.id,
    lineNumber: data.line_number,
    itemId: data.item_id,
    itemName: data.item_name,
    description: data.description || '',
    quantity: data.quantity || 1,
    unitCost: data.unit_cost || 0,
    taxRate: data.tax_rate,
    taxAmount: data.tax_amount,
    lineTotal: data.line_total || 0,
    quantityReceived: data.quantity_received,
    isReceived: data.is_received,
  };
}

/**
 * Transform API response to PurchaseOrder interface.
 */
export function transformPurchaseOrder(data: PurchaseOrderApiResponse): PurchaseOrder {
  return {
    id: data.id,
    orderNumber: data.order_number || '',
    supplierId: data.supplier_id || 0,
    supplierName: data.supplier_name,
    status: (data.status as PurchaseOrderStatus) || 'draft',
    dateCreated: data.date_created || new Date().toISOString(),
    dateOrdered: data.date_ordered,
    dateExpectedDelivery: data.date_expected_delivery,
    dateReceived: data.date_received,
    subtotal: data.subtotal || 0,
    taxTotal: data.tax_total || 0,
    total: data.total || 0,
    currencyCode: data.currency_code,
    notes: data.notes,
    shippingAddress: data.shipping_address,
    agentId: data.agent_id,
    agentName: data.agent_name,
    approvedById: data.approved_by_id,
    approvedByName: data.approved_by_name,
    approvalDate: data.approval_date,
    lines: (data.lines || []).map(transformPurchaseOrderLine),
    ticketId: data.ticket_id,
    projectId: data.project_id,
    clientId: data.client_id,
  };
}

/**
 * Transform API response to Product interface.
 */
export function transformProduct(data: ProductApiResponse): Product {
  return {
    id: data.id,
    name: data.name || '',
    code: data.code,
    sku: data.sku,
    barcode: data.barcode,
    description: data.description,
    type: (data.type as ProductType) || 'product',
    categoryId: data.category_id,
    categoryName: data.category_name,
    unitPrice: data.unit_price || 0,
    unitCost: data.unit_cost,
    taxRate: data.tax_rate,
    isTaxable: data.is_taxable ?? true,
    isActive: data.is_active ?? true,
    isSellable: data.is_sellable ?? true,
    isPurchasable: data.is_purchasable ?? true,
    stockLevel: data.stock_level,
    reorderLevel: data.reorder_level,
    reorderQuantity: data.reorder_quantity,
    supplierId: data.supplier_id,
    supplierName: data.supplier_name,
    supplierPartNumber: data.supplier_part_number,
    weight: data.weight,
    dimensions: data.dimensions,
    notes: data.notes,
    imageUrl: data.image_url,
  };
}

/**
 * Client-related types for HaloPSA.
 */

import { HaloBaseEntity, CustomField } from './common';

/**
 * Site/location belonging to a client.
 */
export interface Site extends HaloBaseEntity {
  name: string;
  clientId?: number;
  clientName?: string;

  // Address information
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  postcode?: string;
  country?: string;

  // Contact
  phoneNumber?: string;
  faxNumber?: string;

  // Status
  inactive: boolean;

  // Relationships
  mainSite: boolean;
  userCount?: number;

  // Custom fields
  customFields?: CustomField[];
}

/**
 * Raw site data from API (snake_case).
 */
export interface SiteApiResponse {
  id: number;
  name: string;
  client_id?: number;
  client_name?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  postcode?: string;
  country?: string;
  phonenumber?: string;
  faxnumber?: string;
  inactive?: boolean;
  main_site?: boolean;
  user_count?: number;
  customfields?: CustomField[];
  [key: string]: unknown;
}

/**
 * End user/contact in HaloPSA.
 */
export interface User extends HaloBaseEntity {
  name: string;
  firstName?: string;
  surname?: string;

  // Contact information
  emailAddress?: string;
  phoneNumber?: string;
  mobileNumber?: string;

  // Organization
  clientId?: number;
  clientName?: string;
  siteId?: number;
  siteName?: string;
  departmentId?: number;
  departmentName?: string;

  // Status
  inactive: boolean;
  isImportantContact: boolean;

  // Portal access
  neverSendEmails: boolean;
  isServiceAccount: boolean;

  // Dates
  dateCreated?: Date | string;

  // Custom fields
  customFields?: CustomField[];
}

/**
 * Raw user data from API (snake_case).
 */
export interface UserApiResponse {
  id: number;
  name: string;
  firstname?: string;
  surname?: string;
  emailaddress?: string;
  phonenumber?: string;
  mobilenumber?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  department_id?: number;
  department_name?: string;
  inactive?: boolean;
  isimportantcontact?: boolean;
  neversendemails?: boolean;
  isserviceaccount?: boolean;
  datecreated?: string;
  customfields?: CustomField[];
  [key: string]: unknown;
}

/**
 * Client/customer organization in HaloPSA.
 */
export interface Client extends HaloBaseEntity {
  name: string;

  // Status
  inactive: boolean;

  // Parent/toplevel relationship
  toplevelId?: number;
  toplevelName?: string;

  // Primary contacts/technicians
  pritech?: number;
  pritechName?: string;
  sectech?: number;
  sectechName?: string;
  accountManagerTech?: number;
  accountManagerTechName?: string;

  // Main site
  mainSiteId?: number;

  // Accounting information
  accountsEmailAddress?: string;
  accountsFirstName?: string;
  accountsLastName?: string;

  // Ticket counts
  openTicketCount?: number;
  oppsTicketCount?: number;

  // Notes
  notes?: string;

  // Dates
  dateCreated?: Date | string;

  // Colour coding
  colour?: string;

  // Custom fields
  customFields?: CustomField[];

  // Related entities (populated when requested)
  sites?: Site[];
  users?: User[];
}

/**
 * Raw client data from API (snake_case).
 */
export interface ClientApiResponse {
  id: number;
  name: string;
  inactive?: boolean;
  toplevel_id?: number;
  toplevel_name?: string;
  pritech?: number;
  pritech_name?: string;
  sectech?: number;
  sectech_name?: string;
  accountmanagertech?: number;
  accountmanagertech_name?: string;
  main_site_id?: number;
  accountsemailaddress?: string;
  accountsfirstname?: string;
  accountslastname?: string;
  open_ticket_count?: number;
  opps_ticket_count?: number;
  notes?: string;
  datecreated?: string;
  colour?: string;
  customfields?: CustomField[];
  sites?: SiteApiResponse[];
  users?: UserApiResponse[];
  [key: string]: unknown;
}

/**
 * Client summary statistics.
 */
export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  totalOpenTickets: number;
  topByTickets: Array<{ name: string; count: number }>;
}

/**
 * Transform API response to Site interface.
 */
export function transformSite(data: SiteApiResponse): Site {
  return {
    id: data.id,
    name: data.name,
    clientId: data.client_id,
    clientName: data.client_name,
    line1: data.line1,
    line2: data.line2,
    line3: data.line3,
    line4: data.line4,
    postcode: data.postcode,
    country: data.country,
    phoneNumber: data.phonenumber,
    faxNumber: data.faxnumber,
    inactive: data.inactive ?? false,
    mainSite: data.main_site ?? false,
    userCount: data.user_count,
    customFields: data.customfields,
  };
}

/**
 * Transform API response to User interface.
 */
export function transformUser(data: UserApiResponse): User {
  return {
    id: data.id,
    name: data.name,
    firstName: data.firstname,
    surname: data.surname,
    emailAddress: data.emailaddress,
    phoneNumber: data.phonenumber,
    mobileNumber: data.mobilenumber,
    clientId: data.client_id,
    clientName: data.client_name,
    siteId: data.site_id,
    siteName: data.site_name,
    departmentId: data.department_id,
    departmentName: data.department_name,
    inactive: data.inactive ?? false,
    isImportantContact: data.isimportantcontact ?? false,
    neverSendEmails: data.neversendemails ?? false,
    isServiceAccount: data.isserviceaccount ?? false,
    dateCreated: data.datecreated,
    customFields: data.customfields,
  };
}

/**
 * Transform API response to Client interface.
 */
export function transformClient(data: ClientApiResponse): Client {
  return {
    id: data.id,
    name: data.name,
    inactive: data.inactive ?? false,
    toplevelId: data.toplevel_id,
    toplevelName: data.toplevel_name,
    pritech: data.pritech,
    pritechName: data.pritech_name,
    sectech: data.sectech,
    sectechName: data.sectech_name,
    accountManagerTech: data.accountmanagertech,
    accountManagerTechName: data.accountmanagertech_name,
    mainSiteId: data.main_site_id,
    accountsEmailAddress: data.accountsemailaddress,
    accountsFirstName: data.accountsfirstname,
    accountsLastName: data.accountslastname,
    openTicketCount: data.open_ticket_count,
    oppsTicketCount: data.opps_ticket_count,
    notes: data.notes,
    dateCreated: data.datecreated,
    colour: data.colour,
    customFields: data.customfields,
    sites: data.sites?.map(transformSite),
    users: data.users?.map(transformUser),
  };
}

/**
 * Get full name of user.
 */
export function getUserFullName(user: User): string {
  if (user.firstName && user.surname) {
    return `${user.firstName} ${user.surname}`;
  }
  return user.name;
}

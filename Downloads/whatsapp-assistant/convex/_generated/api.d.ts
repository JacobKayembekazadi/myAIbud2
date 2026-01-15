/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as appointments from "../appointments.js";
import type * as campaigns from "../campaigns.js";
import type * as contacts from "../contacts.js";
import type * as followUpSequences from "../followUpSequences.js";
import type * as instances from "../instances.js";
import type * as interactions from "../interactions.js";
import type * as leadScoring from "../leadScoring.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as sentiment from "../sentiment.js";
import type * as settings from "../settings.js";
import type * as subscriptionUsage from "../subscriptionUsage.js";
import type * as teamMembers from "../teamMembers.js";
import type * as tenants from "../tenants.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  appointments: typeof appointments;
  campaigns: typeof campaigns;
  contacts: typeof contacts;
  followUpSequences: typeof followUpSequences;
  instances: typeof instances;
  interactions: typeof interactions;
  leadScoring: typeof leadScoring;
  notifications: typeof notifications;
  organizations: typeof organizations;
  sentiment: typeof sentiment;
  settings: typeof settings;
  subscriptionUsage: typeof subscriptionUsage;
  teamMembers: typeof teamMembers;
  tenants: typeof tenants;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as clothingItems from "../clothingItems.js";
import type * as convert from "../convert.js";
import type * as locations from "../locations.js";
import type * as packinglists from "../packinglists.js";
import type * as upload from "../upload.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  clothingItems: typeof clothingItems;
  convert: typeof convert;
  locations: typeof locations;
  packinglists: typeof packinglists;
  upload: typeof upload;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-start */

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
import type * as cleanupNotes from "../cleanupNotes.js";
import type * as crons from "../crons.js";
import type * as noteFreeText from "../noteFreeText.js";
import type * as noteSectionAnnotations from "../noteSectionAnnotations.js";
import type * as noteSections from "../noteSections.js";
import type * as notes from "../notes.js";
import type * as users from "../users.js";
import type * as verseTags from "../verseTags.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cleanupNotes: typeof cleanupNotes;
  crons: typeof crons;
  noteFreeText: typeof noteFreeText;
  noteSectionAnnotations: typeof noteSectionAnnotations;
  noteSections: typeof noteSections;
  notes: typeof notes;
  users: typeof users;
  verseTags: typeof verseTags;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-end */

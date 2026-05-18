/**
 * Current version identifier for Terms of Service + Privacy Policy.
 *
 * Stamped onto every register row's `terms_version` so we can prove which
 * version a given account accepted. Bumping this string means existing
 * accounts have not accepted the new version — surface a re-acceptance
 * banner before continuing (legal P0 #5b, not yet built).
 *
 * Use the ISO date of the published doc, not the day we changed code.
 */
export const TERMS_VERSION = "2026-05-18";

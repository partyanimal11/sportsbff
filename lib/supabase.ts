/**
 * Supabase clients — STUBBED for now.
 *
 * Auth + database land in week 5 of the build plan. Until then this file
 * exports placeholders that throw if called, so any accidental usage fails
 * loudly. The real implementation (using @supabase/ssr) gets dropped in
 * once Aaron sets up a Supabase project.
 */

function notWired(): never {
  throw new Error(
    "[sportsBFF] Supabase isn't wired yet. See Sportsball_Build_Plan_v1.md for the week-5 plan."
  );
}

export function getBrowserSupabase(): never {
  return notWired();
}

export function getServerSupabase(): never {
  return notWired();
}

export function getServiceSupabase(): never {
  return notWired();
}

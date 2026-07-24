// Shared authorization for scheduled (cron) and admin-only backend functions.
// Scheduled automations pass the shared secret via function_args (body.args.cron_secret);
// authenticated admins may also invoke these endpoints manually.
const CRON_SECRET = "cs_cron_8d5f2a1e7b3c9f6a4e2d";

export async function authorizeCronOrAdmin(base44, body) {
  // Scheduled invocation: secret delivered in body.args.cron_secret (from function_args)
  // or top-level body.cron_secret for direct/manual calls.
  const incomingSecret = body?.cron_secret || body?.args?.cron_secret;
  if (incomingSecret && incomingSecret === CRON_SECRET) {
    return { ok: true, via: "cron" };
  }
  // Manual invocation by an authenticated admin
  const user = await base44.auth.me().catch(() => null);
  if (user && user.role === "admin") {
    return { ok: true, via: "admin", user };
  }
  return { ok: false };
}
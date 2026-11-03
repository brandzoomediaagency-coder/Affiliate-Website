/**
 * Grants a role to an existing user (who has already signed up).
 *
 *   npm run admin:grant -- you@example.com            # admin
 *   npm run admin:grant -- editor@example.com editor  # editor
 *   npm run admin:grant -- someone@example.com none   # remove roles
 */
import { serviceClient } from "./_env";

async function main() {
  const [emailArg, roleArg = "admin"] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  if (!email || !["admin", "editor", "none"].includes(roleArg)) {
    console.error("Usage: npm run admin:grant -- <email> [admin|editor|none]");
    process.exit(1);
  }
  const db = serviceClient();
  const { data: profile, error } = await db.from("profiles").select("id, email, status").eq("email", email).maybeSingle();
  if (error) throw error;
  if (!profile) {
    console.error(`No account found for ${email}. Sign up on the website first, then run this command again.`);
    process.exit(1);
  }
  await db.from("user_roles").delete().eq("user_id", profile.id);
  if (roleArg !== "none") {
    const { error: insertError } = await db.from("user_roles").insert({ user_id: profile.id, role: roleArg });
    if (insertError) throw insertError;
  }
  if (profile.status !== "active") await db.from("profiles").update({ status: "active" }).eq("id", profile.id);
  console.log(`✔ ${email} is now ${roleArg === "none" ? "a regular user" : `an ${roleArg}`}. Sign out and in again, then open /admin.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

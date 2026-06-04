import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "http://127.0.0.1:55321";
const DEFAULT_SUPABASE_SECRET_KEY = "__REMOVED_SUPABASE_SECRET__";
const DEFAULT_ADMIN_EMAIL = "admin@price.local";
const DEFAULT_ADMIN_PASSWORD = "PriceLocal@2026!";
const DEFAULT_ADMIN_ROLE = "owner";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? DEFAULT_SUPABASE_SECRET_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
const adminRole = process.env.ADMIN_ROLE ?? DEFAULT_ADMIN_ROLE;

const isLocalSupabase =
  supabaseUrl.startsWith("http://127.0.0.1") ||
  supabaseUrl.startsWith("http://localhost") ||
  supabaseUrl.startsWith("https://127.0.0.1") ||
  supabaseUrl.startsWith("https://localhost");

if (!isLocalSupabase && process.env.ALLOW_REMOTE_ADMIN_SEED !== "true") {
  throw new Error("Refusing to seed admin outside localhost. Set ALLOW_REMOTE_ADMIN_SEED=true to override.");
}

if (!supabaseSecretKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function upsertAuthUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (!error) {
    return data.user;
  }

  if (!error.message.toLowerCase().includes("already")) {
    throw error;
  }

  const existingUser = await findUserByEmail(adminEmail);

  if (!existingUser) {
    throw error;
  }

  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password: adminPassword,
    email_confirm: true,
  });

  if (updateError) {
    throw updateError;
  }

  return updatedUser.user;
}

const user = await upsertAuthUser();

const { error: adminMemberError } = await supabase.from("admin_members").upsert(
  {
    user_id: user.id,
    role: adminRole,
    active: true,
  },
  {
    onConflict: "user_id",
  },
);

if (adminMemberError) {
  throw adminMemberError;
}

console.log(
  JSON.stringify(
    {
      message: "Local admin ready.",
      supabaseUrl,
      email: adminEmail,
      password: adminPassword,
      role: adminRole,
      userId: user.id,
    },
    null,
    2,
  ),
);

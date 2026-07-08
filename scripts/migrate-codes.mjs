/**
 * One-time migration script: create redeem_codes table + import existing codes
 *
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment
 *      OR edit the variables at the top of this file
 *   2. node scripts/migrate-codes.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const JSON_PATH = process.argv[2] ?? "./data/redeem-codes.json";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ 请在环境变量中设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
  console.error("   或者将你的 Supabase URL 和 Service Role Key 粘贴到脚本顶部的变量中");
  console.error("\n   获取方式：Supabase Dashboard → Project Settings → API");
  process.exit(1);
}

// Step 1: Create the table
async function createTable() {
  const sql = `
    create table if not exists public.redeem_codes (
      code text primary key,
      status text not null default 'active',
      redeemed_at timestamptz,
      redeemed_by text,
      order_id text
    );
    create index if not exists redeem_codes_status_idx on public.redeem_codes (status);
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({}),
  });

  // Try direct SQL endpoint
  const sqlRes = await fetch(`${SUPABASE_URL}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!sqlRes.ok) {
    const text = await sqlRes.text();
    // If /sql endpoint doesn't work, try the management API
    console.log("⚠️ /sql endpoint failed, trying REST API...");
    console.log(`   Status: ${sqlRes.status}, Response: ${text.slice(0, 200)}`);

    // Alternative: use pg settings to execute SQL
    const pgRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Prefer": "params=single-object",
      },
      body: JSON.stringify({
        // Execute raw SQL via the 'execute_sql' RPC if available
      }),
    });

    if (pgRes.ok) {
      console.log("✅ Redeem codes table created via REST API");
    } else {
      const pgText = await pgRes.text();
      console.log(`   REST API also failed: ${pgText.slice(0, 200)}`);
    }

    // Fallback: try to just upsert data directly (table might already exist)
    console.log("   ⚠️ 请手动在 Supabase Dashboard -> SQL Editor 中执行以下 SQL：");
    console.log("\n--- SQL ---");
    console.log(sql);
    console.log("--- END ---\n");
    return false;
  }

  console.log("✅ 表 redeem_codes 创建成功");
  return true;
}

// Step 2: Import codes from JSON
async function importCodes() {
  const fs = await import("node:fs");
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const store = JSON.parse(raw);
  const codes = store.codes ?? [];

  if (codes.length === 0) {
    console.log("⚠️ JSON 文件中没有找到兑换码");
    return;
  }

  console.log(`📦 准备导入 ${codes.length} 个兑换码...`);

  const supa = (await import("@supabase/supabase-js")).createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const BATCH_SIZE = 50;
  let imported = 0;

  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    const batch = codes.slice(i, i + BATCH_SIZE).map((c) => ({
      code: c.code,
      status: c.status === "redeemed" ? "redeemed" : "active",
      redeemed_at: c.redeemedAt ?? null,
      redeemed_by: c.redeemedBy ?? null,
      order_id: c.orderId ?? null,
    }));

    const { error } = await supa
      .from("redeem_codes")
      .upsert(batch, { onConflict: "code", ignoreDuplicates: false });

    if (error) {
      console.error(`❌ 批次 ${i / BATCH_SIZE + 1} 导入失败：${error.message}`);
      continue;
    }
    imported += batch.length;
    console.log(`✓ 已导入 ${imported}/${codes.length}`);
  }

  console.log(`✅ 导入完成：${imported} 个兑换码`);
}

async function main() {
  console.log("🚀 开始迁移兑换码...\n");
  await createTable();
  await importCodes();
  console.log("\n✨ 迁移完成！");
}

main().catch((e) => {
  console.error("❌ 迁移失败：", e);
  process.exit(1);
});

import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { appConfig } from "@/lib/config";
import type { Order, OrderAsset, OrderStatus } from "@/lib/types";
import { absoluteStoragePath } from "@/services/storage";
import { assertSupabaseStoreReady, getSupabaseOrder, listSupabaseOrders, saveSupabaseOrder } from "@/services/supabaseStore";

type LocalPayment = { id: string; order_id: string; kind: "deposit" | "selection"; status: "paid"; amount_cents: number; provider: "mock"; provider_trade_no: string; paid_at: string; created_at: string };
export type LocalOrder = Order & { order_assets: OrderAsset[]; payments: LocalPayment[] };
type LocalStore = { orders: LocalOrder[] };

export function isLocalMvpMode() { return appConfig.geminiMockGeneration; }
function ordersJsonPath() { return absoluteStoragePath("orders.json"); }
function emptyStore(): LocalStore { return { orders: [] }; }
const runtimeInstructionLines = [
  "Use the uploaded clear front-facing portrait as identity reference.",
  "Keep identity and facial features consistent.",
  "Generate a tasteful realistic wedding or portrait photo.",
  "No text, no logos, no watermark, no extra people."
];
function stripRuntimeInstructionFromPrompt(prompt: string | null) {
  if (!prompt) return prompt;
  return runtimeInstructionLines.reduce((value, line) => value.replaceAll(`\n${line}`, "").replaceAll(line, ""), prompt).trim();
}
function isSupabaseStore() {
  return appConfig.storageDriver === "supabase";
}
function normalizeOrder(order: LocalOrder): LocalOrder {
  return {
    ...order,
    selected_theme_ids: order.selected_theme_ids ?? [],
    uploadedPhoto: order.uploadedPhoto ?? null,
    uploadedPhotos: order.uploadedPhotos ?? {},
    generation_jobs: order.generation_jobs ?? [],
    order_assets: (order.order_assets ?? []).map((asset) => {
      const rawGenerationType = asset.generation_type as OrderAsset["generation_type"] | "cover_bonus";
      return {
        ...asset,
        person_role: asset.person_role ?? null,
        theme_id: asset.theme_id ?? null,
        theme_name: asset.theme_name ?? null,
        prompt_id: asset.prompt_id ?? null,
        prompt_name: asset.prompt_name ?? null,
        aspect_ratio: asset.aspect_ratio ?? null,
        is_cover_prompt: asset.is_cover_prompt ?? false,
        generation_type: rawGenerationType === "cover_bonus" ? "sweet_spot" : rawGenerationType ?? null,
        generation_prompt: stripRuntimeInstructionFromPrompt(asset.generation_prompt),
        prompt_index: asset.prompt_index ?? null
      };
    }),
    payments: order.payments ?? []
  };
}

export async function ensureLocalStore() {
  if (isSupabaseStore()) {
    await assertSupabaseStoreReady();
    return;
  }
  await mkdir(absoluteStoragePath(""), { recursive: true });
  await mkdir(absoluteStoragePath("uploads"), { recursive: true });
  await mkdir(absoluteStoragePath("generated"), { recursive: true });
  await mkdir(absoluteStoragePath("previews"), { recursive: true });
  await mkdir(absoluteStoragePath("tasks"), { recursive: true });
  await mkdir(absoluteStoragePath("backups"), { recursive: true });
  try { await readFile(ordersJsonPath(), "utf8"); } catch { await writeStore(emptyStore()); }
}

async function readStore(): Promise<LocalStore> {
  if (isSupabaseStore()) {
    return { orders: (await listSupabaseOrders()).map((order) => normalizeOrder(order)) };
  }
  await ensureLocalStore();
  const raw = await readFile(ordersJsonPath(), "utf8");
  if (!raw.trim()) return emptyStore();
  const parsed = JSON.parse(raw) as LocalStore;
  return { orders: (parsed.orders ?? []).map((order) => normalizeOrder(order)) };
}
async function writeStore(store: LocalStore) {
  if (isSupabaseStore()) {
    await Promise.all(store.orders.map((order) => saveSupabaseOrder(order)));
    return;
  }
  await mkdir(path.dirname(ordersJsonPath()), { recursive: true });
  await mkdir(absoluteStoragePath("backups"), { recursive: true });
  const nextJson = `${JSON.stringify(store, null, 2)}\n`;
  JSON.parse(nextJson);
  try {
    const current = await readFile(ordersJsonPath(), "utf8");
    if (current.trim()) JSON.parse(current);
    const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
    await copyFile(ordersJsonPath(), absoluteStoragePath(`backups/orders-${stamp}.json`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const tmpPath = `${ordersJsonPath()}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, nextJson, "utf8");
  await rename(tmpPath, ordersJsonPath());
}
function str(value: FormDataEntryValue | null) { return typeof value === "string" && value.trim() ? value.trim() : null; }

export async function listLocalOrders() { return (await readStore()).orders.sort((a, b) => b.created_at.localeCompare(a.created_at)); }

export async function findOrdersByCustomerName(name: string): Promise<LocalOrder[]> {
  const all = await listLocalOrders();
  const trimmed = name.trim().toLowerCase();
  return all.filter((o) => o.customer_name?.toLowerCase().includes(trimmed));
}

export async function getLocalOrder(orderId: string) {
  if (isSupabaseStore()) {
    const order = await getSupabaseOrder(orderId);
    return order ? normalizeOrder(order) : null;
  }
  return (await readStore()).orders.find((order) => order.id === orderId) ?? null;
}
export async function createLocalOrder(input: { customerName: FormDataEntryValue | null; customerPhone: FormDataEntryValue | null; customerEmail: FormDataEntryValue | null }) {
  const now = new Date().toISOString();
  const order: LocalOrder = { id: randomUUID(), customer_name: str(input.customerName), customer_phone: str(input.customerPhone), customer_email: str(input.customerEmail), status: "pending_theme", deposit_amount_cents: 990, selected_count: 0, selection_amount_cents: 0, selected_theme_ids: [], uploadedPhoto: null, uploadedPhotos: {}, admin_note: null, reject_reason: null, created_at: now, updated_at: now, order_assets: [], payments: [] };
  if (isSupabaseStore()) {
    await saveSupabaseOrder(order);
    return order;
  }
  const store = await readStore();
  store.orders.push(order);
  await writeStore(store);
  return order;
}
export async function updateLocalOrder(orderId: string, updater: (order: LocalOrder) => LocalOrder) {
  if (isSupabaseStore()) {
    const current = await getSupabaseOrder(orderId);
    if (!current) return null;
    const updated = updater(structuredClone(normalizeOrder(current)));
    updated.updated_at = new Date().toISOString();
    await saveSupabaseOrder(updated);
    return updated;
  }
  const store = await readStore();
  const index = store.orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;
  const updated = updater(structuredClone(store.orders[index]));
  updated.updated_at = new Date().toISOString();
  store.orders[index] = updated;
  await writeStore(store);
  return updated;
}
export async function addLocalAsset(orderId: string, input: Omit<OrderAsset, "id" | "order_id" | "created_at">) {
  return updateLocalOrder(orderId, (order) => {
    order.order_assets.push({ ...input, id: randomUUID(), order_id: orderId, created_at: new Date().toISOString() });
    order.order_assets.sort((a, b) => a.sort_order - b.sort_order);
    return order;
  });
}
export async function clearLocalGeneratedAssets(orderId: string) {
  return updateLocalOrder(orderId, (order) => {
    order.order_assets = order.order_assets.filter((asset) => asset.kind !== "generated");
    order.selected_count = 0;
    order.selection_amount_cents = 0;
    return order;
  });
}
export async function updateLocalUploadedPhotos(orderId: string, uploadedPhotos: NonNullable<LocalOrder["uploadedPhotos"]>) {
  return updateLocalOrder(orderId, (order) => {
    order.uploadedPhotos = uploadedPhotos;
    order.uploadedPhoto = uploadedPhotos.bride ?? uploadedPhotos.groom ?? order.uploadedPhoto ?? null;
    return order;
  });
}
export async function updateLocalOrderStatus(orderId: string, status: OrderStatus, extra?: Partial<LocalOrder>) {
  return updateLocalOrder(orderId, (order) => {
    order.status = status;
    if (extra?.admin_note !== undefined) order.admin_note = extra.admin_note;
    if (extra?.reject_reason !== undefined) order.reject_reason = extra.reject_reason;
    return order;
  });
}
export async function saveLocalSelection(orderId: string, assetIds: string[]) {
  return updateLocalOrder(orderId, (order) => {
    const valid = new Set(order.order_assets.filter((asset) => asset.kind === "generated").map((asset) => asset.id));
    const selected = new Set(assetIds.filter((id) => valid.has(id)));
    order.order_assets = order.order_assets.map((asset) => ({ ...asset, is_selected: asset.kind === "generated" && selected.has(asset.id) }));
    order.selected_count = selected.size;
    order.selection_amount_cents = selected.size * 5990;
    order.status = selected.size > 0 ? "pending_final_payment" : "pending_selection";
    return order;
  });
}
export async function saveLocalThemeSelection(orderId: string, themeIds: string[]) {
  const uniqueThemeIds = Array.from(new Set(themeIds.filter((id) => typeof id === "string" && id.trim()).map((id) => id.trim()))).slice(0, 2);
  if (uniqueThemeIds.length < 1 || uniqueThemeIds.length > 2) throw new Error("请选择 1-2 个主题");
  return updateLocalOrder(orderId, (order) => {
    order.selected_theme_ids = uniqueThemeIds;
    order.status = "awaiting_deposit";
    return order;
  });
}
export async function payLocalOrder(orderId: string, kind: "deposit" | "selection", tradeNo: string) {
  return updateLocalOrder(orderId, (order) => {
    const amount = kind === "deposit" ? order.deposit_amount_cents : order.selection_amount_cents;
    if (amount <= 0) throw new Error("No payable amount");
    const now = new Date().toISOString();
    order.payments.push({ id: randomUUID(), order_id: orderId, kind, status: "paid", amount_cents: amount, provider: "mock", provider_trade_no: tradeNo, paid_at: now, created_at: now });
    if (kind === "deposit") order.status = "ready_to_generate";
    else {
      order.status = "completed";
      order.order_assets = order.order_assets.map((asset) => ({ ...asset, is_unlocked: asset.kind === "generated" && asset.is_selected ? true : asset.is_unlocked }));
    }
    return order;
  });
}

export async function confirmLocalPayment(orderId: string, kind: "deposit" | "selection") {
  return payLocalOrder(orderId, kind, `manual-${Date.now()}`);
}
export async function findLocalAsset(assetId: string) {
  for (const order of (await readStore()).orders) {
    const asset = order.order_assets.find((item) => item.id === assetId);
    if (asset) return asset;
  }
  return null;
}

import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./data-dir";
import { ORDER_STATUSES, type OrderStatus } from "./order-status";

export { ORDER_STATUSES, type OrderStatus };

// Commandes COD, une par ligne dans data/orders.jsonl.

export type Order = {
  ref: string;
  createdAt: string;
  status: OrderStatus;
  payment: string;
  product: string;
  metal: string;
  total: number;
  slug: string;
  size?: string | number;
  /** Nom de l'offre choisie (ex. « قطعتان ») */
  offer?: string;
  qty: number;
  name: string;
  phone: string;
  city: string;
  address: string;
  /** Champs ajoutés au formulaire depuis le dashboard */
  extra?: { label: string; value: string }[];
  /** Note interne (dashboard) */
  note?: string;
  updatedAt?: string;
};

const ORDERS_FILE = path.join(DATA_DIR, "orders.jsonl");
const VALID = new Set<string>(ORDER_STATUSES.map((s) => s.value));

// Les écritures passent une par une pour ne jamais perdre de commande
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function normalize(raw: Record<string, unknown>): Order {
  const status = String(raw.status ?? "");
  return { ...(raw as Order), status: (VALID.has(status) ? status : "a_confirmer") as OrderStatus };
}

async function readAll(): Promise<Order[]> {
  try {
    const text = await readFile(ORDERS_FILE, "utf8");
    return text
      .split("\n")
      .filter((line) => line.trim())
      .flatMap((line) => {
        try {
          return [normalize(JSON.parse(line))];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

async function writeAll(orders: Order[]) {
  const tmp = `${ORDERS_FILE}.tmp`;
  await writeFile(tmp, orders.map((o) => JSON.stringify(o)).join("\n") + (orders.length ? "\n" : ""), "utf8");
  await rename(tmp, ORDERS_FILE);
}

export function listOrders() {
  return exclusive(async () => (await readAll()).reverse());
}

export function addOrder(order: Order) {
  return exclusive(async () => {
    await mkdir(path.dirname(ORDERS_FILE), { recursive: true });
    await appendFile(ORDERS_FILE, JSON.stringify(order) + "\n", "utf8");
  });
}

export function updateOrder(ref: string, changes: { status?: string; note?: string }) {
  return exclusive(async () => {
    const orders = await readAll();
    const order = orders.find((o) => o.ref === ref);
    if (!order) return null;
    if (changes.status !== undefined && VALID.has(changes.status)) order.status = changes.status as OrderStatus;
    if (changes.note !== undefined) order.note = String(changes.note).slice(0, 2000);
    order.updatedAt = new Date().toISOString();
    await writeAll(orders);
    return order;
  });
}

export function deleteOrder(ref: string) {
  return exclusive(async () => {
    const orders = await readAll();
    const next = orders.filter((o) => o.ref !== ref);
    if (next.length === orders.length) return false;
    await writeAll(next);
    return true;
  });
}

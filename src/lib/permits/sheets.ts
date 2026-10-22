import type { PermitSnapshot, TrackedPermit } from "./types";

const webhookUrl = process.env.PERMIT_SHEETS_WEBHOOK_URL;
const webhookToken = process.env.PERMIT_SHEETS_WEBHOOK_TOKEN;

function assertConfigured() {
  if (!webhookUrl || !webhookToken) {
    throw new Error("PERMIT_SHEETS_WEBHOOK_URL and PERMIT_SHEETS_WEBHOOK_TOKEN are required");
  }
}

export async function listTrackedPermits(): Promise<TrackedPermit[]> {
  assertConfigured();
  const url = new URL(webhookUrl!);
  url.searchParams.set("token", webhookToken!);
  url.searchParams.set("action", "list");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Sheets webhook list failed: ${response.status}`);

  const body = await response.json();
  if (!Array.isArray(body.permits)) throw new Error("Sheets webhook returned invalid permits payload");

  return body.permits.filter((permit: TrackedPermit) => permit.active !== false);
}

export async function saveSnapshot(
  permit: TrackedPermit,
  snapshot: PermitSnapshot,
  changedFields: string[],
  error?: string,
) {
  assertConfigured();

  const response = await fetch(webhookUrl!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: webhookToken,
      action: "update",
      id: permit.id,
      snapshot,
      changedFields,
      error: error ?? "",
    }),
  });

  if (!response.ok) throw new Error(`Sheets webhook update failed: ${response.status}`);
}

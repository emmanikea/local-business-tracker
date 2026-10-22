import { createHash } from "node:crypto";
import type { PermitSnapshot, TrackedPermit } from "./types";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function getPath(obj: unknown, path?: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

async function fetchPortal(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "PermitTrackerBot/0.1 (+permit-status-monitor)",
      accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Portal returned ${response.status} ${response.statusText}`);
  }

  return response;
}

async function genericHtml(permit: TrackedPermit): Promise<PermitSnapshot> {
  const response = await fetchPortal(permit.portalUrl);
  const html = await response.text();
  const text = htmlToText(html);

  const status = firstMatch(text, [
    /\b(?:permit\s+)?status\s*[:\-]\s*([^|•]{2,80}?)(?=\s{2,}|\b(?:application|record|permit|project|inspection|fee|balance|issued|updated)\b)/i,
    /\bstatus\s+([^|•]{2,60})/i,
  ]) ?? "UNKNOWN";

  const milestone = firstMatch(text, [
    /\b(?:milestone|workflow|stage|step)\s*[:\-]\s*([^|•]{2,100})/i,
  ]);
  const inspection = firstMatch(text, [
    /\b(?:inspection status|next inspection|inspection)\s*[:\-]\s*([^|•]{2,100})/i,
  ]);
  const fees = firstMatch(text, [
    /\b(?:fees? due|balance due|amount due)\s*[:\-]?\s*(\$?[0-9,.]+)/i,
  ]);

  return {
    status,
    milestone,
    inspection,
    fees,
    checkedAt: new Date().toISOString(),
    rawHash: hash(text),
    rawText: text.slice(0, 12000),
  };
}

async function accela(permit: TrackedPermit): Promise<PermitSnapshot> {
  const snapshot = await genericHtml(permit);
  const text = snapshot.rawText ?? "";

  return {
    ...snapshot,
    status:
      firstMatch(text, [
        /\bRecord Status\s*[:\-]?\s*([^|•]{2,80})/i,
        /\bApplication Status\s*[:\-]?\s*([^|•]{2,80})/i,
        /\bPermit Status\s*[:\-]?\s*([^|•]{2,80})/i,
      ]) ?? snapshot.status,
  };
}

async function jsonAdapter(permit: TrackedPermit): Promise<PermitSnapshot> {
  const response = await fetchPortal(permit.portalUrl);
  const json = await response.json();
  const normalized = JSON.stringify(json);

  const status = getPath(json, permit.statusPath);
  if (status == null) {
    throw new Error(`JSON adapter could not resolve statusPath '${permit.statusPath ?? ""}'`);
  }

  return {
    status: String(status),
    milestone: String(getPath(json, permit.milestonePath) ?? "") || undefined,
    inspection: String(getPath(json, permit.inspectionPath) ?? "") || undefined,
    fees: String(getPath(json, permit.feesPath) ?? "") || undefined,
    checkedAt: new Date().toISOString(),
    rawHash: hash(normalized),
  };
}

export async function fetchPermitSnapshot(permit: TrackedPermit) {
  switch (permit.adapter) {
    case "accela":
      return accela(permit);
    case "json":
      return jsonAdapter(permit);
    case "generic-html":
    default:
      return genericHtml(permit);
  }
}

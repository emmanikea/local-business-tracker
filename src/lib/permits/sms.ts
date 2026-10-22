import type { PermitChange } from "./types";

function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  return sid && token && from ? { sid, token, from } : null;
}

export function formatPermitChange(change: PermitChange) {
  const p = change.permit;
  const details = change.changedFields
    .map((field) => `${field}: ${String(change.before[field] ?? "—")} → ${String(change.after[field] ?? "—")}`)
    .join("; ");

  return `Permit update — ${p.projectName} (${p.city}) ${p.permitNumber}. ${details}. ${p.portalUrl}`.slice(0, 1500);
}

export async function sendPermitChangeSms(change: PermitChange) {
  const config = twilioConfig();
  if (!config || !change.permit.pmPhone) return { sent: false, reason: "sms-not-configured" } as const;

  const body = new URLSearchParams({
    To: change.permit.pmPhone,
    From: config.from,
    Body: formatPermitChange(change),
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.sid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${config.sid}:${config.token}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Twilio SMS failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  return { sent: true, sid: result.sid as string } as const;
}

import { fetchPermitSnapshot } from "./adapters";
import { listTrackedPermits, saveSnapshot } from "./sheets";
import { sendPermitChangeSms } from "./sms";
import type { PermitChange, PermitSnapshot, TrackedPermit } from "./types";

const COMPARABLE_FIELDS = ["status", "milestone", "inspection", "fees"] as const;

function changedFields(permit: TrackedPermit, snapshot: PermitSnapshot) {
  return COMPARABLE_FIELDS.filter((field) => {
    const before = permit[field] ?? "";
    const after = snapshot[field] ?? "";
    return String(before).trim() !== String(after).trim();
  });
}

export async function runPermitTracker() {
  const permits = await listTrackedPermits();
  const summary = {
    checked: 0,
    changed: 0,
    notified: 0,
    failed: 0,
    results: [] as Array<Record<string, unknown>>,
  };

  for (const permit of permits) {
    summary.checked += 1;
    try {
      const snapshot = await fetchPermitSnapshot(permit);
      const fields = changedFields(permit, snapshot);
      const isFirstCheck = !permit.rawHash && !permit.status;
      const hasChange = fields.length > 0 && !isFirstCheck;

      if (hasChange) {
        summary.changed += 1;
        const change: PermitChange = {
          permit,
          before: {
            status: permit.status,
            milestone: permit.milestone,
            inspection: permit.inspection,
            fees: permit.fees,
            rawHash: permit.rawHash,
          },
          after: snapshot,
          changedFields: fields,
        };
        const notification = await sendPermitChangeSms(change);
        if (notification.sent) summary.notified += 1;
      }

      await saveSnapshot(permit, snapshot, fields);
      summary.results.push({ id: permit.id, permitNumber: permit.permitNumber, ok: true, changed: hasChange, fields });
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      const fallback: PermitSnapshot = {
        status: permit.status ?? "ERROR",
        milestone: permit.milestone,
        inspection: permit.inspection,
        fees: permit.fees,
        checkedAt: new Date().toISOString(),
        rawHash: permit.rawHash ?? "",
      };
      try {
        await saveSnapshot(permit, fallback, [], message);
      } catch {
        // Keep the original portal failure as the primary error.
      }
      summary.results.push({ id: permit.id, permitNumber: permit.permitNumber, ok: false, error: message });
    }
  }

  return summary;
}

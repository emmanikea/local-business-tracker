export type PermitAdapter = "generic-html" | "accela" | "json";

export type TrackedPermit = {
  id: string;
  projectName: string;
  city: string;
  state?: string;
  permitNumber: string;
  portalUrl: string;
  adapter: PermitAdapter;
  pmPhone?: string;
  status?: string;
  milestone?: string;
  inspection?: string;
  fees?: string;
  rawHash?: string;
  statusPath?: string;
  milestonePath?: string;
  inspectionPath?: string;
  feesPath?: string;
  active?: boolean;
};

export type PermitSnapshot = {
  status: string;
  milestone?: string;
  inspection?: string;
  fees?: string;
  portalUpdatedAt?: string;
  checkedAt: string;
  rawHash: string;
  rawText?: string;
};

export type PermitChange = {
  permit: TrackedPermit;
  before: Partial<PermitSnapshot>;
  after: PermitSnapshot;
  changedFields: Array<keyof Pick<PermitSnapshot, "status" | "milestone" | "inspection" | "fees">>;
};

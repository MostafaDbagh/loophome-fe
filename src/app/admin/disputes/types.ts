import type { OrderSourceType, OrderTab } from "../orderTabs";

type DisputeActor = { id: string; name: string };
export type Dispute = {
  id: string;
  number: string;
  status: "open" | "resolved";
  reason: string;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  createdBy: DisputeActor;
  resolvedBy?: DisputeActor | null;
  history: { status: "open" | "resolved"; at: string; by: DisputeActor; note: string }[];
  source: { type: OrderSourceType; id: string; number: string; title: string; name: string; phone: string; status: string; tab: OrderTab; exists: boolean };
};

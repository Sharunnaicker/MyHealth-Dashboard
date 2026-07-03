// Loose types matching the Google Health API response shapes. They are intentionally
// permissive in Phase 1 — we don't yet know the exact shape of every data type, and the
// goal is to surface raw data, not to model it precisely. Phase 2 tightens these.

export type RecordType = "interval" | "sample" | "daily" | "session" | "food";

// One data point from GET .../dataPoints. Shape varies per data type, so this is open.
export type DataPoint = Record<string, unknown>;

// Raw Google response for a dataPoints.list call.
export interface DataPointsResponse {
  dataPoints?: DataPoint[];
  nextPageToken?: string;
}

// The uniform envelope our backend returns for every data type.
export interface MetricEnvelope {
  ok: boolean;
  data: DataPointsResponse | null;
  error: string | null;
  data_type: string;
  record: RecordType | null;
}

// {slug: envelope} — the shape of GET /health/all.
export type AllMetrics = Record<string, MetricEnvelope>;

export interface AuthStatus {
  authenticated: boolean;
}

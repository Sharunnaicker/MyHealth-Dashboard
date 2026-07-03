// The catalog of everything we render, grouped into the five Phase-1 sections.
// `slug` matches a backend /health/{slug} route. `chart` is a best-effort hint for how
// to visualize the extracted series; the raw-JSON toggle is always available regardless.

export type ChartHint = "line" | "bar" | "value" | "table";

export interface MetricDef {
  slug: string;
  title: string;
  chart: ChartHint;
}

export interface SectionDef {
  id: string;
  title: string;
  metrics: MetricDef[];
}

export const SECTIONS: SectionDef[] = [
  {
    id: "activity",
    title: "Activity & Fitness",
    metrics: [
      { slug: "steps", title: "Steps", chart: "bar" },
      { slug: "distance", title: "Distance", chart: "line" },
      { slug: "active-energy-burned", title: "Active Energy Burned", chart: "bar" },
      { slug: "active-minutes", title: "Active Minutes", chart: "bar" },
      { slug: "active-zone-minutes", title: "Active Zone Minutes", chart: "bar" },
      { slug: "activity-level", title: "Activity Level", chart: "table" },
      { slug: "altitude", title: "Altitude", chart: "line" },
      { slug: "calories-in-hr-zone", title: "Calories in HR Zone", chart: "bar" },
      { slug: "daily-vo2-max", title: "Daily VO2 Max", chart: "line" },
      { slug: "run-vo2-max", title: "Run VO2 Max", chart: "line" },
      { slug: "vo2-max", title: "VO2 Max", chart: "value" },
      { slug: "floors", title: "Floors", chart: "bar" },
      { slug: "sedentary-period", title: "Sedentary Period", chart: "bar" },
      { slug: "swim-lengths", title: "Swim Lengths", chart: "table" },
      { slug: "time-in-hr-zone", title: "Time in HR Zone", chart: "bar" },
      { slug: "total-calories", title: "Total Calories", chart: "line" },
      { slug: "exercise", title: "Exercise Sessions", chart: "table" },
    ],
  },
  {
    id: "health",
    title: "Health Metrics",
    metrics: [
      { slug: "heart-rate", title: "Heart Rate", chart: "line" },
      { slug: "hrv", title: "HRV", chart: "line" },
      { slug: "daily-hrv", title: "Daily HRV", chart: "line" },
      { slug: "resting-heart-rate", title: "Resting Heart Rate", chart: "line" },
      { slug: "daily-hr-zones", title: "Daily HR Zones", chart: "bar" },
      { slug: "spo2", title: "SpO2", chart: "line" },
      { slug: "daily-spo2", title: "Daily SpO2", chart: "line" },
      { slug: "respiratory-rate", title: "Respiratory Rate", chart: "line" },
      { slug: "respiratory-rate-sleep", title: "Respiratory Rate (Sleep)", chart: "line" },
      { slug: "body-temp", title: "Core Body Temp", chart: "line" },
      { slug: "sleep-temp", title: "Sleep Temp Deviation", chart: "bar" },
      { slug: "blood-glucose", title: "Blood Glucose", chart: "line" },
      { slug: "body-fat", title: "Body Fat", chart: "line" },
      { slug: "height", title: "Height", chart: "value" },
      { slug: "weight", title: "Weight", chart: "line" },
    ],
  },
  {
    id: "sleep",
    title: "Sleep",
    metrics: [{ slug: "sleep", title: "Sleep", chart: "table" }],
  },
  {
    id: "nutrition",
    title: "Nutrition",
    metrics: [
      { slug: "nutrition", title: "Nutrition Log", chart: "table" },
      { slug: "hydration", title: "Hydration Log", chart: "bar" },
      { slug: "food", title: "Food", chart: "table" },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    metrics: [
      { slug: "ecg", title: "Electrocardiogram (ECG)", chart: "table" },
      { slug: "irn", title: "Irregular Rhythm Notifications", chart: "table" },
    ],
  },
];

export const ALL_SLUGS: string[] = SECTIONS.flatMap((s) => s.metrics.map((m) => m.slug));

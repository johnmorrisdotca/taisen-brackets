import type { RoadFinal, RoadFinalist, RoadTeam } from "../src/index.ts";

export const FLAGS: Record<"bands" | "columns" | "diamond" | "disc" | "diagonal" | "quarters" | "chevron", (...colours: string[]) => string>;
export const NATIONS: Record<string, { name: string; ja: string; abbr: string; color: string; flag: string }>;
export function nation(key: string, extra?: Partial<RoadTeam>): RoadTeam;
export function roadFinalists(): [RoadFinalist, RoadFinalist];
export const ROAD_FINAL: RoadFinal;
export function roadSeries(emblems: Record<string, string>): [RoadFinalist, RoadFinalist];
export const SERIES_EMBLEMS: Record<string, string>;
export const SERIES_LABELS: Record<string, string>;
export const SERIES_LABELS_JA: Record<string, string>;

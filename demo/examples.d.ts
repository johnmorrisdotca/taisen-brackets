import type * as Taisen from "../src/index.ts";
/** One example of the demo: the tournament it draws, and the options it draws it with. */
export interface Example {
  key: string;
  label: string;
  title: string;
  sport: string;
  /** The tournament as `drawBracket` takes it. */
  data: Taisen.BracketInput;
  options: { roundNames?: readonly string[] | { rounds: readonly { name: string }[] }; roundLabels?: boolean; title?: string };
  layouts: string[];
  theme?: string;
}
export const SPORTS: readonly { key: string; label: string }[];
export function examples(T: unknown): Example[];

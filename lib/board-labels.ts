import type { BoardType, BoardFinSetup, BoardFinSystem } from "@/lib/types/database";

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  shortboard: "Shortboard",
  fish: "Fish",
  mid_length: "Mid-length",
  longboard: "Longboard",
  gun: "Gun",
  sup: "SUP",
  other: "Other",
};

export const BOARD_TYPE_COLORS: Record<BoardType, string> = {
  shortboard: "bg-blue-100 text-blue-800",
  fish: "bg-emerald-100 text-emerald-800",
  mid_length: "bg-teal-100 text-teal-800",
  longboard: "bg-amber-100 text-amber-800",
  gun: "bg-purple-100 text-purple-800",
  sup: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-700",
};

export const BOARD_FIN_SETUP_LABELS: Record<BoardFinSetup, string> = {
  single: "Single",
  twin: "Twin",
  thruster: "Thruster",
  quad: "Quad",
  two_plus_one: "2+1",
  five_fin: "Five fin",
};

export const BOARD_FIN_SYSTEM_LABELS: Record<BoardFinSystem, string> = {
  fcs: "FCS",
  fcs2: "FCS II",
  futures: "Futures",
  glassed_in: "Glassed in",
  other: "Other",
};

/** Format decimal inches as feet'inches", e.g. 74 → 6'2" */
export function formatLength(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return inches > 0 ? `${feet}'${inches}"` : `${feet}'`;
}

import type { FinSystem, FinSizeBucket, FinPosition, FinSide, ListingCondition } from "@/lib/types/database";

export const SYSTEM_LABELS: Record<FinSystem, string> = {
    fcs: "FCS",
    fcs2: "FCS II",
    futures: "Futures",
    single_tab: "Single Tab",
    longboard_box: "Longboard Box",
    other: "Other",
  };
  
  export const SYSTEM_COLORS: Record<FinSystem, string> = {
    fcs: "bg-blue-100 text-blue-800",
    fcs2: "bg-indigo-100 text-indigo-800",
    futures: "bg-amber-100 text-amber-800",
    single_tab: "bg-purple-100 text-purple-800",
    longboard_box: "bg-teal-100 text-teal-800",
    other: "bg-gray-100 text-gray-700",
  };
  
  export const SIZE_LABELS: Record<FinSizeBucket, string> = {
    xs: "XS",
    s: "S",
    m: "M",
    l: "L",
    xl: "XL",
  };
  
  export const POSITION_LABELS: Record<FinPosition, string> = {
    front: "Front",
    rear: "Rear",
    center: "Centre",
    side_bite: "Side Bite",
  };
  
  export const SIDE_LABELS: Record<FinSide, string> = {
    na: "",
    left: "Left",
    right: "Right",
  };
  
  export const CONDITION_LABELS: Record<ListingCondition, string> = {
    new: "New",
    like_new: "Like new",
    used_light: "Used",
    used_visible: "Used",
    repaired: "Repaired",
  };
  
  export const CONDITION_COLORS: Record<ListingCondition, string> = {
    new: "bg-green-100 text-green-800",
    like_new: "bg-emerald-100 text-emerald-800",
    used_light: "bg-yellow-100 text-yellow-800",
    used_visible: "bg-orange-100 text-orange-800",
    repaired: "bg-red-100 text-red-800",
  };
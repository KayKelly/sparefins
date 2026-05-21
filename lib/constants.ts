export const FIN_SYSTEMS = [
  { value: "fcs", label: "FCS" },
  { value: "fcs2", label: "FCS II" },
  { value: "futures", label: "Futures" },
  { value: "single_tab", label: "Single Tab" },
  { value: "longboard_box", label: "Longboard Box" },
  { value: "other", label: "Other" },
] as const

export const FIN_SIZES = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
] as const

export const FIN_POSITIONS = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "center", label: "Centre" },
  { value: "side_bite", label: "Side Bite" },
] as const

export const FIN_SIDES = [
  { value: "na", label: "N/A (no side distinction)" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const

export const CONDITIONS = [
  { value: "new", label: "New (unused)" },
  { value: "like_new", label: "Like new" },
  { value: "used_light", label: "Used — light wear" },
  { value: "used_visible", label: "Used — visible wear" },
  { value: "repaired", label: "Repaired" },
] as const

export const NZ_REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatu-Whanganui",
  "Wellington",
  "Tasman",
  "Nelson",
  "Marlborough",
  "West Coast",
  "Canterbury",
  "Otago",
  "Southland",
  "Outside NZ",
] as const

export const MAX_IMAGES = 5

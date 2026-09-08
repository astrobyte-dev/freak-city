import type { ArchitectureFact } from "../../visuals/types";

// Visual summaries of spaces.ts / affordances.ts, not new parser geography.
// Only explicitly listed permanent entities may be baked into a reviewed plate.
export const architecture: Record<string, ArchitectureFact[]> = {
  taxi: [{ text: "Taxi cabin with a back seat and rain-facing window" }],
  street: [
    { text: "Old brick exterior", entityId: "detail_street_wall" },
    { text: "Frosted club window", entityId: "detail_street_window" },
    {
      text: "Narrow awning above the side entrance",
      entityId: "detail_street_awning",
    },
  ],
  vestibule: [
    { text: "Dried-wine corridor; bar ahead, cloakroom right, toilets left" },
  ],
  bar: [
    {
      text: "One staircase beside the salon; main floor toward a small stage",
      model: "single staircase beside salon, distant small stage",
    },
    {
      text: "High street-facing window",
      model: "high street window",
      entityId: "detail_bar_window",
    },
  ],
  cloakroom: [{ text: "Small cloakroom with an open rack" }],
  washroom: [{ text: "Working toilets with a mirror and partition" }],
  kitchen: [{ text: "Back-room kitchen with a hatch overlooking the bar" }],
  stage: [{ text: "Small stage adjoining the bar" }],
  salon: [{ text: "Quiet room beside the main floor with an open threshold" }],
  landing: [
    {
      text: "One staircase ends at a narrow landing; office and exchange room along corridor",
    },
  ],
  office: [
    { text: "Office window opposite the desk; entrance onto the landing" },
  ],
  "exchange-room": [{ text: "Small exchange room opening onto the landing" }],
  archive: [{ text: "Service-table area off the bar" }],
  "loading-bay": [
    { text: "Loading bay with trolley ramp facing the service road" },
  ],
  kiosk: [{ text: "Street-facing soup kiosk with glass frontage" }],
  apartment: [
    { text: "Apartment interior" },
    { text: "Apartment window", entityId: "detail_apartment_window" },
  ],
  motel: [{ text: "Motel corridor; no invented view inside Room 06" }],
};
export const fixedFurniture: Record<string, ArchitectureFact[]> = {
  bar: [
    {
      text: "Fixed bar counter, bare surface",
      model: "fixed bar counter",
      entityId: "counter",
    },
    {
      text: "Fixed bottle shelving, no loose cups or readable labels",
      model: "bottle shelves",
      entityId: "detail_bar_shelves",
    },
  ],
};
export const illustrationHints: Record<string, string[]> = {
  bar: [
    "Wide view of Velvet's bar during a slow shift, anonymous adult patrons in distant silhouette, non-explicit nightlife",
  ],
  street: [
    "Anonymous adults waiting beneath the awning in rain, old-city nightlife, non-explicit",
  ],
  stage: [
    "Distant adult performer silhouette on the small stage, non-explicit stagewear, no final character likeness",
  ],
};

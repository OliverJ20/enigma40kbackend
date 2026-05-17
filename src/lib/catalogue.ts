import {
  BSDATA_CATALOGUE,
  type CatalogueUnit,
  type Detachment,
  type Enhancement,
  type WargearVariant,
  type WargearGroup,
} from "../data/catalogue.js";
import { ROLE_ORDER, type UnitRole } from "./mock-catalogue.js";

export type { CatalogueUnit, Detachment, Enhancement, WargearVariant, WargearGroup, UnitRole };
export { ROLE_ORDER };

export function getUnits(factionId: string) {
  const data = BSDATA_CATALOGUE[factionId];
  return (data?.units ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role as UnitRole,
    costs: u.costs,
    keywords: u.keywords,
    minModels: u.minModels,
    maxModels: u.maxModels,
    wargear: u.wargear,
    wargearOptions: u.wargearOptions,
  }));
}

export function getDetachments(factionId: string): Detachment[] {
  return BSDATA_CATALOGUE[factionId]?.detachments ?? [];
}

export function getEnhancements(factionId: string): Enhancement[] {
  return BSDATA_CATALOGUE[factionId]?.enhancements ?? [];
}

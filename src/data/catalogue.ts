// AUTO-GENERATED — do not edit manually.
// Source: https://github.com/BSData/wh40k-10e
// Regenerate: npm run sync:catalogue
// Last synced: 2026-11-16T10:40:22.594Z

export interface WargearVariant {
  name: string;
  min: number;
  max: number;
  weapons: string[];
  /** True when this is the SEG's default entry — the base loadout all models start with. */
  isDefault: boolean;
}

export interface WargearGroup {
  name: string;
  groupMin: number;
  groupMax: number;
  /** Minimum unit model count required to show this group (for "per N models" split groups). */
  modelMin?: number;
  /** Empty string for unit-level groups; model name (e.g. "Theyn") for leader weapon choices. */
  modelContext: string;
  /** True for unit-level add-on upgrades (icons, banners) rendered separately from squad composition. */
  isUpgrade: boolean;
  variants: WargearVariant[];
}

export interface CatalogueUnit {
  id: string;
  name: string;
  role: string;
  costs: [number, number][];
  keywords: string[];
  minModels: number;
  maxModels: number;
  wargear: string[];
  wargearOptions: WargearGroup[];
}

export interface Detachment {
  id: string;
  name: string;
  ruleName: string;
  rule: string;
}

export interface Enhancement {
  id: string;
  name: string;
  /** Matches Detachment.id */
  detachmentId: string;
  points: number;
  description: string;
  /** Unit must have ANY of these keywords to be eligible */
  allowedKeywords: string[];
  /** OR the unit's name must match one of these */
  allowedUnitNames: string[];
}

export interface FactionData {
  units: CatalogueUnit[];
  detachments: Detachment[];
  enhancements: Enhancement[];
}

export const BSDATA_CATALOGUE: Record<string, FactionData> = {
  "adepta-sororitas": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "adeptus-custodes": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "adeptus-mechanicus": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "astra-militarum": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "grey-knights": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "imperial-agents": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "imperial-knights": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "space-marines": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "chaos-daemons": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "chaos-knights": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "chaos-space-marines": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "death-guard": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "thousand-sons": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "world-eaters": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "aeldari": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "drukhari": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "genestealer-cults": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "leagues-of-votann": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "necrons": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "orks": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "tau-empire": {
    "units": [],
    "detachments": [],
    "enhancements": []
  },
  "tyranids": {
    "units": [],
    "detachments": [],
    "enhancements": []
  }
};

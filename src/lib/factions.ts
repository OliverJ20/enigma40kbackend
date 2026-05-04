/**
 * Static faction metadata for 10th edition Warhammer 40,000.
 * Catalogue filenames match the BSData wh40k-10e repository:
 *   https://github.com/BSData/wh40k-10e
 */

export interface FactionMeta {
  id: string;
  name: string;
  shortName: string;
  alliance: "Imperium" | "Chaos" | "Xenos" | "Unaligned";
  catalogueFile: string;
  /** OKLCH theme colour for the UI. */
  color: string;
}

export const FACTIONS: readonly FactionMeta[] = [
  // Imperium
  { id: "adepta-sororitas", name: "Adepta Sororitas", shortName: "Sisters", alliance: "Imperium", catalogueFile: "Imperium - Adepta Sororitas.cat", color: "oklch(0.45 0.15 20)" },
  { id: "adeptus-custodes", name: "Adeptus Custodes", shortName: "Custodes", alliance: "Imperium", catalogueFile: "Imperium - Adeptus Custodes.cat", color: "oklch(0.7 0.14 85)" },
  { id: "adeptus-mechanicus", name: "Adeptus Mechanicus", shortName: "Ad Mech", alliance: "Imperium", catalogueFile: "Imperium - Adeptus Mechanicus.cat", color: "oklch(0.5 0.12 30)" },
  { id: "astra-militarum", name: "Astra Militarum", shortName: "Guard", alliance: "Imperium", catalogueFile: "Imperium - Astra Militarum.cat", color: "oklch(0.5 0.08 95)" },
  { id: "grey-knights", name: "Grey Knights", shortName: "GK", alliance: "Imperium", catalogueFile: "Imperium - Grey Knights.cat", color: "oklch(0.7 0.04 260)" },
  { id: "imperial-agents", name: "Imperial Agents", shortName: "Agents", alliance: "Imperium", catalogueFile: "Imperium - Imperial Agents.cat", color: "oklch(0.45 0.05 70)" },
  { id: "imperial-knights", name: "Imperial Knights", shortName: "IK", alliance: "Imperium", catalogueFile: "Imperium - Imperial Knights.cat", color: "oklch(0.55 0.12 250)" },
  { id: "space-marines", name: "Space Marines", shortName: "Marines", alliance: "Imperium", catalogueFile: "Imperium - Space Marines.cat", color: "oklch(0.55 0.18 140)" },
  // Chaos
  { id: "chaos-daemons", name: "Chaos Daemons", shortName: "Daemons", alliance: "Chaos", catalogueFile: "Chaos - Chaos Daemons.cat", color: "oklch(0.45 0.22 25)" },
  { id: "chaos-knights", name: "Chaos Knights", shortName: "CK", alliance: "Chaos", catalogueFile: "Chaos - Chaos Knights.cat", color: "oklch(0.4 0.16 15)" },
  { id: "chaos-space-marines", name: "Chaos Space Marines", shortName: "CSM", alliance: "Chaos", catalogueFile: "Chaos - Chaos Space Marines.cat", color: "oklch(0.5 0.18 15)" },
  { id: "death-guard", name: "Death Guard", shortName: "DG", alliance: "Chaos", catalogueFile: "Chaos - Death Guard.cat", color: "oklch(0.55 0.14 125)" },
  { id: "thousand-sons", name: "Thousand Sons", shortName: "TSons", alliance: "Chaos", catalogueFile: "Chaos - Thousand Sons.cat", color: "oklch(0.45 0.18 265)" },
  { id: "world-eaters", name: "World Eaters", shortName: "WE", alliance: "Chaos", catalogueFile: "Chaos - World Eaters.cat", color: "oklch(0.5 0.22 20)" },
  // Xenos
  { id: "aeldari", name: "Aeldari", shortName: "Eldar", alliance: "Xenos", catalogueFile: "Aeldari - Aeldari.cat", color: "oklch(0.6 0.18 200)" },
  { id: "drukhari", name: "Drukhari", shortName: "DE", alliance: "Xenos", catalogueFile: "Aeldari - Drukhari.cat", color: "oklch(0.45 0.2 340)" },
  { id: "genestealer-cults", name: "Genestealer Cults", shortName: "GSC", alliance: "Xenos", catalogueFile: "Tyranids - Genestealer Cults.cat", color: "oklch(0.55 0.16 120)" },
  { id: "leagues-of-votann", name: "Leagues of Votann", shortName: "Votann", alliance: "Xenos", catalogueFile: "Leagues of Votann - Leagues of Votann.cat", color: "oklch(0.6 0.12 60)" },
  { id: "necrons", name: "Necrons", shortName: "Necrons", alliance: "Xenos", catalogueFile: "Necrons - Necrons.cat", color: "oklch(0.7 0.16 140)" },
  { id: "orks", name: "Orks", shortName: "Orks", alliance: "Xenos", catalogueFile: "Orks - Orks.cat", color: "oklch(0.55 0.16 140)" },
  { id: "tau-empire", name: "T'au Empire", shortName: "T'au", alliance: "Xenos", catalogueFile: "T'au Empire - T'au Empire.cat", color: "oklch(0.6 0.16 60)" },
  { id: "tyranids", name: "Tyranids", shortName: "Nids", alliance: "Xenos", catalogueFile: "Tyranids - Tyranids.cat", color: "oklch(0.55 0.2 330)" },
] as const;

export type FactionId = (typeof FACTIONS)[number]["id"];

export function getFaction(id: string): FactionMeta | undefined {
  return FACTIONS.find((f) => f.id === id);
}

/**
 * Fetches .cat files from https://github.com/BSData/wh40k-10e and extracts
 * unit, detachment, and enhancement data into src/data/catalogue.ts.
 *
 * Usage:  npm run sync:catalogue
 *
 * Two structural patterns exist in the BSData files:
 *
 * Pattern A (e.g. Space Marines, Aeldari):
 *   - Detachments: sharedSelectionEntryGroups["Detachment"/"Detachments"]
 *   - Enhancements: nested sub-groups named "<Detachment> Enhancements"
 *
 * Pattern B (e.g. Death Guard, Necrons, CSM):
 *   - Detachments: sharedSelectionEntries["Detachment"].SEG["Detachment"]
 *   - Enhancements: flat list in sharedSelectionEntryGroups["Enhancements"],
 *     linked to detachments via modifier condition childId
 *
 * Library files (-Library.cat) are fetched automatically when a faction
 * links to them via catalogueLinks.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { FACTIONS } from "../src/lib/factions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BSDATA_RAW = "https://raw.githubusercontent.com/BSData/wh40k-10e/main";

// ── Types ──────────────────────────────────────────────────────

export interface CatalogueUnit {
  id: string;
  name: string;
  role: string;
  costs: [number, number][];
  keywords: string[];
}

export interface Detachment {
  id: string;
  bsdataId: string;   // raw XML id, used to link enhancements in Pattern B
  name: string;
  ruleName: string;
  rule: string;
}

export interface Enhancement {
  id: string;
  name: string;
  detachmentId: string;   // matches Detachment.id (slug)
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

// ── Constants ──────────────────────────────────────────────────

const ROLE_MAP: Record<string, string> = {
  "Epic Hero": "Epic Hero",
  Character: "Character",
  Battleline: "Battleline",
  Infantry: "Infantry",
  Monster: "Monster",
  Vehicle: "Vehicle",
  Walker: "Vehicle",
  Mounted: "Fast Attack",
  Aircraft: "Fast Attack",
  "Dedicated Transport": "Transport",
  Titanic: "Titanic",
};

const SKIP_CATEGORIES = new Set([
  "Configuration", "Grenades", "Fly", "Smoke", "Unit", "Fortification",
  "Imperium", "Chaos", "Xenos", "Unaligned", "Agents of the Imperium",
  "Transport", "Walker", "Aircraft",
]);

// ── XML Parser ─────────────────────────────────────────────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) =>
    [
      "selectionEntry", "selectionEntryGroup", "entryLink",
      "categoryLink", "profile", "characteristic", "cost",
      "catalogueLink", "rule", "modifier", "condition", "conditionGroup",
    ].includes(name),
  removeNSPrefix: true,
});

// ── Fetch cache ────────────────────────────────────────────────

const fetchCache = new Map<string, string>();

// Some catalogueLink names don't exactly match the filename in the repo.
const CATALOGUE_NAME_OVERRIDES: Record<string, string> = {
  // Link name                 → actual filename
  "Chaos - Daemons Library":   "Chaos - Chaos Daemons Library.cat",
};

async function fetchCat(filename: string): Promise<string | null> {
  const resolved = CATALOGUE_NAME_OVERRIDES[filename.replace(/\.cat$/, "")] ?? filename;
  if (fetchCache.has(resolved)) return fetchCache.get(resolved)!;
  const url = `${BSDATA_RAW}/${encodeURIComponent(resolved)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  fetchCache.set(resolved, text);
  return text;
}

// ── Helpers ────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Parses the unit restriction clause from an enhancement description.
 * Handles both ^^keyword^^ markers and plain-text unit names.
 *
 * Examples:
 *   "**^^Adeptus Astartes^^** model only." → keywords: ["Adeptus Astartes"]
 *   "Captain model only."                  → unitNames: ["Captain"]
 *   "^^Autarch^^ or ^^Autarch Wayleaper^^ model only." → keywords: [...]
 */
function parseRestriction(description: string): {
  allowedKeywords: string[];
  allowedUnitNames: string[];
} {
  const match = description.match(/^([\s\S]+?)\s+(?:model|unit)s?\s+only[.,\s]/i);
  if (!match || !match[1]) return { allowedKeywords: [], allowedUnitNames: [] };

  const text = match[1]!;
  const kwPattern = /\*{0,2}\^{1,2}\*{0,2}([^^]+?)\*{0,2}\^{1,2}\*{0,2}/g;
  const keywords: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = kwPattern.exec(text)) !== null) {
    const kw = m[1]!.replace(/\*/g, "").trim();
    if (kw) keywords.push(kw);
  }
  if (keywords.length > 0) return { allowedKeywords: keywords, allowedUnitNames: [] };

  const unitNames = text
    .split(/\s+or\s+/i)
    .map((s) => s.replace(/\*+/g, "").trim())
    .filter(Boolean);
  return { allowedKeywords: [], allowedUnitNames: unitNames };
}

function ruleText(entry: any): { ruleName: string; rule: string } {
  const rules: any[] = entry["rules"]?.["rule"] ?? [];
  const first = rules[0];
  if (!first) return { ruleName: "", rule: "" };
  const desc = String(first["description"] ?? "").trim();
  return { ruleName: String(first["@_name"] ?? "").trim(), rule: desc };
}

function enhancementDescription(entry: any): string {
  const profiles: any[] = entry["profiles"]?.["profile"] ?? [];
  for (const p of profiles) {
    if (p["@_typeName"] === "Abilities") {
      const chars: any[] = p["characteristics"]?.["characteristic"] ?? [];
      for (const c of chars) {
        if (c["@_name"] === "Description" && c["#text"]) {
          return String(c["#text"]).trim();
        }
      }
    }
  }
  return "";
}

// ── Pattern A: detachments in sharedSelectionEntryGroups ───────

function nestedEnhancementNames(allGroups: any[]): Set<string> {
  const group = allGroups.find((g: any) => g["@_name"] === "Enhancements");
  if (!group) return new Set();
  const nested: any[] = group["selectionEntryGroups"]?.["selectionEntryGroup"] ?? [];
  return new Set(
    nested.map((ng: any) =>
      String(ng["@_name"] ?? "").replace(/\s+Enhancements$/i, "").trim(),
    ),
  );
}

function detachmentsFromGroup(group: any): Detachment[] {
  const entries: any[] = group["selectionEntries"]?.["selectionEntry"] ?? [];
  return entries
    .filter((e: any) => !String(e["@_name"] ?? "").includes("[Legends]"))
    .map((e: any): Detachment => {
      const name = String(e["@_name"] ?? "");
      const { ruleName, rule } = ruleText(e);
      return { id: slugify(name), bsdataId: String(e["@_id"] ?? ""), name, ruleName, rule };
    });
}

/**
 * Finds the "Detachment"/"Detachments" selectionEntryGroup whose member names
 * best match the enhancement group names. This handles the case where library
 * files (e.g. Imperial Knights Library) pollute `allGroups` with detachment
 * groups that belong to a different faction.
 */
function extractDetachmentsPatternA(allGroups: any[]): Detachment[] {
  const enhNames = nestedEnhancementNames(allGroups);

  const detGroups = allGroups.filter(
    (g: any) => g["@_name"] === "Detachment" || g["@_name"] === "Detachments",
  );

  let best: Detachment[] = [];
  let bestScore = -1;

  for (const group of detGroups) {
    const candidates = detachmentsFromGroup(group);
    const score = candidates.filter((d) => enhNames.has(d.name)).length;
    if (score > bestScore) {
      bestScore = score;
      best = candidates;
    }
  }

  // Require at least one name to match enhancement groups — avoids picking up
  // unrelated detachment groups from linked library catalogues.
  return bestScore > 0 ? best : [];
}

function extractEnhancementsPatternA(
  allGroups: any[],
  detachmentMap: Map<string, Detachment>,
): Enhancement[] {
  const group = allGroups.find((g: any) => g["@_name"] === "Enhancements");
  if (!group) return [];

  const nested: any[] = group["selectionEntryGroups"]?.["selectionEntryGroup"] ?? [];
  if (nested.length === 0) return [];

  const enhancements: Enhancement[] = [];
  for (const ng of nested) {
    const groupName = String(ng["@_name"] ?? "");
    const detachmentName = groupName.replace(/\s+Enhancements$/i, "").trim();
    const detachment = detachmentMap.get(slugify(detachmentName));
    if (!detachment) continue;

    const entries: any[] = ng["selectionEntries"]?.["selectionEntry"] ?? [];
    for (const e of entries) {
      const name = String(e["@_name"] ?? "");
      if (name.includes("[Legends]")) continue;
      const description = enhancementDescription(e);
      const { allowedKeywords, allowedUnitNames } = parseRestriction(description);
      enhancements.push({
        id: `${detachment.id}__${slugify(name)}`,
        name,
        detachmentId: detachment.id,
        description,
        allowedKeywords,
        allowedUnitNames,
      });
    }
  }
  return enhancements;
}

// ── Pattern B: detachments inside a shared "Detachment" upgrade entry ──

function extractDetachmentsPatternB(allSharedEntries: any[]): Detachment[] {
  // Some factions use name="Detachment" (singular), others "Detachments" (plural)
  const detUpgrade = allSharedEntries.find(
    (e: any) =>
      (e["@_name"] === "Detachment" || e["@_name"] === "Detachments") &&
      e["@_type"] === "upgrade",
  );
  if (!detUpgrade) return [];

  // Navigate into selectionEntryGroups > selectionEntryGroup[name="Detachment"]
  const segs: any[] = detUpgrade["selectionEntryGroups"]?.["selectionEntryGroup"] ?? [];
  const detSeg = segs.find((s: any) => s["@_name"] === "Detachment");
  if (!detSeg) return [];

  const entries: any[] = detSeg["selectionEntries"]?.["selectionEntry"] ?? [];
  return entries
    .filter((e: any) => !String(e["@_name"] ?? "").includes("[Legends]"))
    .map((e: any): Detachment => {
      const name = String(e["@_name"] ?? "");
      const { ruleName, rule } = ruleText(e);
      return { id: slugify(name), bsdataId: String(e["@_id"] ?? ""), name, ruleName, rule };
    });
}

/**
 * For Pattern B, each enhancement has a modifier with a condition:
 *   { type: "lessThan", field: "selections", scope: "roster", childId: DETACHMENT_BSDATA_ID }
 * This tells Battlescribe to hide the enhancement unless that detachment is selected.
 * We use this childId to link each enhancement to its detachment.
 */
function extractEnhancementsPatternB(
  allGroups: any[],
  bsdataIdToDetachment: Map<string, Detachment>,
): Enhancement[] {
  const group = allGroups.find((g: any) => g["@_name"] === "Enhancements");
  if (!group) return [];

  const nested: any[] = group["selectionEntryGroups"]?.["selectionEntryGroup"] ?? [];
  if (nested.length > 0) return []; // Pattern A — don't double-process

  const entries: any[] = group["selectionEntries"]?.["selectionEntry"] ?? [];
  const enhancements: Enhancement[] = [];

  for (const e of entries) {
    const name = String(e["@_name"] ?? "");
    if (name.includes("[Legends]")) continue;

    // Find the detachment childId in modifiers
    let detachmentBsdataId: string | null = null;
    const modifiers: any[] = e["modifiers"]?.["modifier"] ?? [];
    for (const mod of modifiers) {
      const conditions: any[] = mod["conditions"]?.["condition"] ?? [];
      for (const cond of conditions) {
        if (
          cond["@_type"] === "lessThan" &&
          cond["@_field"] === "selections" &&
          (cond["@_scope"] === "roster" || cond["@_scope"] === "force") &&
          cond["@_childId"]
        ) {
          const candidateId = String(cond["@_childId"]);
          if (bsdataIdToDetachment.has(candidateId)) {
            detachmentBsdataId = candidateId;
            break;
          }
        }
      }
      if (detachmentBsdataId) break;
      // Also check inside conditionGroups
      const condGroups: any[] = mod["conditionGroups"]?.["conditionGroup"] ?? [];
      for (const cg of condGroups) {
        const cgConds: any[] = cg["conditions"]?.["condition"] ?? [];
        for (const cond of cgConds) {
          if (
            cond["@_type"] === "lessThan" &&
            cond["@_field"] === "selections" &&
            (cond["@_scope"] === "roster" || cond["@_scope"] === "force") &&
            cond["@_childId"]
          ) {
            const candidateId = String(cond["@_childId"]);
            if (bsdataIdToDetachment.has(candidateId)) {
              detachmentBsdataId = candidateId;
              break;
            }
          }
        }
        if (detachmentBsdataId) break;
      }
      if (detachmentBsdataId) break;
    }

    const detachment = detachmentBsdataId
      ? bsdataIdToDetachment.get(detachmentBsdataId)
      : undefined;
    if (!detachment) continue;

    const description = enhancementDescription(e);
    const { allowedKeywords, allowedUnitNames } = parseRestriction(description);
    enhancements.push({
      id: `${detachment.id}__${slugify(name)}`,
      name,
      detachmentId: detachment.id,
      description,
      allowedKeywords,
      allowedUnitNames,
    });
  }
  return enhancements;
}

// ── Pattern C: enhancements linked via <comment> element ───────
//
// Some factions (Thousand Sons, World Eaters, Chaos Knights, Leagues of Votann,
// Chaos Daemons) place enhancements as flat selectionEntry[type="upgrade"] entries
// — either directly in sharedSelectionEntries or in the flat "Enhancements" group
// — and use a <comment> child element to name the detachment they belong to.

function extractEnhancementsPatternC(
  allSharedEntries: any[],
  allGroups: any[],
  detachmentBySlug: Map<string, Detachment>,
): Enhancement[] {
  const enhancements: Enhancement[] = [];

  // Flat entries from the "Enhancements" sharedSelectionEntryGroup (if present)
  const enhGroup = allGroups.find((g: any) => g["@_name"] === "Enhancements");
  const groupEntries: any[] = enhGroup?.["selectionEntries"]?.["selectionEntry"] ?? [];

  // Also scan sharedSelectionEntries directly (Thousand Sons keeps them there)
  const candidates = [...groupEntries, ...allSharedEntries];
  const seen = new Set<string>();

  for (const e of candidates) {
    if (e["@_type"] !== "upgrade") continue;
    const name = String(e["@_name"] ?? "");
    if (name.includes("[Legends]")) continue;

    const comment = String(e["comment"] ?? "").trim();
    if (!comment) continue;

    const detachment = detachmentBySlug.get(slugify(comment));
    if (!detachment) continue;

    // Must have an Abilities profile
    const profiles: any[] = e["profiles"]?.["profile"] ?? [];
    if (!profiles.some((p: any) => p["@_typeName"] === "Abilities")) continue;

    // Must have pts > 0
    const costsArr: any[] = e["costs"]?.["cost"] ?? [];
    const ptsCost = costsArr.find((c: any) => c["@_name"] === "pts");
    const pts = parseFloat(String(ptsCost?.["@_value"] ?? "0"));
    if (pts <= 0) continue;

    const uid = `${detachment.id}__${slugify(name)}`;
    if (seen.has(uid)) continue;
    seen.add(uid);

    const description = enhancementDescription(e);
    const { allowedKeywords, allowedUnitNames } = parseRestriction(description);
    enhancements.push({
      id: uid,
      name,
      detachmentId: detachment.id,
      description,
      allowedKeywords,
      allowedUnitNames,
    });
  }
  return enhancements;
}

// ── Units ──────────────────────────────────────────────────────

function extractUnit(e: Record<string, any>): CatalogueUnit | null {
  if (e["@_type"] !== "unit") return null;
  const name = String(e["@_name"] ?? "");
  if (name.includes("[Legends]")) return null;

  const catLinks: any[] = e["categoryLinks"]?.["categoryLink"] ?? [];
  const primary = catLinks.find((c: any) => c["@_primary"] === "true");
  const role = ROLE_MAP[String(primary?.["@_name"] ?? "")] ?? "Infantry";

  const keywords = catLinks
    .map((c: any) => String(c["@_name"]))
    .filter(
      (n) =>
        !SKIP_CATEGORIES.has(n) &&
        !n.startsWith("Faction:") &&
        !(n in ROLE_MAP) &&
        n !== name,
    );

  const costsArr: any[] = e["costs"]?.["cost"] ?? [];
  const ptsCost = costsArr.find((c: any) => c["@_name"] === "pts");
  const pts = Math.round(parseFloat(String(ptsCost?.["@_value"] ?? "0")));
  if (pts <= 0) return null;

  return { id: String(e["@_id"]), name, role, costs: [[1, pts]], keywords };
}

// ── Per-faction parsing ────────────────────────────────────────

async function parseFaction(catalogueFile: string): Promise<FactionData> {
  const xml = await fetchCat(catalogueFile);
  if (!xml) return { units: [], detachments: [], enhancements: [] };

  const doc = parser.parse(xml) as Record<string, any>;
  const cat = doc["catalogue"] as Record<string, any> | undefined;
  if (!cat) return { units: [], detachments: [], enhancements: [] };

  // Collect data from both the faction .cat and any linked library files
  const allGroups: any[] = [
    ...(cat["sharedSelectionEntryGroups"]?.["selectionEntryGroup"] ?? []),
  ];
  const allSharedEntries: any[] = [
    ...(cat["sharedSelectionEntries"]?.["selectionEntry"] ?? []),
  ];
  const libraryEntryMap = new Map<string, Record<string, any>>();

  const catLinks: any[] = cat["catalogueLinks"]?.["catalogueLink"] ?? [];
  for (const link of catLinks) {
    const libName = String(link["@_name"] ?? "");
    const libXml = await fetchCat(`${libName}.cat`);
    if (!libXml) continue;
    const libDoc = parser.parse(libXml) as Record<string, any>;
    const libCat = libDoc["catalogue"] as Record<string, any> | undefined;
    if (!libCat) continue;

    // Only include sharedSelectionEntryGroups (detachment/enhancement data) from
    // true library files (library="true"). Linked faction catalogues (e.g. Agents
    // of the Imperium linked by Sororitas) have their OWN unrelated groups which
    // would corrupt detachment/enhancement extraction for the primary faction.
    const isLibrary = String(libCat["@_library"] ?? "false") === "true";
    if (isLibrary) {
      allGroups.push(
        ...(libCat["sharedSelectionEntryGroups"]?.["selectionEntryGroup"] ?? []),
      );
    }

    const libShared: any[] = libCat["sharedSelectionEntries"]?.["selectionEntry"] ?? [];
    allSharedEntries.push(...libShared);
    for (const entry of libShared) {
      libraryEntryMap.set(String(entry["@_id"]), entry);
    }
  }

  // ── Units ────────────────────────────────────────────────────

  const units: CatalogueUnit[] = [];
  const directEntries: any[] = [
    ...(cat["selectionEntries"]?.["selectionEntry"] ?? []),
    ...(cat["sharedSelectionEntries"]?.["selectionEntry"] ?? []),
  ];
  for (const e of directEntries) {
    const u = extractUnit(e);
    if (u) units.push(u);
  }
  const entryLinks: any[] = cat["entryLinks"]?.["entryLink"] ?? [];
  for (const link of entryLinks) {
    const linkName = String(link["@_name"] ?? "");
    if (linkName.includes("[Legends]")) continue;
    const target = libraryEntryMap.get(String(link["@_targetId"] ?? ""));
    if (!target) continue;
    const u = extractUnit(target);
    if (u) units.push({ ...u, name: linkName || u.name });
  }

  // ── Detachments ──────────────────────────────────────────────

  let detachments = extractDetachmentsPatternA(allGroups);
  if (detachments.length === 0) {
    detachments = extractDetachmentsPatternB(allSharedEntries);
  }

  const detachmentBySlug = new Map(detachments.map((d) => [d.id, d]));
  const detachmentByBsdataId = new Map(detachments.map((d) => [d.bsdataId, d]));

  // ── Enhancements ─────────────────────────────────────────────

  let enhancements = extractEnhancementsPatternA(allGroups, detachmentBySlug);
  if (enhancements.length === 0) {
    enhancements = extractEnhancementsPatternB(allGroups, detachmentByBsdataId);
  }
  if (enhancements.length === 0) {
    enhancements = extractEnhancementsPatternC(allSharedEntries, allGroups, detachmentBySlug);
  }

  return { units, detachments, enhancements };
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("Syncing BSData wh40k-10e catalogue…\n");

  const settled = await Promise.allSettled(
    FACTIONS.map(async (faction) => {
      const data = await parseFaction(faction.catalogueFile);
      return { id: faction.id, data };
    }),
  );

  const catalogue: Record<string, FactionData> = {};
  let errors = 0;
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]!;
    const faction = FACTIONS[i]!;
    if (result.status === "fulfilled") {
      catalogue[result.value.id] = result.value.data;
      const { units, detachments, enhancements } = result.value.data;
      console.log(
        `  ✓ ${faction.name}: ${units.length} units, ${detachments.length} detachments, ${enhancements.length} enhancements`,
      );
    } else {
      console.warn(`  ✗ ${faction.name}: ${result.reason}`);
      catalogue[faction.id] = { units: [], detachments: [], enhancements: [] };
      errors++;
    }
  }

  const totals = Object.values(catalogue).reduce(
    (acc, d) => ({
      units: acc.units + d.units.length,
      detachments: acc.detachments + d.detachments.length,
      enhancements: acc.enhancements + d.enhancements.length,
    }),
    { units: 0, detachments: 0, enhancements: 0 },
  );
  console.log(
    `\n${totals.units} units, ${totals.detachments} detachments, ${totals.enhancements} enhancements (${errors} errors)\n`,
  );

  const output = `// AUTO-GENERATED — do not edit manually.
// Source: https://github.com/BSData/wh40k-10e
// Regenerate: npm run sync:catalogue
// Last synced: ${new Date().toISOString()}

export interface CatalogueUnit {
  id: string;
  name: string;
  role: string;
  costs: [number, number][];
  keywords: string[];
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

export const BSDATA_CATALOGUE: Record<string, FactionData> = ${JSON.stringify(
    catalogue,
    (key, value) => (key === "bsdataId" ? undefined : value),
    2,
  )};
`;

  const outPath = join(ROOT, "src/data/catalogue.ts");
  writeFileSync(outPath, output);
  console.log(`Written to src/data/catalogue.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

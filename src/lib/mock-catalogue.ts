/**
 * Mock detachment + unit catalogues. Curated subset per faction so the
 * builder works end-to-end before wiring up the full BSData prebuild
 * pipeline (see scripts/build-catalogues.ts).
 *
 * Points are approximate 10e values for UI demonstration only —
 * NOT authoritative for game use.
 */

import type { FactionId } from "./factions.js";

export interface MockDetachment {
  id: string;
  name: string;
  description: string;
  rule: string;
}

export interface MockUnit {
  id: string;
  name: string;
  role: UnitRole;
  costs: [number, number][];
  keywords: string[];
}

export type UnitRole =
  | "Epic Hero"
  | "Character"
  | "Battleline"
  | "Infantry"
  | "Elite"
  | "Fast Attack"
  | "Heavy"
  | "Vehicle"
  | "Monster"
  | "Titanic"
  | "Transport";

export const ROLE_ORDER: readonly UnitRole[] = [
  "Epic Hero",
  "Character",
  "Battleline",
  "Infantry",
  "Elite",
  "Fast Attack",
  "Heavy",
  "Vehicle",
  "Monster",
  "Titanic",
  "Transport",
] as const;

export const DETACHMENTS: Partial<Record<FactionId, MockDetachment[]>> = {
  "space-marines": [
    { id: "gladius", name: "Gladius Task Force", description: "Classic combined-arms doctrine.", rule: "Combat Doctrines — switch between Devastator, Tactical, and Assault each battle round." },
    { id: "ironstorm", name: "Ironstorm Spearhead", description: "Vehicle-heavy armoured spearhead.", rule: "Armoured Resolve — vehicles receive +1 to hit on the move." },
    { id: "firestorm", name: "Firestorm Assault Force", description: "Assault Marines and bikes.", rule: "Shock Assault — +1 Attack on the turn you charge." },
    { id: "stormlance", name: "Stormlance Task Force", description: "Outriders, Inceptors, Land Speeders.", rule: "Lightning Assault — advance and charge with mounted units." },
  ],
  "death-guard": [
    { id: "plague-company", name: "Plague Company", description: "Triple-Crawler artillery list.", rule: "Nurgle's Gift — enemies near your units suffer −1 Toughness." },
    { id: "mortarions-anvil", name: "Mortarion's Anvil", description: "Deathshroud, Terminators, the Primarch himself.", rule: "The Reaper Descends — deep strike within 6\" of enemy units." },
  ],
  necrons: [
    { id: "awakened-dynasty", name: "Awakened Dynasty", description: "Warrior brick plus Szarekh.", rule: "Command Protocols — re-roll one hit, wound, or save each round." },
    { id: "canoptek-court", name: "Canoptek Court", description: "Cryptek and Canoptek constructs.", rule: "Living Metal Tempest — +1 to Reanimation rolls near Crypteks." },
    { id: "hypercrypt-legion", name: "Hypercrypt Legion", description: "Deep-strike teleport shenanigans.", rule: "Translocation Crypts — remove and redeploy a unit each round." },
  ],
  "tau-empire": [
    { id: "montka", name: "Mont'ka", description: "Gunline with Stormsurge / Broadside anchors.", rule: "Killing Blow — re-roll all failed hits on one selected enemy." },
    { id: "kauyon", name: "Kauyon", description: "Patient ambush, bonuses late-game.", rule: "Patient Hunter — +1 to hit from round 3 onwards." },
  ],
  "adeptus-custodes": [
    { id: "shield-host", name: "Shield Host", description: "The classic Custodes all-rounder.", rule: "Oath of Moment — re-roll hits against a marked enemy unit." },
    { id: "lions-of-the-emperor", name: "Lions of the Emperor", description: "Aggressive Terminator brick.", rule: "Scions of Terra — sustained hits on charge." },
  ],
  aeldari: [
    { id: "ynnari", name: "Ynnari", description: "Fast, fragile, lethal Yvraine-led list.", rule: "Strength from Death — models fight back when slain." },
    { id: "windrider-host", name: "Windrider Host", description: "Jetbikes and skimmers.", rule: "Flickering Advance — advance and shoot without penalty." },
    { id: "battle-host", name: "Aeldari Battle Host", description: "Balanced Craftworld force.", rule: "Strands of Fate — pre-roll 7 dice, spend as needed." },
  ],
  "thousand-sons": [
    { id: "hexwarp-cabal", name: "Hexwarp Cabal", description: "Rubric-heavy psyker magic.", rule: "Warpcraft — cast +1 psychic power per round." },
  ],
  "chaos-space-marines": [
    { id: "pactbound-zealots", name: "Pactbound Zealots", description: "Cultists swarm, Dark Pacts aplenty.", rule: "Dark Pacts — sustained hits, at the cost of mortals." },
    { id: "renegade-raiders", name: "Renegade Raiders", description: "Fast-moving raiders and bikes.", rule: "Terror Tactics — advance and charge." },
  ],
  orks: [
    { id: "waaagh", name: "War Horde", description: "Big Mek, Big Choppas, Big Waaagh!", rule: "Waaagh! — once per game, +1 attack and advance+charge." },
    { id: "kult-of-speed", name: "Kult of Speed", description: "Wartrukks, bikes, buggies.", rule: "Red Ones Go Fasta — bonus move on vehicles." },
  ],
};

export const UNITS: Partial<Record<FactionId, MockUnit[]>> = {
  "space-marines": [
    { id: "sm-captain", name: "Captain", role: "Character", costs: [[1, 80]], keywords: ["Character", "Infantry"] },
    { id: "sm-captain-gravis", name: "Captain in Gravis Armour", role: "Character", costs: [[1, 95]], keywords: ["Character", "Gravis"] },
    { id: "sm-librarian", name: "Librarian", role: "Character", costs: [[1, 75]], keywords: ["Character", "Psyker"] },
    { id: "sm-chaplain", name: "Chaplain", role: "Character", costs: [[1, 65]], keywords: ["Character"] },
    { id: "sm-apothecary-biologis", name: "Apothecary Biologis", role: "Character", costs: [[1, 65]], keywords: ["Character", "Gravis"] },
    { id: "sm-intercessors", name: "Intercessor Squad", role: "Battleline", costs: [[5, 80]], keywords: ["Battleline", "Tacticus"] },
    { id: "sm-assault-intercessors", name: "Assault Intercessor Squad", role: "Battleline", costs: [[5, 75], [10, 150]], keywords: ["Battleline", "Tacticus"] },
    { id: "sm-infiltrators", name: "Infiltrator Squad", role: "Infantry", costs: [[5, 100]], keywords: ["Phobos"] },
    { id: "sm-terminators", name: "Terminator Squad", role: "Elite", costs: [[5, 185]], keywords: ["Terminator"] },
    { id: "sm-sternguard", name: "Sternguard Veteran Squad", role: "Elite", costs: [[5, 140]], keywords: ["Tacticus"] },
    { id: "sm-eradicators", name: "Eradicator Squad", role: "Heavy", costs: [[3, 95], [6, 190]], keywords: ["Gravis"] },
    { id: "sm-hellblasters", name: "Hellblaster Squad", role: "Heavy", costs: [[5, 115], [10, 230]], keywords: ["Tacticus"] },
    { id: "sm-outriders", name: "Outrider Squad", role: "Fast Attack", costs: [[3, 90], [6, 180]], keywords: ["Mounted"] },
    { id: "sm-inceptors", name: "Inceptor Squad", role: "Fast Attack", costs: [[3, 115]], keywords: ["Gravis"] },
    { id: "sm-gladiator-lancer", name: "Gladiator Lancer", role: "Vehicle", costs: [[1, 160]], keywords: ["Vehicle"] },
    { id: "sm-repulsor-executioner", name: "Repulsor Executioner", role: "Vehicle", costs: [[1, 220]], keywords: ["Vehicle", "Transport"] },
    { id: "sm-redemptor", name: "Redemptor Dreadnought", role: "Vehicle", costs: [[1, 210]], keywords: ["Vehicle", "Walker"] },
    { id: "sm-impulsor", name: "Impulsor", role: "Transport", costs: [[1, 80]], keywords: ["Vehicle", "Transport"] },
  ],
  "death-guard": [
    { id: "dg-mortarion", name: "Mortarion, Daemon Primarch of Nurgle", role: "Epic Hero", costs: [[1, 420]], keywords: ["Epic Hero", "Monster"] },
    { id: "dg-lord-virulence", name: "Lord of Virulence", role: "Character", costs: [[1, 85]], keywords: ["Character", "Terminator"] },
    { id: "dg-typhus", name: "Typhus", role: "Epic Hero", costs: [[1, 165]], keywords: ["Epic Hero", "Terminator"] },
    { id: "dg-plague-marines", name: "Plague Marines", role: "Battleline", costs: [[5, 90], [10, 180]], keywords: ["Battleline"] },
    { id: "dg-poxwalkers", name: "Poxwalkers", role: "Infantry", costs: [[10, 60], [20, 120]], keywords: ["Infantry"] },
    { id: "dg-deathshroud", name: "Deathshroud Terminators", role: "Elite", costs: [[3, 140]], keywords: ["Terminator"] },
    { id: "dg-blightlord", name: "Blightlord Terminators", role: "Elite", costs: [[5, 190]], keywords: ["Terminator"] },
    { id: "dg-pbc", name: "Plagueburst Crawler", role: "Heavy", costs: [[1, 170]], keywords: ["Vehicle"] },
    { id: "dg-myphitic-blight", name: "Myphitic Blight-hauler", role: "Heavy", costs: [[1, 110]], keywords: ["Vehicle"] },
    { id: "dg-rhino", name: "Chaos Rhino", role: "Transport", costs: [[1, 75]], keywords: ["Vehicle", "Transport"] },
  ],
  necrons: [
    { id: "nec-szarekh", name: "Szarekh, The Silent King", role: "Epic Hero", costs: [[1, 420]], keywords: ["Epic Hero", "Monster"] },
    { id: "nec-overlord", name: "Overlord", role: "Character", costs: [[1, 85]], keywords: ["Character"] },
    { id: "nec-technomancer", name: "Technomancer", role: "Character", costs: [[1, 70]], keywords: ["Character", "Cryptek"] },
    { id: "nec-cryptothrall", name: "Cryptothralls", role: "Infantry", costs: [[2, 55]], keywords: ["Canoptek"] },
    { id: "nec-warriors", name: "Necron Warriors", role: "Battleline", costs: [[10, 110], [20, 200]], keywords: ["Battleline"] },
    { id: "nec-immortals", name: "Immortals", role: "Battleline", costs: [[5, 75], [10, 140]], keywords: ["Battleline"] },
    { id: "nec-lychguard", name: "Lychguard", role: "Infantry", costs: [[5, 110], [10, 220]], keywords: ["Infantry"] },
    { id: "nec-triarchs", name: "Triarch Praetorians", role: "Elite", costs: [[5, 110]], keywords: ["Infantry"] },
    { id: "nec-scarabs", name: "Canoptek Scarab Swarms", role: "Fast Attack", costs: [[3, 40]], keywords: ["Canoptek"] },
    { id: "nec-wraiths", name: "Canoptek Wraiths", role: "Fast Attack", costs: [[3, 120]], keywords: ["Canoptek"] },
    { id: "nec-doom-ark", name: "Doomsday Ark", role: "Heavy", costs: [[1, 200]], keywords: ["Vehicle"] },
    { id: "nec-ctan", name: "C'tan Shard of the Nightbringer", role: "Monster", costs: [[1, 320]], keywords: ["Monster", "C'tan"] },
    { id: "nec-monolith", name: "Monolith", role: "Heavy", costs: [[1, 330]], keywords: ["Vehicle", "Transport"] },
  ],
  "tau-empire": [
    { id: "tau-farsight", name: "Commander Farsight", role: "Epic Hero", costs: [[1, 95]], keywords: ["Epic Hero"] },
    { id: "tau-fireblade", name: "Cadre Fireblade", role: "Character", costs: [[1, 50]], keywords: ["Character"] },
    { id: "tau-ethereal", name: "Ethereal", role: "Character", costs: [[1, 50]], keywords: ["Character"] },
    { id: "tau-strike-team", name: "Strike Team", role: "Battleline", costs: [[10, 75]], keywords: ["Battleline"] },
    { id: "tau-breachers", name: "Breacher Team", role: "Battleline", costs: [[10, 100]], keywords: ["Battleline"] },
    { id: "tau-crisis", name: "XV8 Crisis Battlesuits", role: "Elite", costs: [[3, 130]], keywords: ["Battlesuit"] },
    { id: "tau-ghostkeel", name: "XV95 Ghostkeel", role: "Elite", costs: [[1, 160]], keywords: ["Battlesuit"] },
    { id: "tau-broadside", name: "XV88 Broadside Battlesuits", role: "Heavy", costs: [[1, 115]], keywords: ["Battlesuit"] },
    { id: "tau-hammerhead", name: "Hammerhead Gunship", role: "Vehicle", costs: [[1, 145]], keywords: ["Vehicle"] },
    { id: "tau-riptide", name: "XV104 Riptide", role: "Monster", costs: [[1, 180]], keywords: ["Battlesuit", "Monster"] },
    { id: "tau-stormsurge", name: "KV128 Stormsurge", role: "Titanic", costs: [[1, 400]], keywords: ["Titanic"] },
  ],
  "adeptus-custodes": [
    { id: "cust-shield-captain", name: "Shield-Captain in Allarus Terminator Armour", role: "Character", costs: [[1, 130]], keywords: ["Character", "Terminator"] },
    { id: "cust-blade-champion", name: "Blade Champion", role: "Character", costs: [[1, 120]], keywords: ["Character"] },
    { id: "cust-trajann", name: "Trajann Valoris", role: "Epic Hero", costs: [[1, 140]], keywords: ["Epic Hero"] },
    { id: "cust-guard", name: "Custodian Guard", role: "Infantry", costs: [[5, 215]], keywords: ["Infantry"] },
    { id: "cust-wardens", name: "Custodian Wardens", role: "Infantry", costs: [[5, 250]], keywords: ["Infantry"] },
    { id: "cust-allarus", name: "Allarus Custodians", role: "Elite", costs: [[3, 195]], keywords: ["Terminator"] },
    { id: "cust-vertus", name: "Vertus Praetors", role: "Fast Attack", costs: [[3, 225]], keywords: ["Mounted"] },
    { id: "cust-dreadnought", name: "Venerable Contemptor-Galatus Dreadnought", role: "Vehicle", costs: [[1, 180]], keywords: ["Vehicle"] },
  ],
  aeldari: [
    { id: "ae-yncarne", name: "The Yncarne", role: "Epic Hero", costs: [[1, 280]], keywords: ["Epic Hero", "Monster"] },
    { id: "ae-yvraine", name: "Yvraine", role: "Character", costs: [[1, 110]], keywords: ["Character"] },
    { id: "ae-autarch", name: "Autarch", role: "Character", costs: [[1, 85]], keywords: ["Character"] },
    { id: "ae-guardians", name: "Guardian Defenders", role: "Battleline", costs: [[10, 100], [20, 200]], keywords: ["Battleline"] },
    { id: "ae-avengers", name: "Dire Avengers", role: "Infantry", costs: [[5, 55], [10, 110]], keywords: ["Infantry", "Aspect"] },
    { id: "ae-banshees", name: "Howling Banshees", role: "Elite", costs: [[10, 130]], keywords: ["Aspect"] },
    { id: "ae-reapers", name: "Dark Reapers", role: "Heavy", costs: [[5, 110]], keywords: ["Aspect"] },
    { id: "ae-wraithguard", name: "Wraithguard", role: "Elite", costs: [[5, 200]], keywords: ["Wraith"] },
    { id: "ae-jetbikes", name: "Windrider Jetbikes", role: "Fast Attack", costs: [[3, 75]], keywords: ["Mounted"] },
    { id: "ae-wave-serpent", name: "Wave Serpent", role: "Transport", costs: [[1, 120]], keywords: ["Vehicle", "Transport"] },
    { id: "ae-wraithknight", name: "Wraithknight", role: "Titanic", costs: [[1, 420]], keywords: ["Titanic"] },
  ],
  orks: [
    { id: "ork-warboss", name: "Warboss in Mega Armour", role: "Character", costs: [[1, 80]], keywords: ["Character"] },
    { id: "ork-ghaz", name: "Ghazghkull Thraka", role: "Epic Hero", costs: [[1, 200]], keywords: ["Epic Hero"] },
    { id: "ork-painboy", name: "Painboy", role: "Character", costs: [[1, 50]], keywords: ["Character"] },
    { id: "ork-boyz", name: "Boyz", role: "Battleline", costs: [[10, 80], [20, 160]], keywords: ["Battleline"] },
    { id: "ork-nobz", name: "Nobz", role: "Infantry", costs: [[5, 115]], keywords: ["Infantry"] },
    { id: "ork-meganobz", name: "Meganobz", role: "Elite", costs: [[3, 115]], keywords: ["Infantry"] },
    { id: "ork-warbikers", name: "Warbikers", role: "Fast Attack", costs: [[3, 85]], keywords: ["Mounted"] },
    { id: "ork-deff-dread", name: "Deff Dread", role: "Vehicle", costs: [[1, 85]], keywords: ["Walker"] },
    { id: "ork-trukk", name: "Trukk", role: "Transport", costs: [[1, 75]], keywords: ["Vehicle", "Transport"] },
    { id: "ork-stompa", name: "Stompa", role: "Titanic", costs: [[1, 750]], keywords: ["Titanic"] },
  ],
};

export function getDetachments(factionId: string): MockDetachment[] {
  return DETACHMENTS[factionId as FactionId] ?? [];
}

export function getUnits(factionId: string): MockUnit[] {
  return UNITS[factionId as FactionId] ?? [];
}

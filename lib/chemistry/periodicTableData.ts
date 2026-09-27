/**
 * Deterministic periodic table data (118 elements).
 *
 * Source of names/symbols/atomic numbers: IUPAC Periodic Table of the Elements.
 * Layout: standard 18-column form with the lanthanides (57–71) and actinides
 * (89–103) shown as separate f-block rows; their `group` is null.
 * Category follows the common school classification (RSC style). Elements
 * 109–118 are marked 'unknown' because their chemical properties have not been
 * established experimentally.
 */

export type ElementCategory =
  | 'alkali_metal'
  | 'alkaline_earth_metal'
  | 'transition_metal'
  | 'post_transition_metal'
  | 'metalloid'
  | 'reactive_nonmetal'
  | 'halogen'
  | 'noble_gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';

export type ElementClass = 'metal' | 'nonmetal' | 'metalloid' | 'unknown';
export type ElementBlock = 's' | 'p' | 'd' | 'f';

export interface ChemicalElement {
  z: number;
  symbol: string;
  name: string;
  period: number;
  /** 1–18, or null for lanthanides/actinides (f-block rows). */
  group: number | null;
  category: ElementCategory;
  elementClass: ElementClass;
  block: ElementBlock;
  /** Valence electrons for main-group elements only; null otherwise. */
  valenceElectrons: number | null;
  /** Grid position for rendering (1-based). Rows 9–10 are the f-block rows. */
  gridRow: number;
  gridColumn: number;
}

const NAMES: Array<[string, string]> = [
  ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'], ['B', 'Boron'],
  ['C', 'Carbon'], ['N', 'Nitrogen'], ['O', 'Oxygen'], ['F', 'Fluorine'], ['Ne', 'Neon'],
  ['Na', 'Sodium'], ['Mg', 'Magnesium'], ['Al', 'Aluminium'], ['Si', 'Silicon'], ['P', 'Phosphorus'],
  ['S', 'Sulfur'], ['Cl', 'Chlorine'], ['Ar', 'Argon'], ['K', 'Potassium'], ['Ca', 'Calcium'],
  ['Sc', 'Scandium'], ['Ti', 'Titanium'], ['V', 'Vanadium'], ['Cr', 'Chromium'], ['Mn', 'Manganese'],
  ['Fe', 'Iron'], ['Co', 'Cobalt'], ['Ni', 'Nickel'], ['Cu', 'Copper'], ['Zn', 'Zinc'],
  ['Ga', 'Gallium'], ['Ge', 'Germanium'], ['As', 'Arsenic'], ['Se', 'Selenium'], ['Br', 'Bromine'],
  ['Kr', 'Krypton'], ['Rb', 'Rubidium'], ['Sr', 'Strontium'], ['Y', 'Yttrium'], ['Zr', 'Zirconium'],
  ['Nb', 'Niobium'], ['Mo', 'Molybdenum'], ['Tc', 'Technetium'], ['Ru', 'Ruthenium'], ['Rh', 'Rhodium'],
  ['Pd', 'Palladium'], ['Ag', 'Silver'], ['Cd', 'Cadmium'], ['In', 'Indium'], ['Sn', 'Tin'],
  ['Sb', 'Antimony'], ['Te', 'Tellurium'], ['I', 'Iodine'], ['Xe', 'Xenon'], ['Cs', 'Caesium'],
  ['Ba', 'Barium'], ['La', 'Lanthanum'], ['Ce', 'Cerium'], ['Pr', 'Praseodymium'], ['Nd', 'Neodymium'],
  ['Pm', 'Promethium'], ['Sm', 'Samarium'], ['Eu', 'Europium'], ['Gd', 'Gadolinium'], ['Tb', 'Terbium'],
  ['Dy', 'Dysprosium'], ['Ho', 'Holmium'], ['Er', 'Erbium'], ['Tm', 'Thulium'], ['Yb', 'Ytterbium'],
  ['Lu', 'Lutetium'], ['Hf', 'Hafnium'], ['Ta', 'Tantalum'], ['W', 'Tungsten'], ['Re', 'Rhenium'],
  ['Os', 'Osmium'], ['Ir', 'Iridium'], ['Pt', 'Platinum'], ['Au', 'Gold'], ['Hg', 'Mercury'],
  ['Tl', 'Thallium'], ['Pb', 'Lead'], ['Bi', 'Bismuth'], ['Po', 'Polonium'], ['At', 'Astatine'],
  ['Rn', 'Radon'], ['Fr', 'Francium'], ['Ra', 'Radium'], ['Ac', 'Actinium'], ['Th', 'Thorium'],
  ['Pa', 'Protactinium'], ['U', 'Uranium'], ['Np', 'Neptunium'], ['Pu', 'Plutonium'], ['Am', 'Americium'],
  ['Cm', 'Curium'], ['Bk', 'Berkelium'], ['Cf', 'Californium'], ['Es', 'Einsteinium'], ['Fm', 'Fermium'],
  ['Md', 'Mendelevium'], ['No', 'Nobelium'], ['Lr', 'Lawrencium'], ['Rf', 'Rutherfordium'], ['Db', 'Dubnium'],
  ['Sg', 'Seaborgium'], ['Bh', 'Bohrium'], ['Hs', 'Hassium'], ['Mt', 'Meitnerium'], ['Ds', 'Darmstadtium'],
  ['Rg', 'Roentgenium'], ['Cn', 'Copernicium'], ['Nh', 'Nihonium'], ['Fl', 'Flerovium'], ['Mc', 'Moscovium'],
  ['Lv', 'Livermorium'], ['Ts', 'Tennessine'], ['Og', 'Oganesson'],
];

const ALKALI = [3, 11, 19, 37, 55, 87];
const ALKALINE = [4, 12, 20, 38, 56, 88];
const POST_TRANSITION = [13, 31, 49, 50, 81, 82, 83, 84];
const METALLOIDS = [5, 14, 32, 33, 51, 52];
const REACTIVE_NONMETALS = [1, 6, 7, 8, 15, 16, 34];
const HALOGENS = [9, 17, 35, 53, 85];
const NOBLE_GASES = [2, 10, 18, 36, 54, 86];

function categoryOf(z: number): ElementCategory {
  if (z >= 109) return 'unknown';
  if (ALKALI.includes(z)) return 'alkali_metal';
  if (ALKALINE.includes(z)) return 'alkaline_earth_metal';
  if (POST_TRANSITION.includes(z)) return 'post_transition_metal';
  if (METALLOIDS.includes(z)) return 'metalloid';
  if (REACTIVE_NONMETALS.includes(z)) return 'reactive_nonmetal';
  if (HALOGENS.includes(z)) return 'halogen';
  if (NOBLE_GASES.includes(z)) return 'noble_gas';
  if (z >= 57 && z <= 71) return 'lanthanide';
  if (z >= 89 && z <= 103) return 'actinide';
  return 'transition_metal';
}

function classOf(category: ElementCategory): ElementClass {
  switch (category) {
    case 'metalloid':
      return 'metalloid';
    case 'reactive_nonmetal':
    case 'halogen':
    case 'noble_gas':
      return 'nonmetal';
    case 'unknown':
      return 'unknown';
    default:
      return 'metal';
  }
}

/** Period and group (null for f-block rows) from atomic number. */
function positionOf(z: number): { period: number; group: number | null } {
  if (z <= 2) return { period: 1, group: z === 1 ? 1 : 18 };
  const shortPeriod = (start: number, period: number) => {
    const offset = z - start; // 0..7
    return { period, group: offset < 2 ? offset + 1 : offset + 11 };
  };
  if (z <= 10) return shortPeriod(3, 2);
  if (z <= 18) return shortPeriod(11, 3);
  if (z <= 36) return { period: 4, group: z - 18 };
  if (z <= 54) return { period: 5, group: z - 36 };
  const longPeriod = (start: number, period: number) => {
    const offset = z - start; // Cs/Fr = 0
    if (offset < 2) return { period, group: offset + 1 };
    if (offset < 17) return { period, group: null }; // La–Lu / Ac–Lr
    return { period, group: offset - 13 }; // Hf/Rf → 4 … Rn/Og → 18
  };
  if (z <= 86) return longPeriod(55, 6);
  return longPeriod(87, 7);
}

function blockOf(z: number, group: number | null): ElementBlock {
  if (group === null) return 'f';
  if (z === 2) return 's';
  if (group <= 2) return 's';
  if (group <= 12) return 'd';
  return 'p';
}

function valenceOf(z: number, group: number | null): number | null {
  if (group === null) return null;
  if (z === 2) return 2;
  if (group <= 2) return group;
  if (group >= 13) return group - 10;
  return null;
}

export const PERIODIC_TABLE_ELEMENTS: ChemicalElement[] = NAMES.map(([symbol, name], idx) => {
  const z = idx + 1;
  const { period, group } = positionOf(z);
  const category = categoryOf(z);
  let gridRow = period;
  let gridColumn = group ?? 0;
  if (group === null) {
    gridRow = period === 6 ? 9 : 10;
    gridColumn = 3 + (z - (period === 6 ? 57 : 89));
  }
  return {
    z,
    symbol,
    name,
    period,
    group,
    category,
    elementClass: classOf(category),
    block: blockOf(z, group),
    valenceElectrons: valenceOf(z, group),
    gridRow,
    gridColumn,
  };
});

export function findElementBySymbol(symbol: string): ChemicalElement | undefined {
  return PERIODIC_TABLE_ELEMENTS.find((e) => e.symbol === symbol);
}

export function findElementByPosition(period: number, group: number): ChemicalElement | undefined {
  return PERIODIC_TABLE_ELEMENTS.find((e) => e.period === period && e.group === group);
}

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  alkali_metal: 'Alkali metal',
  alkaline_earth_metal: 'Alkaline earth metal',
  transition_metal: 'Transition metal',
  post_transition_metal: 'Post-transition metal',
  metalloid: 'Metalloid',
  reactive_nonmetal: 'Reactive nonmetal',
  halogen: 'Halogen',
  noble_gas: 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
  unknown: 'Unknown properties',
};

/** Location challenges used by the lesson's challenge step (deterministic). */
export const LOCATION_CHALLENGES: Array<{ id: string; clue: string; answer: string }> = [
  { id: 'c1', clue: 'Period 3, Group 17: a halogen used to disinfect water.', answer: 'Cl' },
  { id: 'c2', clue: 'Period 2, Group 14: the basis of organic chemistry.', answer: 'C' },
  { id: 'c3', clue: 'Period 4, Group 1: an alkali metal essential in bananas.', answer: 'K' },
  { id: 'c4', clue: 'Period 1, Group 18: the lightest noble gas.', answer: 'He' },
  { id: 'c5', clue: 'Period 3, Group 14: a metalloid used in computer chips.', answer: 'Si' },
];

// cards.js — the Runehold card catalogue.
// Every card is an original design for this game: four suits (Ember, Tide,
// Thorn, Stone), a mana cost, and an effect. Suits are told apart by colour
// AND by shape, never by text alone.

export const SUITS = {
  ember: { name: "Ember", color: "#e8542f", dark: "#8f2a10", glyph: "▲", blurb: "Burns bright. High damage, little defence." },
  tide:  { name: "Tide",  color: "#2f8fe8", dark: "#144a7d", glyph: "●", blurb: "Flows around trouble. Damage plus healing." },
  thorn: { name: "Thorn", color: "#3fae5a", dark: "#1d5c2e", glyph: "◆", blurb: "Grows on itself. Rewards playing suits in runs." },
  stone: { name: "Stone", color: "#9a8f7a", dark: "#5c5344", glyph: "■", blurb: "Stands its ground. Guard that soaks damage." },
};

// Card fields:
//   id     — stable key
//   name   — card name
//   suit   — one of the four suits above
//   cost   — mana to play (1-6)
//   atk    — damage dealt to the rival's Ward when played
//   guard  — Ward-block gained when played (soaks damage until your next turn)
//   mend   — Ward healed when played
//   surge  — extra attack when played right after a card of the same suit
//            (the Resonance rule)
export const CARDS = [
  // ---- Ember: pure damage ----
  { id: "spark-imp",     name: "Spark Imp",     suit: "ember", cost: 1, atk: 2 },
  { id: "cinder-wolf",   name: "Cinder Wolf",   suit: "ember", cost: 2, atk: 4 },
  { id: "flame-lash",    name: "Flame Lash",    suit: "ember", cost: 3, atk: 6 },
  { id: "ember-fanatic", name: "Ember Fanatic", suit: "ember", cost: 2, atk: 3, surge: 2 },
  { id: "inferno-drake", name: "Inferno Drake", suit: "ember", cost: 5, atk: 10 },
  // ---- Tide: damage plus healing ----
  { id: "mist-veil",     name: "Mist Veil",     suit: "tide",  cost: 1, guard: 3 },
  { id: "tidecaller",    name: "Tidecaller",    suit: "tide",  cost: 2, atk: 3, mend: 2 },
  { id: "deep-current",  name: "Deep Current",  suit: "tide",  cost: 3, atk: 5 },
  { id: "coral-sage",    name: "Coral Sage",    suit: "tide",  cost: 3, mend: 6 },
  { id: "leviathan",     name: "Leviathan",     suit: "tide",  cost: 6, atk: 12 },
  // ---- Thorn: resonance payoffs ----
  { id: "thorn-sprout",  name: "Thorn Sprout",  suit: "thorn", cost: 1, atk: 1, guard: 2 },
  { id: "vine-snare",    name: "Vine Snare",    suit: "thorn", cost: 2, atk: 3, surge: 3 },
  { id: "briar-knight",  name: "Briar Knight",  suit: "thorn", cost: 3, atk: 5, guard: 2 },
  { id: "ancient-grove", name: "Ancient Grove", suit: "thorn", cost: 4, mend: 5, guard: 4 },
  { id: "thorn-queen",   name: "Thorn Queen",   suit: "thorn", cost: 5, atk: 9 },
  // ---- Stone: guard walls ----
  { id: "pebble-guard",  name: "Pebble Guard",  suit: "stone", cost: 1, guard: 4 },
  { id: "mountains-oath",name: "Mountain's Oath",suit: "stone",cost: 2, guard: 6 },
  { id: "granite-golem", name: "Granite Golem", suit: "stone", cost: 3, atk: 4, guard: 4 },
  { id: "stone-colossus",name: "Stone Colossus",suit: "stone", cost: 6, atk: 8, guard: 6 },
];

// How many copies of each card go into one player's 24-card deck.
const DECK_LIST = [
  ["spark-imp", 2], ["cinder-wolf", 2], ["flame-lash", 1], ["ember-fanatic", 1],
  ["inferno-drake", 1],
  ["mist-veil", 2], ["tidecaller", 2], ["deep-current", 1], ["coral-sage", 1],
  ["leviathan", 1],
  ["thorn-sprout", 1], ["vine-snare", 1], ["briar-knight", 1], ["ancient-grove", 1],
  ["thorn-queen", 1],
  ["pebble-guard", 1], ["mountains-oath", 1], ["granite-golem", 1],
  ["stone-colossus", 1],
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}

// Build a fresh 24-card deck (array of card ids) and shuffle it with rng().
export function buildDeck(rng) {
  const deck = [];
  for (const [id, n] of DECK_LIST) for (let i = 0; i < n; i++) deck.push(id);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// One-line text of what a card does, for its face and for the log.
export function cardText(card) {
  const parts = [];
  if (card.atk) parts.push(`Deal ${card.atk} damage`);
  if (card.guard) parts.push(`Gain ${card.guard} Guard`);
  if (card.mend) parts.push(`Heal ${card.mend} Ward`);
  if (card.surge) parts.push(`Resonance: +${card.surge} damage`);
  return parts.join(" · ") || "—";
}

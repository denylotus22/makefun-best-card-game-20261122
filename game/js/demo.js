// demo.js — fixed tableaus for the maker's screenshots.
// `?demo=table|win|loss` loads the game straight into a settled, readable
// mid-game or end-game state. These are real renders of the game's own code:
// the same state machine, the same cards, the same renderer — only the
// starting position is staged so a screenshot can show it.

import { freshState } from "./game.js";

const TABLE_LOG = [
  "You play Flame Lash — Deal 6 damage.",
  "Maren plays Granite Golem — Deal 4 damage · Gain 4 Guard.",
  "Guard soaks 4 damage.",
  "Resonance! Vine Snare sings with the thorn before it (+3).",
  "You play Vine Snare — Deal 3 damage · Resonance: +3 damage (+3 Resonance).",
  "— Turn 5 — your move. Mana 5/5. —",
];

function baseTableState() {
  const s = freshState(20261122);
  s.screen = "table";
  s.phase = "player";
  s.turn = 5;
  s.player.ward = 22;
  s.player.guard = 4;
  s.player.mana = 5;
  s.player.maxMana = 5;
  s.rival.ward = 17;
  s.rival.guard = 2;
  s.rival.mana = 3;
  s.rival.maxMana = 5;
  s.playerHand = ["flame-lash", "vine-snare", "tidecaller", "granite-golem", "spark-imp", "coral-sage"];
  s.rivalHand = ["x", "x", "x", "x", "x"].map(() => "pebble-guard"); // backs only; ids never shown
  s.playerDeck = Array(14).fill("spark-imp");
  s.rivalDeck = Array(13).fill("spark-imp");
  s.playerDiscard = ["cinder-wolf", "mist-veil"];
  s.rivalDiscard = ["thorn-sprout"];
  s.playerPlayed = ["vine-snare", "flame-lash"];
  s.rivalPlayed = ["granite-golem"];
  s.playerLastSuit = "thorn";
  s.log = [...TABLE_LOG];
  s.stats = { damageDealt: 13, damageTaken: 8, cardsPlayed: 9, turns: 5 };
  s.selected = 0;
  return s;
}

export function applyDemo(name) {
  if (name === "table") return baseTableState();
  if (name === "win" || name === "loss") {
    const s = baseTableState();
    s.over = true;
    s.phase = "over";
    s.winner = name === "win" ? "player" : "rival";
    s.screen = name;
    if (name === "win") {
      s.rival.ward = 0;
      s.player.ward = 14;
      s.log = ["You play Inferno Drake — Deal 10 damage.", "Maren's Ward shatters — victory is yours!"];
      s.stats = { damageDealt: 30, damageTaken: 16, cardsPlayed: 14, turns: 8 };
    } else {
      s.player.ward = 0;
      s.rival.ward = 9;
      s.log = ["Maren plays Leviathan — Deal 12 damage.", "Your Ward shatters — Maren takes the duel."];
      s.stats = { damageDealt: 21, damageTaken: 30, cardsPlayed: 11, turns: 7 };
    }
    return s;
  }
  return null;
}

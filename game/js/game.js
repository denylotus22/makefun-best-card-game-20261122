// game.js — the Runehold engine: state, turns, rules and input.
// The view lives in render.js; the rival's choices live in ai.js.
// One game: two duellists, 30 Ward each, mana that grows every turn, and a
// 24-card deck. Reduce the rival's Ward to 0 before yours falls.

import { buildDeck, cardById, cardText } from "./cards.js";
import { chooseRivalCard, rivalIntentLine } from "./ai.js";
import { sfx, setMuted, isMuted } from "./audio.js";
import { renderAll, showScreen, floatText, renderLog } from "./render.js";
import { applyDemo } from "./demo.js";

export const MAX_WARD = 30;
export const MAX_MANA = 10;
export const HAND_LIMIT = 7;

// Small seeded RNG so a demo (or a replay) can be reproduced exactly.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function freshState(seed) {
  const rng = mulberry32(seed ?? (Date.now() % 2147483647));
  return {
    screen: "title",
    phase: "player", // "player" | "rival" | "over"
    turn: 1,
    player: { ward: MAX_WARD, guard: 0, mana: 1, maxMana: 1 },
    rival: { ward: MAX_WARD, guard: 0, mana: 1, maxMana: 1 },
    playerHand: [],
    rivalHand: [],
    playerDeck: buildDeck(rng),
    rivalDeck: buildDeck(rng),
    playerDiscard: [],
    rivalDiscard: [],
    playerPlayed: [], // cards on the table this turn, newest last
    rivalPlayed: [],
    playerLastSuit: null,
    rivalLastSuit: null,
    selected: null,
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, turns: 1 },
    rng,
    over: false,
    winner: null,
  };
}

export let state = freshState();

function log(msg) {
  state.log.unshift(msg);
  if (state.log.length > 40) state.log.length = 40;
  renderLog(state);
}

// Draw n cards for a side; reshuffle the discard pile when the deck runs dry.
function drawCards(side, n) {
  const hand = side === "player" ? state.playerHand : state.rivalHand;
  const deck = side === "player" ? state.playerDeck : state.rivalDeck;
  const discard = side === "player" ? state.playerDiscard : state.rivalDiscard;
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) return;
      deck.push(...discard.splice(0));
      for (let j = deck.length - 1; j > 0; j--) {
        const k = Math.floor(state.rng() * (j + 1));
        [deck[j], deck[k]] = [deck[k], deck[j]];
      }
      log("The deck ran dry — the discard pile is shuffled back in.");
    }
    hand.push(deck.pop());
    if (hand.length > HAND_LIMIT) {
      const burned = hand.pop();
      log(`${side === "player" ? "You" : "Maren"} drew too many — ${cardById(burned).name} burns away.`);
    }
  }
}

// Deal damage to a side: Guard soaks it first, then Ward.
function dealDamage(side, amount, sourceName) {
  const target = side === "player" ? state.player : state.rival;
  let rest = amount;
  if (target.guard > 0) {
    const soaked = Math.min(target.guard, rest);
    target.guard -= soaked;
    rest -= soaked;
    if (soaked > 0) log(`Guard soaks ${soaked} damage.`);
  }
  if (rest > 0) {
    target.ward = Math.max(0, target.ward - rest);
    if (side === "player") state.stats.damageTaken += rest;
    else state.stats.damageDealt += rest;
  }
  return rest;
}

// Apply one card's effect. Returns the damage actually dealt to Ward.
export function applyCard(side, card) {
  const me = side === "player" ? state.player : state.rival;
  const foe = side === "player" ? "rival" : "player";
  const lastSuit = side === "player" ? state.playerLastSuit : state.rivalLastSuit;
  const resonant = card.surge && lastSuit === card.suit;
  let atk = card.atk || 0;
  if (resonant) {
    atk += card.surge;
    log(`Resonance! ${card.name} sings with the ${card.suit} before it (+${card.surge}).`);
    sfx.resonance();
  }
  me.mana -= card.cost;
  if (side === "player") state.playerLastSuit = card.suit;
  else state.rivalLastSuit = card.suit;

  let dealt = 0;
  if (atk > 0) {
    dealt = dealDamage(foe, atk, card.name);
    sfx.hit();
    floatText(foe, `-${dealt}`, "dmg");
  }
  if (card.guard) {
    me.guard += card.guard;
    log(`${side === "player" ? "You gain" : "Maren gains"} ${card.guard} Guard.`);
    sfx.guard();
    floatText(side, `+${card.guard} Guard`, "guard");
  }
  if (card.mend) {
    const healed = Math.min(card.mend, MAX_WARD - me.ward);
    me.ward += healed;
    if (healed > 0) {
      log(`${side === "player" ? "You heal" : "Maren heals"} ${healed} Ward.`);
      floatText(side, `+${healed} Ward`, "heal");
    }
  }
  const who = side === "player" ? "You play" : "Maren plays";
  log(`${who} ${card.name} — ${cardText(card)}${resonant ? ` (+${card.surge} Resonance)` : ""}.`);
  return dealt;
}

function checkEnd() {
  if (state.player.ward <= 0 || state.rival.ward <= 0) {
    state.over = true;
    state.phase = "over";
    state.winner = state.rival.ward <= 0 ? "player" : "rival";
    state.screen = state.winner === "player" ? "win" : "loss";
    if (state.winner === "player") sfx.win(); else sfx.lose();
    log(state.winner === "player"
      ? "Maren's Ward shatters — victory is yours!"
      : "Your Ward shatters — Maren takes the duel.");
    showScreen(state);
    renderAll(state);
    return true;
  }
  return false;
}

// ---- Player actions ----

export function selectCard(index) {
  if (state.screen !== "table" || state.phase !== "player" || state.over) return;
  if (index < 0 || index >= state.playerHand.length) return;
  state.selected = state.selected === index ? null : index;
  sfx.select();
  renderAll(state);
}

export function playSelected() {
  if (state.selected === null) return;
  playCard(state.selected);
}

export function playCard(index) {
  if (state.screen !== "table" || state.phase !== "player" || state.over) return;
  const id = state.playerHand[index];
  const card = cardById(id);
  if (!card) return;
  if (card.cost > state.player.mana) {
    log(`Not enough mana for ${card.name} (needs ${card.cost}).`);
    renderAll(state);
    return;
  }
  state.playerHand.splice(index, 1);
  state.playerDiscard.push(id);
  state.playerPlayed.push(id);
  state.selected = null;
  state.stats.cardsPlayed++;
  sfx.play();
  applyCard("player", card);
  if (!checkEnd()) renderAll(state);
}

// End the player's turn and let the rival answer.
export function endTurn() {
  if (state.screen !== "table" || state.phase !== "player" || state.over) return;
  state.phase = "rival";
  state.selected = null;
  log(`— Turn ${state.turn} ends. Maren takes the table. —`);
  log(rivalIntentLine(state));
  sfx.turn();
  renderAll(state);
  runRivalTurn();
}

// The rival plays one card at a time, with a beat between plays so the
// player can follow what she does.
function runRivalTurn() {
  const step = () => {
    if (state.over) return;
    const id = chooseRivalCard(state);
    if (!id) { finishRivalTurn(); return; }
    const idx = state.rivalHand.indexOf(id);
    state.rivalHand.splice(idx, 1);
    state.rivalDiscard.push(id);
    state.rivalPlayed.push(id);
    applyCard("rival", cardById(id));
    if (checkEnd()) return;
    renderAll(state);
    setTimeout(step, 750);
  };
  setTimeout(step, 650);
}

function finishRivalTurn() {
  state.turn++;
  state.stats.turns = state.turn;
  state.player.guard = 0;
  state.rival.guard = 0;
  state.playerPlayed = [];
  state.rivalPlayed = [];
  state.playerLastSuit = null;
  state.rivalLastSuit = null;
  state.player.maxMana = Math.min(MAX_MANA, state.turn);
  state.rival.maxMana = Math.min(MAX_MANA, state.turn);
  state.player.mana = state.player.maxMana;
  state.rival.mana = state.rival.maxMana;
  // The Long Night: from turn 12 the table itself turns hostile — both
  // duellists lose Ward at the start of each turn, growing by 1 a turn.
  // No duel can stall forever, and turtling stops paying.
  if (state.turn >= 12) {
    const wear = state.turn - 11;
    state.rival.ward = Math.max(0, state.rival.ward - wear);
    state.player.ward = Math.max(0, state.player.ward - wear);
    log(`The Long Night deepens — both duellists lose ${wear} Ward.`);
    if (checkEnd()) return;
  }
  state.phase = "player";
  drawCards("player", 1);
  drawCards("rival", 1);
  log(`— Turn ${state.turn} — your move. Mana ${state.player.mana}/${state.player.maxMana}. —`);
  sfx.draw();
  sfx.turn();
  if (!checkEnd()) renderAll(state);
}

// ---- Game lifecycle ----

export function startGame(seed) {
  state = freshState(seed);
  state.screen = "table";
  drawCards("player", 4);
  drawCards("rival", 4);
  log("The duel begins. You hold the first turn — play a card, then End Turn.");
  log("Resonance: play two cards of the same suit in a row for bonus damage.");
  showScreen(state);
  renderAll(state);
}

export function backToTitle() {
  state = freshState();
  showScreen(state);
  renderAll(state);
}

// ---- Input: mouse + keyboard ----

export function bindInput() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") {
      const now = setMuted(!isMuted());
      log(now ? "Sound muted. (M to unmute)" : "Sound on.");
      renderAll(state);
      return;
    }
    if (state.screen === "title") {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startGame(); }
      return;
    }
    if (state.screen === "win" || state.screen === "loss") {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startGame(); }
      if (e.key === "Escape") backToTitle();
      return;
    }
    if (e.key >= "1" && e.key <= "7") selectCard(Number(e.key) - 1);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playSelected(); }
    else if (e.key === "e" || e.key === "E") endTurn();
    else if (e.key === "Escape") { state.selected = null; renderAll(state); }
  });
}

// ---- Boot ----

// The renderer calls back into the engine through this handle.
window.__runehold = { selectCard, playSelected, playCard, endTurn, startGame, backToTitle };

function wireButtons() {
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  on("btn-play", () => startGame());
  on("btn-how", () => document.getElementById("how-panel").classList.toggle("open"));
  on("btn-how-close", () => document.getElementById("how-panel").classList.remove("open"));
  on("btn-end-turn", () => endTurn());
  on("btn-again", () => startGame());
  on("btn-to-title", () => backToTitle());
  on("btn-mute", () => {
    const now = setMuted(!isMuted());
    document.getElementById("btn-mute").textContent = now ? "🔇 Sound off" : "🔊 Sound on";
    renderAll(state);
  });
}

function boot() {
  bindInput();
  wireButtons();
  const params = new URLSearchParams(location.search);
  const demo = params.get("demo");
  if (demo) {
    const staged = applyDemo(demo);
    if (staged) state = staged;
  }
  showScreen(state);
  renderAll(state);
}

document.addEventListener("DOMContentLoaded", boot);

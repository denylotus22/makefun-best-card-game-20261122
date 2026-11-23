// render.js — the Runehold view: builds every card, bar and screen from
// the engine's state and paints it into the page. No game rules live here.

import { SUITS, cardById, cardText } from "./cards.js";
import { MAX_WARD, MAX_MANA } from "./game.js";

const $ = (id) => document.getElementById(id);

// ---- Card faces ----

export function cardElement(id, opts = {}) {
  const card = cardById(id);
  const suit = SUITS[card.suit];
  const el = document.createElement("div");
  el.className = "card" + (opts.faceDown ? " back" : "") + (opts.small ? " small" : "");
  el.style.setProperty("--suit", suit.color);
  el.style.setProperty("--suit-dark", suit.dark);
  if (opts.faceDown) {
    el.innerHTML = `<div class="card-back-glyph">✦</div><div class="card-back-name">RUNEHOLD</div>`;
    return el;
  }
  const stats = [];
  if (card.atk) stats.push(`<span class="stat atk" title="Damage">⚔ ${card.atk}</span>`);
  if (card.guard) stats.push(`<span class="stat guard" title="Guard">🛡 ${card.guard}</span>`);
  if (card.mend) stats.push(`<span class="stat mend" title="Heal">✚ ${card.mend}</span>`);
  el.innerHTML = `
    <div class="card-cost" title="Mana cost">${card.cost}</div>
    <div class="card-suit-glyph" title="${suit.name}">${suit.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-art" aria-hidden="true">${suit.glyph}</div>
    <div class="card-suit">${suit.name}</div>
    <div class="card-text">${cardText(card)}</div>
    <div class="card-stats">${stats.join("")}</div>`;
  if (opts.selectable) {
    el.classList.add("selectable");
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${card.name}, ${suit.name}, cost ${card.cost}. ${cardText(card)}`);
  }
  if (opts.selected) el.classList.add("selected");
  if (opts.unaffordable) el.classList.add("unaffordable");
  return el;
}

function manaPips(mana, maxMana) {
  let out = "";
  for (let i = 1; i <= MAX_MANA; i++) {
    const cls = i <= mana ? "pip on" : i <= maxMana ? "pip dim" : "pip off";
    out += `<span class="${cls}" title="Mana ${i}">●</span>`;
  }
  return out;
}

function wardBar(side) {
  const pct = Math.max(0, (side.ward / MAX_WARD) * 100);
  const low = side.ward <= 10 ? " low" : "";
  return `
    <div class="ward-row">
      <span class="ward-label">Ward</span>
      <div class="ward-bar${low}"><div class="ward-fill" style="width:${pct}%"></div>
      <span class="ward-num">${side.ward} / ${MAX_WARD}</span></div>
      ${side.guard > 0 ? `<span class="guard-chip" title="Guard soaks damage">🛡 ${side.guard}</span>` : ""}
    </div>
    <div class="mana-row"><span class="mana-label">Mana</span>
      <span class="mana-pips">${manaPips(side.mana, side.maxMana)}</span>
      <span class="mana-num">${side.mana}/${side.maxMana}</span></div>`;
}

// ---- Screens ----

export function showScreen(state) {
  const map = { title: "title", table: "table", win: "end", loss: "end" };
  for (const name of ["title", "table", "end"]) {
    $(`screen-${name}`).classList.toggle("active", map[state.screen] === name);
  }
  document.body.dataset.screen = state.screen;
}

export function renderAll(state) {
  if (state.screen === "title") { renderTitle(); return; }
  if (state.screen === "win" || state.screen === "loss") { renderEnd(state); return; }
  renderTable(state);
}

function renderTitle() {
  // The title screen is static HTML; only the suit legend is built here.
  const legend = $("suit-legend");
  if (legend && !legend.dataset.built) {
    legend.dataset.built = "1";
    legend.innerHTML = Object.values(SUITS).map((s) => `
      <div class="legend-item" style="--suit:${s.color}">
        <span class="legend-glyph">${s.glyph}</span>
        <span class="legend-name">${s.name}</span>
        <span class="legend-blurb">${s.blurb}</span>
      </div>`).join("");
  }
}

function renderTable(state) {
  // Rival (top of the table).
  $("rival-ward").innerHTML = wardBar(state.rival);
  $("rival-hand").innerHTML = "";
  state.rivalHand.forEach((id) => $("rival-hand").appendChild(cardElement(id, { faceDown: true, small: true })));
  $("rival-count").textContent = `${state.rivalHand.length} cards · Deck ${state.rivalDeck.length}`;
  $("rival-played").innerHTML = "";
  state.rivalPlayed.forEach((id) => $("rival-played").appendChild(cardElement(id, { small: true })));
  $("turn-banner").textContent =
    state.phase === "player" ? `Your turn — Turn ${state.turn}` : `Maren is playing… — Turn ${state.turn}`;

  // Player (bottom of the table).
  $("player-ward").innerHTML = wardBar(state.player);
  const handEl = $("player-hand");
  handEl.innerHTML = "";
  state.playerHand.forEach((id, i) => {
    const card = cardById(id);
    const el = cardElement(id, {
      selectable: state.phase === "player",
      selected: state.selected === i,
      unaffordable: card.cost > state.player.mana,
    });
    el.dataset.index = i;
    el.addEventListener("click", () => {
      if (state.selected === i) { window.__runehold.playSelected(); }
      else window.__runehold.selectCard(i);
    });
    el.addEventListener("dblclick", () => window.__runehold.playCard(i));
    handEl.appendChild(el);
  });
  $("player-count").textContent = `${state.playerHand.length} cards · Deck ${state.playerDeck.length} · Discard ${state.playerDiscard.length}`;
  $("player-played").innerHTML = "";
  state.playerPlayed.forEach((id) => $("player-played").appendChild(cardElement(id, { small: true })));

  // Controls.
  const endBtn = $("btn-end-turn");
  endBtn.disabled = state.phase !== "player";
  endBtn.textContent = state.phase === "player" ? "End Turn  (E)" : "Maren is playing…";
  $("resonance-note").textContent = state.playerLastSuit
    ? `Resonance armed: your last card was ${SUITS[state.playerLastSuit].name} — play another ${SUITS[state.playerLastSuit].name} for bonus damage.`
    : "Resonance: play two cards of the same suit in a row for bonus damage.";
  renderLog(state);
}

function renderEnd(state) {
  const won = state.winner === "player";
  const s = state.stats;
  $("end-title").textContent = won ? "VICTORY" : "DEFEAT";
  $("end-title").className = won ? "end-title win" : "end-title loss";
  $("end-sub").textContent = won
    ? "Maren's Ward shatters. The table is yours, duellist."
    : "Your Ward shatters. Maren bows — and waits for a rematch.";
  $("end-stats").innerHTML = `
    <div class="end-stat"><span class="end-stat-num">${state.turn}</span><span class="end-stat-label">turns</span></div>
    <div class="end-stat"><span class="end-stat-num">${s.damageDealt}</span><span class="end-stat-label">damage dealt</span></div>
    <div class="end-stat"><span class="end-stat-num">${s.damageTaken}</span><span class="end-stat-label">damage taken</span></div>
    <div class="end-stat"><span class="end-stat-num">${s.cardsPlayed}</span><span class="end-stat-label">cards played</span></div>`;
}

export function renderLog(state) {
  const logEl = $("game-log");
  if (!logEl) return;
  logEl.innerHTML = state.log.slice(0, 3).map((m) => `<div class="log-line">${m}</div>`).join("");
}

// Floating combat text over a duellist's portrait.
export function floatText(side, text, kind) {
  const anchor = side === "player" ? $("player-portrait") : $("rival-portrait");
  if (!anchor) return;
  const el = document.createElement("div");
  el.className = `float-text ${kind}`;
  el.textContent = text;
  anchor.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

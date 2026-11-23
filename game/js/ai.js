// ai.js — the rival's brain for Runehold.
// The rival is "Maren the Tidebound", a duellist whose choices a player can
// read and counter: she spends mana on the best value she can see, prefers
// finishing the game when she can, and guards herself when her Ward is low.
// She never sees the player's hand — only the open table.

import { cardById } from "./cards.js";

// Score one card as the rival would value it right now.
// Damage is worth most when it finishes the player; Guard is worth more
// when the rival is hurt; healing is worth more when the rival is low.
export function scoreCardForRival(card, state) {
  const rival = state.rival;
  const you = state.player;
  let score = 0;
  if (card.atk) {
    score += card.atk * 1.0;
    if (card.atk >= you.ward + you.guard) score += 50; // lethal: take it
    if (card.atk >= you.ward) score += 10; // breaks through Ward alone
  }
  if (card.guard) {
    score += card.guard * 0.7;
    if (rival.ward <= 12) score += card.guard * 0.6; // hurt: turtle up
  }
  if (card.mend) {
    const missing = 30 - rival.ward;
    score += Math.min(card.mend, missing) * 0.8;
  }
  if (card.surge && state.rivalLastSuit === card.suit) score += card.surge * 1.0;
  // Value per mana: a cheap card that does a lot wins over a dear one.
  return score / Math.max(1, card.cost);
}

// Pick the rival's next card to play, or null when she is done.
// She keeps playing while she can afford something worth playing.
export function chooseRivalCard(state) {
  const hand = state.rivalHand;
  let best = null;
  let bestScore = 0.6; // below this, a card is not worth the mana
  for (const id of hand) {
    const card = cardById(id);
    if (!card || card.cost > state.rival.mana) continue;
    const score = scoreCardForRival(card, state);
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

// One line the table shows while the rival thinks, so her intent is readable.
export function rivalIntentLine(state) {
  if (state.player.ward <= 6) return "Maren smells blood — she is hunting the finish.";
  if (state.rival.ward <= 10) return "Maren is hurt — expect Guard and healing.";
  if (state.rival.mana >= 5) return "Maren has a full purse of mana — a big card is coming.";
  return "Maren weighs her hand…";
}

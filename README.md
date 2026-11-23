# makefun-best-card-game-20261122

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/denylotus22/makefun-best-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/denylotus22/makefun-best-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Runehold** — a duel of sigil cards. You and Maren the Tidebound each hold 30 Ward. Spend mana to play cards, guard yourself, heal, and chain suits for Resonance — reduce her Ward to zero before she reduces yours. An original game: its cards, suits, art and sounds were made for Runehold, and it runs entirely offline in a desktop browser. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## Run it

```sh
cd game && python3 -m http.server 8080
# then open http://localhost:8080 in desktop Chrome
```

No build step, no network: `game/index.html` plus its own files under `game/` is the whole game.

## Dossier

### The game

Runehold is a complete 1-v-1 card duellist for keyboard and mouse. Each side starts with 30 Ward, a 24-card deck and 4 cards in hand. Mana refills and grows by 1 every turn, up to 10. Playing a card costs its mana and does what its face says: attack (⚔) damages the rival's Ward, Guard (🛡) soaks damage until your next turn, Heal (✚) restores Ward. First Ward to 0 loses; a win screen and a loss screen both show the duel's stats and offer a rematch.

### The rules that make each hand a decision

- **Four suits, four temperaments.** Ember (▲, red) hits hardest and guards least. Tide (●, blue) mixes damage with healing. Thorn (◆, green) rewards playing suits in runs. Stone (■, grey) builds Guard walls. Suits are told apart by colour *and* shape, never by text alone.
- **Resonance.** Play two cards of the same suit in a row and the second deals bonus damage. Do you spend mana now, or hold a card to complete the run?
- **Guard vs. heal vs. damage.** Every card is a trade: a Stone wall now, a Tide heal for later, or an Ember strike that might end the duel.
- **The Long Night.** From turn 12 both duellists lose Ward each turn (1, then 2, then 3…) — no duel stalls forever, and turtling stops paying.
- **A rival you can read.** Maren the Tidebound plays by a visible logic: she hunts the finish when your Ward is low, turtles with Guard and healing when hers is, and the table tells you which mood she is in before she plays.

### How to play

- **Mouse:** click a card to select it, click again (or double-click) to play it. Click **End Turn** when you are done.
- **Keyboard:** `1–7` select a card, `Enter` plays it, `E` ends the turn, `M` toggles sound, `Esc` deselects.
- **Cards:** 19 original cards across the four suits — Spark Imp, Cinder Wolf, Flame Lash, Ember Fanatic, Inferno Drake, Mist Veil, Tidecaller, Deep Current, Coral Sage, Leviathan, Thorn Sprout, Vine Snare, Briar Knight, Ancient Grove, Thorn Queen, Pebble Guard, Mountain's Oath, Granite Golem, Stone Colossus.
- **Sound:** all effects are synthesised with the Web Audio API — no audio files, no network.

### Screenshots

1. `1-title.jpg` — the title screen, with the four suits and how to play.
2. `2-table.jpg` — the table mid-duel: Maren's hand (face down) and played card, your hand, both Wards and mana, the log and the Resonance note.
3. `3-win.jpg` — the victory screen with the duel's stats.
4. `4-loss.jpg` — the defeat screen with the duel's stats.

### Structure

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. Deterministic: the same bytes on every run.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html` — the page; `game/css/style.css` — the table, cards and screens; `game/js/cards.js` — the card catalogue and deck; `game/js/ai.js` — Maren's choices; `game/js/game.js` — state, turns and input; `game/js/render.js` — the view; `game/js/demo.js` — the staged tableaus the screenshots were taken from (`?demo=table|win|loss`); `game/js/audio.js` — synthesised sounds.

### Play-testing

Played end to end in headless Chromium: title → table → play cards by mouse and by keyboard → end turn → rival answers → full games to victory and to defeat, with zero console errors. A heuristic bot won 4 of 5 full games (5–10 turns each) and lost 1; a naive play-everything bot lost — the duel rewards thinking, and both the win and the loss paths are real.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tj3cdggc&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>

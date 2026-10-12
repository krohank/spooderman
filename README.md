# Spider-Man · Pixel Stories

A standalone, mobile-first, unofficial Spider-Man fan game. Five missions take you across New York, with pixel city scenery, web swinging, combat, and comic-book transitions between chapters. No runtime dependencies or API keys are required.

[Hosted game](https://spider-city-pixel-stories.rohanko4rj.chatgpt.site) — the hosted preview is private and requires the owner's ChatGPT sign-in. Running the source locally does not require an account.

## Play locally

Install Node.js 22 or newer, then run:

```sh
git clone https://github.com/krohank/spooderman.git
cd spooderman
npm start
```

Open http://localhost:4177. No `npm install` step is needed. A phone on the same Wi-Fi network can open `http://YOUR-COMPUTER-LAN-IP:4177` while the server is running and port 4177 is reachable on the computer.

## Controls

- Move: arrow keys or A/D; touch arrows on a phone.
- Jump / double jump: Space, W, up arrow, or JUMP.
- Swing: hold X or SWING; move to build momentum, release to launch.
- Shoot: hold C or WEB. Nearby targets are aimed at automatically.
- Pause: P, Escape, or the pause button. Switching tabs also pauses.

Five chapters have tokens, rescues, drones, a timed power-grid mission, and a Green Goblin boss. Reach the green rooftop beacon after the first four objectives. Defeating the boss completes the campaign. Health, checkpoint respawns, retries, chapter replays, optional synthesized sound, fullscreen, and local progress persistence are included. Supplied user artwork appears in the story transitions; the playfield and sprites are procedurally drawn pixel art.

## Chapters

| Chapter | Neighborhood | Objective |
| --- | --- | --- |
| Neighborhood watch | Queens | Collect 8 web tokens and reach the rooftop beacon. |
| A helping hand | Lower East Side | Rescue 3 stranded citizens. |
| Unfriendly skies | Midtown | Web 6 drones. |
| Lights out | Hell's Kitchen | Recover 5 power cells before the timer runs out. |
| One last swing | Financial District | Defeat the Green Goblin. |

## Checks

```sh
npm run check
npm test
```

The ten engine tests cover movement, rooftop collisions, double jumps, rope constraints, checkpoint respawns, objectives, projectiles, timeouts, the boss fight, and completing the entire campaign with ordinary player controls. The five missions have also been played through in the browser.

## Source layout

- `dist/index.html`, `style.css`, and `app.mjs`: interface, touch/keyboard controls, mission transitions, sound, and browser save data.
- `dist/engine.mjs`: gameplay and physics; usable without a DOM.
- `dist/render.mjs`: pixel scenery, sprites, and effects.
- `dist/art/`: supplied reference artwork used in story panels.
- `dist/fonts/`: bundled Space Grotesk fonts and their SIL Open Font License.
- `tests/engine.test.mjs`: automated gameplay checks.
- `preview.mjs`: dependency-free local HTTP server.

`dist/` is the complete static website: deploy its contents to any static host. Gameplay saves and best scores are stored per browser and site origin. This is an unofficial fan project; the Spider-Man characters and supplied artwork are not claimed as original intellectual property.

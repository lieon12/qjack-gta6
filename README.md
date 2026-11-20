[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/lieon12/qjack-gta6/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/lieon12/qjack-gta6/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Solmar Bay — Open World Crime

Solmar Bay is a complete top-down open-world crime game set in an original sun-soaked coastal city: explore on foot or steal and drive one of six vehicle models — Comet GT, sedan, hatchback, pickup, limo, or a City Taxi — through traffic and pedestrians, raise a five-star wanted level with police cars, foot cops and, from three stars, a helicopter with a searchlight, and run eight story missions for Mama Rosa — from your first car theft to stopping an armored van, collecting protection money on the neon Strip, running a crate from the Marina, and ending El Tiburón himself in the "Tiburón Rising" finale.

The city lives while you play: a clock runs from dawn to night, the weather drifts between clear skies, overcast, rain and fog, and the HUD shows the time, the weather and the district you are standing in — Downtown, Calle Sol, the Docks, Parkside, Beachfront, the Strip, or the Marina with its boats and pier. Hail a taxi with T and ride the meter to your objective, or steal the cab instead. Combat, a weapon and armor shop, cash pickups, a hospital, a minimap, save/continue, and synthesized sound and music round it out, all in plain static files with no network request.

## Play

Serve `game/` with any static file server and open `index.html` in desktop Chrome. Keyboard and mouse only.

- **WASD** move / drive · **Shift** sprint · **Space** punch / brake
- **E** steal or enter a car · **T** hail a taxi · **F / click** shoot
- **1 / 2** fists / pistol · **P / Esc** pause · **S** save · **M** music

## Build

`main.ts` (Node 22, standard library only) copies `game/` to `/output`, decodes the base64 screenshots in `shots-b64/` into `/output/screenshots/`, and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are taken in the browser with `?shot=chase|street|heist|beach` — a dusk chase under the helicopter, a rainy downtown street, the night heist, and a dawn drive along Ocean Drive.

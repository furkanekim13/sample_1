# furkanekim

An original, atmospheric side-scrolling flight platformer built with Phaser 3. All characters, environments, effects, and audio are drawn or generated at runtime; no game art or sound assets are required.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run `npm run build`; preview it with `npm run preview`.

## Play

- Hold **Space**, **W**, **↑**, or touch the play area to flap upward. Release to fall.
- **Esc** or **P** pauses; **R** restarts; **M** toggles sound.
- Collect glowing seeds and power-ups, avoid the moving hazards, and reach the light at the end of each path.
- Progress, records, collected seeds, and master/music/effects sound preferences are stored in browser LocalStorage.

Five original paths gradually introduce blades, gears, moving platforms, crushers, falling stones, and energy barriers. The game uses procedural parallax scenery and Web Audio-generated ambience and effects. Existing saved progress is recognized automatically after the rename.

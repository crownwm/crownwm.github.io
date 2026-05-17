# Crown Games

Made by Wes & Mason.

Static Crown Games hub for approved static hosting. Cards open a local `play.html` launcher so visitors stay inside Crown instead of being sent somewhere else.

## Upload to Static Hosting

Upload the live site files from this folder or the deployment zip to any approved static host.

## What Is Included

- Visible Crown games: 918
- Visible Class6x games/embeds: 778
- Working local Ruffle games: 26
- Catalog entries with thumbnails: 1341
- Hidden broken/unsupported entries: 423
- Saved favorites: yes, stored in the visitor's browser
- Player controls: loading screen, favorite, reload, fullscreen, fill/fit
- Settings: saved themes, compact grid, calm motion, player sizing
- Themes: Classic, Snowfall, Rain Loop, Neon Arcade, Sunset
- Missing thumbnails: 0
- Cards that open away from Crown: 0
- Offsite-navigation games removed: yes

## Deployment Package

The upload zip includes only live site files. Developer tools stay local.

## Updating Later

Use the scripts in the `tools` folder if you want to refresh the catalog later.
`finalize-catalog.js` removes broken/offsite launchers, cleans categories, and deduplicates titles.

## Adding UGS Files

Save the UGS list as `data/ugs-files.txt`, put the real standalone `.html` files in `UGS Files` or `embeds/ugs-source`, then run:

```powershell
node tools/import-ugs-local-files.js
node tools/restore-working-ruffle-games.js
node tools/flag-unsupported-local-games.js
node tools/fill-web-logo-thumbnails.js
node tools/audit-local-playability.js
```

The importer only adds games when the actual local HTML exists. It skips missing files, external-only iframe shells, and Ruffle/Flash entries by default so mobile players do not get broken games.

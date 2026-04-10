# 3d game demo



## Published game page

https://ericyeungcode.github.io/3d-game-demo/


## Dark page issue


```

❯ I publish using "npx gh-pages -d dist" but only see dark page without anything

⏺ That's a common issue with GitHub Pages — the asset paths are wrong. Vite builds with absolute paths (/assets/...) by default, but GitHub Pages serves from a subpath
  (/<repo-name>/).

  Fix by setting the base in your Vite config:

⏺ Write(vite.config.ts)
  ⎿  Wrote 5 lines to vite.config.ts
      1 import { defineConfig } from "vite";
      2
      3 export default defineConfig({
      4   base: "./",
      5 });

⏺ Using "./" makes all paths relative, which works on any hosting subpath.

  Now rebuild and redeploy:

  pnpm build && npx gh-pages -d dist

  That should fix the blank page.

```
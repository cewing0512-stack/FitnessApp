import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const VIRTUAL_ID = 'virtual:media-index';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Exposes `virtual:media-index`, listing which exercise ids have a demo clip
 * and/or thumbnail in public/videos. Dropping a file into that folder is all
 * it takes — the dev server picks it up live, and builds include it.
 */
export function mediaIndex(dir = 'public/videos'): Plugin {
  let root = process.cwd();

  const scan = () => {
    const abs = path.resolve(root, dir);
    const files = fs.existsSync(abs) ? fs.readdirSync(abs) : [];
    const ids = (exts: string[]) =>
      [...new Set(files.filter((f) => exts.includes(path.extname(f).toLowerCase())).map((f) => path.parse(f).name))].sort();
    return { videos: ids(['.mp4']), webm: ids(['.webm']), thumbs: ids(['.jpg']) };
  };

  return {
    name: 'media-index',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      const m = scan();
      return `export const videos = ${JSON.stringify(m.videos)};\nexport const webm = ${JSON.stringify(m.webm)};\nexport const thumbs = ${JSON.stringify(m.thumbs)};\n`;
    },
    configureServer(server) {
      const abs = path.resolve(root, dir);
      server.watcher.add(abs);
      const refresh = (file: string) => {
        if (!file.startsWith(abs)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

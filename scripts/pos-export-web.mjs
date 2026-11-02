// Atalho: o script real fica em mobile/scripts/pos-export-web.mjs. Uso (na raiz): node scripts/pos-export-web.mjs mobile/dist
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const dist = resolve(process.argv[2] ?? 'mobile/dist');
const r = spawnSync(process.execPath, ['scripts/pos-export-web.mjs', dist], { cwd: 'mobile', stdio: 'inherit' });
process.exit(r.status ?? 1);

// Copia os SVG oficiais do Quaru (quaru_v2) para src/config/logo-gerado.ts e public/icones/quaru.svg (favicon SVG).
// Uso: node scripts/gerar-logo.mjs <pasta quaru_v2> [<pasta domma final-sinal>]
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
const L = process.argv[2];
const r = (f) => readFileSync(`${L}/${f}`, 'utf8').trim();
writeFileSync('src/config/logo-gerado.ts', `// GERADO por scripts/gerar-logo.mjs a partir dos arquivos OFICIAIS de identidade/logo-rodada-2/quaru_v2 (sem redesenho).
// O viewBox já inclui a área de proteção do guia (40 px no logotipo 480×180; 10 px no símbolo 120×120).
export const LOGO_CLARO = ${JSON.stringify(r('quaru-v2-colorido.svg'))};
export const LOGO_ESCURO = ${JSON.stringify(r('quaru-v2-colorido-fundo-escuro.svg'))};
export const SIMBOLO = ${JSON.stringify(r('quaru-v2-simbolo.svg'))};
`);
// Símbolo oficial da Domma (redbox/clientes/domma-tecnologia/logo/final-sinal): claro = "icone", escuro = "icone-perfil".
const D = process.argv[3];
if (D) {
  const rd = (f) => readFileSync(`${D}/${f}`, 'utf8').replace(/<\?xml[^>]*>\s*/, '').trim()
    // Mesma cor, só a notação: rgb(48.2%, 38%, 100%) → #7B61FF (o react-native-svg não lê rgb com %).
    .replace(/rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)/g, (_, r, g, b) => '#' + [r, g, b].map((v) => Math.round((Number(v) / 100) * 255).toString(16).padStart(2, '0')).join('').toUpperCase());
  writeFileSync('src/config/domma-gerado.ts', `// GERADO por scripts/gerar-logo.mjs a partir dos arquivos OFICIAIS de domma-tecnologia/logo/final-sinal (sem redesenho).
export const DOMMA_SIMBOLO_CLARO = ${JSON.stringify(rd('domma_sinal_icone.svg'))};
export const DOMMA_SIMBOLO_ESCURO = ${JSON.stringify(rd('domma_sinal_icone-perfil.svg'))};
`);
}
copyFileSync(`${L}/quaru-v2-icone-app-1024.svg`, 'public/icones/quaru.svg');

// Plugin de config do Expo (ADR-0010): exclui os dados do app do backup na nuvem e da transferência
// entre aparelhos (D2D). Android 12+ lê `dataExtractionRules`; Android 11 ou mais antigo lê `fullBackupContent`.
// Só tem efeito num build nativo (prebuild/EAS); no Expo Go e na web não faz nada.
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const DOMINIOS = ['root', 'file', 'database', 'sharedpref', 'external'];

const regrasExtracao = () => `<?xml version="1.0" encoding="utf-8"?>
<!-- Gerado por plugins/sem-backup-android.js (ADR-0010). Android 12+ (API 31+). -->
<data-extraction-rules>
  <cloud-backup>
${DOMINIOS.map((d) => `    <exclude domain="${d}" path="." />`).join('\n')}
  </cloud-backup>
  <device-transfer>
${DOMINIOS.map((d) => `    <exclude domain="${d}" path="." />`).join('\n')}
  </device-transfer>
</data-extraction-rules>
`;

const regrasBackupCompleto = () => `<?xml version="1.0" encoding="utf-8"?>
<!-- Gerado por plugins/sem-backup-android.js (ADR-0010). Android 11 ou mais antigo. -->
<full-backup-content>
${DOMINIOS.map((d) => `  <exclude domain="${d}" path="." />`).join('\n')}
</full-backup-content>
`;

function aplicarNoManifesto(manifesto) {
  const app = manifesto.manifest.application?.[0];
  if (!app) throw new Error('AndroidManifest sem <application>');
  app.$ = { ...app.$, 'android:allowBackup': 'false', 'android:dataExtractionRules': '@xml/regras_extracao_dados', 'android:fullBackupContent': '@xml/regras_backup' };
  return manifesto;
}

const comSemBackup = (config) => {
  config = withAndroidManifest(config, (c) => { c.modResults = aplicarNoManifesto(c.modResults); return c; });
  config = withDangerousMod(config, ['android', async (c) => {
    const dir = path.join(c.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'regras_extracao_dados.xml'), regrasExtracao());
    fs.writeFileSync(path.join(dir, 'regras_backup.xml'), regrasBackupCompleto());
    return c;
  }]);
  return config;
};

module.exports = comSemBackup;
module.exports.aplicarNoManifesto = aplicarNoManifesto;
module.exports.regrasExtracao = regrasExtracao;
module.exports.regrasBackupCompleto = regrasBackupCompleto;

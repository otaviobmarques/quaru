// v0.12.1: o endereço base da versão web vem de EXPO_PUBLIC_BASE_URL.
// - GitHub Pages (endereço antigo): "/quaru" (padrão, igual ao app.json).
// - Vercel (app.quaru.com.br): "" (o app fica na raiz do domínio).
module.exports = ({ config }) => {
  const base = process.env.EXPO_PUBLIC_BASE_URL ?? '/quaru';
  const experiments = { ...config.experiments };
  if (base) experiments.baseUrl = base; else delete experiments.baseUrl;
  return { ...config, experiments };
};

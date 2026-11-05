# Ligar as assinaturas (Asaas) — passo a passo

O app, o banco e as funções já estão prontos. Falta ligar a sua conta do Asaas. Faça primeiro no **sandbox** (teste,
sem dinheiro de verdade) e só depois em produção.

## 1. Chave da API do Asaas
1. Entre no Asaas (sandbox: https://sandbox.asaas.com). Em **Integrações → Chaves de API**, gere uma chave.
2. No Supabase: **Edge Functions → Secrets** (projeto `quaru`), crie:
   - `ASAAS_API_KEY` = a chave do Asaas;
   - `ASAAS_AMBIENTE` = `sandbox` (depois, `producao`);
   - `ASAAS_WEBHOOK_TOKEN` = uma senha longa inventada por você (ex.: 40 letras e números).
   A chave nunca vai para o app nem para o GitHub; não mande essas chaves por chat.

## 2. Webhook (o Asaas avisa quando o pagamento cai)
No Asaas: **Integrações → Webhooks → Adicionar**:
- URL: `https://gnmbrcdqljhtoxxkuekz.supabase.co/functions/v1/asaas-webhook`
- Token de autenticação: o mesmo `ASAAS_WEBHOOK_TOKEN`
- Versão da API: v3 · Tipo de envio: sequencial
- Eventos: **Cobranças** (PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_REFUNDED,
  PAYMENT_CHARGEBACK_REQUESTED) e **Assinaturas** (SUBSCRIPTION_DELETED, SUBSCRIPTION_INACTIVATED).

## 3. Supabase Auth (para o autocadastro)
**Authentication → Sign In / Providers**: deixe **Allow new users to sign up** LIGADO e **Confirm email** LIGADO.
**Authentication → URL Configuration**: Site URL e Redirect URLs com o endereço do app.

## 4. Testar no sandbox
1. Crie uma conta nova no app ("Criar conta · 7 dias grátis") e confirme o e-mail.
2. Em Planos, assine com um CPF de teste válido e pague no sandbox (o Asaas tem "Confirmar pagamento" no painel).
3. Em segundos, o Perfil mostra "Plano … válido até …".

## 5. Começar a cobrar
1. Troque `ASAAS_API_KEY` pela chave de **produção** e `ASAAS_AMBIENTE` para `producao`; refaça o webhook na conta
   de produção (mesma URL e token).
2. No painel admin, ligue **Cobrança ativa**. Quem está no teste ganha pelo menos 7 dias a partir daí.
3. Marque **Cortesia** para amigos e parceiros que não devem pagar.

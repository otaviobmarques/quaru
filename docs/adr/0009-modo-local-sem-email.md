# ADR-0009: Modo local sem e-mail (minimização de dados)
## Status
Aceito
## Data
2026-11-01
## Contexto
A versão 0.1.0 pedia um e-mail na entrada, mas no modo local esse e-mail não servia para nada: não havia login, envio nem recuperação de conta. A revisão jurídica (Jéssica, `juridico/revisao-consentimentos.md`) apontou que coletar dado sem finalidade fere a minimização (LGPD, art. 6º, III).
## Decisão
- O modo local não pede nem guarda e-mail. A tela de entrada tem só o botão "Começar" e o aviso "Sem cadastro".
- O estado passa para a versão 2 (`usuario: { modo: 'local', criadoEm }`). A migração v1→v2 (`migrarEstado`) apaga o e-mail que estiver gravado.
- `acoes.entrar(e, _emailIgnorado?)` mantém o 2º parâmetro só por compatibilidade e o ignora.
- O login por código no e-mail volta quando houver servidor (Supabase Auth), com nova base legal e uma linha na política.
## Consequências
- Não há como recuperar os dados se o aparelho for perdido; a saída é exportar (CSV/ZIP).
- A política de privacidade em rascunho ainda cita "e-mail digitado na entrada". A tela `juridico.tsx` mostra uma nota técnica sobre isso, e a Jéssica precisa ajustar o texto.
- A declaração do Google Play não deve declarar e-mail enquanto o modo for local (`juridico/declaracao-seguranca-dados-google-play.md`, linha 32).

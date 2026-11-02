# ADR-0017 – Tela de login do design v2.1 sem autenticação real ("Continuar sem conta")

- Status: aceito (v0.4.2, não publicado)
- Data: 2026-11-01

## Contexto
O design v2.1 (RedBox, aprovado pelo Otávio) traz uma tela de login com e-mail e senha, "Esqueci minha senha", "Entrar", "Criar conta" e "Entrar com Google". Hoje o app funciona só no modo local (ADR-0004 e ADR-0009): os dados ficam no aparelho e o Supabase ainda não está ligado. Um login que parecesse funcionar sem servidor enganaria a pessoa, que acharia que os dados têm cópia na nuvem.

## Decisão
1. A tela segue o design, mas `autenticacaoDisponivel = false` (`src/config/marca.ts`). Entrar, Criar conta, Esqueci minha senha e o botão do Google ficam **desativados**, com "(em breve)" no rótulo e um aviso explicando o porquê. Os campos de e-mail e senha não são editáveis e não guardam nada.
2. O caminho que funciona é **"Continuar sem conta"**, o modo local atual. Esse botão não existe no design; foi acrescentado e é o principal da tela.
3. Os estados "carregando" e "erro" do design só aparecem pela galeria e pelas capturas (`?estado=`, com `__DEV__` ou `EXPO_PUBLIC_CAPTURAS=1`). No build de produção não há como chegar a eles.
4. Botão do Google, conforme as diretrizes de marca do Google Identity: "G" padrão de 4 cores sem alteração, texto aprovado "Continuar com o Google" (tradução oficial de "Continue with Google"), estilo Light no tema claro e Neutral no escuro, cantos de 4 px e fonte média 14/20. O design usava "Entrar com Google", que não é um dos textos aprovados, e o "G" em degradê exportado do Figma (com `foreignObject`, que o react-native-svg não desenha). Quando a autenticação existir, usar o SDK oficial (Google Identity Services / Credential Manager).
5. Slogan e links ficam em configuração: `src/config/marca.json` (slogan "Seu treino, no seu ritmo.", escolhido pelo Otávio) e `linksJuridicos` (por padrão, a tela jurídica interna `/juridico?doc=termos|politica`, que é um rascunho).
6. A animação "login-sucesso" foi importada, mas não é usada: não existe login com sucesso.

## Alternativas consideradas
- **Login simulado, que aceita qualquer senha**: rejeitado, porque engana a pessoa.
- **Esconder os botões de conta**: rejeitado, porque foge do design aprovado. Os botões desativados com "em breve" mostram o que vem aí.

## Consequências
- Para ligar a autenticação: Supabase Auth com sessão segura (nada de token no localStorage), limite de tentativas e OK do Otávio para mudar o fluxo. Depois, trocar `autenticacaoDisponivel` e implementar os manipuladores.
- A Política de Privacidade precisa mencionar e-mail e conta Google antes de ligar o login.

## Adendo v0.4.3 – Sair
- **Sair** (Perfil) só tira o usuário do estado (`acoes.sair`): treinos, perfil e consentimentos ficam no aparelho; "Continuar sem conta" volta direto para o app, sem repetir os consentimentos.
- **Sair e apagar meus dados deste aparelho** reaproveita o Excluir tudo (`acoes.excluirTudo` + `apagarDadosDoAparelho`), com confirmação digitada ("EXCLUIR").
- Os dois chamam `encerrarSessaoRemota()` (`mobile/src/servicos/sessao.ts`). Hoje ela não faz nada, porque `autenticacaoDisponivel = false`. Quando o Supabase Auth for ligado, é ali que entra `supabase.auth.signOut()`; antes de apagar os dados locais, a sessão remota é encerrada. Nenhuma outra tela precisa mudar.

## Adendo v0.4.3 r2 – tela Sair e exclusão mais robusta
- "Sair" no Perfil abre a tela Sair (design r2 da RedBox), que tem "Sair" (principal), "Cancelar" e "Sair e apagar meus dados deste aparelho".
- Ordem da exclusão (`apagarDadosDoAparelho`): solta o banco, apaga os **arquivos primeiro** (com uma nova tentativa, já que apagar é idempotente) e só depois limpa a tela. Se falhar, o banco é reaberto, o estado continua na tela e a folha mostra "Não foi possível concluir. Tente de novo.". Tentar de novo repete o mesmo caminho. Antes, a tela era limpa antes de apagar os arquivos, e por isso a mensagem antiga ("seus dados não foram alterados") não era verdadeira.

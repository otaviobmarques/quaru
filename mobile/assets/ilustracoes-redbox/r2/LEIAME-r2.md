# Quaru 0.4.3 r2 — sobre a r1 aprovada pelo Henriquiano
A r1 (`../ilustracoes-r1/`) não foi alterada. O "Sair" continua como ação principal. Esta revisão segue a folha `revisao-v0.4.3-r1_folha-previa.png`.

## Obrigatórios
1. As 16 telas `tela-05c-sair-apagar_*` (celular e computador × claro e escuro × normal, confirmado, saindo e erro) têm o aviso, com o texto exato: "Se quiser guardar uma cópia, exporte antes em Perfil › Exportar."
2. As telas `tela-05c-*_erro` dizem "Não foi possível concluir. Tente de novo." Motivo: o app limpa os dados antes de apagar os arquivos (perfil.tsx:114).
   - O gerador **barra** "não foram alterados" nas telas 05c, tanto no texto renderizado quanto no HTML.
   - O erro do 05b ("Não foi possível sair…") continua como estava na r1 aprovada.

## Opcionais (todos feitos)
- No estado normal, o campo EXCLUIR fica vazio, com o placeholder "Digite aqui".
- "Apagar e sair" usa `aria-disabled="true"` em vez de `disabled`, também no estado "Apagando…". O gerador confere que não há `disabled` nesse botão.
- A ajuda diz "Maiúsculas ou minúsculas, tanto faz.", porque o perfil.tsx:114 compara com `confirma.trim().toUpperCase() !== 'EXCLUIR'`, sem diferenciar maiúsculas e minúsculas. Os espaços nas pontas também são ignorados.
- Halteres e barra-anilhas ficaram distintos em 24 px:
  - halteres: um halter curto na diagonal, com cabeças largas;
  - barra-anilhas: barra longa na horizontal, com duas anilhas de cada lado.
  - Os dois seguem o padrão: só contorno, traços 6 e 4, raio 4.

## Verificação
- 44 renders sem problemas (`verificacao-r2.json`).
- 99 pares de contraste AA.
- Jest de contraste do app: 84/84.
- Padrão dos ícones conferido nos 10 ícones.

## Arquivos
- `equipamentos/svg|png|prova-24-48`, `tela-sair/html|png|validacao`.
- Pranchas: `prancha-equipamentos-r2.png`, `prancha-prova-24-48px-r2.png`, `prancha-tela-sair-r2.png`.
- Gerador: `gerador/gerar_r2.py`.

## Pendências
- No app, o `Botao` desabilitado usa o `desabilitado` do componente. Cabe ao Rodrigo decidir se ele vira `accessibilityState={{disabled:true}}` mantendo o foco, que é o equivalente ao aria-disabled.
- No app, o placeholder "Digite aqui" e a frase sobre maiúsculas ainda precisam entrar no `Campo` do perfil.tsx.
- Tons de pele dos personagens fora da paleta: apenas anotado, como na r1.

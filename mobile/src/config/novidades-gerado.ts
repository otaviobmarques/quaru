// GERADO por scripts/gerar-novidades.mjs a partir do CHANGELOG.md. Não edite à mão.
export const VERSAO_NOVIDADES = "0.12.3";
export const NOVIDADES: string[] = [
  "### Corrigido",
  "- Aviso do fim do descanso com a tela bloqueada: o pedido \"Ativar avisos\" só aparecia para quem nunca tinha respondido a um pedido de notificação, então quase ninguém via. Agora fica no topo do treino até ativar, com o passo a passo para iPhone (instalar na Tela de Início) e para notificação bloqueada. Com o aviso ligado, há um botão Testar (o aviso chega em 10 s).",
  "- O aviso do servidor agora toca com som e vibração também com o app aberto (no iPhone em modo silencioso o bipe do app não toca; a notificação vibra).",
  "- O alerta do descanso toca em qualquer tela do app, não só na do treino. Fora dela, uma faixa no topo mostra o tempo e leva de volta ao treino. No Android, com o app em segundo plano, a notificação sai do próprio aparelho.",
  "### Adicionado",
  "- \"Treino concluído!\" na última série: com todos os quadradinhos verdes, o app toca o alerta de fim, não começa descanso e mostra \"🎉 Treino concluído!\" acima do Finalizar treino.",
  "- Excluir treino feito: \"Registrou errado? Excluir este treino\" no cartão de hoje (Início) e \"Excluir este treino\" no resumo. Ele sai do histórico, da sequência e da evolução.",
  "### Mudado",
  "- Finalizar sem nenhuma série marcada oferece descartar em vez de registrar um treino com 0 séries."
];

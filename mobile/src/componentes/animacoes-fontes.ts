/**
 * Animações Lottie do design v2.1 (assets/animacoes, geradas por código: só camadas de forma, sem imagens).
 * Regras de acessibilidade e repetição: assets/animacoes/manifesto.json (copiado do design).
 */
import type { AnimationObject } from 'lottie-react-native';

export type NomeAnimacao = 'tour-progresso' | 'carregando' | 'meta-de-agua' | 'treino-concluido' | 'login-sucesso';

/** Tipo: "sucesso" tem descrição para o leitor de tela; "decorativa" fica oculta (o texto ao lado informa). */
export const INFO_ANIMACAO: Record<NomeAnimacao, { tipo: 'sucesso' | 'decorativa'; descricao: string | null; repeticoesMax: number }> = {
  'tour-progresso': { tipo: 'decorativa', descricao: null, repeticoesMax: 1 },
  carregando: { tipo: 'decorativa', descricao: null, repeticoesMax: 10 },
  'meta-de-agua': { tipo: 'sucesso', descricao: 'Meta de água do dia concluída', repeticoesMax: 1 },
  'treino-concluido': { tipo: 'sucesso', descricao: 'Treino concluído. Parabéns!', repeticoesMax: 1 },
  'login-sucesso': { tipo: 'sucesso', descricao: 'Login feito com sucesso', repeticoesMax: 1 },
};

export const LOTTIE: Record<NomeAnimacao, { claro: AnimationObject; escuro: AnimationObject }> = {
  'tour-progresso': { claro: require('../../assets/animacoes/tour-progresso_claro.json'), escuro: require('../../assets/animacoes/tour-progresso_escuro.json') },
  carregando: { claro: require('../../assets/animacoes/carregando_claro.json'), escuro: require('../../assets/animacoes/carregando_escuro.json') },
  'meta-de-agua': { claro: require('../../assets/animacoes/meta-de-agua_claro.json'), escuro: require('../../assets/animacoes/meta-de-agua_escuro.json') },
  'treino-concluido': { claro: require('../../assets/animacoes/treino-concluido_claro.json'), escuro: require('../../assets/animacoes/treino-concluido_escuro.json') },
  'login-sucesso': { claro: require('../../assets/animacoes/login-sucesso_claro.json'), escuro: require('../../assets/animacoes/login-sucesso_escuro.json') },
};

/** Quadro final (PNG) de cada animação: fallback estático da web e de "reduzir movimento". */
export const QUADRO_FINAL: Record<NomeAnimacao, { claro: number; escuro: number }> = {
  'tour-progresso': { claro: require('../../assets/animacoes/tour-progresso_claro_quadro-final.png'), escuro: require('../../assets/animacoes/tour-progresso_escuro_quadro-final.png') },
  carregando: { claro: require('../../assets/animacoes/carregando_claro_quadro-final.png'), escuro: require('../../assets/animacoes/carregando_escuro_quadro-final.png') },
  'meta-de-agua': { claro: require('../../assets/animacoes/meta-de-agua_claro_quadro-final.png'), escuro: require('../../assets/animacoes/meta-de-agua_escuro_quadro-final.png') },
  'treino-concluido': { claro: require('../../assets/animacoes/treino-concluido_claro_quadro-final.png'), escuro: require('../../assets/animacoes/treino-concluido_escuro_quadro-final.png') },
  'login-sucesso': { claro: require('../../assets/animacoes/login-sucesso_claro_quadro-final.png'), escuro: require('../../assets/animacoes/login-sucesso_escuro_quadro-final.png') },
};

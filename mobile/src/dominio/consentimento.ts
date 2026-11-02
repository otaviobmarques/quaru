/**
 * Consentimentos LGPD: um registro por concessão, com versão e data/hora próprias;
 * revogar fecha o registro ativo (revogadoEm) e nunca apaga — o histórico fica (art. 8º, § 2º).
 */
export type Finalidade = 'dados_saude' | 'ia_visao_eua';

export interface RegistroConsentimento {
  id: string;
  finalidade: Finalidade;
  versao: string;
  aceitoEm: string;
  revogadoEm: string | null;
}

/** Versões dos textos (rascunho da Jéssica, CASO-20261101-01). Trocar por versão aprovada = pedir de novo. */
export const VERSOES: Record<Finalidade, string> = {
  dados_saude: 'saude-2026-11-v1-rascunho',
  ia_visao_eua: 'ia-eua-2026-11-v1-rascunho',
};

/** Registro ativo da finalidade, só se for da versão vigente do texto. */
export function ativo(lista: RegistroConsentimento[], f: Finalidade): RegistroConsentimento | null {
  return lista.find((r) => r.finalidade === f && !r.revogadoEm && r.versao === VERSOES[f]) ?? null;
}

export function conceder(lista: RegistroConsentimento[], f: Finalidade, agora: string, id: string): RegistroConsentimento[] {
  if (ativo(lista, f)) return lista; // já concedido nesta versão: não duplica
  // registro de versão antiga ainda aberto é encerrado ao aceitar a nova
  const fechada = lista.map((r) => (r.finalidade === f && !r.revogadoEm ? { ...r, revogadoEm: agora } : r));
  return [...fechada, { id, finalidade: f, versao: VERSOES[f], aceitoEm: agora, revogadoEm: null }];
}

export function revogar(lista: RegistroConsentimento[], f: Finalidade, agora: string): RegistroConsentimento[] {
  return lista.map((r) => (r.finalidade === f && !r.revogadoEm ? { ...r, revogadoEm: agora } : r));
}

export const historico = (lista: RegistroConsentimento[], f: Finalidade) =>
  lista.filter((r) => r.finalidade === f).toSorted((a, b) => (a.aceitoEm < b.aceitoEm ? -1 : 1));

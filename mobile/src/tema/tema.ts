import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { temas } from './tokens';

export type Cores = { [K in keyof typeof temas.claro]: string };

/**
 * v0.4.4 (tokens v3.2): o fundo das telas é rosa. Dentro de <Tela> (SobreFundo = true), useCores() devolve a paleta
 * "sobre o fundo": texto, texto-suave, primaria, primaria-texto e foco viram os tokens "-sobre-fundo", e as cores
 * proibidas sobre o rosa (erro, sucesso, alerta, secundaria) viram texto-sobre-fundo. Esses tons também passam AA
 * sobre a superfície, então blocos sem <Bloco> continuam legíveis. Blocos (Cartao, Aviso, Selo, campo, ficha…) usam
 * a paleta normal via <Bloco>/useCoresBase().
 */
const SobreFundo = createContext(false);
export const ProvedorSobreFundo = ({ children }: { children: ReactNode }) => createElement(SobreFundo.Provider, { value: true }, children);
/** Conteúdo dentro de um bloco (superfície): volta à paleta normal. */
export const Bloco = ({ children }: { children: ReactNode }) => createElement(SobreFundo.Provider, { value: false }, children);
export const useSobreFundo = () => useContext(SobreFundo);

export function paletaSobreFundo(t: Cores, escuro: boolean): Cores {
  return {
    ...t,
    texto: t['texto-sobre-fundo'], 'texto-suave': t['texto-suave-sobre-fundo'],
    primaria: t['primaria-sobre-fundo'], 'primaria-texto': t['primaria-texto-sobre-fundo'],
    'sobre-primaria': escuro ? t.tinta : '#FFFFFF',
    secundaria: t['texto-sobre-fundo'], 'sobre-secundaria': escuro ? t.tinta : '#FFFFFF',
    erro: t['texto-sobre-fundo'], sucesso: t['texto-sobre-fundo'], alerta: t['texto-sobre-fundo'],
    foco: t['foco-sobre-fundo'], 'borda-campo': t.tinta, divisoria: t.tinta,
  };
}
const SOBRE = { claro: paletaSobreFundo(temas.claro, false), escuro: paletaSobreFundo(temas.escuro, true) };

/** Paleta normal (blocos/superfícies). */
export function useCoresBase(): Cores {
  return useColorScheme() === 'dark' ? temas.escuro : temas.claro;
}
/** Paleta do lugar onde o componente está: sobre o rosa (dentro de <Tela>) ou dentro de bloco. */
export function useCores(): Cores {
  const escuro = useColorScheme() === 'dark';
  const sobre = useContext(SobreFundo);
  return sobre ? SOBRE[escuro ? 'escuro' : 'claro'] : escuro ? temas.escuro : temas.claro;
}
export { espaco, raio, tipografia, toque } from './tokens';

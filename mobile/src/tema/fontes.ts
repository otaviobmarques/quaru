import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

/** Fonte de títulos da identidade v3.2 (Bricolage Grotesque 800, SIL OFL 1.1; instância estática, só latim). */
export const FONTE_TITULO = 'BricolageGrotesque-ExtraBold';
export const ARQUIVOS_FONTES = { [FONTE_TITULO]: require('../../assets/fontes/BricolageGrotesque-ExtraBold.ttf') };

/**
 * Estilo de título v3.2. Enquanto a fonte carrega (ou se falhar), usa a fonte do sistema em 800.
 * Na web a família leva reservas sem serifa, para nunca cair numa fonte serifada.
 */
export function useFonteTitulo(): { fontFamily?: string; fontWeight?: '800' } {
  const [ok] = useFonts(ARQUIVOS_FONTES);
  if (!ok) return { fontWeight: '800', ...(Platform.OS === 'web' ? { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' } : {}) };
  return { fontFamily: Platform.OS === 'web' ? `${FONTE_TITULO}, system-ui, sans-serif` : FONTE_TITULO };
}

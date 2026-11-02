import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Aviso, Segmentado, Tela, Texto } from '@/componentes/ui';
import { marca } from '@/config/marca';
import { POLITICA, TERMOS } from '@/dominio/juridico-gerado';

type Doc = 'termos' | 'politica';

/** Termos de uso e Política de privacidade – RASCUNHO da Jéssica, aguardando revisão de advogado com OAB. */
export default function Juridico() {
  const { doc } = useLocalSearchParams<{ doc?: Doc }>();
  const atual: Doc = doc === 'politica' ? 'politica' : 'termos';
  const texto = (atual === 'termos' ? TERMOS : POLITICA).replaceAll('{NOME_DO_APP}', marca.nome);
  return (
    <Tela titulo="Termos e privacidade" voltar={() => router.back()}>
      <View style={{ borderWidth: 2, borderColor: '#A75A07', borderStyle: 'dashed', borderRadius: 12, padding: 12 }}>
        <Texto v="titulo-3" cor="#A75A07">RASCUNHO</Texto>
        <Texto v="rotulo" suave>Documento em elaboração, ainda não revisado por advogado responsável e não publicado. Não vale como versão final.</Texto>
      </View>
      <Segmentado<Doc> valor={atual} onChange={(d) => router.setParams({ doc: d })} opcoes={[{ valor: 'termos', rotulo: 'Termos de uso' }, { valor: 'politica', rotulo: 'Privacidade' }]} />
      {atual === 'politica' && <Aviso tom="alerta" titulo="Nota técnica" texto="Desde a versão 0.2.0 o modo local não pede e-mail (ADR-0009); a linha sobre e-mail da seção de dados deve ser atualizada no próximo rascunho." />}
      <Markdown texto={texto} />
    </Tela>
  );
}

/** Renderização simples de Markdown (títulos, listas, citações, tabelas como texto, **negrito**). */
function Markdown({ texto }: { texto: string }) {
  const negrito = (l: string) => l.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith('**') ? <Texto key={i} v="corpo-forte">{p.slice(2, -2)}</Texto> : p));
  return (
    <View style={{ gap: 8 }}>
      {texto.split('\n').map((l, i) => {
        if (!l.trim() || /^\|?\s*-{3}/.test(l) || l.trim() === '---') return null;
        if (l.startsWith('# ')) return <Texto key={i} v="titulo-2">{l.slice(2)}</Texto>;
        if (l.startsWith('## ')) return <Texto key={i} v="titulo-3" style={{ marginTop: 8 }}>{l.slice(3)}</Texto>;
        if (l.startsWith('### ')) return <Texto key={i} v="corpo-forte">{l.slice(4)}</Texto>;
        if (l.startsWith('|')) return <Texto key={i} v="rotulo">{negrito(l.split('|').map((c) => c.trim()).filter(Boolean).join(' · '))}</Texto>;
        if (/^\s*[-*] /.test(l)) return <Texto key={i}>• {negrito(l.replace(/^\s*[-*] /, ''))}</Texto>;
        if (l.startsWith('>')) return <Texto key={i} suave>{negrito(l.replace(/^>\s?/, ''))}</Texto>;
        return <Texto key={i}>{negrito(l)}</Texto>;
      })}
    </View>
  );
}

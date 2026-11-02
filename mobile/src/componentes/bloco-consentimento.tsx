import { View } from 'react-native';
import { Cartao, Chave, Selo, Texto } from '@/componentes/ui';
import type { TextoConsentimento } from '@/dominio/textos-consentimento';
import type { RegistroConsentimento } from '@/dominio/consentimento';
import { dataHora } from '@/dominio/consultas';

/** Bloco destacado de um consentimento: título em negrito, finalidade e consequências em corpo (não em letra miúda). */
export function BlocoConsentimento({ texto, valor, onChange, testID, historico }: { texto: TextoConsentimento; valor: boolean; onChange: (v: boolean) => void; testID?: string; historico?: RegistroConsentimento[] }) {
  return (
    <Cartao destaque={valor}>
      <Selo texto={texto.selo} tom={texto.selo.startsWith('Opcional') ? 'secundaria' : 'primaria'} />
      <Texto v="titulo-3">{texto.titulo}</Texto>
      {texto.blocos.map(([r, t]) => <Texto key={r}><Texto v="corpo-forte">{r}: </Texto>{t}</Texto>)}
      <Chave rotulo={texto.chave} valor={valor} onChange={onChange} testID={testID}><Texto v="corpo-forte">{texto.chave}</Texto></Chave>
      {historico && historico.length > 0 && (
        <View style={{ gap: 2 }}>
          <Texto v="rotulo" suave>Histórico neste aparelho:</Texto>
          {historico.map((h) => <Texto key={h.id} v="rotulo" suave>• Autorizado em {dataHora(h.aceitoEm)} (texto {h.versao}){h.revogadoEm ? ` · retirado em ${dataHora(h.revogadoEm)}` : ' · ativo'}</Texto>)}
        </View>
      )}
    </Cartao>
  );
}

import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Ilustracao } from '@/componentes/ilustracoes';
import { Aviso, Botao, Cartao, EstadoVazio, Selo, SeloEnergia, Tela, Texto } from '@/componentes/ui';
import { ImagemOuEspaco } from '@/componentes/imagem-ou-espaco';
import { FOTOS_DIETAS } from '@/dominio/fotos-dietas';
import { raio, useCores } from '@/tema/tema';
import { formatarMl, metaPadraoMl, totalDoDia } from '@/dominio/agua';
import { AVISO_DIETAS, DIETAS } from '@/dominio/dietas';
import { dietaDaPreferencia } from '@/dominio/tour';
import { useEstado } from '@/estado/armazem';

/**
 * Tela 11 – Alimentação. v0.4.1: água do dia e guia informativo de dietas. O diário alimentar virá do pacote
 * @domma/nutricao; quando integrado, o botão de foto chama proximoPassoFoto() (no 1º uso abre /consentimento-ia).
 */
export default function Alimentacao() {
  const { estado } = useEstado();
  const c = useCores();
  const pref = dietaDaPreferencia(estado.perfil?.prefAlimentar);
  const peso = estado.pesos.filter((p) => !p.excluidoEm).toSorted((a, b) => (a.medidoEm < b.medidoEm ? -1 : 1)).at(-1);
  const meta = estado.perfil?.metaAguaMl ?? metaPadraoMl(peso?.pesoKg);
  const hoje = totalDoDia(estado.agua ?? [], new Date());
  return (
    <Tela logo titulo="Alimentação">
      <Cartao onPress={() => router.push('/agua')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 72 }}><Ilustracao nome="agua" descricao="Ilustração de um copo com água" largura={72} /></View>
          <View style={{ flex: 1 }}><Texto v="legenda" suave>ÁGUA HOJE</Texto><Texto v="titulo-3">{formatarMl(hoje)}{meta ? ` de ${formatarMl(meta)}` : ''}</Texto><Texto v="rotulo" suave>Toque para registrar ›</Texto></View>
        </View>
      </Cartao>
      <Cartao onPress={() => router.push('/refeicoes')}>
        <Texto v="titulo-3">Ideias de refeições saudáveis</Texto>
        <Texto v="rotulo" suave>Café da manhã, almoço, lanche e jantar com comida do dia a dia. Filtre por vegetariana, vegana, low-carb e mais.</Texto>
      </Cartao>
      <Texto v="titulo-3">Guia de dietas</Texto>
      <Aviso tom="alerta" titulo="Conteúdo informativo" texto={AVISO_DIETAS} />
      {/* v0.4.3: cartão de cada dieta com foto (80 px, cantos médios do DS) e o selo "Restritiva". */}
      {DIETAS.map((d) => (
        <Pressable key={d.id} testID={`cartao-dieta-${d.id}`} accessibilityRole="button"
          accessibilityLabel={`${d.nome}${d.alerta ? ', restritiva, leia os alertas' : ''}${d.id === pref ? ', sua preferência' : ''}`}
          onPress={() => router.push(`/dieta/${d.id}`)}
          style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, minHeight: 104, borderRadius: raio.grande, borderWidth: d.id === pref ? 2 : 1, borderColor: d.id === pref ? c.primaria : c.borda, backgroundColor: pressed ? c['superficie-2'] : c.superficie })}>
          <ImagemOuEspaco fonte={FOTOS_DIETAS[d.id]?.mini} alt={FOTOS_DIETAS[d.id]?.alt} largura={80} proporcao={1} testID={`foto-dieta-${d.id}`} />
          <View style={{ flex: 1, gap: 4 }}>
            <Texto v="corpo-forte">{d.nome}</Texto>
            <Texto v="rotulo" suave numberOfLines={2}>{d.oQueE.split('.')[0]}</Texto>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {d.alerta && <SeloEnergia texto="Restritiva · leia os alertas" />}
              {d.id === pref && <Selo texto="Sua preferência" tom="primaria" />}
            </View>
          </View>
          <Texto v="titulo-3" suave>›</Texto>
        </Pressable>
      ))}
      <EstadoVazio titulo="Diário alimentar em breve" texto="Em breve você poderá registrar refeições por busca ou por foto. Por enquanto, nada de refeição é gravado."
        acao={<Botao v="secundario" titulo="Registrar peso" onPress={() => router.push('/peso')} />} />
    </Tela>
  );
}

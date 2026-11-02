import { imcSeAplica } from '@/dominio/tour';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, EstadoVazio, GraficoBarras, ItemLista, Tela, Texto } from '@/componentes/ui';
import { dataCurta } from '@/dominio/consultas';
import { formatarKg, lerNumero } from '@/dominio/metricas';
import { acoes, temSaude, useEstado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';
import { AVISO_IMC, calcularImc, faixaImc, formatarImc, ROTULO_FAIXA } from '@/dominio/imc';

/** Tela 10 – Peso corporal (RF07). */
export default function Peso() {
  const { estado, aplicar } = useEstado();
  const [txt, setTxt] = useState('');
  const [erro, setErro] = useState<string>();
  const lista = estado.pesos.filter((p) => !p.excluidoEm).toSorted((a, b) => (a.medidoEm < b.medidoEm ? -1 : 1));
  const alturaCm = estado.perfil?.alturaCm ?? null;
  const imcAtual = calcularImc(lista.at(-1)?.pesoKg, alturaCm);
  const registrar = () => {
    const n = lerNumero(txt);
    if (n == null || n < 20 || n > 400) return setErro('Digite um peso entre 20 e 400 kg, como 78,5');
    if (!temSaude(estado)) return setErro('Autorize dados de saúde em Perfil → Consentimentos.');
    const agora = new Date().toISOString();
    aplicar((e) => acoes.registrarPeso(e, { id: novoId(), pesoKg: n, medidoEm: agora, atualizadoEm: agora }));
    setTxt('');
  };
  return (
    <Tela titulo="Peso corporal" voltar={router.back}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <Campo expandir rotulo="Peso de hoje (kg)" value={txt} onChangeText={(t) => { setTxt(t); setErro(undefined); }} keyboardType="decimal-pad" placeholder="78,5" erro={erro} />
        <View style={{ width: 130, marginBottom: erro ? 20 : 0 }}><Botao v="secundario" titulo="Registrar" onPress={registrar} /></View>
      </View>
      {lista.length === 0 ? <EstadoVazio titulo="Sem registros" texto="Registre seu peso para acompanhar a evolução." /> : (
        <>
          <Cartao><GraficoBarras unidade="kg" pontos={lista.slice(-10).map((p) => ({ rotulo: dataCurta(p.medidoEm), valor: p.pesoKg }))} /></Cartao>
          {alturaCm ? (
            <Cartao>
              <Texto v="legenda" suave>IMC (ALTURA {alturaCm} CM)</Texto>
              {imcAtual != null && <Texto v="rotulo" suave>Último: {formatarImc(imcAtual)} {imcSeAplica(estado.perfil?.faixaIdade) ? ` · faixa ${ROTULO_FAIXA[faixaImc(imcAtual)]}` : ' · faixa adulta não se aplica a menores de 18'}</Texto>}
              <GraficoBarras unidade="de IMC" pontos={lista.slice(-10).map((p) => ({ rotulo: dataCurta(p.medidoEm), valor: calcularImc(p.pesoKg, alturaCm) ?? 0 }))} />
              <Aviso tom="secundaria" titulo="Sobre o IMC" texto={AVISO_IMC} />
            </Cartao>
          ) : <Texto v="rotulo" suave>Informe a altura no Perfil para ver a evolução do IMC.</Texto>}
          <Cartao>{lista.toReversed().map((p, i) => <ItemLista key={p.id} ultimo={i === lista.length - 1} titulo={`${formatarKg(p.pesoKg)} kg`} sub={dataCurta(p.medidoEm) + (alturaCm ? ` · IMC ${formatarImc(calcularImc(p.pesoKg, alturaCm) ?? 0)}` : '') + (p.exemplo ? ' · EXEMPLO' : '')} />)}</Cartao>
        </>
      )}
    </Tela>
  );
}

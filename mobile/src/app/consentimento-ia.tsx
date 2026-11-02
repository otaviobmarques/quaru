import { router } from 'expo-router';
import { useState } from 'react';

import { BlocoConsentimento } from '@/componentes/bloco-consentimento';
import { Botao, Tela, Texto } from '@/componentes/ui';
import { IA_EUA } from '@/dominio/textos-consentimento';
import { acoes, temIa, useEstado } from '@/estado/armazem';

/**
 * Consentimento da IA nos EUA, pedido no PRIMEIRO USO da foto de refeição (consentimento contextual).
 * Ainda sem ponto de entrada: será aberto pelo diário alimentar quando o @domma/nutricao for integrado.
 */
export default function ConsentimentoIa() {
  const { estado, aplicar } = useEstado();
  const [valor, setValor] = useState(temIa(estado));
  const confirmar = () => { aplicar((e) => acoes.definirConsentimento(e, 'ia_visao_eua', valor)); router.back(); };
  return (
    <Tela titulo="Foto da refeição" voltar={() => router.back()}
      rodape={<Botao grande titulo={valor ? 'Autorizar e continuar' : 'Continuar sem a IA (busca manual)'} onPress={confirmar} testID="confirmar-ia" />}>
      <Texto>Antes de analisar sua primeira foto, precisamos da sua autorização específica. Você pode usar o diário sem ela.</Texto>
      <BlocoConsentimento texto={IA_EUA} valor={valor} onChange={setValor} testID="chave-ia" />
      <Botao v="texto" titulo="Ler a Política de Privacidade" onPress={() => router.push('/juridico?doc=politica')} />
    </Tela>
  );
}

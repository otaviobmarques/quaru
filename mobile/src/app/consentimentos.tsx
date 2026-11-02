import { router } from 'expo-router';
import { useState } from 'react';

import { BlocoConsentimento } from '@/componentes/bloco-consentimento';
import { Aviso, Botao, Tela, Texto } from '@/componentes/ui';
import { historico } from '@/dominio/consentimento';
import { INTRO, IA_EUA, SAUDE } from '@/dominio/textos-consentimento';
import { acoes, precisaApresentacao, temIa, temSaude, useEstado } from '@/estado/armazem';

/**
 * Tela 2 – Consentimentos (textos da Jéssica, rascunho). Só o de saúde aparece aqui; o de IA nos EUA é pedido
 * no primeiro uso da foto de refeição (tela /consentimento-ia). Se já houver autorização de IA, ela aparece aqui
 * para poder ser retirada.
 */
export default function Consentimentos() {
  const { estado, aplicar } = useEstado();
  const primeiraVez = !estado.consentimentosVistosEm;
  const saude = temSaude(estado);
  const [revogouSaude, setRevogouSaude] = useState(false);
  const mostrarIa = temIa(estado) || historico(estado.consentimentos, 'ia_visao_eua').length > 0;
  const mudarSaude = (v: boolean) => { aplicar((e) => acoes.definirConsentimento(e, 'dados_saude', v)); setRevogouSaude(!v && !primeiraVez); };
  const continuar = () => { aplicar(acoes.concluirConsentimentos); router.replace(precisaApresentacao(estado) ? '/boas-vindas' : '/inicio'); };
  return (
    <Tela titulo={INTRO.titulo} voltar={primeiraVez ? undefined : () => router.back()}
      rodape={primeiraVez ? <Botao grande titulo={saude ? 'Continuar' : 'Continuar sem autorizar'} onPress={continuar} testID="salvar-consentimentos" /> : undefined}>
      <Texto>{INTRO.texto}</Texto>
      <Botao v="texto" titulo={INTRO.link} onPress={() => router.push('/juridico?doc=politica')} />
      <BlocoConsentimento texto={SAUDE} valor={saude} onChange={mudarSaude} testID="chave-saude" historico={primeiraVez ? undefined : historico(estado.consentimentos, 'dados_saude')} />
      {revogouSaude && (
        <Aviso tom="alerta" titulo="Autorização retirada" texto="Novos treinos e pesos não serão gravados. Os registros que já existem continuam neste aparelho até você decidir.">
          <Botao v="secundario" titulo="Exportar meus dados" onPress={() => router.push('/exportar')} />
          <Botao v="destrutivo" titulo="Apagar registros" onPress={() => router.push('/sair?apagar=1')} />
        </Aviso>
      )}
      {mostrarIa && <BlocoConsentimento texto={IA_EUA} valor={temIa(estado)} onChange={(v) => aplicar((e) => acoes.definirConsentimento(e, 'ia_visao_eua', v))} historico={historico(estado.consentimentos, 'ia_visao_eua')} />}
      {!mostrarIa && <Texto v="rotulo" suave>A análise de foto de refeição por IA, quando existir, pedirá sua autorização separadamente no primeiro uso.</Texto>}
    </Tela>
  );
}

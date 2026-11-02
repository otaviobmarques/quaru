import { View } from 'react-native';

import { CamposCidade, CamposLembretes, EscolhaMultipla, EscolhaUnica } from '@/componentes/perguntas-tour';
import { PADRAO_TREINO, SeletorAreas, SeletorObjetivo } from '@/componentes/seletor-objetivo';
import { Aviso, Campo, Texto } from '@/componentes/ui';
import type { IdPassoTour } from '@/dominio/apresentacao';
import { EQUIPAMENTOS_LISTA, equipamentosPadrao } from '@/dominio/equipamentos';
import { EscolhaEquipamentos } from '@/componentes/icone-equipamento';
import { lerNumero } from '@/dominio/metricas';
import type { PerfilTreino } from '@/dominio/objetivo';
import {
  AVISO_MENOR, AVISO_RESTRICAO, EXPERIENCIAS, FAIXAS_IDADE, LOCAIS, nivelDaExperiencia, PREFERENCIAS, RESTRICOES, TEMPOS, type DadosTour,
} from '@/dominio/tour';
import { acoes, type Estado } from '@/estado/armazem';
import { novoId } from '@/servicos/id';

/** Respostas em edição (tour e Meus dados). Texto de altura/peso fica como string até salvar. */
export interface Rascunho extends DadosTour { nome: string; treino: PerfilTreino; alturaTxt: string; pesoTxt: string }

export function rascunhoDe(e: Estado): Rascunho {
  const p = e.perfil;
  return {
    nome: p?.nome ?? '', treino: p?.treino ?? PADRAO_TREINO, alturaTxt: p?.alturaCm ? String(p.alturaCm) : '', pesoTxt: '',
    faixaIdade: p?.faixaIdade ?? null, experiencia: p?.experiencia ?? null, tempoTreinoMin: p?.tempoTreinoMin ?? null, local: p?.local ?? null,
    restricoes: p?.restricoes ?? [], prefAlimentar: p?.prefAlimentar ?? null, lembretes: p?.lembretes ?? { treinoHora: null, agua: false },
    cidade: p?.cidade ?? '', bairro: p?.bairro ?? '', equipamentos: p?.equipamentos ?? null,
  };
}

/** Grava a resposta de um passo. Lança 'valor_invalido' ou 'sem_consentimento' (a tela mostra a mensagem). */
export function salvarPasso(e: Estado, id: IdPassoTour, r: Rascunho): Estado {
  switch (id) {
    case 'nome': return acoes.definirNome(e, r.nome);
    case 'idade': return acoes.atualizarPerfil(e, { faixaIdade: r.faixaIdade });
    case 'objetivo': return acoes.definirObjetivo(e, { ...r.treino, areas: e.perfil?.treino?.areas ?? r.treino.areas ?? [] });
    case 'experiencia': {
      const x = acoes.atualizarPerfil(e, { experiencia: r.experiencia });
      // Sem objetivo escolhido ainda, a experiência define o nível sugerido.
      return r.experiencia && !x.perfil?.treino ? acoes.definirObjetivo(x, { ...PADRAO_TREINO, nivel: nivelDaExperiencia(r.experiencia) }) : x;
    }
    case 'tempo-local': return acoes.atualizarPerfil(e, { tempoTreinoMin: r.tempoTreinoMin, local: r.local });
    case 'equipamentos': return acoes.atualizarPerfil(e, { equipamentos: r.equipamentos ?? null } /* null = padrão do local */);
    case 'areas': return acoes.definirObjetivo(e, { ...(e.perfil?.treino ?? r.treino), areas: r.treino.areas ?? [] });
    case 'restricoes': return acoes.atualizarPerfil(e, { restricoes: r.restricoes ?? [] });
    case 'medidas': {
      let x = e;
      if (r.alturaTxt.trim()) { const cm = lerNumero(r.alturaTxt); if (cm == null) throw new Error('valor_invalido'); x = acoes.definirAltura(x, Math.round(cm)); }
      if (r.pesoTxt.trim()) {
        const kg = lerNumero(r.pesoTxt); if (kg == null) throw new Error('valor_invalido');
        const agora = new Date().toISOString();
        x = acoes.registrarPeso(x, { id: novoId(), pesoKg: kg, medidoEm: agora, atualizadoEm: agora });
      }
      return x;
    }
    case 'alimentacao': return acoes.atualizarPerfil(e, { prefAlimentar: r.prefAlimentar });
    case 'agua': return acoes.atualizarPerfil(e, { lembretes: r.lembretes });
    case 'cidade': return acoes.atualizarPerfil(e, { cidade: r.cidade, bairro: r.bairro });
    default: return e;
  }
}

/** Campos de uma pergunta do tour. `saude` = consentimento de dados de saúde ativo. */
export function PerguntaTour({ id, r, set, saude }: { id: IdPassoTour; r: Rascunho; set: (r: Rascunho) => void; saude: boolean }) {
  const semSaude = <Aviso titulo="Dados de saúde desativados" texto="Para guardar esta resposta, ative dados de saúde em Perfil → Consentimentos. Você pode pular agora." />;
  switch (id) {
    case 'nome': return <Campo rotulo="Nome ou apelido" value={r.nome} onChangeText={(nome) => set({ ...r, nome })} maxLength={40} autoComplete="off" testID="campo-nome-tour" />;
    case 'idade': return <View style={{ gap: 12 }}>
      <EscolhaUnica rotulo="Faixa de idade" opcoes={FAIXAS_IDADE} valor={r.faixaIdade} onChange={(faixaIdade) => set({ ...r, faixaIdade })} />
      {r.faixaIdade === 'menos-18' && <Aviso tom="alerta" titulo="Menores de 18" texto={AVISO_MENOR} />}
    </View>;
    case 'objetivo': return <SeletorObjetivo valor={r.treino} onChange={(treino) => set({ ...r, treino })} />;
    case 'experiencia': return <EscolhaUnica rotulo="Experiência com treino" opcoes={EXPERIENCIAS} valor={r.experiencia} onChange={(experiencia) => set({ ...r, experiencia })} />;
    case 'tempo-local': return <View style={{ gap: 16 }}>
      <EscolhaUnica rotulo="Tempo por treino" opcoes={TEMPOS} valor={r.tempoTreinoMin} onChange={(tempoTreinoMin) => set({ ...r, tempoTreinoMin })} />
      <EscolhaUnica rotulo="Onde você treina" opcoes={LOCAIS} valor={r.local} onChange={(local) => set({ ...r, local })} />
    </View>;
    case 'equipamentos': return <View style={{ gap: 8 }}>
      <Texto suave>{r.local === 'academia' ? 'Na academia, marcamos tudo. Desmarque o que não tiver.' : 'Marcamos só o peso do corpo. Marque o que você tiver.'}</Texto>
      <EscolhaEquipamentos rotulo="Equipamentos que você tem" opcoes={EQUIPAMENTOS_LISTA} valor={r.equipamentos ?? equipamentosPadrao(r.local)} onChange={(equipamentos) => set({ ...r, equipamentos })} />
    </View>;
    case 'areas': return <SeletorAreas valor={r.treino.areas ?? []} onChange={(areas) => set({ ...r, treino: { ...r.treino, areas } })} />;
    case 'restricoes': return <View style={{ gap: 12 }}>
      <Aviso tom="alerta" titulo="Procure um médico" texto={AVISO_RESTRICAO} />
      {saude ? <EscolhaMultipla rotulo="Restrições ou lesões" opcoes={RESTRICOES} valor={r.restricoes ?? []} onChange={(restricoes) => set({ ...r, restricoes })} /> : semSaude}
    </View>;
    case 'medidas': return saude ? <View style={{ gap: 8 }}>
      <Campo rotulo="Altura em cm (100 a 250)" value={r.alturaTxt} onChangeText={(alturaTxt) => set({ ...r, alturaTxt })} keyboardType="numeric" maxLength={3} testID="campo-altura-tour" />
      <Campo rotulo="Peso em kg" value={r.pesoTxt} onChangeText={(pesoTxt) => set({ ...r, pesoTxt })} keyboardType="decimal-pad" maxLength={6} testID="campo-peso-tour" />
    </View> : semSaude;
    case 'alimentacao': return <EscolhaUnica rotulo="Preferência alimentar" opcoes={PREFERENCIAS} valor={r.prefAlimentar} onChange={(prefAlimentar) => set({ ...r, prefAlimentar })} />;
    case 'agua': return <CamposLembretes valor={r.lembretes ?? { treinoHora: null, agua: false }} onChange={(lembretes) => set({ ...r, lembretes })} />;
    case 'cidade': return <CamposCidade cidade={r.cidade ?? ''} bairro={r.bairro ?? ''} onChange={(cidade, bairro) => set({ ...r, cidade, bairro })} />;
    default: return <Texto> </Texto>;
  }
}

export const MENSAGEM_ERRO: Record<string, string> = {
  valor_invalido: 'Confira o valor: altura entre 100 e 250 cm, peso entre 20 e 400 kg, horário como 07:30.',
  sem_consentimento: 'Ative dados de saúde em Perfil → Consentimentos para guardar esta resposta.',
};

import { router } from 'expo-router';
import { strToU8, zipSync } from 'fflate';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import * as Sharing from 'expo-sharing';

import { Botao, Cartao, ItemLista, Tela, Texto } from '@/componentes/ui';
import { arquivosExportacao, dadosParaExportar, fotoPerfilBytes } from '@/dominio/exportacao';
import { acoes, useEstado } from '@/estado/armazem';

/** Tela 12c – Exportar (.zip gerado no aparelho, regra L3). */
export default function Exportar() {
  const { estado, aplicar } = useEstado();
  const [gerando, setGerando] = useState(false);
  const gerar = async () => { setGerando(true); try { await gerarZip(); aplicar(acoes.registrarExportacao); } finally { setGerando(false); } };
  const gerarZip = async () => {
    const arqs = arquivosExportacao(dadosParaExportar(estado));
    const entradas: Record<string, Uint8Array> = Object.fromEntries(Object.entries(arqs).map(([n, t]) => [n, strToU8(t)]));
    const foto = fotoPerfilBytes(estado);
    if (foto) entradas['foto-perfil.jpg'] = foto;
    const zip = zipSync(entradas);
    const nome = `meus-dados-${new Date().toISOString().slice(0, 10)}.zip`;
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }));
      const a = document.createElement('a'); a.href = url; a.download = nome; a.click(); URL.revokeObjectURL(url);
      return;
    }
    const f = new File(Paths.cache, nome);
    f.write(zip);
    await Sharing.shareAsync(f.uri, { mimeType: 'application/zip' });
  };
  return (
    <Tela titulo="Exportar meus dados" voltar={router.back} rodape={<Botao grande titulo="Gerar e compartilhar .zip" onPress={gerar} carregando={gerando} />}>
      <Texto suave>O arquivo é gerado neste aparelho e compartilhado pela folha do sistema.</Texto>
      <Cartao>
        <ItemLista titulo="dados.json" sub="Tudo, versão de formato 1, datas com fuso" />
        <ItemLista titulo="treinos.csv" sub="Uma linha por série · separador ; · vírgula decimal" />
        <ItemLista titulo="peso_corporal.csv" sub="Data e peso em kg" />
        <ItemLista titulo="agua.csv" sub="Data e mililitros de água" />
        <ItemLista titulo="diario_alimentar.csv" sub="Como foi cada refeição, por dia" />
        <ItemLista titulo="foto-perfil.jpg" sub="Só se você escolheu uma foto" />
        <ItemLista ultimo titulo="LEIA-ME.txt" sub="Explica as colunas" />
      </Cartao>
      {estado.ultimaExportacaoEm && <Texto v="legenda" suave>Última exportação: {new Date(estado.ultimaExportacaoEm).toLocaleDateString('pt-BR')}.</Texto>}
    </Tela>
  );
}

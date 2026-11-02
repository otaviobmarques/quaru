/** Blocos fixos da tela "Sobre e licenças" (L3). Mesmo conteúdo de THIRD_PARTY_NOTICES.md. */
export const MIT_MUSCLEMAP = `MIT License

Copyright (c) 2026 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export const OUTRAS = [
  { nome: 'MuscleMap', licenca: 'MIT', obs: 'Previsto para o mapa muscular; ainda não incluído no código desta versão.' },
  { nome: 'Fonte Inter', licenca: 'SIL Open Font License 1.1', obs: 'Prevista no design; esta versão usa a fonte do sistema.' },
  { nome: 'Fonte Bricolage Grotesque', licenca: 'SIL Open Font License 1.1', obs: 'Títulos do login (identidade v3.2). Instância 800 só com caracteres latinos; texto da licença em mobile/assets/fontes/.' },
  { nome: 'Ícones Lucide', licenca: 'ISC', obs: 'Previstos no design; esta versão usa símbolos de texto.' },
  { nome: 'Imagens dos exercícios: Free Exercise DB (github.com/yuhonas/free-exercise-db)', licenca: 'Unlicense (domínio público)', obs: '22 fotos (posição inicial), reduzidas para 480 px. Conjunto derivado de wrkout/exercises.json (Ollie Jennings). Ver ADR-0012.' },
  { nome: 'expo-sqlite (SQLCipher Community Edition)', licenca: 'MIT; SQLCipher: BSD-3-Clause', obs: 'Banco local cifrado (ADR-0010).' },
  { nome: 'expo-secure-store e expo-crypto', licenca: 'MIT', obs: 'Chave do banco no Keychain/Keystore.' },
  { nome: 'react-native-svg', licenca: 'MIT', obs: 'Desenho das ilustrações, avatares, mapa muscular e logotipo (v0.4.1). As ilustrações são próprias da Domma.' },
  { nome: 'lottie-react-native', licenca: 'Apache-2.0', obs: 'Animações do Android/iOS (v0.4.2). Na web aparece o quadro final estático. As animações são próprias (design v2.1).' },
  { nome: 'expo-image-picker e expo-image-manipulator', licenca: 'MIT', obs: 'Foto de perfil: escolha, recorte e compressão no aparelho (v0.4.1).' },
  { nome: 'fflate', licenca: 'MIT', obs: 'Geração do .zip de exportação.' },
  { nome: 'React Native, Expo e dependências', licenca: 'MIT (maioria)', obs: 'Lista completa a gerar automaticamente no build [a fazer].' },
];

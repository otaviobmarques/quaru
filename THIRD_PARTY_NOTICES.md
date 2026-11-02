# Avisos de terceiros
Mesmo conteúdo da tela "Sobre e licenças" (`mobile/src/dominio/licencas.ts`).

| Item | Licença | Situação nesta versão |
|---|---|---|
| MuscleMap | MIT | Não incluído: o mapa muscular da v0.4.1 é desenho próprio |
| Fonte Inter | SIL OFL 1.1 | Prevista no design; app usa fonte do sistema |
| Ícones Lucide | ISC | Previstos no design; app usa símbolos de texto |
| react-native-svg | MIT | Ilustrações, avatares, mapa muscular e logotipo (v0.4.1); desenhos próprios |
| expo-image-picker, expo-image-manipulator | MIT | Foto de perfil, recorte e compressão no aparelho (v0.4.1) |
| fflate | MIT | Geração do .zip |
| React Native, Expo e dependências | MIT (maioria) | Lista completa a gerar no build [a fazer] |

## MuscleMap — texto integral
```
MIT License

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
SOFTWARE.
```

## Imagens dos exercícios – Free Exercise DB (desde a 0.3.0)
- **Fonte:** https://github.com/yuhonas/free-exercise-db (consultado em 01/11/2026). É derivado de https://github.com/wrkout/exercises.json (Ollie Jennings).
- **Licença:** Unlicense, dedicação ao domínio público (texto em `LICENSE.md` do repositório; reproduzido abaixo). O repositório não traz licença ou autoria por imagem: todas estão sob a licença do repositório.
- **Arquivos:** `mobile/assets/exercicios/01.jpg` a `22.jpg`, a partir de `exercises/<id>/0.jpg`, reduzidos para no máximo 480×320 px (JPEG q72, cerca de 451 KB no total). A correspondência com a pasta de origem está em `mobile/src/dominio/imagens-exercicios.ts`.
- **Desde a 0.4.4:** dados de 876 exercícios (`dist/exercises.json`, commit `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`) em `mobile/src/dominio/catalogo-fedb.json`, com nomes e 41 instruções traduzidos pela Domma (pendentes de revisão CREF), e 873 animações WebP, pôsteres e miniaturas derivados de `exercises/<id>/0.jpg` e `1.jpg` em `mobile/public/exercicios/` (`docs/fontes/free-exercise-db.md`).

```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>
```

## SQLCipher Community Edition (via expo-sqlite, desde a 0.3.0)
Licença BSD-3-Clause, Copyright (c) 2008-2026 Zetetic LLC. O texto integral vem no pacote `expo-sqlite`; é preciso reproduzi-lo na tela de licenças antes de publicar [a fazer na geração automática de avisos].

## lottie-react-native (desde a 0.4.2)
Licença Apache-2.0, Copyright Airbnb / lottie-react-native contributors. O texto integral vem no pacote `lottie-react-native`.

## Fotos de alimentos (v0.4.3)
Fotos das dietas e das ideias de refeições: Pexels (Pexels License) e Pixabay (Pixabay Content License), selecionadas pela RedBox. Autores e links em `docs/fontes/fotos-dietas.md` e no app, em Perfil → Sobre o app.

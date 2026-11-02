# ADR-0014: Perfil local (foto, nome, altura, água) e conteúdo de saúde só informativo

## Status
Proposto (aguarda revisão da Jéssica)

## Data
2026-11-01

## Contexto
A 0.4.1 traz foto/avatar, nome, altura (IMC), água, objetivo e conteúdo de dietas, refeições e treinos. São dados pessoais e de saúde, e o conteúdo pode ser lido como orientação profissional.

## Decisão
1. Todos esses dados ficam no estado local já cifrado (SQLCipher no Android/iOS, ADR-0010; localStorage na web, ADR-0013). Não entram na fila de sincronização nem no Supabase.
2. A foto vira data URI JPEG 320×320 (recorte central, compressão 0,7) dentro do estado; entra na exportação como `foto-perfil.jpg` e some no "Excluir tudo".
3. Altura e água exigem o consentimento de saúde existente.
4. Dietas, refeições e treinos são dados estáticos em arquivos separados, sem números nutricionais nem prescrição, com avisos fixos e revisão profissional obrigatória antes de publicar.
5. Ilustrações, avatares e mapa muscular são desenhos próprios com react-native-svg (MIT); o logotipo usa os arquivos oficiais sem alteração.

## Alternativas consideradas
- Guardar a foto como arquivo no armazenamento do app: ficaria fora do banco cifrado. Rejeitada.
- Usar o MuscleMap (MIT) para o mapa muscular: desenho próprio é mais simples e evita dependência; MuscleMap segue listado como não incluído.

## Consequências
O estado cresce (≈ 20–40 KB por foto). Novo build Android obrigatório por causa dos módulos nativos. Política de privacidade e declaração do Google Play precisam de atualização.

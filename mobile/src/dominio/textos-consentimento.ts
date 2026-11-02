/**
 * Textos dos consentimentos — RASCUNHO da Jéssica (juridico/revisao-consentimentos.md, seção 3,
 * CASO-20261101-01, 01/11/2026), aguardando revisão do advogado responsável (com OAB).
 * Mudou o texto? Mude também VERSOES em consentimento.ts (o consentimento é pedido de novo).
 */
export const INTRO = {
  titulo: 'Seus dados, suas escolhas',
  texto: 'Seus treinos e seu peso são dados de saúde, protegidos pela Lei Geral de Proteção de Dados (LGPD). Cada autorização abaixo é separada, começa desligada e pode ser retirada a qualquer momento em Perfil → Consentimentos.',
  link: 'Ler a Política de Privacidade',
};

export interface TextoConsentimento { selo: string; titulo: string; blocos: [string, string][]; chave: string }

export const SAUDE: TextoConsentimento = {
  selo: 'Necessário para treino e peso',
  titulo: 'Autorizo a Domma Tecnologia a tratar meus dados de saúde de treino e peso',
  blocos: [
    ['O que', 'exercícios, séries, repetições, carga, tempo de descanso, esforço percebido (RPE), histórico de treinos e peso corporal.'],
    ['Para quê', 'apenas para registrar seus treinos e mostrar seu histórico, recordes e gráficos de evolução no app.'],
    ['Onde', 'nesta versão, somente neste aparelho. Nada é enviado à Domma nem a terceiros. Não vendemos nem compartilhamos esses dados com anunciantes.'],
    ['Se você não autorizar', 'o app não consegue gravar treinos nem peso; você ainda pode navegar pela biblioteca de exercícios.'],
    ['Para retirar', 'Perfil → Consentimentos. A partir daí, novos treinos e pesos deixam de ser gravados e você poderá exportar e apagar os registros existentes.'],
  ],
  chave: 'Autorizo o tratamento dos meus dados de saúde de treino e peso',
};

/** Pedido só no primeiro uso da foto de refeição (consentimento contextual). */
export const IA_EUA: TextoConsentimento = {
  selo: 'Opcional',
  titulo: 'Análise da foto da refeição por inteligência artificial nos Estados Unidos',
  blocos: [
    ['O que é enviado', 'somente a foto da refeição que você tirar ou escolher, sem localização (dados EXIF removidos) e sem seu nome, e-mail ou outro identificador.'],
    ['Para quê', 'estimar os alimentos e as calorias da foto para o seu diário alimentar.'],
    ['Quem e onde', 'a análise é feita pelo serviço Vertex AI (modelo Gemini), do Google, em servidores nos Estados Unidos. Isso é uma transferência internacional de dados. A Domma não guarda a foto depois da análise [VERIFICAR].'],
    ['Se você não autorizar', 'você continua usando o diário alimentar, com busca manual de alimentos.'],
    ['Para retirar', 'Perfil → Consentimentos. As próximas fotos deixam de ser enviadas.'],
  ],
  chave: 'Autorizo o envio das fotos das minhas refeições para análise por IA nos Estados Unidos',
};

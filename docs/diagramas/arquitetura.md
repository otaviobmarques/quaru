# Diagramas — app-academia (provisório) · 01/11/2026
Nomes iguais aos do código e do `GLOSSARIO.md`. Arquivos `.mmd` ao lado para renderizar.

## Contêineres (C4 em flowchart)
```mermaid
flowchart LR
  U([Aluno]) -->|toques| APP
  subgraph Aparelho
    APP[App Expo<br/>expo-router + TypeScript] --> EST[(Estado local<br/>AsyncStorage v1)]
    APP --> FILA[[Fila de sincronização]]
    APP --> NOT[Notificação local<br/>expo-notifications]
  end
  subgraph Futuro["Supabase sa-east-1 (aguarda aprovação)"]
    API[PostgREST + RPC<br/>openapi.yaml] --> DB[(Postgres + RLS)]
    AUTH[Auth código por e-mail]
  end
  FILA -.->|upsert idempotente por id| API
  APP -.-> AUTH
  NUT[["@domma/nutricao<br/>(Nícolas, a extrair)"]] -.-> APP
```

## Modelo de dados (ER)
```mermaid
erDiagram
  USUARIOS ||--o{ CONSENTIMENTOS : concede
  USUARIOS ||--o{ ROTINAS : cria
  ROTINAS ||--|{ ROTINA_EXERCICIOS : contem
  EXERCICIOS ||--o{ ROTINA_EXERCICIOS : usado_em
  USUARIOS ||--o{ SESSOES_TREINO : faz
  ROTINAS |o--o{ SESSOES_TREINO : origina
  SESSOES_TREINO ||--|{ SERIES : registra
  EXERCICIOS ||--o{ SERIES : de
  USUARIOS ||--o{ PESOS_CORPORAIS : registra
  SERIES {
    uuid id PK
    uuid sessao_id FK
    uuid exercicio_id FK
    text tipo
    numeric carga_kg
    int reps
    timestamptz atualizado_em
    timestamptz excluido_em
  }
```

## Sequência: registrar série offline e sincronizar (L2)
```mermaid
sequenceDiagram
  autonumber
  actor A as Aluno
  participant T as Tela Treino
  participant E as Estado local
  participant F as Fila
  participant S as Servidor (futuro)
  A->>T: Toca ✓ (concluir série)
  T->>E: salvarSerie (id uuid do aparelho)
  E->>F: enfileirar (substitui versão pendente do mesmo id)
  T->>T: timer de descanso + notificação local
  Note over F,S: sem rede: fila para e mantém a ordem
  F->>S: upsert por id (repetir não duplica)
  alt aceito
    S-->>F: registro com atualizado_em do servidor
  else 422 inválido
    S-->>F: problem+json → item marcado, demais seguem
  end
  S-->>E: mesclar: servidor vence, exclusão não é desfeita
```

## Navegação
```mermaid
flowchart LR
  Entrar --> Consentimentos --> Abas
  subgraph Abas
    Inicio; Rotinas; Historico; Alimentacao; Perfil
  end
  Inicio -->|Iniciar/Continuar| Treino --> Resumo --> Inicio
  Inicio --> Peso
  Rotinas --> EditarRotina --> Biblioteca
  Historico --> Resumo --> DetalheExercicio
  Treino --> DetalheExercicio
  Perfil --> Consentimentos
  Perfil --> Exportar
  Perfil --> Sobre
  Perfil -->|EXCLUIR| Entrar
```

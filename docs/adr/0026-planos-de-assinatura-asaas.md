# ADR-0026 – Planos de assinatura com teste grátis, cobrados pelo Asaas

- Status: aceito (v0.12)
- Data: 2026-11-05
- Substitui: o item "só o admin cadastra" do ADR-0022 (o convite continua existindo)

## Contexto
O Otávio quer vender o Quaru por assinatura: teste grátis de 7 dias, Mensal, Trimestral e Anual. Escolhas dele:
Asaas como gateway; preços R$ 19,90 / R$ 49,90 / R$ 179,90; teste sem cartão; sem plano, o treino fica bloqueado.

## Decisão
1. **Autocadastro**: "Criar conta" no app (Supabase Auth com confirmação de e-mail). O perfil nasce ativo e ganha
   `assinaturas.teste_ate = agora + 7 dias`. Admin e treinador são isentos; o admin dá **cortesia** a quem quiser.
2. **Chave geral** `config_assinatura.cobranca_ativa` (painel admin). Desligada, `meu_plano()` libera todo mundo.
   Ao ligar, quem ainda está no teste ganha pelo menos 7 dias a partir dali.
3. **Acesso** decidido no servidor por `meu_plano()` (livre, isento, assinante, teste ou sem_plano). O app guarda a
   resposta e reconfere as datas localmente (o teste acaba no 8º dia mesmo offline). Sem plano: não começa treino novo;
   continuar um treino já começado, ver histórico e exportar continuam (os dados são da pessoa).
4. **Cobrança no Asaas** pela função `assinatura`: cria o cliente (nome, CPF/CNPJ validado, e-mail) e a assinatura com
   `billingType: UNDEFINED`, para a pessoa escolher Pix, boleto ou cartão na página do Asaas. O app só abre o link da
   cobrança: nenhum dado de cartão passa pelo Quaru, e o CPF não é guardado no nosso banco (fica no Asaas).
   Troca de plano: cancela a anterior e o novo vence no fim do período pago (sem cobrar em dobro).
5. **Webhook** `asaas-webhook` (sem login; autenticado pelo cabeçalho `asaas-access-token`, comparado em tempo
   constante). Pagamento confirmado/recebido → `ativa` e `valido_ate` = vencimento + período + 1 dia de folga.
   Atraso → `atrasada` (o acesso vale até `valido_ate`). Estorno → corta o acesso. Assinatura excluída → `cancelada`.
   Cada evento é aplicado uma vez (`eventos_asaas`). Sandbox por padrão; produção com `ASAAS_AMBIENTE=producao`.
6. **Segredos** só no Supabase (`ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_AMBIENTE`), cadastrados pelo dono da conta.

## Consequências
- O app é local-first: o bloqueio é no app. Quem altera o próprio aparelho poderia burlar; aceito (o valor está nos
  treinos do treinador, na sincronização e nas funções do servidor, que podem passar a exigir plano depois).
- Preços em três lugares (tabela `planos`, `regras.ts` da função e `dominio/plano.ts` do app), cada um com teste dos mesmos valores.
- Política de Privacidade e Termos (rascunho) precisam citar a assinatura, a renovação automática e o Asaas.

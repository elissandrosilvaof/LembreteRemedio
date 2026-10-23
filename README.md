# Brava — agendamento de barbearia

App web responsivo em português, com escolha de serviço, profissional, data e horário, resumo do preço, confirmação e cancelamento. Evita sobreposição de horários por profissional e considera a duração dos serviços. Atendimento de segunda a sábado, das 9h às 19h.

## Executar

Requer Node.js 20 ou superior. Sem dependências externas de execução.

```sh
npm start
```

O servidor usa a porta 3000, configurável por `PORT`.

## Limites do demonstrativo

Os agendamentos e os dados do cliente ficam no localStorage do navegador. Não são compartilhados entre dispositivos, não são enviados à barbearia e não há autenticação, pagamento ou notificações. Os nomes, valores e horários são demonstrativos. Antes de usar em produção, integrar persistência no servidor, controle de concorrência, autenticação e tratamento adequado dos dados pessoais. A interface usa Google Fonts com fontes locais de fallback.

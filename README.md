# Agenda em Dia

**Sua agenda profissional, sempre à mão.**

**Desenvolvido por Elissandro Silva Polidoro.**

Agenda individual offline para Android. No primeiro acesso, escolha Fisioterapia, Psicologia, Natação, Pilates, Quiropraxia ou RPG. O app adapta os termos paciente/aluno e consulta/sessão/aula e sugere tipos de atendimento. RPG também aparece como modalidade na Fisioterapia. O aplicativo é uma agenda, com bloco de Anamnese por atendimento; não inclui diagnóstico automático, controle de pagamentos, notificações, aulas em grupo ou sincronização entre celulares.

## Funcionalidades

- Perfil profissional, alterável sem apagar dados.
- Cadastro e edição de pacientes/alunos, com telefone opcional e busca.
- Agendamento com tipo de atendimento livre, duração de 5 a 480 minutos, data, horário e valor definidos pelo profissional.
- Agenda de todos os dias da semana, sem restrição de horário comercial. O atendimento deve terminar até meia-noite; horários seguem o fuso do aparelho.
- Bloqueio de sobreposição considerando toda a duração, edição, cancelamento e conclusão.
- Quantidade de agendados/concluídos e soma dos valores dos concluídos no dia. Essa soma não é controle de recebimentos.
- Modalidade por atendimento: Particular, Plano, Avaliação e Permuta; registros antigos aparecem como Não informado até serem classificados.
- Bloco **Anamnese**, de até 10.000 caracteres por atendimento, editável inclusive após concluir ou cancelar. As notas não aparecem abertas na agenda.
- Data completa em dia/mês/ano, horário do atendimento e carimbos de criação/última alteração. Não se inventam carimbos para registros anteriores.
- Relatórios PDF e CSV por dia, mês ou ano, por paciente/aluno ou todos no mesmo arquivo, filtráveis por modalidade e status. Notas incluídas somente se a opção for marcada.
- Backup JSON de perfil, cadastros, modalidades e Anamnese, com restauração validada. Restaurar substitui todos os dados, após confirmação.

É um app para **um profissional por instalação**, que pode selecionar sua área. Não é uma agenda compartilhada entre vários profissionais. Não há valores de atendimento predefinidos: o valor inicial é zero e deve ser ajustado pelo usuário.

## Relatórios e Anamnese

1. Em **Agendar**, preencha a modalidade e as anotações no bloco **Anamnese**. O campo Status permite registrar um atendimento histórico como Concluído ou Cancelado. Um novo atendimento marcado como Agendado exige horário futuro.
2. Na agenda, cada cartão mostra data completa e modalidade. O botão **Anamnese** permite consultar/editar as notas e a modalidade sem reagendar. É possível também editar os demais dados de atendimentos concluídos/cancelados, preservando o status selecionado.
3. Em **Relatórios**, escolha Por dia, Por mês ou Por ano e preencha o período. Selecione um paciente/aluno ou **Todos no mesmo arquivo**. Filtros adicionais permitem selecionar modalidade e status.
4. Consulte o resultado e use **Salvar PDF** ou **Salvar planilha CSV**. No Android, escolha o aplicativo de arquivos/compartilhamento para guardar o arquivo. Os PDFs têm cabeçalho, páginas numeradas e uma tabela ordenada por pessoa/data. Os CSVs usam UTF-8 com BOM e ponto e vírgula, incluindo colunas separadas de dia, mês e ano.
5. A opção **Incluir Anamnese no arquivo** começa desmarcada. Quando marcada, inclui as notas no PDF/CSV; o backup sempre contém as notas. Relatórios não substituem um backup para restauração.

O total financeiro do relatório é a soma dos valores dos **concluídos**, sem cancelados ou agendados. Não comprova recebimento. Atendimentos de permuta/plano também usam o valor informado pelo profissional; o aplicativo não faz faturamento de convênios nem baixa de pagamentos.

## Atualizar sem perder dados

Esta versão é **1.1** (versionCode 2), com mesmo identificador Android e mesma chave de armazenamento da versão anterior. Exporte um backup antes de atualizar. Gere o novo APK usando a mesma chave de assinatura e instale por cima do anterior, sem desinstalar. Se a assinatura não corresponder, preserve o backup antes de qualquer remoção.

Dados e backups da versão 1 são aceitos e migrados sem apagar a agenda. Registros antigos recebem modalidade Não informado, Anamnese vazia e carimbos de registro não informados. Novos backups usam formato versão 2 e precisam desta versão para restaurar todos os campos; não restaure os backups novos no app antigo.

## Preservação da barbearia

O Agenda em Dia está na branch **agenda-em-dia**. A branch **main** continua com a Barbearia Brava. O pacote Android `br.com.agendaemdia.app` e o armazenamento `agenda-em-dia-v1` são independentes; ambos os aplicativos podem ser instalados no mesmo celular. Backups da barbearia não são importados neste app.

## Gerar APK no Windows

1. Abra a branch [agenda-em-dia no GitHub](https://github.com/elissandrosilvaof/LembreteRemedio/tree/agenda-em-dia), clique **Code → Download ZIP** e extraia tudo em uma pasta nova.
2. Instale Node.js 22 LTS ou superior e Android Studio, se ainda não tiver.
3. Abra **Preparar-Android.bat** na pasta extraída. Ele instala as dependências com `npm ci`, compila as telas, sincroniza o projeto e abre o Android Studio. A preparação precisa de internet.
4. Se o Android Studio não abrir, escolha **Open** e selecione a pasta **android** deste projeto.
5. Confie no projeto e aguarde a sincronização. Use **JVM 21** se solicitado. O projeto usa SDK Platform **35** e Gradle **8.11.1**. Instale os componentes solicitados pelo Android Studio.
6. Para uso pessoal/testes, selecione a variante **debug**. Vá em **Build → Generate App Bundles or APKs → Generate APKs** (em outras versões, **Build Bundle(s) / APK(s) → Build APK(s)**).
7. O arquivo estará em `android/app/build/outputs/apk/debug/app-debug.apk`. Transfira ao celular e instale, autorizando a origem quando o Android solicitar. Requer Android 6 ou superior e Android System WebView atualizado.

Alternativa no terminal aberto na pasta `android`:

```bat
gradlew.bat assembleDebug
```

## Distribuição comercial

Para distribuir, gere um **APK de release assinado** em **Build → Generate Signed Bundle / APK → APK**; para Google Play, gere um **Android App Bundle (AAB)** pelo mesmo assistente. Crie e guarde a chave de assinatura e suas senhas fora do repositório. Atualizações precisam da mesma chave, do mesmo applicationId e de versionCode maior. Verifique os requisitos atuais da loja antes de publicar; eles podem exigir atualização do SDK alvo.

A identificação do desenvolvedor está no rodapé do app e nos metadados do projeto. Não há licença comercial automática, cobrança, ativação, proteção contra cópia ou publicação em loja nesta versão. Não envie chaves ou senhas ao GitHub. As bibliotecas de terceiros mantêm suas próprias licenças.

Antes de distribuir, valide o APK em aparelho real, incluindo reinicialização, persistência, modo avião, exportação pelo compartilhamento Android e restauração pelo seletor de arquivos. APK debug não substitui uma versão de produção assinada.

## Dados e backup

No Android, os dados ficam no armazenamento privado do app (Capacitor Preferences). No navegador, ficam no localStorage. São agendas independentes; um backup pode transferir os dados entre elas. A desinstalação/limpeza apaga os dados locais; o backup automático do Android está desativado. Exporte regularmente e mantenha a cópia fora do app. Os JSONs de backup e relatórios podem conter nomes, telefones e dados de saúde escritos na Anamnese. Os arquivos exportados não são criptografados. As notas não são enviadas a um servidor. Proteja o aparelho com o bloqueio do próprio Android e guarde/compartilhe os arquivos somente nos destinos desejados.

## Desenvolvimento

```sh
npm ci
npm test
npm run build
npm start
```

Abra a porta 3000. Para abrir sem servidor, use **Abrir-app.bat** ou `public/index.html` depois do build. Todos os recursos são locais; não há download de fontes ou telas.

Depois de mudanças, execute `npm run android:sync` antes de compilar o APK. Não versione node_modules, APKs, chaves ou local.properties.

## Validação desta versão

- Quinze testes automatizados cobrem agenda, migração da versão anterior, notas, modalidade, filtros por período/paciente/status, valores, CSV com texto multiline e PDF de múltiplas páginas.
- Fluxos web em Chromium validam notas em atendimento concluído, persistência, período por dia/mês/ano, PDF e CSV individuais/consolidados, inclusão opcional das notas, atendimento histórico e backup versão 2. Os PDFs também foram conferidos por extração de texto (nomes, datas, acentos e notas).
- Build web e sincronização Capacitor executados. A geração funciona offline no navegador. Compilação do APK desta versão e o compartilhamento de PDF/CSV no Android ainda precisam de validação no Android Studio/aparelho.

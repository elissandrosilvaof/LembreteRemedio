# Brava — Agenda do barbeiro

Aplicativo para um único barbeiro: cadastro de cliente e telefone, seleção de serviço, agenda por dia e status, edição, conclusão, cancelamento, total dos atendimentos concluídos e backup/restauração JSON. Funciona sem internet depois de instalado. Atendimento de segunda a sábado, 9h–19h, com intervalos de 30 minutos. Serviços e preços predefinidos.

No Android, usa Capacitor 7 e Preferences (armazenamento privado do aplicativo). No navegador, usa localStorage. As agendas do navegador e do APK são independentes; transfira os dados pelo backup desta versão. Não migra automaticamente as reservas do demonstrativo anterior. Não há conta, servidor, sincronização, pagamentos ou notificações.

## Gerar um APK no Windows

1. Instale Node.js 22 LTS ou superior e Android Studio.
2. Baixe este repositório em **Code → Download ZIP** e **extraia tudo**. Não abra arquivos dentro do ZIP.
3. Na pasta extraída, abra **Preparar-Android.bat**. Ele executa `npm ci`, compila as telas, sincroniza os plugins e abre a pasta `android` no Android Studio. A preparação precisa de internet.
4. Se o Android Studio não abrir automaticamente, selecione **Open** e escolha a pasta **android** dentro do projeto.
5. Aguarde a sincronização do Gradle. Aceite a instalação dos componentes solicitados. O projeto usa **Android SDK Platform 35**, Java/JDK **21** e Gradle **8.11.1**. Em **Settings → Build, Execution, Deployment → Build Tools → Gradle**, selecione um Gradle JDK compatível (21).
6. No menu **Build**, selecione **Build Bundle(s) / APK(s) → Build APK(s)**. Dependendo da versão, aparece como **Generate App Bundles or APKs → Generate APKs**. Para instalação pessoal, selecione a variante **debug** em Build Variants.
7. Ao concluir, clique em **locate** na notificação. O arquivo estará em `android/app/build/outputs/apk/debug/app-debug.apk`.
8. Transfira o APK para o celular, abra-o e autorize a instalação por aquele aplicativo quando o Android solicitar. Requer Android 6 ou superior e Android System WebView atualizado.

Alternativa no terminal do Android Studio, aberto na pasta `android`:

```bat
gradlew.bat assembleDebug
```

O APK debug é assinado automaticamente para testes e uso pessoal. Para distribuir uma versão de produção, use **Build → Generate Signed Bundle / APK → APK**, crie e guarde sua chave de assinatura. Atualizações precisam do mesmo identificador e da mesma chave; não desinstale para atualizar sem antes exportar um backup. Nunca envie a chave ou senhas ao GitHub.

## Backup

Em **Salvar / compartilhar backup**, escolha onde guardar o JSON (Arquivos, Drive ou outro destino disponível). Guarde uma cópia fora do app. Em **Restaurar backup**, selecione um arquivo exportado por esta versão e confirme a substituição da agenda. Backups inválidos, duplicatas e conflitos são rejeitados antes de gravar. Os arquivos contêm dados dos clientes. A desinstalação ou limpeza dos dados apaga a agenda local; o backup automático do Android está desativado.

## Desenvolvimento

```sh
npm ci
npm test
npm run build
npm start
```

Abra a porta 3000. Para testar sem servidor, após o build abra `public/index.html`. O `Abrir-app.bat` faz isso no Windows. O APK inclui todos os arquivos e não baixa fontes ou telas externas.

Após alterar as telas ou plugins, execute `npm run android:sync` **antes** de compilar no Android Studio. O projeto nativo é versionado; `node_modules`, arquivos compilados, APKs e configurações locais não são.

## Validação

Testes automatizados do modelo cobrem conflitos, edição, horário de atendimento, datas, backups e horários passados. O fluxo web é validado separadamente. A integração nativa, o seletor de arquivos e o compartilhamento devem ser verificados em emulador/aparelho: cadastrar, reiniciar, editar, concluir, exportar, restaurar e usar em modo avião. Não considere o APK validado apenas por sincronizar o projeto.

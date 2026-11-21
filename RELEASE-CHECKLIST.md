# SENSI.AI 1.0.0 — checklist de lançamento

## Identidade da versão
- Nome: SENSI.AI
- Versão: 1.0.0
- Application ID Android: `com.sensiai.freefire`
- Motor: JavaScript local, determinístico e offline

## Verificações concluídas no pacote-fonte
- [x] Testes automatizados do motor: 5/5 aprovados (`node --test tests/engine.test.js`).
- [x] Arquivos HTML, CSS e JavaScript sincronizados entre `frontend/` e os assets do Android WebView.
- [x] Aplicativo WebView bloqueia carregamentos de rede e usa os assets locais.
- [x] README e identificação da versão 1.0.0 presentes.

## Antes de publicar o APK
- [ ] Executar o workflow **Build SENSI.AI APK** no GitHub Actions.
- [ ] Instalar o APK gerado em um Android real.
- [ ] Testar geração, cópia, calibração, salvar perfil, histórico e comparação.
- [ ] Confirmar que os dados permanecem após fechar e abrir o app.
- [ ] Testar em mais de um tamanho de tela e versão Android suportada.
- [ ] Gerar APK de release assinado com uma chave própria e guardada em segurança.
- [ ] Não publicar APK debug como versão final de distribuição.

## Build de validação
O workflow em `.github/workflows/build-apk.yml` executa os testes JavaScript e gera um APK **debug** como artefato do GitHub Actions. Esse APK serve para validação, não como release final assinado.

## Limites conhecidos
O algoritmo produz sugestões iniciais com base nos dados informados. Não mede diretamente o toque, não lê dados internos do Free Fire e não garante headshots ou desempenho competitivo. Os resultados precisam ser ajustados pelo jogador.

## Android 17 (API 37)
- [ ] Build with `compileSdk = 37` and `targetSdk = 37`.
- [ ] Confirm the CI runner installs `platforms;android-37`.
- [ ] Run the full Boost flow on an Android 17 device or emulator.
- [ ] Verify Shizuku authorization, allowed tweaks, and backup restoration.
- [ ] Confirm diagnostic readings are labeled accurately and unavailable metrics are never fabricated.
- [ ] Recheck frontend/Android asset synchronization before release.

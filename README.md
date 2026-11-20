🔴 SENSI.AI

Gerador Inteligente de Sensibilidade para Free Fire

O SENSI.AI é um aplicativo desenvolvido para gerar configurações personalizadas de sensibilidade, considerando as características do smartphone e as preferências do jogador.

Seu objetivo é ajudar cada jogador a encontrar configurações adequadas ao seu estilo de jogo por meio de um algoritmo próprio de geração e calibração.

🎯 Funcionalidades

- Geração personalizada de sensibilidade.
- Configurações para General, Red Dot, 2x, 4x, AWM e Olhadinha.
- Perfis Capa, Precisão, Equilibrado e Agressivo.
- Personalização por modelo de smartphone.
- Consideração de RAM, DPI e taxa de atualização.
- Sistema de calibração.
- Ajustes individuais de sensibilidade.
- Salvamento de configurações.
- Histórico de perfis.
- Comparação de resultados.
- Interface adaptada para dispositivos móveis.
- Funcionamento offline.

⚙️ Tecnologias

- HTML5
- CSS3
- JavaScript
- Node.js (somente se necessário para componentes do projeto)
- Android WebView
- LocalStorage

📱 Compatibilidade

O projeto foi planejado para funcionar em dispositivos Android e permitir empacotamento nos formatos:

- APK

A interface utiliza tecnologias web, facilitando sua adaptação para diferentes tamanhos de tela.

🧠 Sistema de geração

O SENSI.AI utiliza um algoritmo próprio em JavaScript para calcular sugestões de sensibilidade.

O algoritmo considera informações como:

- Fabricante e modelo do smartphone.
- Memória RAM.
- Taxa de atualização.
- DPI informado pelo usuário.
- Estilo de jogo.
- Preferência de mira.
- Resultados da calibração.

Os valores gerados são sugestões iniciais e podem ser ajustados individualmente.

🔧 Como utilizar

1. Abra o SENSI.AI.
2. Informe seu smartphone.
3. Configure as características do dispositivo.
4. Escolha seu estilo de jogo.
5. Selecione sua preferência de mira.
6. Toque em GERAR SENSIBILIDADE.
7. Teste os valores no jogo.
8. Utilize a calibração para ajustar os resultados.
9. Salve seu perfil personalizado.

🔒 Privacidade

A proposta da versão offline é realizar os cálculos diretamente no dispositivo, sem depender de pesquisas externas ou serviços de IA na nuvem.

Os perfis podem ser armazenados localmente no aparelho.

⚠️ Aviso

O SENSI.AI não modifica arquivos do Free Fire, não oferece mira automática e não garante headshots.

As configurações são recomendações personalizadas. Os resultados variam de acordo com o dispositivo, as configurações do jogo e a preferência individual.

🔴 Identidade

SENSI.AI

Sua configuração. Seu estilo. Sua precisão.

Versão: 1.0.0
Categoria: Ferramentas de configuração para jogos
Plataforma: Android

## Identificação da versão oficial

- Nome do aplicativo: SENSI.AI
- Versão: 1.0.0
- Application ID Android: `com.sensiai.freefire`
- Motor: algoritmo local determinístico em JavaScript
- Conexão com serviços externos: não necessária para gerar e calibrar configurações

## Observação sobre os resultados

O motor produz pontos de partida com base nos dados informados. Ele não mede diretamente o toque, não acessa os dados internos do Free Fire e não aprende automaticamente com partidas. A calibração depende do retorno selecionado pelo jogador.


## Versão atual

**SENSI.AI 1.3.0**

### Novidades da 1.3.0
- Preenchimento automático de chipset, categoria do processador, RAM de referência e taxa de atualização para modelos com ficha técnica cadastrada.
- Dados técnicos sincronizados entre a versão web e o Android WebView.
- Aviso para confirmar a variante de RAM e ajustar manualmente os modelos sem ficha técnica cadastrada.
- DPI permanece manual, pois é uma configuração do Android que pode mudar independentemente do modelo.

> As especificações preenchidas são referências para variantes comuns. RAM e algumas características podem variar por região e configuração; confirme os dados do seu aparelho antes de gerar a sensibilidade.


## Versão atual

**SENSI.AI 1.4.0**

### Novidades da 1.4.0
- Geração inicial deixa de usar fabricante, nome do modelo, RAM, chipset e taxa de atualização como substitutos de uma medição real de toque.
- DPI e tamanho do botão permanecem como parâmetros configuráveis da sugestão inicial.
- Calibração adaptativa com memória local por aparelho e perfil.
- Redução gradual do passo quando a mesma mira recebe correções repetidas na mesma direção.
- Memória independente para cada uma das seis miras, armazenada no próprio dispositivo.
- Reset da base também reinicia o aprendizado daquele aparelho e perfil.

O aprendizado é uma heurística local baseada no feedback selecionado, não um modelo de IA treinado nem uma medição automática da partida. O resultado deve ser validado pelo jogador no modo treinamento.

# SENSI.AI 2.0.0

A versão 2.0 inaugura o motor híbrido local, combinando perfis-base, modo de resposta e personalização manual de cada mira.

## Novidades da 2.0.0
- Três modos do motor: Controle, Balanceado e Ágil.
- Combinação do modo selecionado com os quatro perfis de jogo existentes.
- Controles deslizantes individuais de 0 a 200 para Geral, Red Dot, 2x, 4x, AWM e Olhadinha.
- Ajuste fino imediato sem modificar as outras miras.
- Preservação do catálogo de aparelhos, preenchimento técnico, perfis salvos, histórico, comparação e calibração adaptativa.
- Funcionamento offline mantido, com dados no armazenamento local.
- Testes automatizados para modos híbridos, limites e independência dos ajustes.

## Arquitetura e limites
O motor híbrido combina regras determinísticas e controles do jogador. Não é um modelo de aprendizado de máquina treinado, não mede diretamente o toque e não acessa dados internos do Free Fire. RAM, chipset e taxa de atualização são dados informativos, não medidas de sensibilidade. As configurações são pontos de partida para testar e ajustar.

## Versionamento
- VersionName: 2.0.0
- VersionCode: 5
- Branch: release/sensi-ai-2.0.0


## Mega upgrade interno da linha 2.0.0

O Boost Center amplia a versão 2.0.0 sem alterar o VersionName. O VersionCode Android foi incrementado para permitir que o Android reconheça a compilação como atualização.

### Boost Center
- Painel de diagnóstico local com modelo, versão Android, memória disponível, bateria e temperatura quando o sistema fornece esses dados.
- Recomendações conservadoras para estabilidade e uso durante jogos.
- Indicadores de dados indisponíveis quando o Android não fornece uma leitura.
- Nenhum ajuste de sistema é aplicado automaticamente.

### Shizuku Hub
- Integração com a API Shizuku para verificar se o serviço está ativo e se a autorização do SENSI.AI foi concedida.
- Solicitação de autorização somente após toque explícito do usuário.
- Esta compilação não executa comandos privilegiados nem modifica configurações do Android ou arquivos do jogo.
- A autorização Shizuku é opcional e pode ser revogada pelo usuário.

### Segurança e limites
O diagnóstico não é um benchmark de FPS e não mede diretamente o desempenho dentro do Free Fire. O SENSI.AI não encerra processos à força, não desativa proteções, não altera arquivos do jogo e não promete ganho de FPS ou headshots. O app continua funcionando sem Shizuku.

- VersionName: 2.0.0 (mantido)
- VersionCode: 6 (incremento técnico para atualização Android)


# SENSI.AI 2.1.1

- **VersionName:** 2.1.1
- **VersionCode:** 17
- **Android mínimo:** 7.0 (API 24)
- **Application ID:** `com.aistudio.mockcraft.kvwqnz`

### Suporte restaurado
- Central de suporte dentro de Configurações, com orientações para Android antigo e solução de problemas do Shizuku.
- Compatibilidade declarada para Android 7.0 ou superior, mantendo o minSdk 24.
- Orientação correta de inicialização do Shizuku: depuração sem fio no Android 11 ou superior; computador via ADB para Android 10 ou inferior sem root; método root quando disponível.
- Fallback para abrir as configurações do aplicativo em Android anterior ao Android 8 ao acessar opções de notificações.
- Application ID preservado para permitir atualização do mesmo pacote.

O fluxo de inicialização do Shizuku segue o manual oficial: https://shizuku.rikka.app/guide/setup/


## SENSI.AI 2.1.2

- Gráficos Massinha movido para um painel independente na aba Boost.
- Comandos V1 e V2 visíveis e copiáveis para uso manual no Brevent.
- Seleção entre Free Fire e Free Fire MAX para montar o comando correto.
- A seção Gráficos Massinha não depende da autorização Shizuku e não executa comandos automaticamente.
- O painel avisa sobre backup dos valores ANGLE atuais e sobre o encerramento do jogo selecionado.

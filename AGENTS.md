# AGENTS.md

Guia para quem altera este repositório (pessoas e agentes). Para configuração e exemplos de uso do addon, veja o `README.md`.

## O que é

Eitri-app (addon) que recebe os deeplinks do app da loja e abre o Eitri-app certo (`home`, `pdp`, `cart`, `account`...). Ele só mostra uma tela mínima enquanto resolve e, na maioria dos caminhos, fecha em seguida (`closeEitriApp`). Se nada resolver, também fecha.

É o Eitri-app apontado por `deeplinkResolver.slug` no remote config de cada marca. Existem variantes por plataforma em repositórios irmãos (`-shopify`, `-wake`, `-deco`); são projetos separados, então uma correção aqui não vale para elas.

## Fluxo

Entrada única: `src/views/Home.jsx`. Ela carrega as configs (`App.tryAutoConfigure`) e lê `Eitri.getInitializationInfos()`:

| Parâmetro de entrada | Caminho |
|---|---|
| `deeplink` começando com `http`/`www` | salva UTM e chama `resolveDeeplinkPath` (`DeeplinkResolver.js`) |
| `deeplink` de outro esquema (`scheme://...`) | salva UTM e chama `resolveUriDeeplinkScheme` (`UriDeeplinkSchemeResolver.js`) |
| `action` + `value` (push) | salva UTM e chama `deeplinkActionsExecutor` (`NotificationDeepLinkService.js`): `search`, `collection`, `category`, `brand`, `product`. Parâmetros extras são anexados ao `value` |

Detalhes de `Home.jsx`: `awc` vira `utm_campaign`; links `.go.link` só são normalizados com o host do remote config quando existe `providerInfo.host` ou `domain`, e a normalização espera `https://` em minúsculas.

Cada resolver tenta uma lista de caminhos em ordem e o primeiro que retornar um valor verdadeiro vence; se nenhum resolver, fecha o app.

- Links http (`resolveDeeplinkPath`): links das lojas de app, raiz, produto (`/p`), CMS, `deeplinkMap` do remote config, landing page, catálogo por categorias, e por último o navegador.
- Links de esquema (`resolveUriDeeplinkScheme`): genérico, CMS, `deeplinkMap`, produto, coleção, categoria, webview, busca, landing page, landing page do CMS.

### `deeplinkMap` (remote config)

- Casa com `deeplink.indexOf(path) > -1` e **a primeira entrada que casar vence**. A comparação é por trecho, diferencia maiúsculas de minúsculas e não separa origem, query e fragmento. Por isso a ordem importa: sub-caminhos (`/categoria/sub`) devem vir antes do caminho genérico (`/categoria`).
- No fluxo http os redirecionamentos do CMS são avaliados antes do `deeplinkMap` (no de esquema, o `resolveGeneric` vem primeiro, depois o CMS). O README marca o `deeplinkMap` como obsoleto, mas ele continua funcionando.
- `forceWeb: true` abre o navegador; outro valor verdadeiro abre um web flow com essa URL. Sem `forceWeb`, o destino é aberto com `openEitriApp(slug, { deeplink, ...params })`, ou seja, o `params` da entrada é espalhado nos parâmetros de inicialização do destino, exatamente como foi configurado.

## Contrato com a `home`

Nas `home` das marcas que conferimos, a tela `ProductCatalog` lê os filtros em `location.state.params` (`{ facets, sort, query }`) e o título em `location.state.title`. Sem `params`, ela mostra só o título e a lista fica vazia. Algumas `home` já aceitam também `facets` no primeiro nível; confira a da marca antes de assumir.

O que cada caminho envia ao abrir `ProductCatalog`:

| Caminho | Formato |
|---|---|
| `openHome`, `navigateToCategory`, catálogo por categorias de `DeeplinkResolver.js`, ações de catálogo do CMS | filtros dentro de `params` |
| `navigateHome` (push de coleção e de marca) | `facets` (e `sort`) no primeiro nível |
| repasse do `deeplinkMap` | o que estiver configurado na entrada: `facets` ao lado de `route` fica no primeiro nível; `params.params.facets` chega em `params` |
| esquema (coleção/categoria) | payload no primeiro nível e também em `params` |

Ao abrir `ProductCatalog` por código, mande os filtros dentro de `params`. Em entradas do `deeplinkMap`, o formato `params.params.facets` (aninhado) é o que funciona com `home` que lê só `state.params`.

## Convenções do código

- Dependências Eitri: `eitri-bifrost` para navegação e ambiente, `eitri-shopping-vtex-shared` para configs e serviços VTEX (`App`, `Vtex`).
- Aberturas de Eitri-app (`eitriNavigationOpen`/`openEitriApp`) usam `replace: true`, para o resolver não ficar na pilha. Navegador e web flow seguem outro caminho.
- Em falha, o padrão é terminar em `closeEitriApp()`; evite deixar a tela de carregamento aberta. Há exceções hoje (por exemplo, URL inválida em `openBrowser`), não replique.
- Os resolvers devem tratar "não é comigo" devolvendo um valor falso e sem lançar exceção. Hoje alguns devolvem `undefined`, e o chamador aceita qualquer valor verdadeiro como sucesso.
- Estilo predominante do código: tabs, sem ponto e vírgula, aspas simples, `console.log` com o nome do caminho e comentários em português. Imports internos costumam usar o alias `@/services/...`, mas há exceções; siga o arquivo que estiver editando.
- Dados vindos do remote config ou da rede podem faltar: use `?.`, valide `Array.isArray` antes de iterar e envolva chamadas assíncronas em `try/catch`.

## Versão e publicação

- Altere `version` e `versionMessage` em `eitri-app.conf.js` a cada mudança de código.
- Push na `main` roda `.github/workflows/main.yml`, que executa `check_and_push.js`: compara a versão local com a última revisão publicada no Eitri e, se a local for maior, roda `eitri push-version` com o `versionMessage`. O `eitri publish` para o ambiente de dev só roda se `DEV_ENV_ID` estiver preenchido, e hoje está vazio.
- O script não mexe em alias nem em remote config. Como cada marca passa a carregar a versão nova depende do alias `deeplink-resolver` e da publicação no Eitri; confirme isso antes de afirmar que uma mudança já está em produção. A versão publicada pode estar atrás da do `eitri-app.conf.js`.

## Como testar

Não há testes automatizados. Funções puras podem ser verificadas à parte com Node.

Em dispositivo Android (adb): abra o deeplink no app da loja com `adb shell am start -a android.intent.action.VIEW -d "<url>" -p <pacote>`. Na nossa experiência, os apps instalados da loja rodam as versões **publicadas** com o remote config de **produção**. Para testar a versão local, abra o workspace pelo ID (não pelo slug) no EitriPlay.

## Cuidados

- Não publique versão nem altere remote config de produção sem pedido explícito.
- O resolver é compartilhado por várias marcas: uma mudança aqui pode afetar todas. Valide links http, links de esquema, entradas do `deeplinkMap` e notificações antes de publicar.

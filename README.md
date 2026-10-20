# Eitri Shopping Addons
[Eitri Shopping Addons](https://github.com/eitri-tech/eitri-shopping-addons) são uma maneira rápida de integrar provedores de serviços e novos recursos e funcionalidades em aplicativos Eitri. Você precisa apenas configurar seus Eitri-apps para utilizarem os add-ons selecionados.

## Deeplink Resolver
O Eitri Deeplink Resolver é um addon plug-n-play para aplicações do Eitri App Shopping.

Com ele você pode dar ao seu app a capacidade de interpretar e direcionar para a página correta do app a grande maioria dos deeplinks padrão de e-commerce como deeplinks de páginas de categoria, produto, coleções, favoritos, minha conta e muito mais.

Alem disso, você pode configurar regras e caminhos personalizados para seus deeplinks a partir da configuração remota de sua aplicação ou, para lojas Vtex, [pelo CMS](#personalizando-deeplinks-pelo-cms-vtex).

Se preferir você pode tambem criar uma cópia do Deeplink Resolver em sua aplicação para personalizar ainda mais os comportamentos usando nosso template.

### Deeplinks suportados (Vtex)
Para saber mais sobre os deeplinks suportados acesse nossa [documentação sobre deeplinks](https://docs.eitri.tech/pt/eitri-shopping/deeplinks/).

### Ativando o Deeplink Resolver padrão (Para Vtex)

Para ativar o deeplink resolver com os comportamentos padrão, siga os seguintes passos:

1. Acesse o [Console Eitri](https://console.eitri.tech/) e vá em `Aplicativos`
2. Selecione o aplicativo no qual deseja configurar o Deeplink Resolver e em seguida acesse `Seus ambientes`
3. Clique em `Configurar` no ambiente desejado e procure a sessão `Configurações customizadas` para edita-las
4. Clique em `Editar configurações` e altere com cuidado o JSON apresentado para incluir as informações descritas nas proximas sessões (`deeplinkResolver` e, caso necessário, `deeplinks`).
5. Solicite à equipe Eitri a ativação do Deeplink Resolver para o seu app (Não é necessário caso você crie [seu próprio deeplink resolver](#criando-seu-próprio-deeplink-resolver))

> [!IMPORTANT]
> Ao alterar as configurações remotas de um ambiente, esteja atento à sintaxe do JSON pois o efeito das alterações é imediato e você pode quebrar seu app caso formule mal o JSON.

#### deeplinkResolver

Inclua em qualquer parte da raiz do JSON o `deeplinkResolver` com o slug de nosso Eitri-app para ativar o suporte ao processamento de deeplinks.

Esta entrada define qual será o Eitri-app responsável por processar seus deeplinks. Recomendamos que você use um alias "deeplink-resolver" e atribua este alias ao eitriapp que preferir.

```json
    "deeplinkResolver": {
        "slug": "deeplink-resolver"
    }
```

### Personalizando deeplinks para seu app

Alem dos deeplinks padrão, você pode definir deeplinks customizados para seu App para expandir ainda mais as possibilidades de tratamento e abertura de páginas do seu aplicativo. Para isso existem 2 métodos:

#### Personalizando deeplinks pelo CMS (Vtex)

Para personalizar os deeplinks e seus comportamentos pelo CMS da Vtex, basta cadastrar uma página do tipo Deeplink e incluir componentes do tipo "deeplink" dentro dela.

Cada componente cadastrado define termos de `path` e, quando o deeplink contém algum desses termos, o usuário é direcionado ao destino configurado.

A ordem dos componentes na página define a prioridade (vale o primeiro que encontrar um termo).

##### Configurando o CMS
Se eu aplicativon ainda não tem este recurso mas você deseja utilizar, basta incluir no CMS do app (arquivos `content-types.json` e `sections.json`) o content type `deeplink` e o componente `deeplink` conforme as recomendações abaixo:

``content-types.json``

```json
{
    "id": "deeplink",
    "name": "Deeplinks",
    "scopes": ["deeplink"],
    "isSingleton": true,
    "configurationSchemaSets": []
}
```

``sections.json``

O componente `deeplink` completo, com todo o schema, está no arquivo de exemplo [public/sections.json](public/sections.json) (último item da lista). O arquivo [public/content-types.json](public/content-types.json) mostra o content type acima junto dos demais content types de um app.

##### Campos do componente

`path`: lista de termos que deseja identificar no deeplink  
`action`: destino do redirecionamento, no mesmo modelo dos banners da home (`type`, `value`, `sort` e `title`)  
`remoteConfigKey` (opcional): o redirecionamento só é aplicado quando esta chave estiver habilitada  
`startDate` / `endDate` (opcionais): período de vigência do redirecionamento  
`name` (opcional): identificação interna

#### Tipos de ação (`action.type`)

| Tipo | `value` | Destino |
|---|---|---|
| `link` | URL completa (com `https://`) | Abre a URL via WebFlow |
| `product` | Id ou slug do produto | PDP |
| `collection` | Id da coleção | Listagem de produtos da coleção |
| `category` | Caminho da categoria (`cat1/cat2/cat3`) | Listagem de produtos da categoria |
| `search` | Termo de busca | Resultado da busca |
| `page` | Nome da landing page no CMS | Landing page |
| `path` | Path do site (aceita `map`, `filter.*` e `sort`) | Listagem de produtos |
| `brand` | Nome da marca | Listagem de produtos da marca |
| `cart` | — | Carrinho |
| `account` | Opcional: nome da view do Eitri-app de conta (ex: `AboutUs`) | View informada ou, sem `value`, a página inicial da conta |
| `wishlist` | — | Favoritos (`account`, rota `Wishlist`) |
| `orders` | — | Meus pedidos (`account`, rota `OrderList`) |

Para `collection`, `category` e `brand`, o campo `sort` define a ordenação e `title` o título exibido na listagem.



> [!IMPORTANT]
> Você só pode ter uma página de deeplinks mas pode ter ilimitados deeplinks configurados.
> A ordem dos deeplinks cadastrados é a ordem de prioridade no direcionamento.
> Ao criar a página Deeplinks no CMS ela tem prioridade sobre qualquer mapeamento de deeplinks feito no remote config Eitri conforme a descrição do próximo item

#### [OBSOLETO] entrada deeplinks no remote config Eitri

Os redirecionamentos do CMS são avaliados **antes** do `deeplinkMap` da configuração remota, mas ele continua funcionando normalmente.

Inclua em qualquer parte da raiz do JSON o `deeplink` com `deeplinkMap` dentro dele. Em `deeplinkMap` você deve criar um array com um objeto para cada personalização de path que deseja receber e tratar.

Exemplo:

```json
{
    "deeplink": {
        "deeplinkMap": [
            {
                "path": [
                    "novidades"
                ],
                "slug": "my-eitri-app-home",
                "params": {
                    "route": "ProductCatalog",
                    "facets": [
                        {
                            "productClusterIds": 139
                        }
                    ]
                }
            },
            {
                "path": [
                    "outlet"
                ],
                "slug": "my-eitri-app-home",
                "params": {
                    "route": "ProductCatalog",
                    "facets": [
                        {
                            "productClusterIds": 165
                        }
                    ]
                }
            }
        ]
    }
}
```

Onde:

`path`: é o termo que deseja identificar no caminho do deeplink
`slug`: é o slug do Eitri-app de seu app para qual deseja direcionar o usuário
`params`: são os [parâmetros de inicialização](https://cdn.83io.com.br/library/eitri-bifrost/doc/latest/classes/Bifrost.html#getInitializationInfos) que deseja enviar ao Eitri-app quando ele for chamado 

### Criando seu próprio Deeplink Resolver

Caso as personalizações não atendam suas necessidades, é possível tambem criar seu próprio Eitri-app de tratamento de deeplinks para manipular completamente o código uilizado.

Para isso, utilize o [`eitri create` com o parâmetro `--template`](https://docs.eitri.tech/pt/eitri-cli/#opcoes-disponiveis_1) e selecione o template `eitri-shopping-addons-deeplink-resolver`.

Desta forma, ao invés de utilizar nosso Eitri-app de tratamento de deeplinks você poderá personalizar completamente os comportamentos e código de seu Eitri-app para atender as mais variadas necessidades.

> [!WARNING]
> Após a criação, você deve incluir o **slug do seu Eitri-app** recém criado na entrada `deeplinkResolver` em sua configuração de ambiente [conforme descrito anteriormente](#deeplinkresolver).

Usando esta estratégia, sempre que seu app for aberto a partir de um deeplink, o acesso será direcionado para este Eitri-app passando como [parâmetros de inicialização]((https://cdn.83io.com.br/library/eitri-bifrost/doc/latest/classes/Bifrost.html#getInitializationInfos)) as informações recebidas no deeplink para que você trate da maneira mais adequada.
# Eitri Shopping Addons
[Eitri Shopping Addons](https://github.com/eitri-tech/eitri-shopping-addons) are a fast and easy way to integrate common provider resources into your Eitri applications. You just need to set your Eitri-Apps to use the selected addon wherever you need to use it.

## Deeplink Resolver
The Eitri Deeplink Resolver is a plug-n-play addon for Eitri App Shopping applications.

With it, you can give your app the ability to interpret and redirect to the correct page for most standard e-commerce deeplinks, such as category, product, collections, favorites, my account pages, and much more.

Additionally, you can configure custom rules and paths for your deeplinks through your application's remote configuration or, for Vtex stores, [via CMS](#customizing-deeplinks-via-cms-vtex).

You can also create a copy of the Deeplink Resolver in your application to further customize behaviors using our template.

### Supported Deeplinks (Vtex)

To know more about supported deeplinks go to [our deeplink documentation](https://docs.eitri.tech/en/eitri-shopping/deeplinks/).

### Enabling the Default Deeplink Resolver (For Vtex)

To enable the deeplink resolver with default behaviors, follow these steps:

1. Access the [Eitri Console](https://console.eitri.tech/) and go to `Applications`
2. Select the application where you want to configure the Deeplink Resolver and then access `Your environments`
3. Click `Configure` on the desired environment and look for the `Custom settings` section to edit them
4. Click `Edit settings` and carefully modify the presented JSON and include the information described in the next sections (`deeplinkResolver` and, if necessary, `deeplinks`).
5. Request the Eitri team to activate the Deeplink Resolver for your app (Not necessary if you create [your own deeplink resolver](#creating-your-own-deeplink-resolver))

> [!IMPORTANT]
> When changing the remote settings of an environment, pay attention to the JSON syntax as the effect of changes is immediate and you may break your app if the JSON is malformed.

#### deeplinkResolver

Include the `deeplinkResolver` with the slug of our Eitri-app anywhere in the root of the JSON to enable deeplink processing support.

This entry defines which Eitri-app will be responsible for processing your deeplinks.

```json
    "deeplinkResolver": {
        "slug": "eitri-shopping-addons-deeplink-resolver"
    }
```

### Customizing Deeplinks for Your App

In addition to the default deeplinks, you can define custom deeplinks for your app to further expand the possibilities of handling and opening pages in your application. To do this, include the information in your environment configuration as described below.

#### deeplinks

Include the `deeplink` with `deeplinkMap` inside it anywhere in the root of the JSON. In `deeplinkMap`, you should create an array with an object for each path customization you want to receive and handle.

Example:

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

Where:

`path`: is the term you want to identify in the deeplink path  
`slug`: is the slug of your app's Eitri-app to which you want to redirect the user  
`params`: are the [initialization parameters](https://cdn.83io.com.br/library/eitri-bifrost/doc/latest/classes/Bifrost.html#getInitializationInfos) you want to send to the Eitri-app when it is called

#### Example Environment Configuration

```json
{
    "deeplink": {
        "deeplinkMap": [
            {
                "path": [
                    "news"
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
            },
            {
                "path": [
                    "wishilist"
                ],
                "slug": "my-eitri-app-account",
                "params": {
                    "route": "whishlist"
                }
            },
            {
                "path": [
                    "login"
                ],
                "slug": "my-eitri-app-account"
            },
            {
                "path": [
                    "_secure/account#/orders"
                ],
                "slug": "my-eitri-app-account",
                "params": {
                    "route": "orders"
                }
            }
        ]
    },
    "deeplinkResolver": {
        "slug": "eitri-shopping-addons-deeplink-resolver"
    }
}
```

### Customizing Deeplinks via CMS (Vtex)

In addition to the remote configuration `deeplinkMap`, redirects can also be registered in the Vtex CMS (FastStore), allowing the app's management team to maintain their deeplinks without changing the environment configuration.

It works the same way as `deeplinkMap`: each registered component defines `path` terms and, when the deeplink contains any of those terms, the user is sent to the configured destination. The order of the components on the page defines the priority (the first one with a matching term wins). CMS redirects are evaluated **before** the remote configuration `deeplinkMap`, which keeps working for deeplinks not registered in the CMS.

#### Setting up the CMS

Add to the app's CMS (`content-types.json` and `sections.json` files) the `deeplink` content type and the `deeplink` component, restricted to it by scope:

```json
{
    "id": "deeplink",
    "name": "Deeplinks",
    "scopes": ["deeplink"],
    "isSingleton": true,
    "configurationSchemaSets": []
}
```

```json
{
    "name": "deeplink",
    "requiredScopes": ["deeplink"],
    "schema": { "...": "..." }
}
```

The full component schema can be copied from the `eitri-shopping-bodyforsure` reference app (`eitri-shopping-bodyforsure-home/public/sections.json`).

#### Component fields

`path`: list of terms you want to identify in the deeplink  
`action`: redirect destination, following the same model as the home banners (`type`, `value`, `sort` and `title`)  
`remoteConfigKey` (optional): the redirect is only applied when this key is enabled  
`startDate` / `endDate` (optional): period during which the redirect is valid  
`name` (optional): internal identification

#### Action types (`action.type`)

| Type | `value` | Destination |
|---|---|---|
| `link` | Full URL (with `https://`) | Opens the URL via WebFlow |
| `product` | Product id or slug | PDP |
| `collection` | Collection id | Collection product listing |
| `category` | Category path (`cat1/cat2/cat3`) | Category product listing |
| `search` | Search term | Search results |
| `page` | Landing page name in the CMS | Landing page |
| `path` | Site path (supports `map`, `filter.*` and `sort`) | Product listing |
| `brand` | Brand name | Brand product listing |
| `cart` | — | Cart |
| `account` | Optional: name of the account Eitri-app view (e.g. `AboutUs`) | The given view or, without `value`, the account home page |
| `wishlist` | — | Favorites (`account`, route `Wishlist`) |
| `orders` | — | My orders (`account`, route `OrderList`) |

For `collection`, `category` and `brand`, the `sort` field sets the ordering and `title` the title shown on the listing.

### Creating Your Own Deeplink Resolver

If remote configuration customizations do not meet your needs, you can also create your own Eitri-app for handling deeplinks.

To do this, use [`eitri create` with the `--template` parameter](https://docs.eitri.tech/en/eitri-cli/#available-options_1) and select the `eitri-shopping-addons-deeplink-resolver` template.

This way, instead of using our Eitri-app for deeplink handling, you can fully customize the behaviors and code of your Eitri-app to meet the most varied needs.

> [!WARNING]
> After creation, you must include the **slug of your newly created Eitri-app** in the `deeplinkResolver` entry in your environment configuration [as previously described](#deeplinkresolver).

Using this strategy, whenever your app is opened from a deeplink, access will be directed to this Eitri-app, passing the information received in the deeplink as [initialization parameters]((https://cdn.83io.com.br/library/eitri-bifrost/doc/latest/classes/Bifrost.html#getInitializationInfos)) so you can handle it in the most appropriate way.
# Eitri Shopping Addons
[Eitri Shopping Addons](https://github.com/eitri-tech/eitri-shopping-addons) are a fast way to integrate service providers and new resources and features into Eitri applications. You just need to set up your Eitri-apps to use the selected add-ons.

## Deeplink Resolver
The Eitri Deeplink Resolver is a plug-n-play addon for Eitri App Shopping applications.

With it, you can give your app the ability to interpret and redirect to the correct page of the app for most standard e-commerce deeplinks, such as category, product, collections, favorites, my account pages, and much more.

Additionally, you can configure custom rules and paths for your deeplinks through your application's remote configuration or, for Vtex stores, [via the CMS](#customizing-deeplinks-via-cms-vtex).

If you prefer, you can also create a copy of the Deeplink Resolver in your application to further customize behaviors using our template.

### Supported Deeplinks (Vtex)
To know more about supported deeplinks go to [our deeplink documentation](https://docs.eitri.tech/en/eitri-shopping/deeplinks/).

### Enabling the Default Deeplink Resolver (For Vtex)

To enable the deeplink resolver with default behaviors, follow these steps:

1. Access the [Eitri Console](https://console.eitri.tech/) and go to `Applications`
2. Select the application where you want to configure the Deeplink Resolver and then access `Your environments`
3. Click `Configure` on the desired environment and look for the `Custom settings` section to edit them
4. Click `Edit settings` and carefully modify the presented JSON to include the information described in the next sections (`deeplinkResolver` and, if necessary, `deeplinks`).
5. Request the Eitri team to activate the Deeplink Resolver for your app (Not necessary if you create [your own deeplink resolver](#creating-your-own-deeplink-resolver))

> [!IMPORTANT]
> When changing the remote settings of an environment, pay attention to the JSON syntax as the effect of changes is immediate and you may break your app if the JSON is malformed.

#### deeplinkResolver

Include the `deeplinkResolver` with the slug of our Eitri-app anywhere in the root of the JSON to enable deeplink processing support.

This entry defines which Eitri-app will be responsible for processing your deeplinks. We recommend using a "deeplink-resolver" alias and assigning this alias to the Eitri-app of your choice.

```json
    "deeplinkResolver": {
        "slug": "deeplink-resolver"
    }
```

### Customizing Deeplinks for Your App

In addition to the default deeplinks, you can define custom deeplinks for your app to further expand the possibilities of handling and opening pages in your application. There are 2 methods to do this:

#### Customizing Deeplinks via CMS (Vtex)

To customize deeplinks and their behaviors through the Vtex CMS, just register a page of the Deeplink type and add "deeplink" components to it.

Each registered component defines `path` terms and, when the deeplink contains any of those terms, the user is sent to the configured destination.

The order of the components on the page defines the priority (the first one with a matching term wins).

##### Setting up the CMS
If your app does not have this feature yet but you want to use it, just add to the app's CMS (`content-types.json` and `sections.json` files) the `deeplink` content type and the `deeplink` component following the recommendations below:

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

The full `deeplink` component, with its whole schema, is in the example file [public/sections.json](public/sections.json) (last item of the list). The [public/content-types.json](public/content-types.json) file shows the content type above alongside an app's other content types.

##### Component fields

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



> [!IMPORTANT]
> You can only have one deeplinks page, but you can have unlimited deeplinks configured.
> The order of the registered deeplinks is the priority order for redirection.
> Once the Deeplinks page is created in the CMS, it takes priority over any deeplink mapping made in the Eitri remote config, as described in the next item

#### [DEPRECATED] deeplinks entry in the Eitri remote config

CMS redirects are evaluated **before** the remote configuration `deeplinkMap`, but it keeps working normally.

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

### Creating Your Own Deeplink Resolver

If the customizations do not meet your needs, you can also create your own Eitri-app for handling deeplinks and fully control the code used.

To do this, use [`eitri create` with the `--template` parameter](https://docs.eitri.tech/en/eitri-cli/#available-options_1) and select the `eitri-shopping-addons-deeplink-resolver` template.

This way, instead of using our Eitri-app for deeplink handling, you can fully customize the behaviors and code of your Eitri-app to meet the most varied needs.

> [!WARNING]
> After creation, you must include the **slug of your newly created Eitri-app** in the `deeplinkResolver` entry in your environment configuration [as previously described](#deeplinkresolver).

Using this strategy, whenever your app is opened from a deeplink, access will be directed to this Eitri-app, passing the information received in the deeplink as [initialization parameters](https://cdn.83io.com.br/library/eitri-bifrost/doc/latest/classes/Bifrost.html#getInitializationInfos) so you can handle it in the most appropriate way.

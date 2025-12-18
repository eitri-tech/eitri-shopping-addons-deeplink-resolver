import { getProductById, getProductBySlug } from './ProductService'
import { openBrowser, openEitriApp, openProduct } from './NavigationService'
import Eitri from 'eitri-bifrost'
import { resolveDeeplinkFromRemoteConfig } from './DeeplinkResolver'
import { delay } from './UtilService'

const resolveDeeplinkToProduct = async deeplink => {
	try {
		let product = null

		if (deeplink?.startsWith('product/id')) {
			const productId = deeplink.split('product/id/')[1]
			product = await getProductById(productId)
		}

		if (deeplink?.startsWith('product/slug')) {
			const productSlug = deeplink.split('product/slug/')[1]
			const _product = await getProductBySlug(productSlug)
			product = _product?.[0]
		}

		if (product) {
			openProduct(product)
			return true
		}

		return false
	} catch (error) {
		console.error('Erro ao processar o deep link do produto', error)
		return false
	}
}

const resolveCollection = async (deeplink, params) => {
	try {
		if (deeplink?.startsWith('collection')) {
			const paramsObj = Object.fromEntries(new URLSearchParams(params))
			openEitriApp('home', {
				facets: [{ key: 'productClusterIds', value: paramsObj?.filter || paramsObj?.filters }],
				sort: paramsObj?.O || paramsObj?.order,
				route: 'ProductCatalog'
			})
			return true
		}

		return false
	} catch (error) {
		console.error('Erro ao processar o deep link do produto', error)
		return false
	}
}

const resolveCategory = async (deeplink, params) => {
	if (!deeplink) return false

	if (!deeplink?.startsWith('category')) {
		return
	}

	const categories = deeplink.replace('category/', '').split('/')
	const facets = categories.map((category, index) => ({
		key: `category-${index + 1}`,
		value: category
	}))
	if (!facets) return false

	const paramsObj = Object.fromEntries(new URLSearchParams(params))
	openEitriApp('home', {
		facets,
		route: 'ProductCatalog',
		sort: paramsObj?.O || paramsObj?.order || '',
		filter: params
	})
	return true
}

const resolveWebView = async (deeplink, params) => {
	if (!deeplink) return false

	if (!deeplink.startsWith('webview')) {
		return false
	}

	if (deeplink.startsWith('webview/inapp/')) {
		const url = deeplink.replace(/^webview\/inapp\//i, '')
		openBrowser(`${decodeURIComponent(url)}${params ? '?'+params : ''}`, true)
	} else {
		const url = deeplink.replace(/^webview\//i, '')
		openBrowser(`${decodeURIComponent(url)}${params ? '?'+params : ''}`, false)
	}
	return true
}

const resolveSearch = async (deeplink, params) => {
	if (!deeplink) return false

	if (!deeplink.startsWith('search')) {
		return false
	}

	const term = deeplink.split('search/')[1]
	const paramsObj = Object.fromEntries(new URLSearchParams(params))
	openEitriApp('home', {
		route: 'Search',
		searchTerm: term,
		sort: paramsObj?.O || paramsObj?.order,
		filter: params
	})
	return true
}

const resolveGeneric = async (deeplink, params) => {
	if (!deeplink) return false

	if (deeplink.startsWith('cart')) {
		const cartId = deeplink.split('cart/')[1]
		openEitriApp('cart', {
			cartId: cartId
		})
		return true
	}

	if (deeplink.startsWith('account')) {
		const viewName = deeplink.split('account/')[1]
		openEitriApp('account', {
			route: viewName || ''
		})
		return true
	}

	if (deeplink.startsWith('home')) {
		openEitriApp('home')
		return true
	}
	
	return false
}

export const resolveUriDeeplinkScheme = async deeplink => {
	const [, basePath] = deeplink.split('://')
	const [path, queryParams] = basePath.split(/\?(.*)/).filter(Boolean)

	const deeplinkWays = [
		resolveDeeplinkFromRemoteConfig,
		resolveDeeplinkToProduct,
		resolveCollection,
		resolveCategory,
		resolveWebView,
		resolveSearch,
		resolveGeneric
	]

	try {
		for (const way of deeplinkWays) {
			try {
				
				// console.log('executando:', way.name)
				
				let result = await way(path, queryParams)
				if (result) {
					return true
				}
			} catch (error) {
				console.error('Erro ao processar o deep link', way.name, error)
			}
		}
		Eitri.close()
	} catch (error) {
		console.error('Erro ao processar o deep link', error)
		Eitri.close()
	}
}

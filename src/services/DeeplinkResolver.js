import Eitri from 'eitri-bifrost'
import { App } from 'eitri-shopping-vtex-shared'
import { openEitriApp, openHome, openProductBySlug, openRedirectLinkBrowser } from './NavigationService'
import { delay } from './UtilService'

const resolveDeeplinkRoot = deeplink => {
	console.log('resolveDeeplinkRoot')
	const domain = App?.configs?.providerInfo?.domain
	if (!domain) return false
	const isRoot = new RegExp(`^https?:\/\/${domain}\/?$`).test(deeplink)
	if (isRoot) {
		openEitriApp('home')
		return true
	}
	return false
}

const resolveDeeplinkToProduct = async deeplink => {
	try {
		console.log('resolveDeeplinkToProduct')
		const [baseUrl] = deeplink.split('?')

		if (baseUrl.toLowerCase().endsWith('/p')) {
			const urlParts = baseUrl.split('/')
			const productSlug = urlParts[urlParts.length - 2]
			if (productSlug) {
				await openProductBySlug(productSlug)
				return true
			}
		}
		return false
	} catch (error) {
		console.error('Erro ao processar o deep link do produto', error)
		return false
	}
}

const resolveDeeplinkToProductCatalog = deeplink => {
	console.log('resolveDeeplinkToProductCatalog')
	if (!deeplink) return false

	deeplink = deeplink.replace(/^https?:\/\//, "")
	const domain = App?.configs?.providerInfo?.domain?.replace(/^https?:\/\//, "")?.replace(/\/$/, "")

	const [baseUrl, queryParams] = deeplink.split('?')
	try {
		if (deeplink?.includes('&map=') || deeplink?.includes('?map=')) {
			const paramsArray = queryParams.split('&')
			const paramsObject = {}
			let mapValues = []

			paramsArray.forEach(param => {
				const [key, value] = param.split('=')
				if (key === 'map') {
					mapValues = decodeURIComponent(value).split(',')
				} else {
					paramsObject[key] = value
				}
			})

			if (mapValues.length > 0) {
				if (!domain) return false
				const pathSegments = baseUrl
					.replace(new RegExp(`^${domain}\/?`), '')
					.split('#')[0]
					.split('/')

				const facets = mapValues.map((mapValue, index) => ({
					key: mapValue,
					value: pathSegments[index] || ''
				}))
				openHome({ deeplinkFacets: facets })
				return true
			}
		}

		if (deeplink?.includes('filter')) {
			const paramsArray = queryParams.split('&')
			let facets = []

			paramsArray.forEach(param => {
				if (param.startsWith('filter.')) {
					const [keyWithFilter, value] = param.split('=')
					const key = keyWithFilter.replace('filter.', '')
					facets.push({
						key: key,
						value: decodeURIComponent(value)
					})
				}
			})

			let sort = ''

			if (deeplink?.includes('sort')) {
				const sortMatch = deeplink?.match(/sort=([^&]*)/)
				sort = sortMatch ? decodeURIComponent(sortMatch[1]) : ''
			}

			if (facets.length > 0) {
				openHome({ deeplinkFacets: facets, sort })
				return true
			}
		}

		if (!domain) return false

		const path = deeplink.replace(new RegExp(`^${domain}\/?`), '')
		
		const [categoryPath] = path.split('?')
		if (!categoryPath) return false

		const categories = categoryPath.split('/')
		if (!categories) return false

		const facets = categories.map((category, index) => ({
			key: `category-${index + 1}`,
			value: category
		}))
		if (!facets) return false
		openEitriApp('home', { params: { facets }, route: 'ProductCatalog' })
		return true
	} catch (error) {
		console.error('Erro ao processar o deep link de busca', error)
		return false
	}
}

const resolveStoreLinks = deeplink => {
	console.log('resolveStoreLinks')
	if (deeplink.includes('play.google') || deeplink.includes('app.apple')) {
		Eitri.close()
		return true
	}
	return false
}

export const resolveDeeplinkFromRemoteConfig = deeplink => {
	console.log('resolveDeeplinkFromRemoteConfig')
	const rcDeeplinkConfig = App?.configs?.deeplink
	if (!rcDeeplinkConfig?.deeplinkMap) {
		return false
	}

	const matchedDeeplink = rcDeeplinkConfig.deeplinkMap.find(dlinkMap => {
		return dlinkMap.path.some(path => deeplink.indexOf(path) > -1)
	})
	if (matchedDeeplink) {
		openEitriApp(matchedDeeplink.slug, matchedDeeplink.params)
		return true
	} else {
		return false
	}
}

export const resolveDeeplinkPath = async deeplink => {
	const deeplinkWays = [
		resolveStoreLinks,
		resolveDeeplinkRoot,
		resolveDeeplinkFromRemoteConfig,
		resolveDeeplinkToProduct,
		resolveDeeplinkToProductCatalog,
		openRedirectLinkBrowser
	]

	try {
		for (const way of deeplinkWays) {
			try {
				let result = await way(deeplink)
				if (result) {
					return true
				}
			} catch (error) {
				console.error('Erro ao processar o deep link', error)
			}
		}
		Eitri.close()
	} catch (error) {
		console.error('Erro ao processar o deep link', error)
		Eitri.close()
	}
}

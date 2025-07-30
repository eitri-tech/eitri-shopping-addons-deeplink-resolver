import Eitri from 'eitri-bifrost'
import { getProductBySlug } from './ProductService'

/**
 * Abre o EitriApp de detalhe do produto
 * @param {(object)} product - produto inteiro.
 */
export const openProduct = async product => {
	try {
		Eitri.navigation.open({
			slug: 'pdp',
			initParams: { product: product },
			replace: true
		})
	} catch (e) {
		console.error('navigate to PDP: Error', e)
		Eitri.close()
	}
}

export const openProductBySlug = async slug => {
	try {
		const result = await getProductBySlug(slug)

		if (!result || result.length === 0) {
			console.error('Nenhum produto encontrado para o deep link. Fechando app...')
			Eitri.close()
			return false
		}

		Eitri.navigation.open({
			slug: 'pdp',
			initParams: { product: result[0] },
			replace: true
		})
	} catch (e) {
		console.error('navigate to PDP: Error', e)
		Eitri.close()
	}
}

function resolveFacets(facet) {
	let query = null

	const facets = facet.filter(item => {
		if (item.key === 'ft') {
			query = item['value']
			return false
		}
		return true
	})

	const normalizedPath = { facets: facets }

	if (query) {
		normalizedPath.query = query
	}

	return normalizedPath
}

/**
 * Abre o EitriApp de home
 */
export const openHome = async deeplink => {
	try {
		let params = {}
		if (deeplink?.deeplinkFacets) {
			params = resolveFacets(deeplink?.deeplinkFacets)
		}

		if (deeplink?.sort) {
			params.sort = deeplink?.sort
		}

		if (deeplink) {
			Eitri.navigation.open({
				slug: 'home',
				initParams: { params, route: 'ProductCatalog' },
				replace: true
			})
		}
	} catch (e) {
		console.error('navigate to Home: Error', e)
		Eitri.close()
	}
}

export const openCheckout = async () => {
	try {
		Eitri.navigation.open({
			slug: 'checkout',
			replace: true
		})
	} catch (e) {
		console.error('navigate to Checkout: Error', e)
		Eitri.close()
	}
}

/**
 * Abre o EitriApp relacionado ao deeplink da push notification
 */

export const normalizePath = path => {
	let pathComponents = decodeURIComponent(path).split('?')
	let pathData = pathComponents[0].split('/').filter(Boolean)
	let queryParams = new URLSearchParams(pathComponents[1])
	let normalizedData = { facets: [] }

	if (queryParams.has('map')) {
		let mapKeys = queryParams.get('map').split(',')
		pathData.forEach((value, index) => {
			if (mapKeys[index] === 'ft') {
				normalizedData.query = value
			} else {
				normalizedData.facets.push({
					key: mapKeys[index],
					value: value
				})
			}
		})
	}

	if (path?.includes('filter')) {
		const paramsArray = path.split('&')

		paramsArray.forEach(param => {
			if (param.startsWith('filter.')) {
				const [keyWithFilter, value] = param.split('=')
				const key = keyWithFilter.replace('filter.', '')
				normalizedData.facets.push({
					key: key,
					value: decodeURIComponent(value)
				})
			}
		})
	}
	if (!path?.includes('filter') && !queryParams.has('map')) {
		pathData.forEach((value, index) => {
			normalizedData.facets.push({
				key: `category-${index + 1}`,
				value: value
			})
		})
	}

	if (path?.includes('sort')) {
		const sortMatch = path?.match(/sort=([^&]*)/)
		normalizedData.sort = sortMatch ? decodeURIComponent(sortMatch[1]) : ''
	}

	for (let [key, value] of queryParams.entries()) {
		if (key !== 'map') {
			normalizedData[key] = value
		}
	}

	return normalizedData
}

export const navigateHome = async (facets, title, type) => {
	let initParams

	if (facets.includes('?')) {
		const normalize = normalizePath(facets)
		initParams = { facets: normalize?.facets, sort: normalize?.sort, route: 'ProductCatalog', title }
	} else {
		initParams = { facets: [{ key: type, value: facets }], route: 'ProductCatalog', title }
	}

	try {
		Eitri.navigation.open({
			slug: 'home',
			initParams: initParams,
			replace: true
		})
	} catch (e) {
		console.error('navigate to Home: Error', e)
		Eitri.close()
	}
}

export const navigateSearch = async value => {
	try {
		Eitri.navigation.open({
			slug: 'home',
			initParams: { searchTerm: value, route: 'Search' },
			replace: true
		})
	} catch (e) {
		console.error('navigate to Home: Error', e)
		Eitri.close()
	}
}

export const navigateToCategory = async (category, title) => {
	const normalizedPath = normalizePath(category)
	try {
		Eitri.navigation.open({
			slug: 'home',
			initParams: { params: normalizedPath, route: 'ProductCatalog', title },
			replace: true
		})
	} catch (e) {
		console.error('navigate to Home: Error', e)
		Eitri.close()
	}
}

export const openEitriApp = async (slug, params) => {
	try {
		Eitri.navigation.open({
			slug,
			initParams: params,
			replace: true
		})
	} catch (e) {
		console.error('navigate to Home: Error', e)
		Eitri.close()
	}
}

export const openRedirectLinkBrowser = async deeplink => {
	try {
		console.log('openRedirectLinkBrowser')
		const { applicationData } = await Eitri.getConfigs()
		let url =
			applicationData.platform === 'ios'
				? deeplink
				: `https://faststore-cms.s3.us-east-1.amazonaws.com/redirect.html?link=${btoa(deeplink)}`

		Eitri.openBrowser({
			url: url,
			inApp: false
		})
		Eitri.close()
	} catch (error) {
		console.error('Erro ao processar o deep link de busca', error)
		Eitri.close()
	}
}

export const openBrowser = async url => {
	try {
		Eitri.openBrowser({
			url: url,
			inApp: true
		})
		Eitri.close()
	} catch (error) {
		console.error('Erro ao processar o deep link de busca', error)
		Eitri.close()
	}
}

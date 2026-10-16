import Eitri from 'eitri-bifrost'
import { Vtex } from 'eitri-shopping-vtex-shared'
import {
	closeEitriApp,
	eitriNavigationOpen,
	normalizePath,
	openEitriApp,
	openLandingPage,
	openProductById,
	openProductBySlug,
	openWebFlow
} from './NavigationService'

// Redirecionamentos cadastrados no CMS (content type "deeplink", componente "deeplink").
// Mesma mecânica do deeplinkMap do remote config: o primeiro componente (na ordem da página)
// com algum termo de "path" contido no deeplink define o destino, que segue o mesmo modelo de
// "action" dos banners da home (type/value/sort/title).

const CMS_CONTENT_TYPE = 'deeplink'
const CMS_SECTION_NAME = 'deeplink'

// tipos de ação em que "value" é opcional
const ACTIONS_WITHOUT_VALUE = ['cart', 'account', 'wishlist', 'orders']

let deeplinksPromise = null

export const getCmsDeeplinks = () => {
	if (!deeplinksPromise) {
		deeplinksPromise = loadCmsDeeplinks()
	}
	return deeplinksPromise
}

const loadCmsDeeplinks = async () => {
	try {
		const { faststore } = Vtex?.configs || {}
		if (!faststore) return []

		const result = await Vtex.cms.getPagesByContentTypes(faststore, CMS_CONTENT_TYPE, {})
		const sections = result?.data?.[0]?.sections || []

		const now = new Date()
		const deeplinks = sections.filter(section => {
			const { path, action, startDate, endDate } = section?.data || {}
			if (section?.name !== CMS_SECTION_NAME) return false
			if (!getPathTerms(path).length || !action?.type) return false
			if (!action.value && !ACTIONS_WITHOUT_VALUE.includes(action.type)) return false
			return isWithinValidDateRange(startDate, endDate, now)
		})

		return filterByRemoteConfig(deeplinks)
	} catch (error) {
		console.error('Erro ao carregar deeplinks do CMS', error)
		return []
	}
}

const getPathTerms = path => (Array.isArray(path) ? path.filter(term => typeof term === 'string' && term.trim()) : [])

const isWithinValidDateRange = (startDateStr, endDateStr, now) => {
	const start = startDateStr ? new Date(startDateStr) : null
	const end = endDateStr ? new Date(endDateStr) : null

	if ((start && isNaN(start)) || (end && isNaN(end))) return false

	if (start && now < start) return false
	if (end && now > end) return false

	return true
}

const getRemoteConfig = async key => {
	try {
		const result = await Eitri.exposedApis.remoteConfig.getString({ key })

		if (result === 'false') return false
		if (result === 'true') return true

		return result
	} catch (e) {
		console.error('Erro ao buscar remote config:', e)
		return null
	}
}

const filterByRemoteConfig = async deeplinks => {
	const keys = [...new Set(deeplinks.map(section => section.data?.remoteConfigKey).filter(Boolean))]
	if (!keys.length) return deeplinks

	const results = await Promise.all(keys.map(getRemoteConfig))
	const enabled = keys.reduce((acc, key, index) => ({ ...acc, [key]: !!results[index] }), {})

	return deeplinks.filter(section => !section.data?.remoteConfigKey || enabled[section.data.remoteConfigKey])
}

export const resolveDeeplinkFromCms = async deeplink => {
	console.log('resolveDeeplinkFromCms')
	if (!deeplink) return false

	const deeplinks = await getCmsDeeplinks()
	const matched = deeplinks.find(section => getPathTerms(section.data.path).some(term => deeplink.indexOf(term) > -1))
	if (!matched) return false

	return executeCmsAction(matched.data.action)
}

// Equivalente ao processActions (ResolveCmsActions) da home, abrindo o Eitri-app de destino
// com os mesmos route/state que a home usa ao navegar a partir de um banner.
const openHomeRoute = async initParams => {
	try {
		await eitriNavigationOpen({ slug: 'home', initParams, replace: true })
	} catch (e) {
		console.error('navigate to Home: Error', e)
		closeEitriApp()
	}
}

const openProductCatalog = (params, action) =>
	openHomeRoute({ route: 'ProductCatalog', params, title: action?.title || '' })

const buildCategoryFacets = value =>
	(value?.split('/') || [])
		.filter(Boolean)
		.map((category, index) => ({ key: `category-${index + 1}`, value: category }))

export const executeCmsAction = async action => {
	const { type, value } = action || {}

	switch (type) {
		case 'search':
			await openHomeRoute({ route: 'Search', searchTerm: value })
			return true
		case 'collection':
			await openProductCatalog({ facets: [{ key: 'productClusterIds', value }], sort: action?.sort || '' }, action)
			return true
		case 'page':
			await openLandingPage(action?.title || '', value)
			return true
		case 'category':
			await openProductCatalog({ facets: buildCategoryFacets(value), sort: action?.sort || '' }, action)
			return true
		case 'product':
			if (/^\d+$/.test(value)) {
				await openProductById(value)
			} else {
				await openProductBySlug(value)
			}
			return true
		case 'path':
			await openProductCatalog(normalizePath(value), action)
			return true
		case 'brand':
			await openProductCatalog({ facets: [{ key: 'brand', value }], sort: action?.sort || '' }, action)
			return true
		case 'link':
			// mesmo comportamento do forceWeb com URL no deeplinkMap do remote config
			await openWebFlow(value)
			return true
		case 'cart':
			await openEitriApp('cart')
			return true
		case 'account':
			// com value, abre a view do account de mesmo nome (ex: AboutUs); sem value, abre a home do account
			await openEitriApp('account', value?.trim() ? { route: value.trim() } : undefined)
			return true
		case 'wishlist':
			await openEitriApp('account', { route: 'Wishlist' })
			return true
		case 'orders':
			await openEitriApp('account', { route: 'OrderList' })
			return true
		default:
			console.error(`Unknown CMS deeplink action type: ${type}`)
			return false
	}
}

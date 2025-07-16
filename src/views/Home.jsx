import Eitri from 'eitri-bifrost'
import { openProduct, openHome, openProductBySlug, openEitriApp } from '../services/NavigationService'
import { getProductBySlug } from '../services/ProductService'
import { Vtex, App } from 'eitri-shopping-vtex-shared'
import { Loading } from 'eitri-shopping-torra-shared'
import { deeplinkActionsExecutor } from '../services/NotificationDeepLinkService'

export default function Home(props) {
	useEffect(() => {
		startHome()
	}, [])

	const startHome = async () => {
		await loadConfigs()
		await resolveContent()
	}

	const loadConfigs = async () => {
		try {
			await App.tryAutoConfigure({ verbose: false })
		} catch (error) {
			console.error('Erro ao buscar configurações', error)
		}
	}

	const resolveContent = async () => {
		try {
			const startParams = await Eitri.getInitializationInfos()
			if (!startParams) {
				console.error('Nenhum parâmetro de inicialização encontrado.')
				Eitri.close()
				return
			}

			await processStartParams(startParams)
		} catch (error) {
			console.error('Erro ao resolver parâmetros de inicialização:', error)
			Eitri.close()
		}
	}

	async function resolveDeeplinkUtmParams(startParams) {
		const utmParams = Object.fromEntries(Object.entries(startParams).filter(([key]) => key.includes('utm')))

		await saveUtmParams(utmParams)
	}

	function processParams(input) {
		const { action, value, title, utm, ...others } = input

		// Concatena os outros parâmetros com &
		const additionalParams = Object.entries(others)
			.map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
			.join('&')

		const finalValue = additionalParams ? `${value}&${additionalParams}` : value

		return {
			...(action && { action }),
			value: finalValue,
			...(utm && { utm }),
			...(title && { title })
		}
	}

	const processStartParams = async startParams => {
		try {
			const { action, value, title } = startParams

			if (action && value) {
				await resolveDeeplinkUtmParams(startParams)

				let processedParameters = processParams(startParams)

				deeplinkActionsExecutor({
					action: processedParameters.action,
					value: processedParameters.value,
					title: processedParameters.title || ''
				})
				return
			}

			if (!startParams?.deeplink) {
				Eitri.close()
				throw new Error('Nenhum deeplink encontrado')
			}

			const [, queryParams] = startParams.deeplink.split('?')

			try {
				await resolveUtmParams(queryParams)
			} catch (e) {
				console.error('Erro ao salvar os parâmetros UTM', e)
			}

			const deeplinkWays = [
				resolveDeeplinkFromRemoteConfig,
				resolveDeeplinkToProduct,
				resolveDeeplinkToProductCatalog
			]

			resolveDeeplink(startParams, deeplinkWays)
		} catch (error) {
			console.error('Erro ao processar os parametros de inicializacao', error)
			Eitri.close()
		}
	}

	const resolveUtmParams = async queryParams => {
		if (!queryParams) return
		const paramsArray = queryParams.split('&')
		const paramsObject = {}
		paramsArray.forEach(param => {
			const [key, value] = param.split('=')
			if (key.startsWith('utm')) {
				paramsObject[key] = value
			}
		})

		// o utm_source será definido pelo app
		paramsObject.utm_source = null

		await saveUtmParams(paramsObject)
	}

	const saveUtmParams = async params => {
		return Vtex.customer.saveUtmParams(params)
	}

	const resolveDeeplink = async (startParams, deeplinkWays) => {
		try {
			for (const way of deeplinkWays) {
				try {
					let result = await way(startParams)
					if (result) {
						return true
					}
				} catch (error) {
					console.error('Erro ao processar o deep link', error)
				}
			}

			openBrowser(startParams)
		} catch (error) {
			console.error('Erro ao processar o deep link', error)
			Eitri.close()
		}
	}

	const resolveDeeplinkToProduct = async startParams => {
		try {
			let { deeplink } = startParams
			const [baseUrl] = deeplink.split('?')

			if (baseUrl.toLowerCase().endsWith('/p')) {
				const urlParts = baseUrl.split('/')
				const productSlug = urlParts[urlParts.length - 2]
				const product = await getProductBySlug(productSlug)

				if (product && product[0]?.productId) {
					openProduct(product[0])
					return true
				}
			}
			return false
		} catch (error) {
			console.error('Erro ao processar o deep link do produto', error)
			return false
		}
	}

	const resolveDeeplinkToProductCatalog = startParams => {
		const deeplink = startParams?.deeplink
		if (!deeplink) return false

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
					const pathSegments = baseUrl
						.replace(/^@?https:\/\/www\.lojastorra\.com\.br\//, '')
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
			return false
		} catch (error) {
			console.error('Erro ao processar o deep link de busca', error)
			return false
		}
	}

	const resolveDeeplinkFromRemoteConfig = startParams => {
		const rcDeeplinkConfig = App?.configs?.deeplink

		if (!rcDeeplinkConfig?.deeplinkMap) {
			return false
		}

		const matchedDeeplink = rcDeeplinkConfig.deeplinkMap.find(deeplink => {
			return deeplink.path.some(path => startParams.deeplink.indexOf(path) > -1)
		})

		if (matchedDeeplink) {
			openEitriApp(matchedDeeplink.slug, matchedDeeplink.params)
			return true
		} else {
			return false
		}
	}

	const openBrowser = async startParams => {
		try {
			let { deeplink } = startParams

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

	return (
        <Page className="w-screen h-screen">
            <View className="pt-8 w-full h-full">
				<Loading />
			</View>
        </Page>
	)
}

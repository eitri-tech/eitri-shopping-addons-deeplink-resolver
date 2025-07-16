import Eitri from 'eitri-bifrost'
import { navigateHome, navigateSearch, navigateToCategory, openProductBySlug } from './NavigationService'

export const deeplinkActionsExecutor = content => {
	if (!content || !content.action) {
		console.error('Deeplink action inválida ou ausente:', content)
		return false
	}

	const { action, value, title = '' } = content

	try {
		switch (action) {
			case 'search':
				navigateSearch(value)
				break
			case 'collection':
				navigateHome(value, title, 'productClusterIds')
				break
			case 'category':
				navigateToCategory(value, title)
				break
			case 'brand':
				navigateHome(value, title, 'brand')
				break
			case 'product':
				openProductBySlug(value)
				break
			default:
				console.error(`Unknown action type: ${action}`)
				Eitri.close()
				return false
		}
	} catch (error) {
		console.error('Erro ao executar deeplink:', error)
		return false
	}
}

interface GoogleReviewData {
  rating: number
  reviewCount: number
  reviews: Array<{
    author_name: string
    author_url: string
    language: string
    original_language: string
    profile_photo_url: string
    rating: number
    relative_time_description: string
    text: string
    time: number
    translated: boolean
  }>
  placeId: string
  photos: string[]
  name: string
  address: string
  website?: string
  phone?: string
  types: string[]
}

interface GoogleReviewsResponse {
  success: boolean
  data?: GoogleReviewData
  error?: string
}

class GoogleReviewsClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/google-reviews'
  }

  /**
   * Busca reviews do Google para um estabelecimento
   */
  async getBusinessReviews(params: {
    businessName?: string
    address?: string
    placeId?: string
  }): Promise<GoogleReviewsResponse> {
    try {
      console.log('ðŸŒŸ Buscando reviews do Google:', params)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        if (response.status === 503) {
          console.warn('š ï¸ Google Places API ná£o configurada')
          return {
            success: false,
            error: 'Funcionalidade de reviews do Google ná£o está¡ configurada'
          }
        }
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data: GoogleReviewsResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na API')
      }

      console.log('œ… Reviews obtidos:', data.data)
      return data

    } catch (error) {
      console.error('Œ Erro ao buscar reviews:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reviews'
      }
    }
  }

  /**
   * Busca reviews para máºltiplos estabelecimentos (para comparaá§á£o)
   */
  async getMultipleBusinessReviews(businesses: Array<{
    name: string
    address?: string
    placeId?: string
  }>): Promise<Array<GoogleReviewsResponse & { businessName: string }>> {
    const results = []

    for (const business of businesses) {
      try {
        const result = await this.getBusinessReviews({
          businessName: business.name,
          address: business.address,
          placeId: business.placeId
        })

        results.push({
          ...result,
          businessName: business.name
        })

      } catch (error) {
        console.error(`Œ Erro ao buscar reviews para ${business.name}:`, error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          businessName: business.name
        })
      }

      // Aguardar um pouco entre requisiá§áµes para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
  }
}

// Singleton instance
export const googleReviewsClient = new GoogleReviewsClient()

// Tipos exportados
export type { GoogleReviewData, GoogleReviewsResponse } 

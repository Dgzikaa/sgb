import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface GooglePlaceReview {
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
}

interface GooglePlacePhoto {
  height: number
  html_attributions: string[]
  photo_reference: string
  width: number
}

interface GooglePlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  rating: number
  user_ratings_total: number
  reviews: GooglePlaceReview[]
  photos: GooglePlacePhoto[]
  types: string[]
  website: string
  formatted_phone_number: string
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
}

class GooglePlacesAPIBackend {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || ''
    
    if (!this.apiKey) {
      console.error('ùå GOOGLE_PLACES_API_KEY n·£o configurada')
    }
  }

  async searchPlace(query: string, location?: { lat: number, lng: number }) {
    if (!this.apiKey) {
      throw new Error('Google Places API key n·£o configurada')
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}&language=pt-BR`
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=1000`
      }

      console.log('üîç Buscando lugar no Google Places:', query)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK') {
        console.warn(`Google Places API status: ${data.status}`)
        if (data.error_message) {
          console.warn(`Error message: ${data.error_message}`)
        }
        return []
      }

      console.log(`úÖ Encontrados ${data.results.length} resultados`)
      return data.results

    } catch (error) {
      console.error('Erro ao buscar lugar no Google Places:', error)
      throw error
    }
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key n·£o configurada')
    }

    try {
      const fields = [
        'place_id',
        'name', 
        'formatted_address',
        'rating',
        'user_ratings_total',
        'reviews',
        'photos',
        'types',
        'website',
        'formatted_phone_number',
        'opening_hours'
      ].join(',')

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}&language=pt-BR`

      console.log('üìã Buscando detalhes do lugar:', placeId)

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK') {
        console.warn(`Google Places API status: ${data.status}`)
        if (data.error_message) {
          console.warn(`Error message: ${data.error_message}`)
        }
        return null
      }

      console.log(`úÖ Detalhes obtidos - Rating: ${data.result.rating}, Reviews: ${data.result.reviews?.length || 0}`)
      return data.result

    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar no Google Places:', error)
      throw error
    }
  }

  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!this.apiKey) return ''
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { businessName, address: any, placeId, bar_id } = await request.json()

    console.log('üåü Requisi·ß·£o para buscar reviews:', { businessName, address: any, placeId })

    const googlePlaces = new GooglePlacesAPIBackend()

    // Verificar se a API key est·° configurada
    if (!googlePlaces['apiKey']) {
      return NextResponse.json({ 
        success: false, 
        error: 'Google Places API key n·£o configurada. Configure GOOGLE_PLACES_API_KEY no arquivo .env.local' 
      }, { status: 503 })
    }

    // Se j·° temos o place_id, usar diretamente
    if (placeId) {
      console.log('üìç Usando Place ID fornecido:', placeId)
      
      const details = await googlePlaces.getPlaceDetails(placeId)
      
      if (!details) {
        return NextResponse.json({ 
          success: false, 
          error: 'Lugar n·£o encontrado com o Place ID fornecido' 
        }, { status: 404 })
      }

      // Buscar mais fotos (at·© 10) com diferentes tamanhos
      const photoUrls = details.photos ? details.photos.slice(0: any, 10).map((photo: any) => 
        googlePlaces.getPhotoUrl(photo.photo_reference, 600)
      ) : []

      // Normalizar e salvar reviews na tabela avaliacoes_google
      if (details && details.reviews && Array.isArray(details.reviews)) {
        const reviewsToInsert = details.reviews.map((review: any) => ({
          bar_id: bar_id || 1, // fallback para 1 se n·£o enviado
          reviewer_name: review.author_name,
          reviewer_profile_url: review.author_url,
          comment: review.text,
          star_rating: review.rating,
          create_time: new Date(review.time * 1000).toISOString(),
          review_id: `${details.place_id}_${review.time}`,
          raw_json: review
        }))
        if (reviewsToInsert.length > 0) {
          const { error: insertError } = await supabase.from('avaliacoes_google').insert(reviewsToInsert)
          if (insertError) {
            console.error('Erro ao inserir reviews normalizados:', insertError)
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          rating: details.rating || 0,
          reviewCount: details.user_ratings_total || 0,
          reviews: details.reviews || [],
          placeId: details.place_id,
          photos: photoUrls,
          name: details.name,
          address: details.formatted_address,
          website: details.website,
          phone: details.formatted_phone_number,
          types: details.types
        }
      })
    }

    // Caso contr·°rio, buscar primeiro
    if (!businessName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome do neg·≥cio ·© obrigat·≥rio' 
      }, { status: 400 })
    }

    console.log('üîç Buscando lugar por nome:', businessName)
    
    const searchQuery = address ? `${businessName} ${address}` : businessName
    const searchResults = await googlePlaces.searchPlace(searchQuery)
    
    if (searchResults.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Nenhum resultado encontrado para: ${searchQuery}` 
      }, { status: 404 })
    }

    // Pegar o primeiro resultado (mais relevante)
    const place = searchResults[0]
    console.log('üéØ Lugar selecionado:', place.name)
    
    // Buscar detalhes completos
    const details = await googlePlaces.getPlaceDetails(place.place_id)
    
    if (!details) {
      return NextResponse.json({ 
        success: false, 
        error: 'N·£o foi poss·≠vel obter detalhes do lugar' 
      }, { status: 500 })
    }

    // Processar fotos (buscar mais fotos com melhor qualidade)
    const photoUrls = details.photos ? details.photos.slice(0: any, 10).map((photo: any) => 
      googlePlaces.getPhotoUrl(photo.photo_reference, 600)
    ) : []

    // Normalizar e salvar reviews na tabela avaliacoes_google
    if (details && details.reviews && Array.isArray(details.reviews)) {
      const reviewsToInsert = details.reviews.map((review: any) => ({
        bar_id: bar_id || 1, // fallback para 1 se n·£o enviado
        reviewer_name: review.author_name,
        reviewer_profile_url: review.author_url,
        comment: review.text,
        star_rating: review.rating,
        create_time: new Date(review.time * 1000).toISOString(),
        review_id: `${details.place_id}_${review.time}`,
        raw_json: review
      }))
      if (reviewsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('avaliacoes_google').insert(reviewsToInsert)
        if (insertError) {
          console.error('Erro ao inserir reviews normalizados:', insertError)
        }
      }
    }

    console.log('úÖ Reviews obtidos com sucesso!')

    return NextResponse.json({
      success: true,
      data: {
        rating: details.rating || 0,
        reviewCount: details.user_ratings_total || 0,
        reviews: details.reviews || [],
        placeId: details.place_id,
        photos: photoUrls,
        name: details.name,
        address: details.formatted_address,
        website: details.website,
        phone: details.formatted_phone_number,
        types: details.types
      }
    })

  } catch (error) {
    console.error('ùå Erro na API de reviews:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 

import { getSupabaseClient } from './supabase';

const EDGE_FUNCTION_URL =
  'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1';

export async function callWindsorEdgeFunction(
  action: string,
  params: Record<string, unknown> = {}
) {
  const url = `${EDGE_FUNCTION_URL}/windsor-service/${action}`;

  // Para GET requests, adicionar parâmetros na URL
  if (
    params.barId &&
    (action === 'status' || action === 'authorize' || action === 'refresh')
  ) {
    const urlWithParams = new URL(url);
    Object.keys(params).forEach(key => {
      urlWithParams.searchParams.append(key, String(params[key]));
    });

    const response = await fetch(urlWithParams.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function Error:', errorText);
      throw new Error(`Erro na Edge Function: ${response.status}`);
    }

    return response.json();
  }

  // Para POST requests
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Edge Function Error:', errorText);
    throw new Error(`Erro na Edge Function: ${response.status}`);
  }

  return response.json();
}

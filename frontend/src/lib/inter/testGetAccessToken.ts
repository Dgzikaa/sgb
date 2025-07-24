import { getInterAccessToken } from './getAccessToken'

async function test() {
  try {
    const token = await getInterAccessToken()
    console.log('Token gerado com sucesso:', token)
  } catch (err) {
    console.error('Erro ao gerar token:', err)
  }
}

test() 
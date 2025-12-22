const token = 'gti_prod_9b8e09ccd2685ed580bacb2';
const hoje = new Date();
const inicio = new Date(hoje);
inicio.setDate(hoje.getDate() - 7);
const startDate = inicio.toISOString().split('T')[0];
const endDate = hoje.toISOString().split('T')[0];

console.log('Token:', token);
console.log('Periodo:', startDate, 'a', endDate);
console.log('Testando API Getin diretamente...');

const url = 'https://api.getinapis.com/apis/v2/reservations?start_date=' + startDate + '&end_date=' + endDate + '&page=1&per_page=10';

fetch(url, {
  method: 'GET',
  headers: {
    'apiKey': token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status, r.statusText);
  return r.json();
})
.then(data => {
  if (data.success) {
    console.log('SUCESSO! Reservas encontradas:', data.data?.length || 0);
    if (data.data && data.data[0]) {
      console.log('Primeira reserva:', data.data[0].customer_name, '-', data.data[0].date);
    }
  } else {
    console.log('Resposta:', JSON.stringify(data, null, 2));
  }
})
.catch(err => console.error('Erro:', err));


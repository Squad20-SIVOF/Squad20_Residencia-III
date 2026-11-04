// Formatadores compartilhados para moeda, datas e quilometragem.
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function formatKm(value) {
  return `${new Intl.NumberFormat('pt-BR').format(value)} km`;
}

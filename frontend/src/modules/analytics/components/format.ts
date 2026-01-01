export function formatNumber(n: number | null | undefined) {
  const v = typeof n === 'number' ? n : 0;
  return v.toLocaleString('pt-BR');
}

export function formatMoneyBRL(n: number | null | undefined) {
  const v = typeof n === 'number' ? n : 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

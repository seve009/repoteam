export function formattaMonete(n) {
  const valore = Math.round(Number(n) || 0)
  const segno = valore < 0 ? '−' : ''
  return segno + new Intl.NumberFormat('it-IT').format(Math.abs(valore))
}

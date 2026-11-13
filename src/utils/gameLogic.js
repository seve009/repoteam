import {
  ASTA,
  AZIONI_PER_AFFITTO,
  BOT,
  CASE,
  CATALOGO,
  CATALOGO_MAP,
  MONETE_INIZIALI,
  RARITA,
  SCAVO,
  SINERGIA,
  VENDITA,
  casaById,
  raritaSuccessiva,
} from './gameData.js'

export function mulberry32(seme) {
  let a = seme >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function vicini(indice, lato) {
  const x = indice % lato
  const y = Math.floor(indice / lato)
  const celle = []
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= lato || ny >= lato) continue
      celle.push(ny * lato + nx)
    }
  }
  return celle
}

function mescola(lista, rng) {
  for (let i = lista.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const scambio = lista[i]
    lista[i] = lista[j]
    lista[j] = scambio
  }
  return lista
}

export function creaScavo(primo, rng = Math.random) {
  const { lato, trappole, pepite } = SCAVO
  const totale = lato * lato
  const vietate = new Set([primo, ...vicini(primo, lato)])
  const libere = []
  for (let i = 0; i < totale; i += 1) {
    if (!vietate.has(i)) libere.push(i)
  }
  mescola(libere, rng)
  const tipi = Array(totale).fill('vuoto')
  for (let i = 0; i < trappole; i += 1) tipi[libere[i]] = 'trappola'
  for (let i = 0; i < pepite; i += 1) tipi[libere[trappole + i]] = 'pepita'
  const vicine = tipi.map((tipo, indice) => {
    if (tipo === 'trappola') return 0
    return vicini(indice, lato).filter((j) => tipi[j] === 'trappola').length
  })
  return { lato, tipi, vicine }
}

export function rivela(aperti, tipi, vicine, lato, indice) {
  const next = aperti.slice()
  if (next[indice]) return { aperti: next, trappola: false, pepite: 0 }
  if (tipi[indice] === 'trappola') {
    tipi.forEach((tipo, i) => {
      if (tipo === 'trappola') next[i] = true
    })
    return { aperti: next, trappola: true, pepite: 0 }
  }
  let pepite = 0
  const pila = [indice]
  while (pila.length) {
    const corrente = pila.pop()
    if (next[corrente] || tipi[corrente] === 'trappola') continue
    next[corrente] = true
    if (tipi[corrente] === 'pepita') pepite += 1
    if (tipi[corrente] === 'vuoto' && vicine[corrente] === 0) {
      for (const vicino of vicini(corrente, lato)) {
        if (!next[vicino]) pila.push(vicino)
      }
    }
  }
  return { aperti: next, trappola: false, pepite }
}

export function zonaVerde(larghezza, rng = Math.random) {
  const margine = 0.04
  const spazio = Math.max(0, 1 - larghezza - margine * 2)
  return { inizio: margine + rng() * spazio, larghezza }
}

export function nelVerde(pos, zona) {
  return pos >= zona.inizio && pos <= zona.inizio + zona.larghezza
}

export function pescaRarita(pesi, rng = Math.random) {
  const voci = Object.entries(pesi).filter(([, peso]) => peso > 0)
  const totale = voci.reduce((somma, [, peso]) => somma + peso, 0)
  let lancio = rng() * totale
  for (const [nome, peso] of voci) {
    lancio -= peso
    if (lancio <= 0) return nome
  }
  return voci[voci.length - 1][0]
}

export function pescaCimelioDiRarita(rarita, rng = Math.random) {
  const pool = CATALOGO.filter((pezzo) => pezzo.rarita === rarita)
  return pool[Math.floor(rng() * pool.length)]
}

export function preparaLotto(rng = Math.random) {
  const rarita = pescaRarita(ASTA.pesi, rng)
  const cimelio = pescaCimelioDiRarita(rarita, rng)
  const valore = cimelio.valoreBase
  const base = Math.max(15, Math.round(valore * (0.32 + rng() * 0.22)))
  const incremento = Math.max(8, Math.round(valore * 0.08))
  return { cimelio, base, incremento }
}

export function botVuole(botId, prossimoPrezzo, valore, rng = Math.random) {
  const bot = BOT[botId]
  if (!bot || prossimoPrezzo > valore * bot.tetto) return false
  return rng() >= bot.esitazione
}

export function saldoAsta(valore, prezzo, vinta) {
  if (!vinta) return 0
  return valore - prezzo
}

export function prezzoVendita(cimelio) {
  return Math.round(cimelio.valoreBase * VENDITA)
}

export function haCimeli(inventario) {
  return Object.values(inventario).some((n) => n > 0)
}

export function copieEsposte(esposti, id) {
  return esposti.reduce((n, voce) => n + (voce === id ? 1 : 0), 0)
}

export function gruppiSet(esposti) {
  const conteggi = {}
  for (const id of esposti) {
    if (!id || !CATALOGO_MAP[id]) continue
    const set = CATALOGO_MAP[id].set
    conteggi[set] = (conteggi[set] || 0) + 1
  }
  return conteggi
}

export function setSinergici(esposti) {
  return Object.entries(gruppiSet(esposti))
    .filter(([, n]) => n >= SINERGIA)
    .map(([set]) => set)
}

export function calcolaRendita(esposti) {
  const bonus = new Set(setSinergici(esposti))
  let totale = 0
  for (const id of esposti) {
    if (!id || !CATALOGO_MAP[id]) continue
    const pezzo = CATALOGO_MAP[id]
    totale += bonus.has(pezzo.set) ? pezzo.renditaPassiva * 2 : pezzo.renditaPassiva
  }
  return totale
}

export function calcolaPrestigio(esposti) {
  const bonus = new Set(setSinergici(esposti))
  let totale = 0
  for (const id of esposti) {
    if (!id || !CATALOGO_MAP[id]) continue
    const pezzo = CATALOGO_MAP[id]
    const base = RARITA[pezzo.rarita].prestigio
    totale += bonus.has(pezzo.set) ? base * 2 : base
  }
  return totale
}

export function statoIniziale() {
  const casa = CASE[0]
  return {
    monete: MONETE_INIZIALI,
    azioni: 0,
    casaId: casa.id,
    casePossedute: [casa.id],
    inventario: {},
    esposti: Array(casa.slot).fill(null),
    scoperti: [],
  }
}

function aggiungiCopie(inventario, ids) {
  const next = { ...inventario }
  for (const id of ids) {
    if (!CATALOGO_MAP[id]) continue
    next[id] = (next[id] || 0) + 1
  }
  return next
}

function unisciScoperti(scoperti, ids) {
  const set = new Set(scoperti)
  for (const id of ids) {
    if (CATALOGO_MAP[id]) set.add(id)
  }
  return [...set]
}

function ridimensiona(esposti, slot) {
  const next = esposti.slice(0, slot)
  while (next.length < slot) next.push(null)
  return next
}

export function concludiAzione(stato, delta, ids = []) {
  if (stato.monete < 0) return { stato, evento: null }
  const inventario = aggiungiCopie(stato.inventario, ids)
  const scoperti = unisciScoperti(stato.scoperti, ids)
  let monete = stato.monete + delta
  const azioni = stato.azioni + 1
  let evento = null
  if (azioni % AZIONI_PER_AFFITTO === 0) {
    const rendita = calcolaRendita(stato.esposti)
    const affitto = casaById(stato.casaId).affitto
    const netto = rendita - affitto
    if (monete + netto < 0 && !haCimeli(inventario)) {
      monete += rendita
      evento = { rendita, affitto: 0, sospeso: true }
    } else {
      monete += netto
      evento = { rendita, affitto, sospeso: false }
    }
  }
  if (monete < 0 && !haCimeli(inventario)) monete = 0
  return {
    stato: { ...stato, monete, azioni, inventario, scoperti },
    evento,
  }
}

export function vendi(stato, id) {
  const pezzo = CATALOGO_MAP[id]
  if (!pezzo || (stato.inventario[id] || 0) < 1) return stato
  const inventario = { ...stato.inventario, [id]: stato.inventario[id] - 1 }
  if (inventario[id] <= 0) delete inventario[id]
  let esposti = stato.esposti
  const mostrati = copieEsposte(esposti, id)
  const rimasti = inventario[id] || 0
  if (mostrati > rimasti) {
    let daTogliere = mostrati - rimasti
    esposti = esposti.map((voce) => {
      if (voce === id && daTogliere > 0) {
        daTogliere -= 1
        return null
      }
      return voce
    })
  }
  return {
    ...stato,
    inventario,
    esposti,
    monete: stato.monete + prezzoVendita(pezzo),
  }
}

export function fondi(stato, id, nuovoId) {
  const pezzo = CATALOGO_MAP[id]
  const nuovo = CATALOGO_MAP[nuovoId]
  if (!pezzo || !nuovo) return stato
  if ((stato.inventario[id] || 0) < 3) return stato
  if (!raritaSuccessiva(pezzo.rarita) || nuovo.rarita !== raritaSuccessiva(pezzo.rarita)) return stato
  const inventario = { ...stato.inventario, [id]: stato.inventario[id] - 3 }
  if (inventario[id] <= 0) delete inventario[id]
  inventario[nuovoId] = (inventario[nuovoId] || 0) + 1
  let esposti = stato.esposti
  const mostrati = copieEsposte(esposti, id)
  const rimasti = inventario[id] || 0
  if (mostrati > rimasti) {
    let daTogliere = mostrati - rimasti
    esposti = esposti.map((voce) => {
      if (voce === id && daTogliere > 0) {
        daTogliere -= 1
        return null
      }
      return voce
    })
  }
  return {
    ...stato,
    inventario,
    esposti,
    scoperti: unisciScoperti(stato.scoperti, [nuovoId]),
  }
}

export function esponi(stato, id, slot) {
  const casa = casaById(stato.casaId)
  if (!CATALOGO_MAP[id]) return stato
  if (slot < 0 || slot >= casa.slot) return stato
  if (stato.esposti[slot]) return stato
  const liberi = (stato.inventario[id] || 0) - copieEsposte(stato.esposti, id)
  if (liberi < 1) return stato
  const esposti = stato.esposti.slice()
  esposti[slot] = id
  return { ...stato, esposti }
}

export function rimuovi(stato, slot) {
  if (slot < 0 || slot >= stato.esposti.length) return stato
  if (!stato.esposti[slot]) return stato
  const esposti = stato.esposti.slice()
  esposti[slot] = null
  return { ...stato, esposti }
}

export function puoComprareCasa(stato, id) {
  const indice = CASE.findIndex((casa) => casa.id === id)
  if (indice <= 0) return false
  if (stato.casePossedute.includes(id)) return false
  if (!stato.casePossedute.includes(CASE[indice - 1].id)) return false
  if (stato.monete < 0 || stato.monete < CASE[indice].costo) return false
  if (calcolaPrestigio(stato.esposti) < CASE[indice].prestigioRichiesto) return false
  return true
}

export function compraCasa(stato, id) {
  if (!puoComprareCasa(stato, id)) return stato
  const casa = casaById(id)
  return {
    ...stato,
    monete: stato.monete - casa.costo,
    casaId: id,
    casePossedute: [...stato.casePossedute, id],
    esposti: ridimensiona(stato.esposti, casa.slot),
  }
}

export function selezionaCasa(stato, id) {
  if (!stato.casePossedute.includes(id)) return stato
  const casa = casaById(id)
  return {
    ...stato,
    casaId: id,
    esposti: ridimensiona(stato.esposti, casa.slot),
  }
}

export function normalizza(raw) {
  const base = statoIniziale()
  if (!raw || typeof raw !== 'object') return base
  const caseValide = new Set(CASE.map((casa) => casa.id))
  const idsValidi = new Set(CATALOGO.map((pezzo) => pezzo.id))
  const casePossedute = Array.isArray(raw.casePossedute)
    ? raw.casePossedute.filter((id) => caseValide.has(id))
    : []
  if (!casePossedute.includes(base.casaId)) casePossedute.unshift(base.casaId)
  const casaId = caseValide.has(raw.casaId) && casePossedute.includes(raw.casaId)
    ? raw.casaId
    : base.casaId
  const casa = casaById(casaId)
  const inventario = {}
  if (raw.inventario && typeof raw.inventario === 'object') {
    for (const [id, n] of Object.entries(raw.inventario)) {
      if (!idsValidi.has(id)) continue
      const quantita = Math.floor(Number(n))
      if (quantita > 0) inventario[id] = quantita
    }
  }
  const grezzi = Array.isArray(raw.esposti) ? raw.esposti : []
  const esposti = Array(casa.slot).fill(null)
  const usate = {}
  for (let i = 0; i < casa.slot; i += 1) {
    const id = grezzi[i]
    if (!idsValidi.has(id)) continue
    usate[id] = (usate[id] || 0) + 1
    if (usate[id] > (inventario[id] || 0)) continue
    esposti[i] = id
  }
  const scoperti = new Set(
    Array.isArray(raw.scoperti) ? raw.scoperti.filter((id) => idsValidi.has(id)) : [],
  )
  for (const id of Object.keys(inventario)) scoperti.add(id)
  const moneteLette = Number(raw.monete)
  const azioniLette = Number(raw.azioni)
  return {
    monete: Number.isFinite(moneteLette) ? Math.round(moneteLette) : base.monete,
    azioni: Number.isFinite(azioniLette) && azioniLette >= 0 ? Math.floor(azioniLette) : 0,
    casaId,
    casePossedute,
    inventario,
    esposti,
    scoperti: [...scoperti],
  }
}

export function riduci(stato, azione) {
  switch (azione.type) {
    case 'CONCLUSIONE':
      return concludiAzione(stato, azione.delta || 0, azione.ids || [])
    case 'VENDI':
      return { stato: vendi(stato, azione.id), evento: null }
    case 'FONDI':
      return { stato: fondi(stato, azione.id, azione.nuovoId), evento: null }
    case 'ESPONI':
      return { stato: esponi(stato, azione.id, azione.slot), evento: null }
    case 'RIMUOVI':
      return { stato: rimuovi(stato, azione.slot), evento: null }
    case 'COMPRA_CASA':
      return { stato: compraCasa(stato, azione.id), evento: null }
    case 'SELEZIONA_CASA':
      return { stato: selezionaCasa(stato, azione.id), evento: null }
    case 'RESET':
      return { stato: statoIniziale(), evento: null }
    default:
      return { stato, evento: null }
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CATALOGO_MAP,
  CHIAVE_SALVATAGGIO,
  PACCHI,
  casaById,
  raritaSuccessiva,
} from '../utils/gameData.js'
import {
  calcolaPrestigio,
  calcolaRendita,
  copieEsposte,
  normalizza,
  pescaCimelioDiRarita,
  pescaRarita,
  riduci,
  setSinergici,
  statoIniziale,
} from '../utils/gameLogic.js'

function carica() {
  try {
    const grezzo = localStorage.getItem(CHIAVE_SALVATAGGIO)
    if (!grezzo) return statoIniziale()
    return normalizza(JSON.parse(grezzo))
  } catch {
    return statoIniziale()
  }
}

export function useGameState() {
  const [stato, setStato] = useState(carica)
  const [evento, setEvento] = useState(null)
  const ref = useRef(stato)

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE_SALVATAGGIO, JSON.stringify(stato))
    } catch {
      /* il browser ha rifiutato il salvataggio */
    }
  }, [stato])

  useEffect(() => {
    if (!evento) return undefined
    const timer = setTimeout(() => setEvento(null), 4600)
    return () => clearTimeout(timer)
  }, [evento])

  const applica = useCallback((azione) => {
    const risultato = riduci(ref.current, azione)
    ref.current = risultato.stato
    setStato(risultato.stato)
    if (risultato.evento) setEvento(risultato.evento)
    return risultato
  }, [])

  const concludi = useCallback((delta, ids = []) => {
    if (ref.current.monete < 0) return null
    return applica({ type: 'CONCLUSIONE', delta, ids })
  }, [applica])

  const compraPacco = useCallback((packId) => {
    const pacco = PACCHI.find((voce) => voce.id === packId)
    if (!pacco || ref.current.monete < pacco.costo || ref.current.monete < 0) return null
    const azioniPrima = ref.current.azioni
    const ids = [0, 1, 2].map(() => pescaCimelioDiRarita(pescaRarita(pacco.pesi), Math.random).id)
    applica({ type: 'CONCLUSIONE', delta: -pacco.costo, ids })
    if (ref.current.azioni === azioniPrima) return null
    return ids.map((id) => CATALOGO_MAP[id])
  }, [applica])

  const fondi = useCallback((id) => {
    const pezzo = CATALOGO_MAP[id]
    const prossima = pezzo ? raritaSuccessiva(pezzo.rarita) : null
    if (!prossima || (ref.current.inventario[id] || 0) < 3) return null
    const nuovo = pescaCimelioDiRarita(prossima, Math.random)
    applica({ type: 'FONDI', id, nuovoId: nuovo.id })
    return nuovo
  }, [applica])

  const reset = useCallback(() => {
    const fresco = statoIniziale()
    ref.current = fresco
    setStato(fresco)
    setEvento(null)
    try {
      localStorage.removeItem(CHIAVE_SALVATAGGIO)
    } catch {
      /* niente da cancellare */
    }
  }, [])

  const casa = casaById(stato.casaId)
  const inDebito = stato.monete < 0

  return {
    stato,
    evento,
    inDebito,
    casa,
    rendita: calcolaRendita(stato.esposti),
    prestigio: calcolaPrestigio(stato.esposti),
    sinergie: setSinergici(stato.esposti),
    chiudiEvento: () => setEvento(null),
    incassa: (importo) => concludi(importo),
    fallisci: () => concludi(0),
    concludiAsta: (delta) => concludi(delta),
    compraPacco,
    vendi: (id) => applica({ type: 'VENDI', id }),
    fondi,
    esponi: (id, slot) => applica({ type: 'ESPONI', id, slot }),
    rimuovi: (slot) => applica({ type: 'RIMUOVI', slot }),
    compraCasa: (id) => applica({ type: 'COMPRA_CASA', id }),
    selezionaCasa: (id) => applica({ type: 'SELEZIONA_CASA', id }),
    reset,
    copie: (id) => stato.inventario[id] || 0,
    disponibili: (id) => (stato.inventario[id] || 0) - copieEsposte(stato.esposti, id),
  }
}

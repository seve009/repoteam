import { useEffect, useRef, useState } from 'react'
import { SCASSO } from '../../utils/gameData.js'
import { nelVerde, zonaVerde } from '../../utils/gameLogic.js'
import { formattaMonete } from '../../utils/format.js'

export default function Scasso({ bloccato, onVinto, onFallito }) {
  const [inCorsa, setInCorsa] = useState(false)
  const [cilindro, setCilindro] = useState(0)
  const [zona, setZona] = useState(null)
  const [esito, setEsito] = useState(null)
  const pos = useRef(0)
  const t0 = useRef(0)
  const cursore = useRef(null)
  const inCorsaRef = useRef(false)
  const cilindroRef = useRef(0)
  const zonaRef = useRef(null)
  const onVintoRef = useRef(onVinto)
  const onFallitoRef = useRef(onFallito)
  useEffect(() => {
    onVintoRef.current = onVinto
    onFallitoRef.current = onFallito
  })

  useEffect(() => () => {
    if (inCorsaRef.current) {
      inCorsaRef.current = false
      onFallitoRef.current()
    }
  }, [])

  useEffect(() => {
    if (!inCorsa) return undefined
    t0.current = 0
    let raf = 0
    const loop = (now) => {
      if (!t0.current) t0.current = now
      const velocita = SCASSO.velocita[cilindroRef.current]
      const x = (Math.sin(((now - t0.current) / 1000) * velocita) + 1) / 2
      pos.current = x
      if (cursore.current) cursore.current.style.left = `${x * 100}%`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [inCorsa, cilindro])

  function scatta() {
    if (!inCorsaRef.current || !zonaRef.current) return
    if (!nelVerde(pos.current, zonaRef.current)) {
      inCorsaRef.current = false
      setInCorsa(false)
      setEsito('fallito')
      onFallitoRef.current()
      return
    }
    if (cilindroRef.current >= SCASSO.cilindri - 1) {
      inCorsaRef.current = false
      setInCorsa(false)
      setEsito('vinto')
      onVintoRef.current()
      return
    }
    const prossimo = cilindroRef.current + 1
    const nuova = zonaVerde(SCASSO.larghezze[prossimo])
    cilindroRef.current = prossimo
    zonaRef.current = nuova
    setCilindro(prossimo)
    setZona(nuova)
  }

  useEffect(() => {
    if (!inCorsa) return undefined
    const tasto = (evento) => {
      if (evento.repeat) return
      if (evento.code !== 'Space' && evento.code !== 'Enter') return
      evento.preventDefault()
      scatta()
    }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [inCorsa, cilindro, zona])

  function avvia() {
    if (bloccato || inCorsaRef.current) return
    const prima = zonaVerde(SCASSO.larghezze[0])
    cilindroRef.current = 0
    zonaRef.current = prima
    inCorsaRef.current = true
    setCilindro(0)
    setZona(prima)
    setEsito(null)
    setInCorsa(true)
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] text-gold">SCASSO DEL CAVEAU</p>
      <h2 className="mt-1 font-display text-3xl">Tre cilindri, una zona verde</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
        Il cursore oscilla. Scatta quando è nel verde: la fascia si stringe a ogni cilindro.
        Tre centri pagano {formattaMonete(SCASSO.premio)}. Un errore chiude il caveau a mani vuote.
        Spazio, invio, o il pulsante.
      </p>

      <div className="mt-6 flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((indice) => {
          let classe = 'lampada'
          if (esito === 'vinto' || indice < cilindro) classe += ' accesa'
          else if (esito === 'fallito' && indice === cilindro) classe += ' rossa'
          else if (inCorsa && indice === cilindro) classe += ' attiva'
          return <span key={indice} className={classe} />
        })}
      </div>

      <div className="barra-caveau mt-4">
        {zona && (
          <span
            className="zona-verde"
            style={{ left: `${zona.inizio * 100}%`, width: `${zona.larghezza * 100}%` }}
          />
        )}
        <span ref={cursore} className="ago" style={{ left: '0%' }} />
      </div>

      <p className="mt-4 min-h-6 text-sm">
        {esito === 'vinto' && <span className="text-gold">Caveau aperto. +{formattaMonete(SCASSO.premio)}.</span>}
        {esito === 'fallito' && <span className="text-danger">Cilindro bloccato. Nessun premio.</span>}
        {inCorsa && <span className="text-mute">Cilindro {cilindro + 1} di {SCASSO.cilindri}.</span>}
      </p>

      <div className="mt-4 flex gap-3">
        {!inCorsa && (
          <button type="button" className="btn-oro" onClick={avvia} disabled={bloccato}>
            {esito ? 'Riprova' : 'Avvia il primo cilindro'}
          </button>
        )}
        {inCorsa && (
          <button type="button" className="btn-oro" onPointerDown={(evento) => { evento.preventDefault(); scatta() }}>
            Scatta
          </button>
        )}
      </div>
    </div>
  )
}

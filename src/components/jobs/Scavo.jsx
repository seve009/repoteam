import { useEffect, useRef, useState } from 'react'
import { SCAVO } from '../../utils/gameData.js'
import { creaScavo, rivela } from '../../utils/gameLogic.js'
import { formattaMonete } from '../../utils/format.js'

function boardVuoto(indice) {
  const campo = creaScavo(indice)
  const n = campo.lato * campo.lato
  return {
    ...campo,
    aperti: Array(n).fill(false),
    bandiere: Array(n).fill(false),
    bottino: 0,
    fase: 'scavo',
  }
}

export default function Scavo({ bloccato, onIncassa, onFallito }) {
  const [board, setBoard] = useState(null)
  const boardRef = useRef(null)
  const onFallitoRef = useRef(onFallito)
  const onIncassaRef = useRef(onIncassa)
  useEffect(() => {
    onFallitoRef.current = onFallito
    onIncassaRef.current = onIncassa
  })

  useEffect(() => () => {
    if (boardRef.current?.fase === 'scavo') onFallitoRef.current()
  }, [])

  function pubblica(next, evento) {
    boardRef.current = next
    setBoard(next)
    if (evento === 'trappola') onFallitoRef.current()
    if (evento === 'incasso') onIncassaRef.current(next.bottino)
  }

  function cella(indice, bandiera) {
    if (bloccato) return
    const prev = boardRef.current
    if (prev && prev.fase !== 'scavo') return
    if (!prev && bandiera) return
    const base = prev ?? boardVuoto(indice)
    if (bandiera) {
      if (base.aperti[indice]) return
      const bandiere = base.bandiere.slice()
      bandiere[indice] = !bandiere[indice]
      pubblica({ ...base, bandiere })
      return
    }
    if (base.bandiere[indice] || base.aperti[indice]) return
    const esito = rivela(base.aperti, base.tipi, base.vicine, base.lato, indice)
    if (esito.trappola) {
      pubblica({ ...base, aperti: esito.aperti, bottino: 0, fase: 'trappola' }, 'trappola')
      return
    }
    pubblica({
      ...base,
      aperti: esito.aperti,
      bottino: base.bottino + esito.pepite * SCAVO.valorePepita,
    })
  }

  function incassa() {
    const prev = boardRef.current
    if (!prev || prev.fase !== 'scavo') return
    pubblica({ ...prev, fase: 'incasso' }, 'incasso')
  }

  function nuovo() {
    boardRef.current = null
    setBoard(null)
  }

  const n = SCAVO.lato * SCAVO.lato
  const aperti = board?.aperti
  const bandiere = board?.bandiere
  const fase = board?.fase ?? 'attesa'
  const bottino = board?.bottino ?? 0
  const bandierePiante = bandiere ? bandiere.filter(Boolean).length : 0

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-gold">SCAVO ARCHEOLOGICO</p>
          <h2 className="mt-1 font-display text-3xl">Otto per otto, dieci trappole</h2>
        </div>
        <p className="font-display text-3xl text-gold">{formattaMonete(bottino)}</p>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
        Click sinistro scava. Click destro, o maiusc e click, pianta una bandierina.
        Ci sono {SCAVO.pepite} pepite da {formattaMonete(SCAVO.valorePepita)}. Incassa prima di una trappola: il bottino, altrimenti, resta nella terra.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs tracking-[0.14em] text-mute uppercase">
        <span>Bandierine {bandierePiante}/{SCAVO.trappole}</span>
        {fase === 'trappola' && <span className="text-danger">Trappola. Il bottino è perduto.</span>}
        {fase === 'incasso' && <span className="text-gold">Incassati {formattaMonete(bottino)}.</span>}
      </div>

      <div
        className="mt-4 grid max-w-[520px] grid-cols-8 gap-1.5"
        onContextMenu={(evento) => evento.preventDefault()}
      >
        {Array.from({ length: n }, (_, indice) => {
          const aperto = Boolean(aperti?.[indice])
          const flag = Boolean(bandiere?.[indice])
          const tipo = board?.tipi?.[indice]
          const numero = board?.vicine?.[indice] ?? 0
          let classe = 'zolla'
          let segno = ''
          if (aperto && tipo === 'trappola') {
            classe += ' trappola'
            segno = '×'
          } else if (aperto && tipo === 'pepita') {
            classe += ' pepita'
            segno = '◆'
          } else if (aperto) {
            classe += ' aperta'
            segno = numero > 0 ? String(numero) : ''
          } else if (flag) {
            classe += ' bandiera'
            segno = '⚑'
          }
          return (
            <button
              key={indice}
              type="button"
              className={classe}
              aria-label={`Zolla ${indice + 1}`}
              onClick={(evento) => cella(indice, evento.shiftKey)}
              onContextMenu={(evento) => {
                evento.preventDefault()
                cella(indice, true)
              }}
            >
              {segno}
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex gap-3">
        {fase === 'scavo' && (
          <button type="button" className="btn-oro" onClick={incassa} disabled={bloccato}>
            Incassa e scappa
          </button>
        )}
        {fase !== 'scavo' && fase !== 'attesa' && (
          <button type="button" className="btn" onClick={nuovo}>
            Nuovo scavo
          </button>
        )}
      </div>
    </div>
  )
}

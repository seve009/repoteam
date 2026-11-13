import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PACCHI, RARITA, RARITA_ORDINE, raritaMassima } from '../utils/gameData.js'
import { formattaMonete } from '../utils/format.js'
import RelicCard from './RelicCard.jsx'

const CLASSI = {
  polveroso: 'pacco-polveroso',
  antiquario: 'pacco-antiquario',
  reliquiario: 'pacco-reliquiario',
}

export default function ShopTab({ game }) {
  const [apertura, setApertura] = useState(null)
  const [messaggio, setMessaggio] = useState('')
  const blocco = useRef(false)
  const trascinato = useRef(0)

  function compra(id) {
    if (blocco.current || game.inDebito) {
      if (game.inDebito) setMessaggio('Prima salda il rosso.')
      return
    }
    const presi = game.compraPacco(id)
    if (!presi) {
      setMessaggio('Non hai abbastanza monete.')
      return
    }
    blocco.current = true
    setMessaggio('')
    setApertura({
      pacco: PACCHI.find((pacco) => pacco.id === id),
      cimeli: presi,
      taglio: 0,
      fase: 'sigillo',
      rivelati: 0,
    })
  }

  function taglia(quanto) {
    setApertura((corrente) => {
      if (!corrente || corrente.fase !== 'sigillo') return corrente
      const taglio = Math.min(100, corrente.taglio + quanto)
      return { ...corrente, taglio, fase: taglio >= 100 ? 'carte' : 'sigillo' }
    })
  }

  function rivelaCarta(indice) {
    setApertura((corrente) => {
      if (!corrente || corrente.fase !== 'carte' || indice !== corrente.rivelati) return corrente
      return { ...corrente, rivelati: corrente.rivelati + 1 }
    })
  }

  function chiudi() {
    blocco.current = false
    trascinato.current = 0
    setApertura(null)
  }

  const massima = apertura ? RARITA[raritaMassima(apertura.cimeli)] : null

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] text-gold">BANCO</p>
      <h1 className="mt-2 font-display text-4xl">Tre modi di sperare</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
        Ogni pacco contiene tre cimeli. Comprarlo conta come un’azione. Il colore che scalda il sigillo è la rarità più alta, prima ancora che tu la veda.
      </p>
      {messaggio && <p className="mt-3 text-sm text-danger">{messaggio}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PACCHI.map((pacco) => {
          const somma = Object.values(pacco.pesi).reduce((n, peso) => n + peso, 0)
          return (
            <article key={pacco.id} className={`pacco ${CLASSI[pacco.id]}`}>
              <p className="text-[11px] tracking-[0.22em] text-ivory/70">TRE CIMELI</p>
              <h2 className="mt-2 font-display text-3xl leading-tight">{pacco.nome}</h2>
              <p className="mt-3 min-h-12 text-sm text-ivory/80">{pacco.promessa}</p>
              <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-black/30">
                {RARITA_ORDINE.map((rarita) => (
                  <span
                    key={rarita}
                    style={{ width: `${(pacco.pesi[rarita] / somma) * 100}%`, background: RARITA[rarita].colore }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] tracking-[0.14em] text-ivory/60 uppercase">
                {RARITA_ORDINE.filter((rarita) => pacco.pesi[rarita] > 0).join(' · ')}
              </p>
              <button
                type="button"
                className="btn-oro mt-6"
                disabled={game.inDebito || game.stato.monete < pacco.costo || Boolean(apertura)}
                onClick={() => compra(pacco.id)}
              >
                Apri · {formattaMonete(pacco.costo)}
              </button>
            </article>
          )
        })}
      </div>

      {apertura && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink p-6" role="dialog" aria-modal="true" aria-label="Apertura pacco">
          <div
            className="pointer-events-none absolute h-80 w-80 rounded-full blur-3xl"
            style={{ background: massima.colore, opacity: 0.18 + (apertura.taglio / 100) * 0.55 }}
          />
          {apertura.fase === 'sigillo' ? (
            <div
              className={`pacco relative z-10 w-full max-w-sm cursor-ew-resize select-none ${CLASSI[apertura.pacco.id]}`}
              onPointerDown={(evento) => {
                evento.currentTarget.setPointerCapture(evento.pointerId)
                trascinato.current = 0
              }}
              onPointerMove={(evento) => {
                if (evento.buttons !== 1) return
                trascinato.current += Math.abs(evento.movementX) + Math.abs(evento.movementY)
                if (trascinato.current > 6) {
                  const passo = trascinato.current * 0.28
                  trascinato.current = 0
                  taglia(passo)
                }
              }}
              onPointerUp={() => {
                if (trascinato.current < 12) taglia(14)
                trascinato.current = 0
              }}
            >
              <p className="text-[11px] tracking-[0.22em] text-ivory/70">SIGILLO</p>
              <h2 className="mt-2 font-display text-4xl">{apertura.pacco.nome}</h2>
              <p className="mt-4 text-sm text-ivory/80">Trascina sul sigillo, o clicca, finché non cede.</p>
              <div className="relative mx-auto mt-8 grid h-28 w-28 place-items-center">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: massima.colore, opacity: 0.35 + apertura.taglio / 180 }}
                />
                <span className="absolute h-px bg-ivory" style={{ width: `${apertura.taglio}%` }} />
                <span className="font-display text-sm tracking-[0.2em]">{Math.round(apertura.taglio)}</span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 w-full max-w-3xl">
              <p className="text-center text-[11px] tracking-[0.28em] text-gold">UN CIMELIO ALLA VOLTA</p>
              <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
                {apertura.cimeli.map((cimelio, indice) => {
                  const girata = indice < apertura.rivelati
                  return (
                    <button
                      key={`${cimelio.id}-${indice}`}
                      type="button"
                      className="text-left disabled:opacity-100"
                      disabled={girata || indice !== apertura.rivelati}
                      onClick={() => rivelaCarta(indice)}
                    >
                      <div className={`flip w-full ${girata ? 'girata' : ''}`}>
                        <div className="flip-inner">
                          <div className="faccia retro">
                            <div className="dorso">
                              <p className="font-display text-2xl text-gold">{indice + 1}</p>
                            </div>
                          </div>
                          <div className="faccia fronte">
                            <RelicCard cimelio={cimelio} />
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {apertura.rivelati === 3 && (
                <div className="mt-6 text-center">
                  <button type="button" className="btn-oro" onClick={chiudi}>
                    Nella collezione
                  </button>
                </div>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}

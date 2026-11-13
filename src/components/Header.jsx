import { useEffect, useRef, useState } from 'react'
import { AZIONI_PER_AFFITTO } from '../utils/gameData.js'
import { formattaMonete } from '../utils/format.js'

const VOCI = [
  { id: 'lavori', nome: 'Lavori' },
  { id: 'bustine', nome: 'Bustine' },
  { id: 'casa', nome: 'Casa' },
  { id: 'collezione', nome: 'Collezione' },
]

export default function Header({ tab, onTab, game }) {
  const [aperte, setAperte] = useState(false)
  const [conferma, setConferma] = useState(false)
  const box = useRef(null)
  const verso = game.stato.azioni % AZIONI_PER_AFFITTO

  useEffect(() => {
    if (!aperte) return undefined
    const chiudi = (evento) => {
      if (!box.current?.contains(evento.target)) setAperte(false)
    }
    const tasto = (evento) => {
      if (evento.key === 'Escape') setAperte(false)
    }
    document.addEventListener('mousedown', chiudi)
    document.addEventListener('keydown', tasto)
    return () => {
      document.removeEventListener('mousedown', chiudi)
      document.removeEventListener('keydown', tasto)
    }
  }, [aperte])

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <div className="leading-none">
          <p className="font-display text-xl tracking-[0.18em] text-gold">VAULT & PACKS</p>
          <p className="mt-1 text-[10px] tracking-[0.32em] text-mute">SALA PRIVATA</p>
        </div>

        <nav className="flex gap-1" aria-label="Sezioni">
          {VOCI.map((voce) => {
            const attivo = tab === voce.id
            return (
              <button
                key={voce.id}
                type="button"
                onClick={() => onTab(voce.id)}
                className={`px-3 py-1 text-sm ${attivo ? 'text-gold' : 'text-mute hover:text-ivory'}`}
                aria-current={attivo ? 'page' : undefined}
              >
                {voce.nome}
                <span className={`mt-1 block h-px ${attivo ? 'bg-gold' : 'bg-transparent'}`} />
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <div className="text-right">
            <p className="font-display text-2xl leading-none">{formattaMonete(game.stato.monete)}</p>
            <p className="mt-1 text-[10px] tracking-[0.22em] text-mute">MONETE</p>
          </div>
          <div
            className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 text-center"
            title="Prestigio della casa attuale"
          >
            <span>
              <span className="block font-display text-lg leading-none">{game.prestigio}</span>
              <span className="block text-[8px] tracking-[0.14em] text-mute">PRE</span>
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-ivory">Affitto {formattaMonete(game.casa.affitto)}</p>
            <p className="mt-1 flex justify-end gap-1" aria-label={`Azioni verso l'affitto: ${verso} su ${AZIONI_PER_AFFITTO}`}>
              {Array.from({ length: AZIONI_PER_AFFITTO }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i < verso ? 'bg-gold' : 'bg-line'}`}
                />
              ))}
            </p>
          </div>
          <div className="relative" ref={box}>
            <button
              type="button"
              className="btn"
              aria-expanded={aperte}
              onClick={() => {
                setAperte((v) => !v)
                setConferma(false)
              }}
            >
              Impostazioni
            </button>
            {aperte && (
              <div className="scheda absolute right-0 z-40 mt-2 w-80 p-4 shadow-2xl">
                <p className="font-display text-xl">Impostazioni</p>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  Il salvataggio è automatico, su questo computer. Azioni compiute: {game.stato.azioni}.
                  Cimeli distinti: {game.stato.scoperti.length}.
                </p>
                {!conferma ? (
                  <button type="button" className="btn mt-4" onClick={() => setConferma(true)}>
                    Ricomincia da capo
                  </button>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-ivory">Perdi monete, case e collezione.</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="btn-oro"
                        onClick={() => {
                          game.reset()
                          setConferma(false)
                          setAperte(false)
                        }}
                      >
                        Conferma
                      </button>
                      <button type="button" className="btn" onClick={() => setConferma(false)}>
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

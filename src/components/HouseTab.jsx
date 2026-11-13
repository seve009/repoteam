import { useState } from 'react'
import { CASE, CATALOGO_MAP } from '../utils/gameData.js'
import { prezzoVendita, puoComprareCasa } from '../utils/gameLogic.js'
import { formattaMonete } from '../utils/format.js'
import RelicCard from './RelicCard.jsx'

export default function HouseTab({ game }) {
  const [slotAttivo, setSlotAttivo] = useState(null)
  const casa = game.casa
  const liberi = Object.keys(game.stato.inventario)
    .filter((id) => game.disponibili(id) > 0)
    .map((id) => CATALOGO_MAP[id])

  function motivo(immobile) {
    if (game.stato.casePossedute.includes(immobile.id)) return null
    const indice = CASE.findIndex((voce) => voce.id === immobile.id)
    if (!game.stato.casePossedute.includes(CASE[indice - 1]?.id)) return 'Prima la casa precedente.'
    if (game.prestigio < immobile.prestigioRichiesto) return `Prestigio ${immobile.prestigioRichiesto}.`
    if (game.stato.monete < immobile.costo) return `Servono ${formattaMonete(immobile.costo)}.`
    return null
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] text-gold">IMMOBILI</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl">{casa.nome}</h1>
        <p className="text-sm text-mute">
          Rendita {formattaMonete(game.rendita)} · affitto {formattaMonete(casa.affitto)} · {casa.slot} teche
        </p>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">{casa.descrizione}</p>
      {game.sinergie.length > 0 && (
        <p className="mt-3 text-sm text-gold">
          Sinergia: {game.sinergie.join(', ')}. Rendita e prestigio di quei set sono doppi.
        </p>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CASE.map((immobile) => {
          const posseduta = game.stato.casePossedute.includes(immobile.id)
          const attuale = game.stato.casaId === immobile.id
          const blocco = motivo(immobile)
          return (
            <article key={immobile.id} className={`scheda p-4 ${attuale ? 'border-gold/70' : ''}`}>
              <h2 className="font-display text-2xl leading-tight">{immobile.nome}</h2>
              <p className="mt-2 text-xs text-mute">{immobile.slot} teche · affitto {formattaMonete(immobile.affitto)}</p>
              <p className="mt-2 min-h-12 text-sm text-mute">{immobile.descrizione}</p>
              {attuale && <p className="mt-3 text-sm text-gold">Ci vivi.</p>}
              {!attuale && posseduta && (
                <button type="button" className="btn mt-3" onClick={() => { game.selezionaCasa(immobile.id); setSlotAttivo(null) }}>
                  Vivi qui
                </button>
              )}
              {!posseduta && (
                <>
                  <p className="mt-3 text-xs text-mute">
                    {formattaMonete(immobile.costo)} · prestigio {immobile.prestigioRichiesto}
                  </p>
                  <button
                    type="button"
                    className="btn-oro mt-3"
                    disabled={!puoComprareCasa(game.stato, immobile.id)}
                    onClick={() => { game.compraCasa(immobile.id); setSlotAttivo(null) }}
                  >
                    Acquista
                  </button>
                  {blocco && <p className="mt-2 text-xs text-mute">{blocco}</p>}
                </>
              )}
            </article>
          )
        })}
      </div>

      <h2 className="mt-8 font-display text-2xl">Muro</h2>
      <div className={`mt-4 grid gap-3 ${casa.slot > 8 ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {game.stato.esposti.map((id, slot) => {
          const pezzo = id ? CATALOGO_MAP[id] : null
          const sinergia = Boolean(pezzo && game.sinergie.includes(pezzo.set))
          return (
            <div key={slot}>
              {pezzo ? (
                <div>
                  <RelicCard cimelio={pezzo} sinergia={sinergia} />
                  <button type="button" className="btn mt-2 w-full" onClick={() => game.rimuovi(slot)}>
                    Togli
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSlotAttivo(slot)}
                  className={`flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-dashed text-sm ${slotAttivo === slot ? 'border-gold text-gold' : 'border-line text-mute'}`}
                >
                  Teca {slot + 1}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {slotAttivo !== null && (
        <div className="scheda mt-5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Scegli un cimelio per la teca {slotAttivo + 1}. Le copie già al muro non compaiono.</p>
            <button type="button" className="btn" onClick={() => setSlotAttivo(null)}>Chiudi</button>
          </div>
          {liberi.length === 0 && (
            <p className="mt-3 text-sm text-mute">Nessun cimelio libero.</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {liberi.map((pezzo) => (
              <div key={pezzo.id}>
                <RelicCard
                  cimelio={pezzo}
                  conteggio={game.disponibili(pezzo.id)}
                  onClick={() => {
                    game.esponi(pezzo.id, slotAttivo)
                    setSlotAttivo(null)
                  }}
                />
                <p className="mt-1 text-center text-[11px] text-mute">Vendita {formattaMonete(prezzoVendita(pezzo))}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

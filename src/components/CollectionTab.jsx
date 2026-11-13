import { useState } from 'react'
import { CATALOGO, RARITA, SET_NOMI } from '../utils/gameData.js'
import { prezzoVendita } from '../utils/gameLogic.js'
import { formattaMonete } from '../utils/format.js'
import RelicCard from './RelicCard.jsx'

export default function CollectionTab({ game }) {
  const [setFiltro, setSetFiltro] = useState('Tutti')
  const [scelto, setScelto] = useState(null)
  const [fusione, setFusione] = useState(null)
  const visibili = CATALOGO.filter((pezzo) => setFiltro === 'Tutti' || pezzo.set === setFiltro)
  const dettaglio = CATALOGO.find((pezzo) => pezzo.id === scelto) || null
  const copie = dettaglio ? game.copie(dettaglio.id) : 0
  const scoperto = dettaglio ? game.stato.scoperti.includes(dettaglio.id) : false

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <p className="text-[11px] tracking-[0.28em] text-gold">CODEX</p>
        <h1 className="mt-2 font-display text-4xl">
          {game.stato.scoperti.length} di {CATALOGO.length}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
          Tre copie uguali diventano un cimelio della rarità successiva, pescato tra quelli esistenti. Una copia si vende subito, al {Math.round(0.45 * 100)}% del valore.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {['Tutti', ...SET_NOMI].map((nome) => (
            <button
              key={nome}
              type="button"
              className={`btn ${setFiltro === nome ? 'border-gold text-gold' : ''}`}
              onClick={() => setSetFiltro(nome)}
            >
              {nome}
            </button>
          ))}
        </div>
        {fusione && (
          <p className="mt-4 text-sm text-gold">
            Tre copie si sono sciolte. Entra in collezione: {fusione.nome}.
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibili.map((pezzo) => {
            const note = game.stato.scoperti.includes(pezzo.id)
            return (
              <RelicCard
                key={pezzo.id}
                cimelio={pezzo}
                scoperta={note}
                conteggio={game.copie(pezzo.id)}
                selezionata={scelto === pezzo.id}
                onClick={() => setScelto(pezzo.id)}
              />
            )
          })}
        </div>
      </div>

      <aside className="scheda p-4 lg:sticky lg:top-24">
        {!dettaglio && <p className="text-sm text-mute">Scegli un cimelio del codex.</p>}
        {dettaglio && !scoperto && (
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: RARITA[dettaglio.rarita].colore }}>
              {dettaglio.set} · {dettaglio.rarita}
            </p>
            <h2 className="mt-2 font-display text-3xl">Ancora al buio</h2>
            <p className="mt-3 text-sm text-mute">Non l’hai ancora trovato. Il nome resta coperto.</p>
          </div>
        )}
        {dettaglio && scoperto && (
          <div>
            <p className="text-4xl">{dettaglio.icona}</p>
            <h2 className="mt-2 font-display text-3xl leading-tight">{dettaglio.nome}</h2>
            <p className="mt-1 text-[11px] tracking-[0.16em] uppercase" style={{ color: RARITA[dettaglio.rarita].colore }}>
              {dettaglio.set} · {dettaglio.rarita}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mute">{dettaglio.descrizione}</p>
            <p className="mt-3 text-sm">
              Valore {formattaMonete(dettaglio.valoreBase)} · rendita {dettaglio.renditaPassiva} · copie {copie}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="btn"
                disabled={copie < 1}
                onClick={() => game.vendi(dettaglio.id)}
              >
                Vendi una copia · {formattaMonete(prezzoVendita(dettaglio))}
              </button>
              <button
                type="button"
                className="btn-oro"
                disabled={copie < 3 || dettaglio.rarita === 'Mitico'}
                onClick={() => {
                  const nuovo = game.fondi(dettaglio.id)
                  if (nuovo) {
                    setFusione(nuovo)
                    setScelto(nuovo.id)
                  }
                }}
              >
                Fondi 3 copie
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

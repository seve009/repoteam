import { useState } from 'react'
import { SCASSO } from '../utils/gameData.js'
import Asta from './jobs/Asta.jsx'
import Scasso from './jobs/Scasso.jsx'
import Scavo from './jobs/Scavo.jsx'

const LAVORI = [
  { id: 'scavo', nome: 'Scavo archeologico', testo: 'Campo minato, con le pepite.' },
  { id: 'scasso', nome: 'Scasso del caveau', testo: 'Tre tempi, zero errori.' },
  { id: 'asta', nome: 'Asta e perizia', testo: 'Indizi, bot, e un prezzo.' },
]

export default function JobsTab({ game }) {
  const [lavoro, setLavoro] = useState('scavo')

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
      <div>
        <p className="text-[11px] tracking-[0.28em] text-gold">SALA LAVORI</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">Guadagno difficile</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">
          Ogni lavoro concluso, vinto o perso, è un’azione. Ogni cinque azioni passa l’affitto di {game.casa.nome}.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {LAVORI.map((voce) => {
            const attivo = lavoro === voce.id
            return (
              <button
                key={voce.id}
                type="button"
                onClick={() => setLavoro(voce.id)}
                className={`scheda px-4 py-3 text-left ${attivo ? 'border-gold/70' : ''}`}
              >
                <span className={`block text-sm ${attivo ? 'text-gold' : 'text-ivory'}`}>{voce.nome}</span>
                <span className="mt-1 block text-xs text-mute">{voce.testo}</span>
              </button>
            )
          })}
        </div>
      </div>
      <section className="scheda p-5 sm:p-6">
        {game.inDebito && (
          <p className="mb-4 text-sm text-danger">Il saldo è in rosso. Vendi un cimelio prima di tornare al lavoro.</p>
        )}
        {lavoro === 'scavo' && (
          <Scavo bloccato={game.inDebito} onIncassa={game.incassa} onFallito={game.fallisci} />
        )}
        {lavoro === 'scasso' && (
          <Scasso
            bloccato={game.inDebito}
            onVinto={() => game.incassa(SCASSO.premio)}
            onFallito={game.fallisci}
          />
        )}
        {lavoro === 'asta' && (
          <Asta monete={game.stato.monete} bloccato={game.inDebito} onRisolvi={game.concludiAsta} />
        )}
      </section>
    </div>
  )
}

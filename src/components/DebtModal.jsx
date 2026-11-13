import { CATALOGO_MAP } from '../utils/gameData.js'
import { prezzoVendita } from '../utils/gameLogic.js'
import { formattaMonete } from '../utils/format.js'

export default function DebtModal({ game }) {
  const posseduti = Object.keys(game.stato.inventario)
    .map((id) => CATALOGO_MAP[id])
    .filter(Boolean)
    .sort((a, b) => prezzoVendita(a) - prezzoVendita(b))

  return (
    <div className="fixed inset-x-0 bottom-0 top-24 z-20 flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Saldo in rosso">
      <div className="scheda w-full max-w-lg p-5">
        <p className="text-[11px] tracking-[0.22em] text-danger">AFFITTO INSOLUTO</p>
        <h2 className="mt-2 font-display text-3xl">Il saldo è in rosso</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Hai {formattaMonete(game.stato.monete)}. Vendi un cimelio per continuare. Se è esposto, scende dal muro.
        </p>
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {posseduti.map((pezzo) => (
            <li key={pezzo.id} className="flex items-center justify-between gap-3 border-b border-line/70 py-2">
              <span>
                <span className="mr-2">{pezzo.icona}</span>
                {pezzo.nome}
                <span className="text-mute"> ×{game.copie(pezzo.id)}</span>
              </span>
              <button type="button" className="btn" onClick={() => game.vendi(pezzo.id)}>
                Vendi {formattaMonete(prezzoVendita(pezzo))}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

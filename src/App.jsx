import { useState } from 'react'
import CollectionTab from './components/CollectionTab.jsx'
import DebtModal from './components/DebtModal.jsx'
import Header from './components/Header.jsx'
import HouseTab from './components/HouseTab.jsx'
import JobsTab from './components/JobsTab.jsx'
import ShopTab from './components/ShopTab.jsx'
import { useGameState } from './hooks/useGameState.js'
import { formattaMonete } from './utils/format.js'

export default function App() {
  const game = useGameState()
  const [tab, setTab] = useState('lavori')
  const evento = game.evento

  return (
    <div className="flex min-h-full flex-col">
      <Header tab={tab} onTab={setTab} game={game} />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-6">
        <div className={tab === 'lavori' ? '' : 'hidden'}><JobsTab game={game} /></div>
        <div className={tab === 'bustine' ? '' : 'hidden'}><ShopTab game={game} /></div>
        <div className={tab === 'casa' ? '' : 'hidden'}><HouseTab game={game} /></div>
        <div className={tab === 'collezione' ? '' : 'hidden'}><CollectionTab game={game} /></div>
      </main>
      {game.inDebito && <DebtModal game={game} />}
      {evento && (
        <button
          type="button"
          onClick={game.chiudiEvento}
          className="scheda fixed bottom-5 right-5 z-40 max-w-sm px-4 py-3 text-left text-sm shadow-2xl"
        >
          {evento.sospeso
            ? `Rendita +${formattaMonete(evento.rendita)}. L’affitto è sospeso: non hai cimeli da vendere.`
            : `Rendita +${formattaMonete(evento.rendita)} · affitto −${formattaMonete(evento.affitto)}.`}
        </button>
      )}
    </div>
  )
}

import { RARITA, SET_TEMI } from '../utils/gameData.js'

export default function RelicCard({
  cimelio,
  scoperta = true,
  conteggio,
  sinergia = false,
  selezionata = false,
  onClick,
}) {
  const rar = RARITA[cimelio.rarita]
  const tema = SET_TEMI[cimelio.set]
  const alta = scoperta && (cimelio.rarita === 'Leggendario' || cimelio.rarita === 'Mitico')
  const Tag = onClick ? 'button' : 'article'
  const stile = {
    '--card-bordo': rar.colore,
    '--card-sfondo': tema.sfondo,
    '--card-ombra': sinergia || alta ? `0 0 22px ${rar.bagliore}` : 'none',
  }

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card-cimelio ${alta ? 'foil' : ''} ${selezionata ? 'selezionata' : ''}`}
      style={stile}
    >
      <div className="flex items-center justify-between text-[10px] tracking-[0.18em] uppercase" style={{ color: tema.tinta }}>
        <span>{cimelio.set}</span>
        {conteggio > 1 && <span>×{conteggio}</span>}
      </div>
      <div className="flex flex-1 items-center justify-center text-5xl">
        {scoperta ? cimelio.icona : <span className="text-mute">?</span>}
      </div>
      <div>
        <p className="font-display text-lg leading-tight">
          {scoperta ? cimelio.nome : 'Ancora al buio'}
        </p>
        <p className="mt-1 text-[11px] tracking-[0.16em] uppercase" style={{ color: rar.colore }}>
          {cimelio.rarita}
          {sinergia ? ' · sinergia' : ''}
        </p>
        {scoperta && (
          <p className="mt-2 text-xs text-mute">Rendita {cimelio.renditaPassiva}</p>
        )}
      </div>
    </Tag>
  )
}

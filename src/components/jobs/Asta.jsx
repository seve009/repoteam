import { useEffect, useRef, useState } from 'react'
import { ASTA, BOT } from '../../utils/gameData.js'
import { botVuole, preparaLotto, saldoAsta } from '../../utils/gameLogic.js'
import { formattaMonete } from '../../utils/format.js'
import RelicCard from '../RelicCard.jsx'

function nomeLeader(id) {
  if (id === 'tu') return 'Tu'
  return BOT[id]?.nome ?? 'Nessuno'
}

export default function Asta({ monete, bloccato, onRisolvi }) {
  const [fase, setFase] = useState('attesa')
  const [vista, setVista] = useState(null)
  const live = useRef(null)
  const onRisolviRef = useRef(onRisolvi)
  useEffect(() => {
    onRisolviRef.current = onRisolvi
  })

  useEffect(() => () => {
    if (live.current && !live.current.chiusa) {
      live.current.chiusa = true
      onRisolviRef.current(0)
    }
  }, [])

  function fotografia(extra = {}) {
    const lotto = live.current
    const secondi = Math.max(0, ASTA.secondi - (performance.now() - lotto.inizio) / 1000)
    const prossima = lotto.leader ? lotto.prezzo + lotto.incremento : lotto.base
    return {
      indizi: lotto.cimelio.indizi,
      prezzo: lotto.prezzo,
      leader: lotto.leader,
      passato: lotto.passato,
      base: lotto.base,
      incremento: lotto.incremento,
      prossima,
      borsa: lotto.borsa,
      cronaca: lotto.cronaca,
      secondi,
      ...extra,
    }
  }

  function annota(testo) {
    live.current.cronaca = [...live.current.cronaca, testo].slice(-4)
  }

  function offri(chi) {
    const lotto = live.current
    if (!lotto || lotto.chiusa || lotto.leader === chi) return false
    if (chi === 'tu' && lotto.passato) return false
    const offerta = lotto.leader ? lotto.prezzo + lotto.incremento : lotto.base
    if (chi === 'tu' && offerta > lotto.borsa) return false
    if (chi !== 'tu' && !botVuole(chi, offerta, lotto.cimelio.valoreBase)) return false
    lotto.prezzo = offerta
    lotto.leader = chi
    annota(`${nomeLeader(chi)} rilancia a ${formattaMonete(offerta)}.`)
    return true
  }

  function chiudi() {
    const lotto = live.current
    if (!lotto || lotto.chiusa) return
    lotto.chiusa = true
    const vinta = lotto.leader === 'tu'
    const delta = saldoAsta(lotto.cimelio.valoreBase, lotto.prezzo, vinta)
    setFase('esito')
    setVista(fotografia({
      secondi: 0,
      vinta,
      delta,
      cimelio: lotto.cimelio,
    }))
    onRisolviRef.current(delta)
  }

  useEffect(() => {
    if (fase !== 'corsa') return undefined
    const timer = setInterval(() => {
      const lotto = live.current
      if (!lotto || lotto.chiusa) return
      const ora = performance.now()
      if ((ora - lotto.inizio) / 1000 >= ASTA.secondi) {
        chiudi()
        return
      }
      for (const bot of ['impulsivo', 'calcolatore']) {
        if (ora < lotto.prossimo[bot]) continue
        offri(bot)
        const pausa = bot === 'impulsivo' ? 700 : 1100
        lotto.prossimo[bot] = ora + pausa + Math.random() * 650
      }
      setVista(fotografia())
    }, 180)
    return () => clearInterval(timer)
  }, [fase])

  function entra() {
    if (bloccato || (live.current && !live.current.chiusa)) return
    const preparato = preparaLotto()
    const ora = performance.now()
    live.current = {
      ...preparato,
      prezzo: preparato.base,
      leader: null,
      passato: false,
      chiusa: false,
      inizio: ora,
      borsa: monete,
      cronaca: ['Il banditore apre il lotto.'],
      prossimo: {
        impulsivo: ora + 600 + Math.random() * 500,
        calcolatore: ora + 1000 + Math.random() * 600,
      },
    }
    setVista(fotografia())
    setFase('corsa')
  }

  function rilancia() {
    if (offri('tu')) setVista(fotografia())
  }

  function passo() {
    const lotto = live.current
    if (!lotto || lotto.chiusa || lotto.passato) return
    lotto.passato = true
    annota('Passi. I due continuano senza di te.')
    setVista(fotografia())
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.28em] text-gold">ASTA E PERIZIA</p>
      <h2 className="mt-1 font-display text-3xl">Dieci secondi, due offerenti</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
        Il lotto è coperto. Tre indizi, una base, e basta. Se vinci paghi il prezzo e incassi il valore vero:
        la differenza può essere un guadagno o una perdita, mai oltre le monete che hai in sala.
      </p>

      {fase === 'attesa' && (
        <button type="button" className="btn-oro mt-6" onClick={entra} disabled={bloccato}>
          Entra in sala
        </button>
      )}

      {vista && fase !== 'attesa' && (
        <div className="mt-6 grid items-start gap-6 md:grid-cols-[220px_1fr]">
          <div>
            {fase === 'esito' ? (
              <RelicCard cimelio={vista.cimelio} />
            ) : (
              <div className="dorso aspect-[3/4]">
                <div className="text-center">
                  <p className="font-display text-3xl text-gold">V&P</p>
                  <p className="mt-2 text-[10px] tracking-[0.28em] text-mute">LOTTO COPERTO</p>
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="font-display text-5xl leading-none">{Math.ceil(vista.secondi)}</p>
            <p className="mt-1 text-[11px] tracking-[0.2em] text-mute">SECONDI</p>
            <p className="mt-4 text-sm">
              Prezzo <span className="font-display text-2xl text-gold">{formattaMonete(vista.prezzo)}</span>
              <span className="text-mute"> · in testa {nomeLeader(vista.leader)}</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm italic text-ivory/90">
              {vista.indizi.map((indizio) => (
                <li key={indizio}>“{indizio}”</li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 text-xs text-mute">
              {vista.cronaca.map((riga, indice) => (
                <p key={`${riga}-${indice}`}>{riga}</p>
              ))}
            </div>
            <p className="mt-3 text-xs text-mute">
              {BOT.impulsivo.nome}: {BOT.impulsivo.tratto} {BOT.calcolatore.nome}: {BOT.calcolatore.tratto}
            </p>

            {fase === 'corsa' && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-oro"
                  onClick={rilancia}
                  disabled={vista.passato || vista.leader === 'tu' || vista.prossima > vista.borsa}
                >
                  Rilancia a {formattaMonete(vista.prossima)}
                </button>
                <button type="button" className="btn" onClick={passo} disabled={vista.passato}>
                  Passo
                </button>
              </div>
            )}

            {fase === 'esito' && (
              <div className="mt-5">
                {vista.vinta ? (
                  <p className="text-sm">
                    Aggiudicato a te per {formattaMonete(vista.prezzo)}. Valore vero {formattaMonete(vista.cimelio.valoreBase)}.
                    Saldo {vista.delta >= 0 ? '+' : '−'}{formattaMonete(Math.abs(vista.delta))}.
                  </p>
                ) : (
                  <p className="text-sm">
                    Se ne va {vista.leader ? `da ${nomeLeader(vista.leader)}` : 'invenduto'}
                    {vista.leader ? ` a ${formattaMonete(vista.prezzo)}` : ''}. Valore vero {formattaMonete(vista.cimelio.valoreBase)}.
                    Tu non hai speso nulla.
                  </p>
                )}
                <button type="button" className="btn mt-4" onClick={() => { setFase('attesa'); setVista(null) }}>
                  Nuovo lotto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

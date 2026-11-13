import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CATALOGO,
  CATALOGO_MAP,
  MONETE_INIZIALI,
  RARITA,
  SCAVO,
} from './gameData.js'
import {
  botVuole,
  calcolaPrestigio,
  calcolaRendita,
  compraCasa,
  concludiAzione,
  creaScavo,
  esponi,
  fondi,
  mulberry32,
  nelVerde,
  normalizza,
  pescaRarita,
  preparaLotto,
  prezzoVendita,
  puoComprareCasa,
  riduci,
  rivela,
  saldoAsta,
  selezionaCasa,
  setSinergici,
  statoIniziale,
  vendi,
  vicini,
  zonaVerde,
} from './gameLogic.js'

function conCopie(id, n, extra = {}) {
  const stato = statoIniziale()
  stato.inventario = { [id]: n }
  stato.scoperti = [id]
  return { ...stato, ...extra, inventario: { ...stato.inventario, ...(extra.inventario || {}) } }
}

describe('scavo', () => {
  it('tiene libera la prima cella e i suoi vicini', () => {
    for (const seme of [1, 2, 9, 40]) {
      for (const primo of [0, 27, 63]) {
        const board = creaScavo(primo, mulberry32(seme + primo))
        assert.notEqual(board.tipi[primo], 'trappola')
        for (const vicino of vicini(primo, board.lato)) {
          assert.notEqual(board.tipi[vicino], 'trappola')
        }
        assert.equal(board.tipi.filter((t) => t === 'trappola').length, SCAVO.trappole)
        assert.equal(board.tipi.filter((t) => t === 'pepita').length, SCAVO.pepite)
      }
    }
  })

  it('allaga solo i vuoti senza numero e conta le pepite', () => {
    const lato = 3
    const tipi = Array(9).fill('vuoto')
    const vicine = Array(9).fill(0)
    const aperti = Array(9).fill(false)
    const tutto = rivela(aperti, tipi, vicine, lato, 4)
    assert.equal(tutto.aperti.every(Boolean), true)
    assert.equal(tutto.pepite, 0)

    const conPepita = Array(9).fill('vuoto')
    conPepita[1] = 'pepita'
    const vicinePepita = Array(9).fill(0)
    const solo = rivela(Array(9).fill(false), conPepita, vicinePepita, lato, 1)
    assert.equal(solo.pepite, 1)
    assert.equal(solo.aperti.filter(Boolean).length, 1)

    const trappole = Array(9).fill('vuoto')
    trappole[0] = 'trappola'
    trappole[8] = 'trappola'
    const boom = rivela(Array(9).fill(false), trappole, Array(9).fill(1), lato, 0)
    assert.equal(boom.trappola, true)
    assert.equal(boom.aperti[0], true)
    assert.equal(boom.aperti[8], true)
    assert.equal(boom.pepite, 0)
  })
})

describe('scasso e asta', () => {
  it('tiene la zona verde dentro la barra', () => {
    for (let i = 0; i < 40; i += 1) {
      const zona = zonaVerde(0.08, mulberry32(i + 3))
      assert.ok(zona.inizio >= 0.04 - 1e-9)
      assert.ok(zona.inizio + zona.larghezza <= 0.96 + 1e-9)
      assert.equal(nelVerde(zona.inizio, zona), true)
      assert.equal(nelVerde(zona.inizio + zona.larghezza, zona), true)
      assert.equal(nelVerde(zona.inizio - 0.001, zona), false)
    }
  })

  it('fa fermare i bot al proprio tetto', () => {
    assert.equal(botVuole('calcolatore', 80, 100, () => 0.99), true)
    assert.equal(botVuole('calcolatore', 81, 100, () => 0.99), false)
    assert.equal(botVuole('impulsivo', 108, 100, () => 0.5), true)
    assert.equal(botVuole('impulsivo', 109, 100, () => 0.99), false)
    assert.equal(botVuole('impulsivo', 50, 100, () => 0), false)
    const lotto = preparaLotto(mulberry32(7))
    assert.ok(lotto.base < lotto.cimelio.valoreBase)
    assert.equal(saldoAsta(130, 90, true), 40)
    assert.equal(saldoAsta(130, 90, false), 0)
  })
})

describe('economia', () => {
  it('raddoppia rendita e prestigio solo sul set completo', () => {
    let stato = statoIniziale()
    stato = esponi({ ...stato, inventario: { scarabeo: 1, lino: 1, ushabti: 1 } }, 'scarabeo', 0)
    stato = esponi(stato, 'lino', 1)
    assert.deepEqual(setSinergici(stato.esposti), [])
    assert.equal(calcolaRendita(stato.esposti), 2 + 2)
    assert.equal(calcolaPrestigio(stato.esposti), 1 + 1)
    stato = esponi(stato, 'ushabti', 2)
    assert.deepEqual(setSinergici(stato.esposti), ['Antico Egitto'])
    assert.equal(calcolaRendita(stato.esposti), (2 + 2 + 6) * 2)
    assert.equal(calcolaPrestigio(stato.esposti), (1 + 1 + 3) * 2)
  })

  it('scala l’affitto ogni cinque azioni e lo sospende se non c’è nulla da vendere', () => {
    let stato = statoIniziale()
    for (let i = 0; i < 4; i += 1) {
      stato = concludiAzione(stato, 0).stato
    }
    assert.equal(stato.azioni, 4)
    assert.equal(stato.monete, MONETE_INIZIALI)
    const quinto = concludiAzione(stato, 0)
    assert.equal(quinto.evento.sospeso, false)
    assert.equal(quinto.evento.affitto, 25)
    assert.equal(quinto.stato.monete, MONETE_INIZIALI - 25)

    const basePovero = statoIniziale()
    basePovero.azioni = 4
    basePovero.monete = 10
    const senzaPezzi = concludiAzione(basePovero, 0)
    assert.equal(senzaPezzi.evento.sospeso, true, JSON.stringify(senzaPezzi))
    assert.equal(senzaPezzi.stato.monete, 10)

    let conPezzi = conCopie('scarabeo', 1, { azioni: 4, monete: 10, esposti: [null, null, null, null] })
    const debito = concludiAzione(conPezzi, 0)
    assert.equal(debito.evento.sospeso, false)
    assert.equal(debito.evento.affitto, 25)
    assert.equal(debito.stato.monete, 10 - 25)
  })

  it('rifiuta nuove azioni finché il saldo è in rosso', () => {
    const povero = conCopie('scarabeo', 1, { monete: -5 })
    const fermo = concludiAzione(povero, 100, ['lino'])
    assert.equal(fermo.stato.monete, -5)
    assert.equal(fermo.stato.inventario.lino, undefined)
  })

  it('vende una copia esposta e la toglie dal muro', () => {
    let stato = conCopie('lapis', 1)
    stato = esponi(stato, 'lapis', 0)
    stato = vendi(stato, 'lapis')
    assert.equal(stato.inventario.lapis, undefined)
    assert.equal(stato.esposti[0], null)
    assert.equal(stato.monete, MONETE_INIZIALI + prezzoVendita(CATALOGO_MAP.lapis))
  })

  it('fonde tre copie in una rarità superiore e libera gli slot', () => {
    let stato = conCopie('scarabeo', 3)
    stato = esponi(stato, 'scarabeo', 0)
    stato = esponi(stato, 'scarabeo', 1)
    stato = esponi(stato, 'scarabeo', 2)
    const raro = CATALOGO.find((pezzo) => pezzo.rarita === 'Raro')
    const fuso = fondi(stato, 'scarabeo', raro.id)
    assert.equal(fuso.inventario.scarabeo, undefined)
    assert.equal(fuso.inventario[raro.id], 1)
    assert.equal(fuso.esposti.every((id) => id !== 'scarabeo'), true)
    assert.equal(fondi(conCopie('scarabeo', 2), 'scarabeo', raro.id).inventario.scarabeo, 2)
    assert.equal(fondi(conCopie('occhio', 3), 'occhio', 'corona').inventario.occhio, 3)
  })

  it('non espone più copie di quelle possedute', () => {
    const stato = esponi(conCopie('lino', 1), 'lino', 0)
    assert.equal(esponi(stato, 'lino', 1).esposti[1], null)
    assert.equal(esponi(stato, 'lino', 0).esposti[0], 'lino')
  })

  it('sblocca le case in ordine, con monete e prestigio', () => {
    let stato = statoIniziale()
    stato.monete = 20000
    assert.equal(puoComprareCasa(stato, 'appartamento'), false)
    stato = esponi({ ...stato, inventario: { ushabti: 3, scarabeo: 3 } }, 'ushabti', 0)
    stato = esponi(stato, 'ushabti', 1)
    stato = esponi(stato, 'ushabti', 2)
    assert.equal(calcolaPrestigio(stato.esposti), 3 * 3 * 2)
    assert.equal(puoComprareCasa(stato, 'villa'), false)
    stato = compraCasa(stato, 'appartamento')
    assert.equal(stato.casaId, 'appartamento')
    assert.equal(stato.esposti.length, 8)
    assert.equal(stato.esposti[0], 'ushabti')
    assert.ok(stato.monete < 20000)
    stato = selezionaCasa(stato, 'monolocale')
    assert.equal(stato.casaId, 'monolocale')
    assert.equal(stato.esposti.length, 4)
    assert.equal(stato.esposti[0], 'ushabti')
  })

  it('ignora un salvataggio corrotto e ripara gli slot', () => {
    const pulito = normalizza(null)
    assert.equal(pulito.monete, MONETE_INIZIALI)
    const riparato = normalizza({
      monete: 12.4,
      azioni: 3,
      casaId: 'villa',
      casePossedute: ['monolocale'],
      inventario: { scarabeo: 1, fantasma: 4, lino: 0 },
      esposti: ['scarabeo', 'scarabeo', 'fantasma'],
      scoperti: ['nope'],
    })
    assert.equal(riparato.monete, 12)
    assert.equal(riparato.casaId, 'monolocale')
    assert.equal(riparato.inventario.fantasma, undefined)
    assert.equal(riparato.inventario.lino, undefined)
    assert.equal(riparato.esposti[0], 'scarabeo')
    assert.equal(riparato.esposti[1], null)
    assert.equal(riparato.esposti.length, 4)
    assert.ok(riparato.scoperti.includes('scarabeo'))
  })

  it('pesca le rarità dentro ai pesi', () => {
    const conteggi = { Comune: 0, Raro: 0 }
    for (let i = 0; i < 1000; i += 1) {
      conteggi[pescaRarita({ Comune: 75, Raro: 25, Epico: 0 }, mulberry32(i + 11))] += 1
    }
    assert.ok(conteggi.Comune > 680 && conteggi.Comune < 820)
    assert.equal(CATALOGO.length >= 24, true)
    assert.equal(new Set(CATALOGO.map((pezzo) => pezzo.id)).size, CATALOGO.length)
    for (const pezzo of CATALOGO) {
      assert.equal(pezzo.valoreBase, RARITA[pezzo.rarita].valoreBase)
      assert.equal(pezzo.indizi.length, 3)
    }
  })

  it('resetta dal riduttore', () => {
    const sporco = conCopie('corona', 1, { monete: 9, azioni: 8 })
    const fresco = riduci(sporco, { type: 'RESET' }).stato
    assert.deepEqual(fresco, statoIniziale())
  })
})

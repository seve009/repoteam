/** Catalogo, rarità, bustine e immobili di Vault & Packs. */

export const CHIAVE_SALVATAGGIO = 'vault-packs-save-v1'
export const MONETE_INIZIALI = 60
export const AZIONI_PER_AFFITTO = 5
export const VENDITA = 0.45
export const SINERGIA = 3

export const RARITA_ORDINE = ['Comune', 'Raro', 'Epico', 'Leggendario', 'Mitico']

export const RARITA = {
  Comune: {
    valoreBase: 40,
    renditaPassiva: 2,
    prestigio: 1,
    colore: '#b7b1a8',
    bagliore: 'rgba(183, 177, 168, 0.28)',
  },
  Raro: {
    valoreBase: 130,
    renditaPassiva: 6,
    prestigio: 3,
    colore: '#79b8ff',
    bagliore: 'rgba(121, 184, 255, 0.4)',
  },
  Epico: {
    valoreBase: 340,
    renditaPassiva: 15,
    prestigio: 8,
    colore: '#c084fc',
    bagliore: 'rgba(192, 132, 252, 0.45)',
  },
  Leggendario: {
    valoreBase: 860,
    renditaPassiva: 38,
    prestigio: 20,
    colore: '#e4c56a',
    bagliore: 'rgba(228, 197, 106, 0.5)',
  },
  Mitico: {
    valoreBase: 2400,
    renditaPassiva: 96,
    prestigio: 55,
    colore: '#ff6b81',
    bagliore: 'rgba(255, 107, 129, 0.55)',
  },
}

export const SET_NOMI = ['Antico Egitto', 'Tech Retro', 'Arte Occulta', 'Gioielli Reali']

export const SET_TEMI = {
  'Antico Egitto': {
    tinta: '#d4b483',
    sfondo: 'linear-gradient(165deg, #3d2e1c 0%, #16110c 72%)',
  },
  'Tech Retro': {
    tinta: '#8fd0b0',
    sfondo: 'linear-gradient(165deg, #1a3330 0%, #0e1412 72%)',
  },
  'Arte Occulta': {
    tinta: '#c4addd',
    sfondo: 'linear-gradient(165deg, #2c2438 0%, #120e16 72%)',
  },
  'Gioielli Reali': {
    tinta: '#f0d7b4',
    sfondo: 'linear-gradient(165deg, #3a2830 0%, #160f12 72%)',
  },
}

export const CASE = [
  {
    id: 'monolocale',
    nome: 'Monolocale Fatiscente',
    slot: 4,
    affitto: 25,
    costo: 0,
    prestigioRichiesto: 0,
    descrizione: 'Intonaco umido e quattro chiodi nel muro. L’affitto è basso, lo spazio anche.',
  },
  {
    id: 'appartamento',
    nome: 'Appartamento in Centro',
    slot: 8,
    affitto: 70,
    costo: 750,
    prestigioRichiesto: 18,
    descrizione: 'Una vetrina sulla strada e otto piedistalli. I passanti cominciano a fermarsi.',
  },
  {
    id: 'villa',
    nome: 'Villa Storica',
    slot: 12,
    affitto: 180,
    costo: 3800,
    prestigioRichiesto: 70,
    descrizione: 'Un salone con dodici nicchie. Il prestigio, da qui, si vede dal cancello.',
  },
  {
    id: 'museo',
    nome: 'Museo Privato & Caveau',
    slot: 18,
    affitto: 420,
    costo: 14000,
    prestigioRichiesto: 160,
    descrizione: 'Diciotto teche blindate. Quello che esponi rende. Il resto resta nel caveau.',
  },
]

export const PACCHI = [
  {
    id: 'polveroso',
    nome: 'Pacco Polveroso',
    costo: 90,
    promessa: 'Carta ingiallita, quasi sempre un pezzo comune.',
    pesi: { Comune: 68, Raro: 24, Epico: 6, Leggendario: 2, Mitico: 0 },
  },
  {
    id: 'antiquario',
    nome: "Cassa dell'Antiquario",
    costo: 280,
    promessa: 'Il mercante giura di averci guardato dentro. Non dice cosa ha visto.',
    pesi: { Comune: 38, Raro: 34, Epico: 18, Leggendario: 8, Mitico: 2 },
  },
  {
    id: 'reliquiario',
    nome: 'Reliquiario Sigillato',
    costo: 960,
    promessa: 'Cera nera, nastro di lino. Qui i miti smettono di essere un pettegolezzo.',
    pesi: { Comune: 8, Raro: 22, Epico: 34, Leggendario: 26, Mitico: 10 },
  },
]

export const SCAVO = {
  lato: 8,
  trappole: 10,
  pepite: 8,
  valorePepita: 36,
}

export const SCASSO = {
  cilindri: 3,
  larghezze: [0.24, 0.15, 0.08],
  velocita: [2.6, 3.6, 5.2],
  premio: 240,
}

export const ASTA = {
  secondi: 10,
  pesi: { Comune: 34, Raro: 30, Epico: 20, Leggendario: 12, Mitico: 4 },
}

export const BOT = {
  impulsivo: {
    id: 'impulsivo',
    nome: 'Vico il Frettoloso',
    tratto: 'Rilancia spesso, e volentieri sopra il valore.',
    tetto: 1.08,
    esitazione: 0.22,
  },
  calcolatore: {
    id: 'calcolatore',
    nome: 'Nera Calder',
    tratto: 'Si ferma prima del prezzo giusto.',
    tetto: 0.8,
    esitazione: 0.12,
  },
}

function cimelio(id, nome, set, rarita, icona, descrizione, indizi) {
  const scala = RARITA[rarita]
  return {
    id,
    nome,
    set,
    rarita,
    icona,
    descrizione,
    indizi,
    valoreBase: scala.valoreBase,
    renditaPassiva: scala.renditaPassiva,
  }
}

export const CATALOGO = [
  cimelio('scarabeo', 'Scarabeo di fango', 'Antico Egitto', 'Comune', '🪲',
    'Un amuleto di argilla che si sbriciola se lo stringi.',
    ['La scheda parla di fango del fiume, non di oro.', 'Il banditore lo posa senza guardarlo.', 'Sta nel palmo e pesa come un sasso secco.']),
  cimelio('lino', 'Benda di lino', 'Antico Egitto', 'Comune', '🧵',
    'Una striscia tessuta, ancora tiepida di resina.',
    ['Odora di tela vecchia e di olio.', 'Nessuno in sala si sporge.', 'Si piega. Non suona.']),
  cimelio('ushabti', 'Ushabti incrinato', 'Antico Egitto', 'Raro', '🗿',
    'Un servitore di ceramica con una crepa sul petto. Il nome è illeggibile.',
    ['Una figurina che doveva lavorare al posto di qualcuno.', 'Il prezzo di partenza non è da bancarella.', 'La crepa è antica, il volto no.']),
  cimelio('lapis', 'Anello di lapislazzuli', 'Antico Egitto', 'Raro', '💍',
    'Blu fondo, venato d’oro povero. Sta largo su ogni dito.',
    ['Un blu che non è vetro.', 'Chi lo ha perso aveva mani piccole.', 'Il mercante lo chiama “pietra del fiume” e distoglie gli occhi.']),
  cimelio('maschera', 'Maschera di gesso', 'Antico Egitto', 'Epico', '🎭',
    'Il calco di un volto. Le ciglia sono ancora impresse.',
    ['Non è oro: è un volto, e pesa.', 'La sala fa silenzio quando esce dalla cassa.', 'Chi la guarda troppo a lungo sbatte le palpebre.']),
  cimelio('pugnale', 'Pugnale del Nilo', 'Antico Egitto', 'Leggendario', '🗡️',
    'Lama corta, rivetto d’oro. Sulla guardia c’è un’onda.',
    ['Metallo che ha visto un fiume, non una vetrina.', 'Il banditore chiede di non toccare il filo.', 'In sala qualcuno si alza in piedi.']),
  cimelio('occhio', 'Occhio di Ra', 'Antico Egitto', 'Mitico', '☀️',
    'Un disco che scalda il palmo. Non ha retro.',
    ['Chi lo nomina abbassa la voce.', 'Non è un gioiello: è un sole piccolo.', 'La cassetta è foderata di lino nero.']),

  cimelio('cavo', 'Cavo ingiallito', 'Tech Retro', 'Comune', '🔌',
    'Isolante crepato, rame in vista. Puzza di polvere calda.',
    ['Roba da ripostiglio, non da teca.', 'Si piega e resta piegato.', 'Il lotto sta in una busta, non in una scatola.']),
  cimelio('tasto', 'Tasto di bachelite', 'Tech Retro', 'Comune', '⌨️',
    'Un bottone nero, staccato. Sotto c’è ancora la molla.',
    ['Un pezzo solo, di una macchina più grande.', 'Nessuno offre senza averlo visto da vicino.', 'Fa clic. Il clic è tutto.']),
  cimelio('walkman', 'Walkman graffiato', 'Tech Retro', 'Raro', '📼',
    'Lo sportello non chiude. Dentro non c’è nastro.',
    ['Musica da tasca, di un’altra decade.', 'I graffi sono d’uso, non di caduta.', 'Il mercante mima delle cuffie e non aggiunge altro.']),
  cimelio('disco', 'Disco da cinque pollici', 'Tech Retro', 'Raro', '💾',
    'Etichetta scritta a mano: “NON CANCELLARE”.',
    ['Quadrato, flessibile, e nessuno sa cosa contiene.', 'L’etichetta è un ordine, non un titolo.', 'Il prezzo sale appena qualcuno capisce l’anno.']),
  cimelio('tubo', 'Tubo catodico', 'Tech Retro', 'Epico', '📺',
    'Vetro spesso, interno verde. Acceso, mostra solo neve.',
    ['Pesa come un comodino e brilla di verde.', 'Va maneggiato in due. Il banditore lo ricorda due volte.', 'Non è un mobile: è un occhio di vetro.']),
  cimelio('scheda', 'Scheda del settantasette', 'Tech Retro', 'Leggendario', '🖥️',
    'Circuito madre con una data incisa a mano sul bordo.',
    ['Una piastra, non un computer intero.', 'La data sul bordo fa tacere Vico.', 'Odora di stagno e di archivio chiuso.']),
  cimelio('nucleo', 'Nucleo a valvole', 'Tech Retro', 'Mitico', '💡',
    'Quattro valvole ancora calde. Nessuno sa da quale macchina.',
    ['Resta tiepido anche spento.', 'Vetro, filamenti, e un ronzio che non c’è.', 'Il lotto è assicurato. Il mercante lo dice piano.']),

  cimelio('candela', 'Candela storta', 'Arte Occulta', 'Comune', '🕯️',
    'Cera nera, stoppino bianco. Non vuole stare dritta.',
    ['Si è sciolta da un lato solo.', 'Luce da comodino, se proprio.', 'Il banditore non la accende.']),
  cimelio('pagina', 'Pagina bruciata', 'Arte Occulta', 'Comune', '📄',
    'Mezza frase in una lingua che cambia se la rileggi.',
    ['Carta, non rilegatura.', 'Il bordo è carbone.', 'Tre parole, e nessuna si lascia copiare.']),
  cimelio('specchio', 'Specchio appannato', 'Arte Occulta', 'Raro', '🪞',
    'Riflette la stanza con un secondo di ritardo.',
    ['Un vetro che non ha fretta.', 'Chi si specchia sbaglia il conto delle persone.', 'La cornice è povera. Il vetro no.']),
  cimelio('sigillo', 'Sigillo di cera nera', 'Arte Occulta', 'Raro', '⚫',
    'Impronta di un anello che non è in vendita.',
    ['Cera, non metallo.', 'L’impronta non corrisponde a nessun anello in sala.', 'Spezzarlo farebbe rumore. Nessuno lo propone.']),
  cimelio('teschio', 'Teschio inciso', 'Arte Occulta', 'Epico', '💀',
    'Sulla fronte, una mappa di una casa che non esiste più.',
    ['Osso vero, dice il cartellino. La mappa è il punto.', 'Qualcuno in sala smette di sorridere.', 'Non è un soprammobile da ingresso.']),
  cimelio('grimorio', 'Grimorio senza titolo', 'Arte Occulta', 'Leggendario', '📕',
    'Le pagine sono cucite con filo rosso. L’indice è vuoto.',
    ['Un libro che rifiuta il proprio nome.', 'Il filo è rosso e nuovo. La carta no.', 'Nera Calder chiude il taccuino.']),
  cimelio('lanterna', 'Lanterna ostinata', 'Arte Occulta', 'Mitico', '🏮',
    'Accesa da prima che la comprassi. Non consuma olio.',
    ['Fa luce senza chiedere nulla.', 'Il mercante la tiene coperta fino all’ultimo.', 'In sala le altre lampade sembrano spente.']),

  cimelio('spilla', 'Spilla di ottone', 'Gioielli Reali', 'Comune', '📌',
    'Un nodo d’ottone, verde agli angoli. Chiude ancora.',
    ['Metallo povero, lavorato con cura.', 'Sta bene su un cappotto, non su una corona.', 'Il prezzo di partenza è quasi un’offesa.']),
  cimelio('perla', 'Perla di fiume', 'Gioielli Reali', 'Comune', '⚪',
    'Irregolare, latte sporco. Rotola storta.',
    ['Non è rotonda e non è di mare.', 'Una sola, senza filo.', 'Bel colore, se ti piace il grigio.']),
  cimelio('orecchino', 'Orecchino smarrito', 'Gioielli Reali', 'Raro', '💎',
    'Il paio non c’è. Il castone tiene ancora una scheggia.',
    ['Ne manca uno. Il mercante lo dice subito.', 'La pietra è piccola e vera.', 'Qualcuno in sala controlla il proprio orecchio.']),
  cimelio('fibbia', 'Fibbia di corte', 'Gioielli Reali', 'Raro', '⚜️',
    'Argento opaco, giglio storto. Ha tenuto una cintura importante.',
    ['Un fermaglio, non una gemma.', 'Lo stemma è di una corte che non riceve più.', 'Peso da metallo buono.']),
  cimelio('diadema', 'Diadema opaco', 'Gioielli Reali', 'Epico', '💫',
    'Una mezzaluna da fronte. Le perle sono mezze staccate.',
    ['Si posa sulla fronte, non sul dito.', 'Le perle sono stanche ma contate.', 'Il banditore chiede silenzio prima di alzarlo.']),
  cimelio('collana', 'Collana della reggente', 'Gioielli Reali', 'Leggendario', '📿',
    'Granati scuri, filo d’oro rifatto due volte.',
    ['Pietre scure, una fila sola, e basta a cambiare la luce.', 'Il filo è stato rifatto. Le pietre no.', 'Vico smette di scherzare.']),
  cimelio('corona', 'Corona mai indossata', 'Gioielli Reali', 'Mitico', '👑',
    'Dentro, il velluto è nuovo. Nessuna testa l’ha piegato.',
    ['Il velluto interno non ha una piega.', 'Non è un diadema: chiude tutta la testa.', 'La cassa ha due serrature, e una è già aperta.']),
]

export const CATALOGO_MAP = Object.fromEntries(CATALOGO.map((pezzo) => [pezzo.id, pezzo]))

export function casaById(id) {
  return CASE.find((casa) => casa.id === id) || CASE[0]
}

export function raritaSuccessiva(rarita) {
  const indice = RARITA_ORDINE.indexOf(rarita)
  if (indice < 0 || indice >= RARITA_ORDINE.length - 1) return null
  return RARITA_ORDINE[indice + 1]
}

export function raritaMassima(cimeli) {
  let migliore = 'Comune'
  let punteggio = -1
  for (const pezzo of cimeli) {
    const indice = RARITA_ORDINE.indexOf(pezzo.rarita)
    if (indice > punteggio) {
      punteggio = indice
      migliore = pezzo.rarita
    }
  }
  return migliore
}

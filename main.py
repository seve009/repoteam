"""Vault & Packs: gestionale collezionistico in una finestra locale.

Si avvia con `python main.py`. Usa solo pygame e la libreria standard.
"""

from __future__ import annotations

import json
import math
import os
import random
import sys

import pygame


# --- Palette e costanti -----------------------------------------------------

SFONDO = (15, 23, 42)          # #0f172a
PANNELLO = (30, 41, 59)        # #1e293b
PANNELLO_2 = (51, 65, 85)
ORO = (251, 191, 36)           # #fbbf24
TESTO = (241, 245, 249)
SMORZATO = (148, 163, 184)
PERICOLO = (248, 113, 113)
OK = (52, 211, 153)
CELLA_CHIUSA = (51, 65, 85)
CELLA_APERTA = (15, 23, 42)
VERDE_ZONA = (22, 163, 74)

RARITA_ORDINE = ["Comune", "Raro", "Epico", "Leggendario", "Mitico"]
COLORE_RARITA = {
    "Comune": (148, 163, 184),
    "Raro": (96, 165, 250),
    "Epico": (167, 139, 250),
    "Leggendario": (251, 191, 36),
    "Mitico": (225, 29, 72),
}
COLORE_SET = {
    "Antico Egitto": (234, 179, 8),
    "Tech Retro": (56, 189, 248),
    "Arte Occulta": (192, 132, 252),
    "Gioielli Reali": (251, 113, 133),
}
PUNTI_PRESTIGIO = {
    "Comune": 1,
    "Raro": 2,
    "Epico": 4,
    "Leggendario": 8,
    "Mitico": 16,
}
VALORE_BASE = {
    "Comune": 20,
    "Raro": 55,
    "Epico": 140,
    "Leggendario": 320,
    "Mitico": 700,
}
RENDITA_BASE = {
    "Comune": 1,
    "Raro": 3,
    "Epico": 7,
    "Leggendario": 14,
    "Mitico": 28,
}

CASE = [
    {"nome": "Monolocale Fatiscente", "slot": 3, "costo": 0, "prestigio": 0, "affitto": 12},
    {"nome": "Appartamento in Centro", "slot": 6, "costo": 350, "prestigio": 25, "affitto": 35},
    {"nome": "Villa Storica", "slot": 10, "costo": 1100, "prestigio": 70, "affitto": 80},
    {"nome": "Museo Privato e Caveau", "slot": 15, "costo": 3500, "prestigio": 160, "affitto": 160},
]

SCAVI = [
    {"nome": "Basso", "tassa": 8, "trappole": 8, "pepite": 10, "paga": 10},
    {"nome": "Medio", "tassa": 20, "trappole": 12, "pepite": 8, "paga": 22},
    {"nome": "Alto", "tassa": 45, "trappole": 16, "pepite": 6, "paga": 50},
]
SCASSI = [
    {"nome": "Basso", "tassa": 10, "cilindri": 3, "premio": 55},
    {"nome": "Medio", "tassa": 28, "cilindri": 4, "premio": 140},
    {"nome": "Alto", "tassa": 70, "cilindri": 5, "premio": 320},
]
ASTE = [
    {"nome": "Basso", "base": 25, "minimo": 15, "massimo": 90, "passo": 10},
    {"nome": "Medio", "base": 60, "minimo": 30, "massimo": 240, "passo": 20},
    {"nome": "Alto", "base": 140, "minimo": 50, "massimo": 700, "passo": 40},
]
PACCHETTI = [
    {
        "id": "polveroso",
        "nome": "Pacco Polveroso",
        "costo": 45,
        "pesi": [("Comune", 70), ("Raro", 25), ("Epico", 5)],
        "testo": "70% comune, 25% raro, 5% epico",
    },
    {
        "id": "antiquario",
        "nome": "Cassa dell'Antiquario",
        "costo": 160,
        "pesi": [("Comune", 40), ("Raro", 40), ("Epico", 15), ("Leggendario", 5)],
        "testo": "40% comune, 40% raro, 15% epico, 5% leggendario",
    },
    {
        "id": "reliquiario",
        "nome": "Reliquiario Sigillato",
        "costo": 520,
        "pesi": [("Epico", 50), ("Leggendario", 40), ("Mitico", 10)],
        "testo": "50% epico, 40% leggendario, 10% mitico",
    },
]

LARGHEZZA, ALTEZZA = 1280, 760
BARRA = 248
TESTA = 64
MESSAGGIO_H = 36
GRIGLIA = 8
ERRORI_CONSENTITI = 2
AZIONI_PER_AFFITTO = 5
TAGLIO_SIGILLO = 220

SALVATAGGIO_FORZATO = None


def percorso_salvataggio():
    """save.json nella cartella da cui si lancia il gioco."""
    if SALVATAGGIO_FORZATO:
        return SALVATAGGIO_FORZATO
    return os.path.join(os.getcwd(), "save.json")


def prezzo_vendita(valore):
    """Il 45% del valore base, arrotondato per difetto."""
    return valore * 45 // 100


# --- Catalogo ---------------------------------------------------------------

class Cimelio:
    """Un pezzo del catalogo. L'id non si ripete."""

    def __init__(self, id_, nome, insieme, rarita, icona, forma, descrizione, indizio):
        self.id = id_
        self.nome = nome
        self.insieme = insieme
        self.rarita = rarita
        self.valore_base = VALORE_BASE[rarita]
        self.rendita = RENDITA_BASE[rarita]
        self.icona = icona
        self.forma = forma
        self.descrizione = descrizione
        self.indizio = indizio


def _c(id_, nome, insieme, rarita, icona, forma, descrizione, indizio):
    return Cimelio(id_, nome, insieme, rarita, icona, forma, descrizione, indizio)


# 6 pezzi per set (2 comuni, 2 rari, 1 epico, 1 leggendario) più un mitico.
# Il mitico esce solo dal Reliquiario. Il leggendario resta nel pool dell'Antiquario.
CATALOGO_LISTA = [
    _c("scarabeo", "Scarabeo di fango", "Antico Egitto", "Comune", "🪲", "triangolo",
       "Un amuleto di argilla che si sbriciola se lo stringi.", "Materiale: argilla secca"),
    _c("lino", "Benda di lino", "Antico Egitto", "Comune", "🧵", "rettangolo",
       "Una fascia ingiallita, ancora annodata.", "Materiale: fibra tessuta"),
    _c("ushabti", "Ushabti incrinato", "Antico Egitto", "Raro", "🗿", "esagono",
       "Il servitore di ceramica ha perso un braccio.", "Materiale: ceramica cotta"),
    _c("lapis", "Anello di lapislazzuli", "Antico Egitto", "Raro", "💍", "cerchio",
       "Il blu è fondo, la montatura è stanca.", "Materiale: pietra blu"),
    _c("maschera", "Maschera di gesso", "Antico Egitto", "Epico", "🎭", "rombo",
       "Il volto è sereno e un po' troppo liscio.", "Materiale: gesso dipinto"),
    _c("pugnale", "Pugnale del Nilo", "Antico Egitto", "Leggendario", "🗡️", "stella",
       "La lama è corta, il nome inciso è ancora leggibile.", "Materiale: bronzo scuro"),
    _c("occhio", "Occhio di Ra", "Antico Egitto", "Mitico", "☀️", "occhio",
       "Non riflette la stanza: riflette il giorno in cui è stato tolto.", "Materiale: oro che scalda"),

    _c("cavo", "Cavo ingiallito", "Tech Retro", "Comune", "🔌", "rettangolo",
       "Isolante crepato, rame che spunta.", "Materiale: rame ossidato"),
    _c("tasto", "Tasto di bachelite", "Tech Retro", "Comune", "⌨️", "quadrato",
       "Un tasto solo, di una macchina che non c'è più.", "Materiale: bachelite"),
    _c("walkman", "Walkman graffiato", "Tech Retro", "Raro", "📼", "rettangolo",
       "Lo sportello chiude ancora, il nastro no.", "Materiale: plastica rigata"),
    _c("disco", "Disco da cinque pollici", "Tech Retro", "Raro", "💾", "cerchio",
       "L'etichetta dice solo: non formattare.", "Materiale: plastica magnetica"),
    _c("tubo", "Tubo catodico", "Tech Retro", "Epico", "📺", "esagono",
       "Il vetro tiene un'immagine spenta.", "Materiale: vetro spesso"),
    _c("scheda", "Scheda del settantasette", "Tech Retro", "Leggendario", "🖥️", "rettangolo",
       "I condensatori sono stati saldati a mano.", "Materiale: fibra e stagno"),
    _c("nucleo", "Nucleo a valvole", "Tech Retro", "Mitico", "💡", "stella",
       "Le valvole si accendono senza corrente in vista.", "Materiale: vetro e vuoto"),

    _c("candela", "Candela storta", "Arte Occulta", "Comune", "🕯️", "rettangolo",
       "La cera ha colato da un lato solo.", "Materiale: cera nera"),
    _c("pagina", "Pagina bruciata", "Arte Occulta", "Comune", "📄", "rettangolo",
       "Restano tre parole e un buco.", "Materiale: carta combusta"),
    _c("specchio", "Specchio appannato", "Arte Occulta", "Raro", "🪞", "cerchio",
       "Non restituisce chi lo guarda, ma chi l'ha venduto.", "Materiale: vetro al mercurio"),
    _c("sigillo", "Sigillo di cera nera", "Arte Occulta", "Raro", "🕯️", "cerchio",
       "Il marchio è una porta chiusa.", "Materiale: cera e cenere"),
    _c("teschio", "Teschio inciso", "Arte Occulta", "Epico", "💀", "cerchio",
       "Le incisioni girano intorno alle orbite.", "Materiale: osso lavorato"),
    _c("grimorio", "Grimorio senza titolo", "Arte Occulta", "Leggendario", "📕", "rettangolo",
       "Le pagine non hanno numero e non finiscono dove ti aspetti.", "Materiale: pelle e inchiostro"),
    _c("lanterna", "Lanterna ostinata", "Arte Occulta", "Mitico", "🏮", "esagono",
       "La fiamma c'è anche a coperchio chiuso.", "Materiale: ottone tiepido"),

    _c("spilla", "Spilla di ottone", "Gioielli Reali", "Comune", "📌", "rombo",
       "Un fiore piccolo, il fermaglio ancora morde.", "Materiale: ottone opaco"),
    _c("perla", "Perla di fiume", "Gioielli Reali", "Comune", "⚪", "cerchio",
       "Non è tonda. Per questo è vera.", "Materiale: madreperla"),
    _c("orecchino", "Orecchino smarrito", "Gioielli Reali", "Raro", "💎", "cerchio",
       "Il paio non si è mai trovato.", "Materiale: argento e vetro"),
    _c("fibbia", "Fibbia di corte", "Gioielli Reali", "Raro", "⚜️", "rombo",
       "Teneva un mantello che non è nel lotto.", "Materiale: argento cesellato"),
    _c("diadema", "Diadema opaco", "Gioielli Reali", "Epico", "👑", "triangolo",
       "Le pietre sono state levate. Restano i castoni.", "Materiale: argento vuoto"),
    _c("collana", "Collana della reggente", "Gioielli Reali", "Leggendario", "📿", "cerchio",
       "Ogni grano è diverso, nessuno è sostituibile.", "Materiale: granati e oro"),
    _c("corona", "Corona mai indossata", "Gioielli Reali", "Mitico", "👑", "stella",
       "Non c'è traccia di una testa. Il metallo è nuovo di secoli.", "Materiale: oro mai toccato"),
]

CATALOGO = {c.id: c for c in CATALOGO_LISTA}


def rarita_successiva(rarita):
    indice = RARITA_ORDINE.index(rarita)
    if indice >= len(RARITA_ORDINE) - 1:
        return None
    return RARITA_ORDINE[indice + 1]


def pool_rarita(rarita):
    return [c for c in CATALOGO_LISTA if c.rarita == rarita]


def estrai_cimelio(pacchetto_id):
    """Sceglie la rarità coi pesi del pacchetto, poi un cimelio di quella rarità."""
    pacchetto = next(p for p in PACCHETTI if p["id"] == pacchetto_id)
    rarita = _pesca_pesata(pacchetto["pesi"])
    pool = pool_rarita(rarita)
    if not pool:
        raise RuntimeError(f"Pool vuoto per {rarita}")
    return random.choice(pool).id


def _pesca_pesata(pesi):
    totale = sum(peso for _, peso in pesi)
    tiro = random.uniform(0, totale)
    accumulo = 0.0
    for rarita, peso in pesi:
        accumulo += peso
        if tiro <= accumulo:
            return rarita
    return pesi[-1][0]


def migliore_rarita(ids):
    migliore = ids[0]
    for id_ in ids[1:]:
        if RARITA_ORDINE.index(CATALOGO[id_].rarita) > RARITA_ORDINE.index(CATALOGO[migliore].rarita):
            migliore = id_
    return CATALOGO[migliore].rarita


# --- Stato e case -----------------------------------------------------------

class HouseManager:
    """Slot, prestigio, rendita, sinergie e acquisto dell'immobile successivo."""

    def __init__(self, stato):
        self.stato = stato

    def casa(self):
        return CASE[self.stato.casa]

    def affitto(self):
        return self.casa()["affitto"]

    def _conteggi_set(self):
        conti = {}
        for id_ in self.stato.esposti:
            if not id_:
                continue
            nome = CATALOGO[id_].insieme
            conti[nome] = conti.get(nome, 0) + 1
        return conti

    def set_in_sinergia(self):
        """Un set con almeno tre pezzi esposti raddoppia rendita e prestigio."""
        return {nome for nome, n in self._conteggi_set().items() if n >= 3}

    def moltiplicatore(self, id_):
        if not id_:
            return 1
        if CATALOGO[id_].insieme in self.set_in_sinergia():
            return 2
        return 1

    def prestigio(self):
        totale = 0
        for id_ in self.stato.esposti:
            if not id_:
                continue
            punti = PUNTI_PRESTIGIO[CATALOGO[id_].rarita]
            totale += punti * self.moltiplicatore(id_)
        return totale

    def rendita(self):
        totale = 0
        for id_ in self.stato.esposti:
            if not id_:
                continue
            totale += CATALOGO[id_].rendita * self.moltiplicatore(id_)
        return totale

    def copie_libere(self, id_):
        esposte = sum(1 for slot in self.stato.esposti if slot == id_)
        return self.stato.inventario.get(id_, 0) - esposte

    def piazza(self, slot, id_):
        if slot < 0 or slot >= len(self.stato.esposti):
            return False
        if self.stato.esposti[slot] is not None:
            return False
        if id_ not in CATALOGO or self.copie_libere(id_) < 1:
            return False
        self.stato.esposti[slot] = id_
        self.stato.salva()
        return True

    def togli(self, slot):
        if slot < 0 or slot >= len(self.stato.esposti):
            return False
        if self.stato.esposti[slot] is None:
            return False
        self.stato.esposti[slot] = None
        self.stato.salva()
        return True

    def prossima(self):
        if self.stato.casa >= len(CASE) - 1:
            return None
        return CASE[self.stato.casa + 1]

    def puo_comprare(self):
        prossima = self.prossima()
        if prossima is None or self.stato.in_rosso():
            return False
        return self.stato.monete >= prossima["costo"] and self.prestigio() >= prossima["prestigio"]

    def compra(self):
        if not self.puo_comprare():
            return False
        prossima = self.prossima()
        self.stato.monete -= prossima["costo"]
        self.stato.casa += 1
        slot = CASE[self.stato.casa]["slot"]
        self.stato.esposti = (self.stato.esposti + [None] * slot)[:slot]
        self.stato.messaggio = f"Hai preso le chiavi: {prossima['nome']}."
        self.stato.messaggio_negativo = False
        self.stato.salva()
        return True


class GameState:
    """Monete, inventario, casa, azioni verso l'affitto. Si scrive su save.json."""

    def __init__(self):
        self.monete = 60
        self.casa = 0
        self.inventario = {}
        self.esposti = [None] * CASE[0]["slot"]
        self.azioni = 0
        self.messaggio = "Guadagna nei lavori, apri le bustine, esponi i cimeli."
        self.messaggio_negativo = False
        self.case = HouseManager(self)

    def in_rosso(self):
        return self.monete < 0

    def tassa_minima(self):
        return min(voce["tassa"] for voce in SCAVI + SCASSI)

    def bloccato_senza_cimeli(self):
        """Né lavori pagabili né pezzi da vendere: resta il reset."""
        if self.inventario:
            return False
        if self.in_rosso():
            return True
        return self.monete < self.tassa_minima()

    def aggiungi(self, id_, quantita=1):
        self.inventario[id_] = self.inventario.get(id_, 0) + quantita

    def _toglie_copie(self, id_, quantita):
        """Toglie copie, prima quelle non esposte. Aggiorna gli slot se serve."""
        if self.inventario.get(id_, 0) < quantita:
            return False
        esposte = [i for i, slot in enumerate(self.esposti) if slot == id_]
        libere = self.inventario[id_] - len(esposte)
        da_slot = max(0, quantita - libere)
        for indice in esposte[:da_slot]:
            self.esposti[indice] = None
        resto = self.inventario[id_] - quantita
        if resto <= 0:
            del self.inventario[id_]
        else:
            self.inventario[id_] = resto
        return True

    def vendi(self, id_):
        if id_ not in CATALOGO or self.inventario.get(id_, 0) < 1:
            return False
        ricavo = prezzo_vendita(CATALOGO[id_].valore_base)
        era_in_rosso = self.in_rosso()
        self._toglie_copie(id_, 1)
        self.monete += ricavo
        self.messaggio = f"Venduto {CATALOGO[id_].nome} per {ricavo} monete."
        if era_in_rosso and not self.in_rosso():
            self.messaggio += " Il saldo non è più in rosso."
        elif self.in_rosso():
            self.messaggio += " Sei ancora in rosso."
        self.messaggio_negativo = self.in_rosso()
        self.salva()
        return True

    def fondi(self, id_):
        """Tre copie uguali diventano un cimelio casuale della rarità sopra."""
        pezzo = CATALOGO.get(id_)
        if pezzo is None or pezzo.rarita == "Mitico":
            return False
        if self.inventario.get(id_, 0) < 3:
            return False
        sopra = rarita_successiva(pezzo.rarita)
        pool = pool_rarita(sopra)
        if not pool:
            return False
        self._toglie_copie(id_, 3)
        nuovo = random.choice(pool).id
        self.aggiungi(nuovo)
        self.messaggio = f"Fusione: tre {pezzo.nome} diventano {CATALOGO[nuovo].nome}."
        self.messaggio_negativo = False
        self.salva()
        return True

    def chiudi_lavoro(self, bottino, testo, negativo=False):
        """Bottino (anche negativo), poi la rendita della casa, poi l'affitto ogni 5 azioni."""
        rendita = self.case.rendita()
        self.monete += int(bottino) + rendita
        self.azioni += 1
        affitto = 0
        if self.azioni >= AZIONI_PER_AFFITTO:
            self.azioni = 0
            affitto = self.case.affitto()
            self.monete -= affitto
        parti = [testo]
        if rendita:
            parti.append(f"rendita +{rendita}")
        if affitto:
            parti.append(f"affitto -{affitto}")
        if self.in_rosso():
            parti.append("sei in rosso: vendi un cimelio")
        self.messaggio = " · ".join(parti)
        self.messaggio_negativo = self.in_rosso() or bottino < 0 or negativo
        self.salva()

    def registra_bustina(self):
        """Lo sbustamento conta come azione e può far scattare l'affitto. Non dà rendita."""
        self.azioni += 1
        affitto = 0
        if self.azioni >= AZIONI_PER_AFFITTO:
            self.azioni = 0
            affitto = self.case.affitto()
            self.monete -= affitto
        if affitto and self.in_rosso():
            self.messaggio = f"Affitto -{affitto}. Sei in rosso: vendi un cimelio."
            self.messaggio_negativo = True
        elif affitto:
            self.messaggio = f"Bustina aperta. Affitto -{affitto}."
            self.messaggio_negativo = False
        else:
            self.messaggio_negativo = False
        self.salva()

    def compra_bustina(self, pacchetto_id):
        if self.in_rosso():
            return None
        pacchetto = next(p for p in PACCHETTI if p["id"] == pacchetto_id)
        if self.monete < pacchetto["costo"]:
            return None
        self.monete -= pacchetto["costo"]
        ids = [estrai_cimelio(pacchetto_id) for _ in range(3)]
        for id_ in ids:
            self.aggiungi(id_)
        self.registra_bustina()
        if not self.messaggio.startswith("Affitto") and not self.messaggio.startswith("Bustina aperta"):
            pass
        if "Affitto" not in self.messaggio:
            self.messaggio = f"Hai pagato {pacchetto['nome']}."
        return ids

    def salva(self):
        dati = {
            "versione": 1,
            "monete": self.monete,
            "casa": self.casa,
            "inventario": self.inventario,
            "esposti": self.esposti,
            "azioni": self.azioni,
            "messaggio": self.messaggio,
        }
        percorso = percorso_salvataggio()
        temporaneo = percorso + ".tmp"
        with open(temporaneo, "w", encoding="utf-8") as file:
            json.dump(dati, file, ensure_ascii=False, indent=2)
        os.replace(temporaneo, percorso)

    def sanitizza(self):
        self.monete = int(self.monete)
        self.casa = max(0, min(len(CASE) - 1, int(self.casa)))
        self.azioni = max(0, min(AZIONI_PER_AFFITTO - 1, int(self.azioni)))
        inventario = {}
        for id_, quantita in dict(self.inventario).items():
            if id_ in CATALOGO and int(quantita) > 0:
                inventario[id_] = int(quantita)
        self.inventario = inventario
        slot = CASE[self.casa]["slot"]
        esposti = list(self.esposti)[:slot]
        esposti += [None] * (slot - len(esposti))
        puliti = []
        for id_ in esposti:
            if id_ in self.inventario:
                puliti.append(id_)
            else:
                puliti.append(None)
        usati = {}
        for indice, id_ in enumerate(puliti):
            if not id_:
                continue
            usati[id_] = usati.get(id_, 0) + 1
            if usati[id_] > self.inventario.get(id_, 0):
                puliti[indice] = None
        self.esposti = puliti

    @classmethod
    def nuovo(cls):
        return cls()

    @classmethod
    def carica(cls):
        percorso = percorso_salvataggio()
        if not os.path.exists(percorso):
            stato = cls.nuovo()
            stato.salva()
            return stato
        try:
            with open(percorso, "r", encoding="utf-8") as file:
                dati = json.load(file)
            stato = cls.nuovo()
            stato.monete = dati["monete"]
            stato.casa = dati["casa"]
            stato.inventario = dati.get("inventario", {})
            stato.esposti = dati.get("esposti", [])
            stato.azioni = dati.get("azioni", 0)
            stato.messaggio = dati.get("messaggio", stato.messaggio)
            stato.sanitizza()
            return stato
        except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError):
            stato = cls.nuovo()
            stato.messaggio = "Salvataggio illeggibile: si ricomincia."
            stato.salva()
            return stato

    def reset(self):
        nuovo = GameState.nuovo()
        self.monete = nuovo.monete
        self.casa = nuovo.casa
        self.inventario = {}
        self.esposti = [None] * CASE[0]["slot"]
        self.azioni = 0
        self.messaggio = "Partita azzerata. Sessanta monete, monolocale, nessun cimelio."
        self.messaggio_negativo = False
        self.case = HouseManager(self)
        self.salva()


# --- Minigiochi -------------------------------------------------------------

class MinesweeperGame:
    """Scavo 8x8. I numeri contano le trappole vicine. La prima cella non è mai una trappola.

    Le pepite stanno fuori dalla zona aperta dal primo click: per incassare bisogna
    scavare ancora, e una trappola azzera il montepremi.
    """

    def __init__(self, livello):
        dati = SCAVI[livello]
        self.livello = livello
        self.nome = dati["nome"]
        self.tassa = dati["tassa"]
        self.quante_trappole = dati["trappole"]
        self.quante_pepite = dati["pepite"]
        self.paga = dati["paga"]
        self.trappole = set()
        self.pepite = set()
        self.rivelate = [[False] * GRIGLIA for _ in range(GRIGLIA)]
        self.bandiere = [[False] * GRIGLIA for _ in range(GRIGLIA)]
        self.pronta = False
        self.montepremi = 0
        self.trovate = 0
        self.finita = False
        self.trappola = False
        self.risolta = False
        self.origine = (0, 0)
        self.lato = 52

    def _vicini(self, x, y):
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < GRIGLIA and 0 <= ny < GRIGLIA:
                    yield nx, ny

    def _trappole_vicine(self, x, y):
        return sum(1 for nx, ny in self._vicini(x, y) if (nx, ny) in self.trappole)

    def _zona_aperta(self, x, y):
        """Flood-fill delle celle senza trappole, come nel prato fiorito."""
        aperti = set()
        pila = [(x, y)]
        while pila:
            cx, cy = pila.pop()
            if (cx, cy) in aperti:
                continue
            if self.bandiere[cy][cx]:
                continue
            if (cx, cy) in self.trappole:
                continue
            aperti.add((cx, cy))
            if self._trappole_vicine(cx, cy) == 0:
                for nx, ny in self._vicini(cx, cy):
                    if (nx, ny) not in aperti:
                        pila.append((nx, ny))
        return aperti

    def _prepara(self, x, y):
        celle = [(cx, cy) for cx in range(GRIGLIA) for cy in range(GRIGLIA) if (cx, cy) != (x, y)]
        self.trappole = set(random.sample(celle, self.quante_trappole))
        self.pronta = True
        gia_aperte = self._zona_aperta(x, y)
        sicure = [
            (cx, cy)
            for cx in range(GRIGLIA)
            for cy in range(GRIGLIA)
            if (cx, cy) not in self.trappole and (cx, cy) not in gia_aperte
        ]
        quante = min(self.quante_pepite, len(sicure))
        self.pepite = set(random.sample(sicure, quante)) if quante else set()

    def cella_a(self, pos):
        ox, oy = self.origine
        x = (pos[0] - ox) // self.lato
        y = (pos[1] - oy) // self.lato
        if 0 <= x < GRIGLIA and 0 <= y < GRIGLIA:
            if ox <= pos[0] < ox + self.lato * GRIGLIA and oy <= pos[1] < oy + self.lato * GRIGLIA:
                return int(x), int(y)
        return None

    def scava(self, x, y):
        if self.finita or self.risolta or self.bandiere[y][x] or self.rivelate[y][x]:
            return
        if not self.pronta:
            self._prepara(x, y)
        if (x, y) in self.trappole:
            self.rivelate[y][x] = True
            self.trappola = True
            self.finita = True
            self.montepremi = 0
            return
        for cx, cy in self._zona_aperta(x, y):
            if self.rivelate[cy][cx]:
                continue
            self.rivelate[cy][cx] = True
            if (cx, cy) in self.pepite:
                self.montepremi += self.paga
                self.trovate += 1
        if self._sicure_tutte_aperte():
            self.finita = True

    def bandiera(self, x, y):
        if self.finita or self.rivelate[y][x]:
            return
        self.bandiere[y][x] = not self.bandiere[y][x]

    def _sicure_tutte_aperte(self):
        if not self.pronta:
            return False
        for x in range(GRIGLIA):
            for y in range(GRIGLIA):
                if (x, y) not in self.trappole and not self.rivelate[y][x]:
                    return False
        return True

    def incassa(self):
        if self.finita:
            return
        self.finita = True


class LockpickGame:
    """Il cursore va avanti e indietro. Spazio nella zona verde passa il cilindro.

    Due errori sono concessi. Al terzo il caveau si chiude e il premio è perso.
    """

    def __init__(self, livello):
        dati = SCASSI[livello]
        self.livello = livello
        self.nome = dati["nome"]
        self.tassa = dati["tassa"]
        self.cilindri = dati["cilindri"]
        self.premio = dati["premio"]
        self.corrente = 0
        self.errori = 0
        self.pos = 0.0
        self.direzione = 1
        self.centro = 0.5
        self.mezza = 0.12
        self.velocita = 1.2
        self.finita = False
        self.successo = False
        self.risolta = False
        self.flash = 0.0
        self.flash_ok = False
        self._nuova_zona()

    def _nuova_zona(self):
        # La zona si stringe e il cursore accelera a ogni cilindro.
        basi_mezza = (0.13, 0.11, 0.10)
        basi_vel = (1.15, 1.4, 1.65)
        self.mezza = basi_mezza[self.livello] * (0.9 ** self.corrente)
        self.velocita = basi_vel[self.livello] * (1 + self.corrente * 0.12)
        margine = self.mezza + 0.02
        self.centro = random.uniform(margine, 1 - margine)
        self.pos = 0.0
        self.direzione = 1

    def aggiorna(self, dt):
        if self.finita:
            self.flash = max(0.0, self.flash - dt)
            return
        self.pos += self.direzione * self.velocita * dt
        if self.pos >= 1:
            self.pos = 1
            self.direzione = -1
        elif self.pos <= 0:
            self.pos = 0
            self.direzione = 1
        self.flash = max(0.0, self.flash - dt)

    def nel_verde(self):
        return abs(self.pos - self.centro) <= self.mezza

    def tenta(self):
        if self.finita:
            return
        if self.nel_verde():
            self.flash = 0.25
            self.flash_ok = True
            self.corrente += 1
            if self.corrente >= self.cilindri:
                self.finita = True
                self.successo = True
            else:
                self._nuova_zona()
        else:
            self.flash = 0.25
            self.flash_ok = False
            self.errori += 1
            if self.errori > ERRORI_CONSENTITI:
                self.finita = True
                self.successo = False


class AuctionGame:
    """Dieci secondi, due bot, un lotto con tre indizi e un valore nascosto.

    Il bot irruento rilancia spesso, anche sopra il valore.
    Il bot calcolatore rilancia solo se il prezzo resta sotto la sua stima.
    Non rilanciare non costa nulla. Se vinci, paghi il prezzo e incassi il valore vero.
    """

    def __init__(self, livello):
        dati = ASTE[livello]
        self.livello = livello
        self.nome = dati["nome"]
        self.base = dati["base"]
        self.passo = dati["passo"]
        self.prezzo = dati["base"]
        self.tempo = 10.0
        self.leader = None
        self.finita = False
        self.risolta = False
        self.valore = random.randint(dati["minimo"], dati["massimo"])
        self.cimelio = self._scegli_cimelio(dati["minimo"], dati["massimo"])
        self.indizi = self._indizi()
        self.attesa_irruento = 0.7
        self.attesa_calcolo = 1.15

    def _scegli_cimelio(self, minimo, massimo):
        span = max(1, massimo - minimo)
        fascia = (self.valore - minimo) / span
        if fascia < 0.34:
            gradini = ["Comune", "Raro"]
        elif fascia < 0.67:
            gradini = ["Raro", "Epico"]
        else:
            gradini = ["Epico", "Leggendario", "Mitico"]
        pool = [c for c in CATALOGO_LISTA if c.rarita in gradini]
        return random.choice(pool or CATALOGO_LISTA)

    def _indizi(self):
        span = max(1, ASTE[self.livello]["massimo"] - ASTE[self.livello]["minimo"])
        fascia = (self.valore - ASTE[self.livello]["minimo"]) / span
        if fascia < 0.34:
            stima = "fascia modesta"
        elif fascia < 0.67:
            stima = "fascia incerta"
        else:
            stima = "fascia ambita"
        return [
            f"Provenienza: {self.cimelio.insieme}",
            f"Stima di sala: {stima}",
            self.cimelio.indizio,
        ]

    def prezzo_prossimo(self):
        if self.leader is None:
            return self.prezzo
        return self.prezzo + self.passo

    def _rilancia(self, chi):
        if self.leader == chi:
            return
        if self.leader is not None:
            self.prezzo += self.passo
        self.leader = chi

    def rilancio_giocatore(self, monete):
        if self.finita:
            return False
        if monete < self.prezzo_prossimo():
            return False
        self._rilancia("giocatore")
        return True

    def _bot(self, chi):
        if chi == "irruento":
            tetto = int(self.valore * random.uniform(1.0, 1.35))
            if self.prezzo <= tetto and self.leader != "irruento" and random.random() < 0.8:
                self._rilancia("irruento")
        else:
            tetto = int(self.valore * 0.85)
            if self.prezzo_prossimo() <= tetto and self.leader != "calcolatore":
                self._rilancia("calcolatore")

    def aggiorna(self, dt):
        if self.finita:
            return
        self.tempo -= dt
        self.attesa_irruento -= dt
        self.attesa_calcolo -= dt
        if self.attesa_irruento <= 0:
            self.attesa_irruento = random.uniform(0.85, 1.3)
            self._bot("irruento")
        if self.attesa_calcolo <= 0:
            self.attesa_calcolo = random.uniform(1.2, 1.9)
            self._bot("calcolatore")
        if self.tempo <= 0:
            self.tempo = 0
            self.finita = True

    def nome_leader(self):
        return {
            None: "Nessuno",
            "giocatore": "Tu",
            "irruento": "Bot irruento",
            "calcolatore": "Bot calcolatore",
        }[self.leader]


class PackOpener:
    """Taglio del sigillo, bagliore della rarità più alta, tre carte girate una alla volta."""

    def __init__(self, pacchetto_id, ids):
        self.pacchetto = next(p for p in PACCHETTI if p["id"] == pacchetto_id)
        self.ids = list(ids)
        self.rarita = migliore_rarita(self.ids)
        self.fase = "taglio"
        self.taglio = 0.0
        self.glow = 0.7
        self.mostrate = 0
        self.particelle = []
        self.sigillo = pygame.Rect(0, 0, 0, 0)

    def taglia(self, pos, quanto):
        if self.fase != "taglio":
            return
        if self.sigillo.w and not self.sigillo.collidepoint(pos):
            return
        self.taglio += quanto
        if self.taglio >= TAGLIO_SIGILLO:
            self._apri_sigillo()

    def _apri_sigillo(self):
        self.fase = "bagliore"
        colore = COLORE_RARITA[self.rarita]
        for _ in range(48):
            angolo = random.uniform(0, math.tau)
            velocita = random.uniform(40, 180)
            self.particelle.append({
                "x": 0.0,
                "y": 0.0,
                "vx": math.cos(angolo) * velocita,
                "vy": math.sin(angolo) * velocita,
                "vita": random.uniform(0.4, 1.1),
                "colore": colore,
            })

    def aggiorna(self, dt, centro):
        if self.fase == "bagliore":
            self.glow -= dt
            if self.glow <= 0:
                self.fase = "carte"
        vive = []
        for particella in self.particelle:
            particella["x"] += particella["vx"] * dt
            particella["y"] += particella["vy"] * dt
            particella["vita"] -= dt
            if particella["vita"] > 0:
                vive.append(particella)
        self.particelle = vive
        self._centro = centro

    def gira(self):
        if self.fase == "carte" and self.mostrate < 3:
            self.mostrate += 1
            return True
        return False

    def finita(self):
        return self.fase == "carte" and self.mostrate >= 3


# --- Disegno ----------------------------------------------------------------

def _font(dimensione, grassetto=False):
    font = pygame.font.SysFont("dejavusans", dimensione, bold=grassetto)
    if font is None:
        font = pygame.font.Font(None, dimensione)
    return font


def spezza(font, testo, larghezza):
    parole = testo.split()
    righe = []
    corrente = ""
    for parola in parole:
        prova = (corrente + " " + parola).strip()
        if font.size(prova)[0] <= larghezza:
            corrente = prova
        else:
            if corrente:
                righe.append(corrente)
            corrente = parola
    if corrente:
        righe.append(corrente)
    return righe or [""]


def disegna_forma(superficie, forma, colore, centro, raggio):
    cx, cy = centro
    if forma == "cerchio":
        pygame.draw.circle(superficie, colore, centro, raggio)
    elif forma == "quadrato":
        pygame.draw.rect(superficie, colore, (cx - raggio, cy - raggio, raggio * 2, raggio * 2), border_radius=4)
    elif forma == "rettangolo":
        pygame.draw.rect(superficie, colore, (cx - raggio, cy - raggio // 2, raggio * 2, raggio), border_radius=3)
    elif forma == "triangolo":
        punti = [(cx, cy - raggio), (cx - raggio, cy + raggio), (cx + raggio, cy + raggio)]
        pygame.draw.polygon(superficie, colore, punti)
    elif forma == "rombo":
        punti = [(cx, cy - raggio), (cx + raggio, cy), (cx, cy + raggio), (cx - raggio, cy)]
        pygame.draw.polygon(superficie, colore, punti)
    elif forma == "esagono":
        punti = []
        for i in range(6):
            angolo = math.radians(-90 + i * 60)
            punti.append((cx + math.cos(angolo) * raggio, cy + math.sin(angolo) * raggio))
        pygame.draw.polygon(superficie, colore, punti)
    elif forma == "occhio":
        pygame.draw.ellipse(superficie, colore, (cx - raggio, cy - raggio // 2, raggio * 2, raggio))
        pygame.draw.circle(superficie, SFONDO, centro, max(2, raggio // 3))
    else:
        punti = []
        for i in range(10):
            angolo = math.radians(-90 + i * 36)
            raggio_i = raggio if i % 2 == 0 else raggio // 2
            punti.append((cx + math.cos(angolo) * raggio_i, cy + math.sin(angolo) * raggio_i))
        pygame.draw.polygon(superficie, colore, punti)


class UIManager:
    """Quattro schede, i tre lavori, il negozio e la casa. I click passano da qui."""

    def __init__(self, stato=None, schermo=None):
        if not pygame.get_init():
            pygame.init()
        pygame.display.set_caption("Vault & Packs")
        self.schermo = schermo or pygame.display.set_mode((LARGHEZZA, ALTEZZA))
        self.clock = pygame.time.Clock()
        self.font = _font(18)
        self.font_piccolo = _font(14)
        self.font_grande = _font(28, True)
        self.font_titolo = _font(22, True)
        self.stato = stato or GameState.carica()
        self.scheda = "casa"
        self.modalita = None
        self.scavo = None
        self.scasso = None
        self.asta = None
        self.apertura = None
        self.selettore = None
        self.scroll = 0
        self.scroll_massimo = 0
        self.hit = []
        self.reset_fino_a = 0
        self.vivo = True
        self.mouse = (0, 0)
        self.contenuto = pygame.Rect(BARRA, TESTA + MESSAGGIO_H, LARGHEZZA - BARRA, ALTEZZA - TESTA - MESSAGGIO_H)

    def esegui(self):
        while self.vivo:
            dt = self.clock.tick(60) / 1000
            for evento in pygame.event.get():
                self._evento(evento)
            self._aggiorna(dt)
            self._disegna()
            pygame.display.flip()
        pygame.quit()

    def _evento(self, evento):
        if evento.type == pygame.QUIT:
            self.vivo = False
        elif evento.type == pygame.MOUSEMOTION:
            self.mouse = evento.pos
            if self.apertura and pygame.mouse.get_pressed()[0]:
                distanza = abs(evento.rel[0]) + abs(evento.rel[1]) * 0.35
                self.apertura.taglia(evento.pos, distanza)
        elif evento.type == pygame.MOUSEBUTTONDOWN:
            self.mouse = evento.pos
            if evento.button == 3 and self.modalita == "scavo" and self.scavo and not self.scavo.risolta:
                cella = self.scavo.cella_a(evento.pos)
                if cella:
                    self.scavo.bandiera(*cella)
                    return
            if evento.button == 1 and (pygame.key.get_mods() & pygame.KMOD_CTRL) and self.modalita == "scavo":
                if self.scavo and not self.scavo.risolta:
                    cella = self.scavo.cella_a(evento.pos)
                    if cella:
                        self.scavo.bandiera(*cella)
                        return
            if evento.button == 1:
                if self.apertura and self.apertura.fase == "taglio":
                    self.apertura.taglia(evento.pos, 42)
                self._click(evento.pos)
            elif evento.button == 4:
                self.scroll = max(0, self.scroll - 48)
            elif evento.button == 5:
                self.scroll = min(self.scroll_massimo, self.scroll + 48)
        elif evento.type == pygame.KEYDOWN and evento.key == pygame.K_SPACE:
            if self.modalita == "scasso" and self.scasso and not self.scasso.finita:
                self.scasso.tenta()
        elif evento.type == pygame.KEYDOWN and evento.key == pygame.K_ESCAPE:
            if self.selettore is not None:
                self.selettore = None

    def _click(self, pos):
        for rect, funzione, attivo, ritagliato in reversed(self.hit):
            if not attivo or not rect.collidepoint(pos):
                continue
            if ritagliato and not self.contenuto.collidepoint(pos):
                continue
            funzione()
            return

    def _aggiorna(self, dt):
        if self.scasso and self.modalita == "scasso":
            self.scasso.aggiorna(dt)
            if self.scasso.finita and not self.scasso.risolta:
                self._chiudi_scasso()
        if self.asta and self.modalita == "asta":
            self.asta.aggiorna(dt)
            if self.asta.finita and not self.asta.risolta:
                self._chiudi_asta()
        if self.scavo and self.modalita == "scavo" and self.scavo.finita and not self.scavo.risolta:
            self._chiudi_scavo()
        if self.apertura:
            centro = self.contenuto.center
            self.apertura.aggiorna(dt, centro)

    def _lavoro_bloccato(self):
        return self.stato.in_rosso()

    def _inizia_scavo(self, livello):
        if self._lavoro_bloccato():
            return
        tassa = SCAVI[livello]["tassa"]
        if self.stato.monete < tassa:
            return
        self.stato.monete -= tassa
        self.stato.salva()
        self.scavo = MinesweeperGame(livello)
        self.modalita = "scavo"

    def _inizia_scasso(self, livello):
        if self._lavoro_bloccato():
            return
        tassa = SCASSI[livello]["tassa"]
        if self.stato.monete < tassa:
            return
        self.stato.monete -= tassa
        self.stato.salva()
        self.scasso = LockpickGame(livello)
        self.modalita = "scasso"

    def _inizia_asta(self, livello):
        if self._lavoro_bloccato():
            return
        self.asta = AuctionGame(livello)
        self.modalita = "asta"

    def _chiudi_scavo(self):
        if not self.scavo or self.scavo.risolta:
            return
        self.scavo.risolta = True
        if self.scavo.trappola:
            self.stato.chiudi_lavoro(0, "Trappola: il bottino dello scavo è perduto", negativo=True)
        elif self.scavo.montepremi:
            self.stato.chiudi_lavoro(self.scavo.montepremi, f"Scavo incassato +{self.scavo.montepremi}")
        else:
            self.stato.chiudi_lavoro(0, "Sei uscito dallo scavo senza pepite")

    def _chiudi_scasso(self):
        if not self.scasso or self.scasso.risolta:
            return
        self.scasso.risolta = True
        if self.scasso.successo:
            self.stato.chiudi_lavoro(self.scasso.premio, f"Caveau aperto +{self.scasso.premio}")
        else:
            self.stato.chiudi_lavoro(0, "Caveau sigillato: il premio è perduto", negativo=True)

    def _chiudi_asta(self):
        if not self.asta or self.asta.risolta:
            return
        self.asta.risolta = True
        if self.asta.leader == "giocatore":
            delta = self.asta.valore - self.asta.prezzo
            if delta >= 0:
                testo = f"Asta vinta: valore {self.asta.valore}, pagato {self.asta.prezzo}, utile +{delta}"
            else:
                testo = f"Asta in perdita: valore {self.asta.valore}, pagato {self.asta.prezzo}, saldo {delta}"
            self.stato.chiudi_lavoro(delta, testo)
        else:
            self.stato.chiudi_lavoro(0, "Lotto aggiudicato a un altro. Non hai speso nulla")

    def _torna_lavori(self):
        self.modalita = None
        self.scavo = None
        self.scasso = None
        self.asta = None
        self.scheda = "lavori"

    def _compra(self, pacchetto_id):
        if self.apertura is not None:
            return
        ids = self.stato.compra_bustina(pacchetto_id)
        if not ids:
            return
        self.apertura = PackOpener(pacchetto_id, ids)
        self.scheda = "negozio"

    def _pulsante(self, rect, testo, funzione, attivo=True, primario=False, ritagliato=False):
        hover = attivo and rect.collidepoint(self.mouse)
        if not attivo:
            sfondo = (30, 41, 59)
            bordo = (71, 85, 105)
            colore = (100, 116, 139)
        elif primario:
            sfondo = (120, 86, 18) if hover else (146, 100, 14)
            bordo = ORO
            colore = (255, 251, 235)
        else:
            sfondo = (71, 85, 105) if hover else (51, 65, 85)
            bordo = (226, 232, 240) if hover else (203, 213, 225)
            colore = TESTO
        pygame.draw.rect(self.schermo, sfondo, rect, border_radius=8)
        pygame.draw.rect(self.schermo, bordo, rect, width=1, border_radius=8)
        etichetta = self.font.render(testo, True, colore)
        self.schermo.blit(etichetta, etichetta.get_rect(center=rect.center))
        self.hit.append((rect, funzione, attivo, ritagliato))

    def _pannello(self, rect, bordo=None):
        pygame.draw.rect(self.schermo, PANNELLO, rect, border_radius=12)
        pygame.draw.rect(self.schermo, bordo or PANNELLO_2, rect, width=1, border_radius=12)

    def _testo(self, testo, pos, font=None, colore=TESTO):
        font = font or self.font
        immagine = font.render(testo, True, colore)
        self.schermo.blit(immagine, pos)
        return immagine.get_width()

    def _paragrafo(self, testo, rect, font=None, colore=SMORZATO):
        font = font or self.font_piccolo
        y = rect.y
        for riga in spezza(font, testo, rect.w):
            if y > rect.bottom - font.get_height():
                break
            self._testo(riga, (rect.x, y), font, colore)
            y += font.get_height() + 2
        return y

    def _icona(self, cimelio, rect):
        pygame.draw.rect(self.schermo, (15, 23, 42), rect, border_radius=8)
        pygame.draw.rect(self.schermo, COLORE_RARITA[cimelio.rarita], rect, width=2, border_radius=8)
        raggio = max(6, min(rect.w, rect.h) // 2 - 8)
        disegna_forma(
            self.schermo,
            cimelio.forma,
            COLORE_SET[cimelio.insieme],
            rect.center,
            raggio,
        )

    def _disegna(self):
        self.hit = []
        self.mouse = pygame.mouse.get_pos()
        self.schermo.fill(SFONDO)
        self._barra()
        self._testata()
        if self.selettore is not None:
            self._disegna_casa(interattiva=False)
            self._disegna_selettore()
        elif self.modalita == "scavo":
            self._disegna_scavo()
        elif self.modalita == "scasso":
            self._disegna_scasso()
        elif self.modalita == "asta":
            self._disegna_asta()
        elif self.scheda == "casa":
            self._disegna_casa(interattiva=True)
        elif self.scheda == "negozio":
            self._disegna_negozio()
        elif self.scheda == "lavori":
            self._disegna_lavori()
        elif self.scheda == "collezione":
            self._disegna_collezione()

    def _vai(self, scheda):
        if self.modalita or self.apertura:
            return
        self.scheda = scheda
        self.scroll = 0
        self.selettore = None

    def _reset(self):
        adesso = pygame.time.get_ticks()
        if adesso > self.reset_fino_a:
            self.reset_fino_a = adesso + 3000
            return
        self.stato.reset()
        self.modalita = None
        self.scavo = None
        self.scasso = None
        self.asta = None
        self.apertura = None
        self.selettore = None
        self.scheda = "casa"
        self.scroll = 0
        self.reset_fino_a = 0

    def _barra(self):
        pygame.draw.rect(self.schermo, (2, 6, 23), (0, 0, BARRA, ALTEZZA))
        self._testo("Vault & Packs", (20, 22), self.font_titolo, ORO)
        self._testo("Collezione locale", (20, 52), self.font_piccolo, SMORZATO)
        voci = [
            ("casa", "La mia casa"),
            ("negozio", "Negozio"),
            ("lavori", "Lavori"),
            ("collezione", "Collezione"),
        ]
        blocco = self.modalita is not None or self.apertura is not None
        for indice, (scheda, etichetta) in enumerate(voci):
            rect = pygame.Rect(16, 110 + indice * 58, BARRA - 32, 46)
            attivo = scheda == self.scheda and self.modalita is None
            if attivo:
                pygame.draw.rect(self.schermo, (69, 52, 12), rect, border_radius=8)
                pygame.draw.rect(self.schermo, ORO, rect, width=1, border_radius=8)
                colore = ORO
            else:
                colore = SMORZATO if blocco else TESTO
            self._testo(etichetta, (rect.x + 14, rect.y + 12), self.font, colore)
            if not blocco:
                self.hit.append((rect, lambda s=scheda: self._vai(s), True, False))
        armato = pygame.time.get_ticks() < self.reset_fino_a
        testo = "Conferma reset" if armato else "Reset partita"
        urgente = self.stato.bloccato_senza_cimeli()
        self._pulsante(
            pygame.Rect(16, ALTEZZA - 68, BARRA - 32, 44),
            testo,
            self._reset,
            primario=armato or urgente,
        )

    def _testata(self):
        rect = pygame.Rect(BARRA, 0, LARGHEZZA - BARRA, TESTA)
        pygame.draw.rect(self.schermo, (15, 23, 42), rect)
        pygame.draw.line(self.schermo, (51, 65, 85), (BARRA, TESTA - 1), (LARGHEZZA, TESTA - 1))
        colore_monete = PERICOLO if self.stato.in_rosso() else ORO
        pillole = [
            (f"Monete  {self.stato.monete}", colore_monete),
            (f"Prestigio  {self.stato.case.prestigio()}", TESTO),
            (self.stato.case.casa()["nome"], TESTO),
            (f"Affitto tra  {AZIONI_PER_AFFITTO - self.stato.azioni}", SMORZATO),
        ]
        x = BARRA + 20
        for testo, colore in pillole:
            immagine = self.font_piccolo.render(testo, True, colore)
            scatola = pygame.Rect(x, 16, immagine.get_width() + 22, 32)
            pygame.draw.rect(self.schermo, PANNELLO, scatola, border_radius=8)
            self.schermo.blit(immagine, (scatola.x + 11, scatola.y + 8))
            x = scatola.right + 10
        fascia = pygame.Rect(BARRA, TESTA, LARGHEZZA - BARRA, MESSAGGIO_H)
        pygame.draw.rect(self.schermo, (15, 23, 42), fascia)
        colore = PERICOLO if self.stato.messaggio_negativo or self.stato.in_rosso() else SMORZATO
        testo = self.stato.messaggio
        if self.stato.bloccato_senza_cimeli():
            testo = "Non puoi pagare un lavoro e non hai cimeli da vendere. Resetta la partita."
            colore = PERICOLO
        self._paragrafo(testo, pygame.Rect(BARRA + 20, TESTA + 8, LARGHEZZA - BARRA - 40, 24), self.font_piccolo, colore)

    def _disegna_casa(self, interattiva):
        casa = self.stato.case.casa()
        sinistra = pygame.Rect(self.contenuto.x + 16, self.contenuto.y + 16, 640, self.contenuto.h - 32)
        self._pannello(sinistra)
        self._testo(casa["nome"], (sinistra.x + 18, sinistra.y + 16), self.font_titolo, ORO)
        info = (
            f"Slot {casa['slot']}   ·   affitto {casa['affitto']}   ·   "
            f"rendita +{self.stato.case.rendita()} a lavoro chiuso"
        )
        self._testo(info, (sinistra.x + 18, sinistra.y + 52), self.font_piccolo, SMORZATO)
        sinergie = self.stato.case.set_in_sinergia()
        if sinergie:
            self._testo(
                "Sinergia ×2: " + ", ".join(sorted(sinergie)),
                (sinistra.x + 18, sinistra.y + 74),
                self.font_piccolo,
                ORO,
            )
        else:
            self._testo(
                "Tre pezzi dello stesso set, esposti insieme, raddoppiano rendita e prestigio.",
                (sinistra.x + 18, sinistra.y + 74),
                self.font_piccolo,
                SMORZATO,
            )
        self._griglia_slot(sinistra, interattiva)
        destra = pygame.Rect(sinistra.right + 16, sinistra.y, self.contenuto.right - sinistra.right - 32, 280)
        self._pannello(destra)
        self._testo("Immobile successivo", (destra.x + 18, destra.y + 16), self.font, ORO)
        prossima = self.stato.case.prossima()
        if prossima is None:
            self._paragrafo(
                "Il museo è la casa più grande. Non c'è un altro indirizzo.",
                pygame.Rect(destra.x + 18, destra.y + 56, destra.w - 36, 80),
            )
        else:
            self._testo(prossima["nome"], (destra.x + 18, destra.y + 52), self.font, TESTO)
            manca_monete = max(0, prossima["costo"] - self.stato.monete)
            manca_prestigio = max(0, prossima["prestigio"] - self.stato.case.prestigio())
            dettaglio = (
                f"{prossima['slot']} slot  ·  {prossima['costo']} monete  ·  "
                f"prestigio {prossima['prestigio']}"
            )
            self._testo(dettaglio, (destra.x + 18, destra.y + 82), self.font_piccolo, SMORZATO)
            if manca_monete or manca_prestigio:
                mancanze = []
                if manca_monete:
                    mancanze.append(f"{manca_monete} monete")
                if manca_prestigio:
                    mancanze.append(f"{manca_prestigio} prestigio")
                self._paragrafo(
                    "Ti manca " + " e ".join(mancanze) + ".",
                    pygame.Rect(destra.x + 18, destra.y + 112, destra.w - 36, 50),
                    colore=PERICOLO,
                )
            else:
                self._testo("Puoi comprarla.", (destra.x + 18, destra.y + 116), self.font_piccolo, OK)
            self._pulsante(
                pygame.Rect(destra.x + 18, destra.bottom - 64, destra.w - 36, 44),
                f"Compra · {prossima['costo']}",
                self.stato.case.compra,
                attivo=interattiva and self.stato.case.puo_comprare(),
                primario=True,
            )

    def _griglia_slot(self, pannello, interattiva):
        colonne = 5
        lato = 108
        gap = 10
        origine_x = pannello.x + 18
        origine_y = pannello.y + 108
        sinergie = self.stato.case.set_in_sinergia()
        for indice, id_ in enumerate(self.stato.esposti):
            col = indice % colonne
            riga = indice // colonne
            rect = pygame.Rect(origine_x + col * (lato + gap), origine_y + riga * (lato + gap), lato, lato)
            if id_ and CATALOGO[id_].insieme in sinergie:
                pygame.draw.rect(self.schermo, (69, 52, 12), rect, border_radius=10)
                pygame.draw.rect(self.schermo, ORO, rect, width=2, border_radius=10)
            else:
                self._pannello(rect)
            if id_:
                cimelio = CATALOGO[id_]
                icona = pygame.Rect(rect.x + 30, rect.y + 10, 48, 48)
                self._icona(cimelio, icona)
                nome = cimelio.nome
                while nome and self.font_piccolo.size(nome + "…")[0] > lato - 8:
                    nome = nome[:-1]
                if nome != cimelio.nome:
                    nome += "…"
                etichetta = self.font_piccolo.render(nome, True, TESTO)
                self.schermo.blit(etichetta, etichetta.get_rect(midtop=(rect.centerx, rect.bottom - 28)))
                if interattiva:
                    self.hit.append((rect, lambda s=indice: self.stato.case.togli(s), True, False))
            else:
                piu = self.font_grande.render("+", True, SMORZATO)
                self.schermo.blit(piu, piu.get_rect(center=rect.center))
                if interattiva:
                    self.hit.append((rect, lambda s=indice: self._apri_selettore(s), True, False))

    def _apri_selettore(self, slot):
        self.selettore = slot
        self.scroll = 0

    def _disegna_selettore(self):
        velo = pygame.Surface((LARGHEZZA, ALTEZZA), pygame.SRCALPHA)
        velo.fill((2, 6, 23, 180))
        self.schermo.blit(velo, (0, 0))
        finestra = pygame.Rect(BARRA + 40, 120, LARGHEZZA - BARRA - 80, ALTEZZA - 180)
        self._pannello(finestra, ORO)
        self._testo("Scegli un cimelio da esporre", (finestra.x + 20, finestra.y + 16), self.font_titolo, ORO)
        self._pulsante(
            pygame.Rect(finestra.right - 140, finestra.y + 16, 120, 36),
            "Chiudi",
            lambda: setattr(self, "selettore", None),
        )
        posseduti = []
        for cimelio in CATALOGO_LISTA:
            libere = self.stato.case.copie_libere(cimelio.id)
            if libere > 0:
                posseduti.append((cimelio, libere))
        if not posseduti:
            self._paragrafo(
                "Non hai copie libere. Apri una bustina, oppure togli un pezzo già esposto.",
                pygame.Rect(finestra.x + 20, finestra.y + 80, finestra.w - 40, 60),
            )
            return
        area = pygame.Rect(finestra.x + 16, finestra.y + 68, finestra.w - 32, finestra.h - 84)
        self.schermo.set_clip(area)
        colonne = 3
        larghezza = (area.w - 16) // colonne
        altezza = 84
        totale = math.ceil(len(posseduti) / colonne) * altezza
        self.scroll_massimo = max(0, totale - area.h)
        self.scroll = min(self.scroll, self.scroll_massimo)
        for indice, (cimelio, libere) in enumerate(posseduti):
            col = indice % colonne
            riga = indice // colonne
            rect = pygame.Rect(
                area.x + col * larghezza,
                area.y + riga * altezza - self.scroll,
                larghezza - 10,
                altezza - 10,
            )
            if not area.colliderect(rect):
                continue
            self._pannello(rect, COLORE_RARITA[cimelio.rarita])
            self._icona(cimelio, pygame.Rect(rect.x + 8, rect.y + 14, 52, 52))
            self._testo(cimelio.nome, (rect.x + 70, rect.y + 14), self.font_piccolo, TESTO)
            self._testo(
                f"{cimelio.rarita} · {cimelio.insieme} · ×{libere}",
                (rect.x + 70, rect.y + 38),
                self.font_piccolo,
                SMORZATO,
            )
            self.hit.append((
                rect,
                lambda i=cimelio.id, s=self.selettore: self._piazza_e_chiudi(s, i),
                True,
                False,
            ))
        self.schermo.set_clip(None)

    def _piazza_e_chiudi(self, slot, id_):
        if self.stato.case.piazza(slot, id_):
            self.selettore = None

    def _disegna_negozio(self):
        if self.apertura:
            self._disegna_apertura()
            return
        self._testo("Tre pacchetti, tre cimeli ciascuno.", (self.contenuto.x + 24, self.contenuto.y + 18), self.font, SMORZATO)
        if self.stato.in_rosso():
            self._testo("In rosso non si compra. Vendi un cimelio dalla collezione.", (self.contenuto.x + 24, self.contenuto.y + 46), self.font_piccolo, PERICOLO)
        larghezza = (self.contenuto.w - 64) // 3
        for indice, pacchetto in enumerate(PACCHETTI):
            rect = pygame.Rect(self.contenuto.x + 16 + indice * (larghezza + 16), self.contenuto.y + 80, larghezza, 340)
            self._pannello(rect)
            self._testo(pacchetto["nome"], (rect.x + 16, rect.y + 18), self.font, ORO)
            self._testo(f"{pacchetto['costo']} monete", (rect.x + 16, rect.y + 52), self.font_grande, TESTO)
            self._paragrafo(pacchetto["testo"], pygame.Rect(rect.x + 16, rect.y + 110, rect.w - 32, 70))
            self._paragrafo(
                "Si taglia il sigillo col mouse. Il bordo prende il colore della rarità più alta.",
                pygame.Rect(rect.x + 16, rect.y + 180, rect.w - 32, 70),
            )
            puo = (not self.stato.in_rosso()) and self.stato.monete >= pacchetto["costo"]
            self._pulsante(
                pygame.Rect(rect.x + 16, rect.bottom - 64, rect.w - 32, 44),
                "Compra e apri",
                lambda p=pacchetto["id"]: self._compra(p),
                attivo=puo,
                primario=puo,
            )

    def _disegna_apertura(self):
        apertura = self.apertura
        rect = pygame.Rect(self.contenuto.x + 80, self.contenuto.y + 24, self.contenuto.w - 160, self.contenuto.h - 48)
        colore = COLORE_RARITA[apertura.rarita] if apertura.fase != "taglio" else PANNELLO_2
        self._pannello(rect, colore)
        self._testo(apertura.pacchetto["nome"], (rect.x + 24, rect.y + 16), self.font_titolo, ORO)
        if apertura.fase == "taglio":
            self._testo("Trascina o clicca sul sigillo per tagliarlo.", (rect.x + 24, rect.y + 56), self.font, SMORZATO)
            pacco = pygame.Rect(rect.centerx - 160, rect.y + 120, 320, 220)
            pygame.draw.rect(self.schermo, (69, 52, 12), pacco, border_radius=12)
            pygame.draw.rect(self.schermo, ORO, pacco, width=2, border_radius=12)
            sigillo = pygame.Rect(pacco.x + 24, pacco.centery - 16, pacco.w - 48, 32)
            apertura.sigillo = sigillo
            progresso = min(1.0, apertura.taglio / TAGLIO_SIGILLO)
            pieno = pygame.Rect(sigillo.x, sigillo.y, int(sigillo.w * progresso), sigillo.h)
            pygame.draw.rect(self.schermo, (120, 53, 15), sigillo, border_radius=6)
            if pieno.w:
                pygame.draw.rect(self.schermo, ORO, pieno, border_radius=6)
            self._testo("SIGILLO", (sigillo.x + 8, sigillo.y + 6), self.font_piccolo, SFONDO)
        else:
            apertura.sigillo = pygame.Rect(0, 0, 0, 0)
            centro = (rect.centerx, rect.y + 150)
            for particella in apertura.particelle:
                px = int(centro[0] + particella["x"])
                py = int(centro[1] + particella["y"])
                pygame.draw.circle(self.schermo, particella["colore"], (px, py), 3)
            if apertura.fase == "bagliore":
                self._testo(
                    f"Qualcosa di {apertura.rarita.lower()} è nel pacco.",
                    (rect.x + 24, rect.y + 220),
                    self.font,
                    COLORE_RARITA[apertura.rarita],
                )
            else:
                self._carte(rect, apertura)
                if apertura.finita():
                    self._pulsante(
                        pygame.Rect(rect.centerx - 120, rect.bottom - 64, 240, 44),
                        "Nella collezione",
                        self._chiudi_apertura,
                        primario=True,
                    )
                else:
                    self._pulsante(
                        pygame.Rect(rect.centerx - 120, rect.bottom - 64, 240, 44),
                        "Gira la prossima",
                        apertura.gira,
                        primario=True,
                    )

    def _carte(self, rect, apertura):
        for indice in range(3):
            carta = pygame.Rect(rect.x + 48 + indice * 210, rect.y + 250, 190, 150)
            cimelio = CATALOGO[apertura.ids[indice]]
            if indice < apertura.mostrate:
                self._pannello(carta, COLORE_RARITA[cimelio.rarita])
                self._icona(cimelio, pygame.Rect(carta.x + 12, carta.y + 14, 48, 48))
                nome = cimelio.nome
                while nome and self.font_piccolo.size(nome + "…")[0] > carta.w - 78:
                    nome = nome[:-1]
                if nome != cimelio.nome:
                    nome += "…"
                self._testo(nome, (carta.x + 68, carta.y + 16), self.font_piccolo, TESTO)
                self._testo(cimelio.rarita, (carta.x + 68, carta.y + 38), self.font_piccolo, COLORE_RARITA[cimelio.rarita])
                self._testo(cimelio.insieme, (carta.x + 12, carta.y + 112), self.font_piccolo, SMORZATO)
            else:
                self._pannello(carta, COLORE_RARITA[apertura.rarita] if indice == apertura.mostrate else PANNELLO_2)
                punto = self.font_grande.render("?", True, SMORZATO)
                self.schermo.blit(punto, punto.get_rect(center=carta.center))
            if indice == apertura.mostrate:
                self.hit.append((carta, apertura.gira, True, False))

    def _chiudi_apertura(self):
        self.apertura = None

    def _disegna_lavori(self):
        if self.stato.in_rosso():
            self._testo(
                "Lavori bloccati finché il saldo è in rosso.",
                (self.contenuto.x + 24, self.contenuto.y + 16),
                self.font,
                PERICOLO,
            )
        else:
            self._testo(
                "La tassa si paga all'ingresso e non torna. Il rischio alto paga di più.",
                (self.contenuto.x + 24, self.contenuto.y + 16),
                self.font_piccolo,
                SMORZATO,
            )
        giochi = [
            ("Scavo archeologico", "Griglia, pepite, trappole. Incassa prima di saltare in aria.", SCAVI, self._inizia_scavo, "tassa"),
            ("Scasso del caveau", "Spazio nella zona verde. Due errori, al terzo si chiude.", SCASSI, self._inizia_scasso, "tassa"),
            ("Asta e perizia", "Dieci secondi contro due bot. Non rilanciare non costa.", ASTE, self._inizia_asta, "base"),
        ]
        larghezza = (self.contenuto.w - 64) // 3
        for indice, (titolo, descrizione, livelli, avvia, campo) in enumerate(giochi):
            rect = pygame.Rect(self.contenuto.x + 16 + indice * (larghezza + 16), self.contenuto.y + 52, larghezza, self.contenuto.h - 72)
            self._pannello(rect)
            self._testo(titolo, (rect.x + 16, rect.y + 16), self.font, ORO)
            self._paragrafo(descrizione, pygame.Rect(rect.x + 16, rect.y + 50, rect.w - 32, 70))
            for livello, dati in enumerate(livelli):
                if campo == "tassa":
                    dettaglio = f"{dati['nome']} · tassa {dati['tassa']}"
                    if "paga" in dati:
                        dettaglio += f" · +{dati['paga']}/pepita"
                    elif "premio" in dati:
                        dettaglio += f" · premio {dati['premio']}"
                    puo = (not self.stato.in_rosso()) and self.stato.monete >= dati["tassa"]
                else:
                    dettaglio = f"{dati['nome']} · base {dati['base']} · passo {dati['passo']}"
                    puo = not self.stato.in_rosso()
                self._testo(dettaglio, (rect.x + 16, rect.y + 140 + livello * 78), self.font_piccolo, SMORZATO)
                self._pulsante(
                    pygame.Rect(rect.x + 16, rect.y + 164 + livello * 78, rect.w - 32, 40),
                    f"Entra · {dati['nome']}",
                    lambda lv=livello, fn=avvia: fn(lv),
                    attivo=puo,
                    primario=(livello == 2 and puo),
                )

    def _disegna_scavo(self):
        scavo = self.scavo
        self._testo(
            f"Scavo {scavo.nome} · tassa già pagata {scavo.tassa} · pepite {scavo.trovate}",
            (self.contenuto.x + 24, self.contenuto.y + 12),
            self.font,
            ORO,
        )
        self._testo(
            "Click sinistro scava. Click destro, o Ctrl e click, mette la bandierina.",
            (self.contenuto.x + 24, self.contenuto.y + 40),
            self.font_piccolo,
            SMORZATO,
        )
        scavo.lato = 52
        scavo.origine = (self.contenuto.x + 28, self.contenuto.y + 78)
        for y in range(GRIGLIA):
            for x in range(GRIGLIA):
                rect = pygame.Rect(
                    scavo.origine[0] + x * scavo.lato,
                    scavo.origine[1] + y * scavo.lato,
                    scavo.lato - 3,
                    scavo.lato - 3,
                )
                aperta = scavo.rivelate[y][x]
                if aperta and (x, y) in scavo.trappole:
                    pygame.draw.rect(self.schermo, (127, 29, 29), rect, border_radius=4)
                    self._testo("×", (rect.x + 16, rect.y + 12), self.font_grande, (254, 226, 226))
                elif scavo.finita and (x, y) in scavo.trappole:
                    pygame.draw.rect(self.schermo, (69, 10, 10), rect, border_radius=4)
                    self._testo("×", (rect.x + 16, rect.y + 12), self.font, PERICOLO)
                elif aperta and (x, y) in scavo.pepite:
                    pygame.draw.rect(self.schermo, (69, 52, 12), rect, border_radius=4)
                    pygame.draw.circle(self.schermo, ORO, rect.center, 10)
                elif aperta:
                    pygame.draw.rect(self.schermo, CELLA_APERTA, rect, border_radius=4)
                    pygame.draw.rect(self.schermo, PANNELLO_2, rect, width=1, border_radius=4)
                    if scavo.pronta:
                        n = scavo._trappole_vicine(x, y)
                        if n:
                            colore = {
                                1: (96, 165, 250),
                                2: (52, 211, 153),
                                3: (248, 113, 113),
                                4: (167, 139, 250),
                                5: (251, 146, 60),
                                6: (34, 211, 238),
                                7: TESTO,
                                8: SMORZATO,
                            }[n]
                            etichetta = self.font.render(str(n), True, colore)
                            self.schermo.blit(etichetta, etichetta.get_rect(center=rect.center))
                else:
                    pygame.draw.rect(self.schermo, CELLA_CHIUSA, rect, border_radius=4)
                    if scavo.bandiere[y][x]:
                        pygame.draw.polygon(
                            self.schermo,
                            ORO,
                            [(rect.centerx, rect.y + 10), (rect.centerx, rect.bottom - 10), (rect.right - 10, rect.centery)],
                        )
                if not scavo.risolta and not aperta:
                    self.hit.append((rect, lambda cx=x, cy=y: scavo.scava(cx, cy), True, False))
        lato_info = pygame.Rect(scavo.origine[0] + GRIGLIA * scavo.lato + 28, scavo.origine[1], 360, 420)
        self._pannello(lato_info)
        self._testo("Montepremi", (lato_info.x + 18, lato_info.y + 16), self.font_piccolo, SMORZATO)
        colore = PERICOLO if scavo.trappola else ORO
        self._testo(str(0 if scavo.trappola else scavo.montepremi), (lato_info.x + 18, lato_info.y + 40), self.font_grande, colore)
        self._paragrafo(
            f"Ogni pepita vale {scavo.paga}. Nel terreno ce ne sono {len(scavo.pepite)}, "
            f"fuori dalla prima zona sicura. Una trappola azzera tutto.",
            pygame.Rect(lato_info.x + 18, lato_info.y + 100, lato_info.w - 36, 120),
        )
        if scavo.trovate and scavo.pronta and scavo.trovate == len(scavo.pepite) and not scavo.trappola:
            self._testo("Le pepite sono tutte fuori.", (lato_info.x + 18, lato_info.y + 230), self.font_piccolo, OK)
        if not scavo.risolta:
            self._pulsante(
                pygame.Rect(lato_info.x + 18, lato_info.bottom - 64, lato_info.w - 36, 44),
                "Incassa e scappa",
                scavo.incassa,
                primario=True,
            )
        else:
            self._pulsante(
                pygame.Rect(lato_info.x + 18, lato_info.bottom - 64, lato_info.w - 36, 44),
                "Torna ai lavori",
                self._torna_lavori,
                primario=True,
            )

    def _disegna_scasso(self):
        scasso = self.scasso
        self._testo(
            f"Scasso {scasso.nome} · cilindro {min(scasso.corrente + 1, scasso.cilindri)}/{scasso.cilindri} · errori {scasso.errori}/{ERRORI_CONSENTITI}",
            (self.contenuto.x + 24, self.contenuto.y + 16),
            self.font,
            ORO,
        )
        self._testo("Premi Spazio quando il cursore è nel verde.", (self.contenuto.x + 24, self.contenuto.y + 48), self.font_piccolo, SMORZATO)
        barra = pygame.Rect(self.contenuto.x + 48, self.contenuto.y + 220, self.contenuto.w - 96, 42)
        pygame.draw.rect(self.schermo, (15, 23, 42), barra, border_radius=8)
        pygame.draw.rect(self.schermo, PANNELLO_2, barra, width=1, border_radius=8)
        zona_x = barra.x + int((scasso.centro - scasso.mezza) * barra.w)
        zona_w = max(4, int(scasso.mezza * 2 * barra.w))
        pygame.draw.rect(self.schermo, VERDE_ZONA, (zona_x, barra.y + 4, zona_w, barra.h - 8), border_radius=4)
        cursore_x = barra.x + int(scasso.pos * barra.w)
        colore_cursore = OK if scasso.flash_ok and scasso.flash else PERICOLO if scasso.flash else ORO
        pygame.draw.rect(self.schermo, colore_cursore, (cursore_x - 3, barra.y - 10, 6, barra.h + 20), border_radius=2)
        for indice in range(scasso.cilindri):
            centro = (self.contenuto.x + 80 + indice * 70, self.contenuto.y + 140)
            if indice < scasso.corrente:
                colore = OK
            elif indice == scasso.corrente and not scasso.finita:
                colore = ORO
            else:
                colore = PANNELLO_2
            pygame.draw.circle(self.schermo, colore, centro, 18)
            pygame.draw.circle(self.schermo, SFONDO, centro, 8)
        self._testo(f"Premio in palio: {scasso.premio}", (self.contenuto.x + 48, self.contenuto.y + 300), self.font, TESTO)
        self._testo(f"Tassa già pagata: {scasso.tassa}", (self.contenuto.x + 48, self.contenuto.y + 332), self.font_piccolo, SMORZATO)
        if scasso.risolta:
            esito = "Caveau aperto." if scasso.successo else "Il caveau si è sigillato."
            self._testo(esito, (self.contenuto.x + 48, self.contenuto.y + 380), self.font, OK if scasso.successo else PERICOLO)
            self._pulsante(
                pygame.Rect(self.contenuto.x + 48, self.contenuto.y + 430, 240, 44),
                "Torna ai lavori",
                self._torna_lavori,
                primario=True,
            )

    def _disegna_asta(self):
        asta = self.asta
        self._testo(f"Asta {asta.nome} · base {asta.base} · passo {asta.passo}", (self.contenuto.x + 24, self.contenuto.y + 16), self.font, ORO)
        scheda = pygame.Rect(self.contenuto.x + 24, self.contenuto.y + 60, 460, 280)
        self._pannello(scheda)
        self._testo("Lotto misterioso", (scheda.x + 16, scheda.y + 16), self.font, TESTO)
        for indice, indizio in enumerate(asta.indizi):
            self._paragrafo(
                indizio,
                pygame.Rect(scheda.x + 16, scheda.y + 60 + indice * 58, scheda.w - 32, 50),
                self.font,
                TESTO,
            )
        lato = pygame.Rect(scheda.right + 20, scheda.y, 420, 280)
        self._pannello(lato)
        self._testo(f"{asta.tempo:04.1f} s", (lato.x + 16, lato.y + 16), self.font_grande, ORO if asta.tempo > 3 else PERICOLO)
        barra = pygame.Rect(lato.x + 16, lato.y + 70, lato.w - 32, 14)
        pygame.draw.rect(self.schermo, SFONDO, barra, border_radius=6)
        pieno = pygame.Rect(barra.x, barra.y, int(barra.w * (asta.tempo / 10)), barra.h)
        pygame.draw.rect(self.schermo, ORO, pieno, border_radius=6)
        self._testo(f"Prezzo  {asta.prezzo}", (lato.x + 16, lato.y + 100), self.font, TESTO)
        self._testo(f"In testa: {asta.nome_leader()}", (lato.x + 16, lato.y + 136), self.font, SMORZATO)
        prossimo = asta.prezzo_prossimo()
        puo = (not asta.finita) and self.stato.monete >= prossimo
        if not asta.risolta:
            self._pulsante(
                pygame.Rect(lato.x + 16, lato.bottom - 64, lato.w - 32, 44),
                f"Rilancia a {prossimo}",
                lambda: asta.rilancio_giocatore(self.stato.monete),
                attivo=puo,
                primario=True,
            )
        else:
            self._testo(f"Valore vero: {asta.valore}", (lato.x + 16, lato.y + 176), self.font, OK if asta.valore >= asta.prezzo else PERICOLO)
        if asta.risolta:
            self._pulsante(
                pygame.Rect(scheda.x, self.contenuto.bottom - 70, 240, 44),
                "Torna ai lavori",
                self._torna_lavori,
                primario=True,
            )
        else:
            self._paragrafo(
                "Il bot irruento rilancia spesso. Il calcolatore solo se il prezzo è sotto la sua stima. Lasciare correre il tempo non costa.",
                pygame.Rect(self.contenuto.x + 24, self.contenuto.bottom - 80, self.contenuto.w - 48, 60),
            )

    def _disegna_collezione(self):
        self.schermo.set_clip(self.contenuto)
        y = self.contenuto.y + 16 - self.scroll
        self._testo("Tre copie uguali si fondono nella rarità sopra. Il mitico si vende o si espone.", (self.contenuto.x + 20, y), self.font_piccolo, SMORZATO)
        y += 36
        posseduti = [c for c in CATALOGO_LISTA if self.stato.inventario.get(c.id, 0) > 0]
        mancanti = [c for c in CATALOGO_LISTA if self.stato.inventario.get(c.id, 0) == 0]
        if not posseduti:
            self._testo("L'inventario è vuoto.", (self.contenuto.x + 20, y), self.font, SMORZATO)
            y += 40
        for cimelio in posseduti:
            y = self._riga_cimelio(cimelio, y, True)
        y += 12
        self._testo("Ancora da trovare", (self.contenuto.x + 20, y), self.font, SMORZATO)
        y += 32
        for cimelio in mancanti:
            y = self._riga_cimelio(cimelio, y, False)
        altezza = y + self.scroll - self.contenuto.y
        self.scroll_massimo = max(0, altezza - self.contenuto.h + 16)
        self.scroll = min(self.scroll, self.scroll_massimo)
        self.schermo.set_clip(None)

    def _riga_cimelio(self, cimelio, y, posseduto):
        rect = pygame.Rect(self.contenuto.x + 16, y, self.contenuto.w - 32, 96)
        visibile = self.contenuto.colliderect(rect)
        if visibile:
            bordo = COLORE_RARITA[cimelio.rarita] if posseduto else (51, 65, 85)
            self._pannello(rect, bordo)
            self._icona(cimelio, pygame.Rect(rect.x + 12, rect.y + 22, 52, 52))
            colore = TESTO if posseduto else SMORZATO
            self._testo(cimelio.nome, (rect.x + 78, rect.y + 8), self.font, colore)
            quantita = self.stato.inventario.get(cimelio.id, 0)
            self._testo(
                f"{cimelio.rarita} · {cimelio.insieme} · valore {cimelio.valore_base} · rendita {cimelio.rendita}",
                (rect.x + 78, rect.y + 32),
                self.font_piccolo,
                COLORE_RARITA[cimelio.rarita] if posseduto else SMORZATO,
            )
            self._paragrafo(
                cimelio.descrizione,
                pygame.Rect(rect.x + 78, rect.y + 52, rect.w - 420, 36),
                self.font_piccolo,
                SMORZATO,
            )
            if posseduto:
                self._testo(f"×{quantita}", (rect.right - 400, rect.y + 12), self.font_piccolo, SMORZATO)
                self._pulsante(
                    pygame.Rect(rect.right - 150, rect.y + 28, 130, 40),
                    f"Vendi {prezzo_vendita(cimelio.valore_base)}",
                    lambda i=cimelio.id: self.stato.vendi(i),
                    ritagliato=True,
                )
                if cimelio.rarita != "Mitico":
                    self._pulsante(
                        pygame.Rect(rect.right - 310, rect.y + 28, 148, 40),
                        "Fondi 3",
                        lambda i=cimelio.id: self.stato.fondi(i),
                        attivo=quantita >= 3,
                        ritagliato=True,
                    )
        return y + 106


def controlli():
    """Prove sulle regole, senza aprire la finestra di gioco."""
    global SALVATAGGIO_FORZATO
    import tempfile

    cartella = tempfile.mkdtemp(prefix="vault-")
    SALVATAGGIO_FORZATO = os.path.join(cartella, "save.json")
    errori = []

    def atteso(condizione, testo):
        if not condizione:
            errori.append(testo)

    stato = GameState.nuovo()
    atteso(stato.monete == 60 and stato.casa == 0 and stato.inventario == {}, "partenza")
    atteso(len(CATALOGO_LISTA) == 28, "catalogo")
    for insieme in COLORE_SET:
        pezzi = [c for c in CATALOGO_LISTA if c.insieme == insieme and c.rarita != "Mitico"]
        atteso(len(pezzi) == 6, f"set {insieme}")
        atteso(sum(1 for c in pezzi if c.rarita == "Comune") == 2, f"comuni {insieme}")
        atteso(sum(1 for c in pezzi if c.rarita == "Mitico") == 0, f"mitico fuori dai sei {insieme}")
        atteso(sum(1 for c in CATALOGO_LISTA if c.insieme == insieme and c.rarita == "Mitico") == 1, f"mitico {insieme}")

    for _ in range(40):
        scavo = MinesweeperGame(0)
        scavo.scava(3, 4)
        atteso((3, 4) not in scavo.trappole, "prima cella sicura")
        atteso(scavo.pronta, "griglia pronta")
        zona = scavo._zona_aperta(3, 4)
        atteso(scavo.pepite.isdisjoint(zona), "pepite fuori dalla prima zona")
        atteso(len(scavo.trappole) == 8, "otto trappole")

    stato.chiudi_lavoro(0, "vuoto")
    stato.chiudi_lavoro(0, "vuoto")
    stato.chiudi_lavoro(0, "vuoto")
    stato.chiudi_lavoro(0, "vuoto")
    atteso(stato.monete == 60 and stato.azioni == 4, "quattro azioni senza affitto")
    stato.chiudi_lavoro(0, "vuoto")
    atteso(stato.monete == 48 and stato.azioni == 0, "affitto del monolocale")

    scavo = MinesweeperGame(0)
    scavo.scava(0, 0)
    scavo.montepremi = 30
    scavo.incassa()
    atteso(scavo.finita and not scavo.trappola, "incasso")
    prima = stato.monete
    stato.chiudi_lavoro(scavo.montepremi, "incasso")
    atteso(stato.monete == prima + 30, "il montepremi entra in cassa")

    comune = next(c.id for c in CATALOGO_LISTA if c.rarita == "Comune")
    raro = next(c.id for c in CATALOGO_LISTA if c.rarita == "Raro" and CATALOGO[c.id].insieme == CATALOGO[comune].insieme)
    epico = next(c.id for c in CATALOGO_LISTA if c.rarita == "Epico" and CATALOGO[c.id].insieme == CATALOGO[comune].insieme)
    altro_raro = [c.id for c in CATALOGO_LISTA if c.rarita == "Raro" and c.insieme == CATALOGO[comune].insieme and c.id != raro][0]
    stato.aggiungi(raro)
    stato.aggiungi(altro_raro)
    stato.aggiungi(epico)
    stato.case.piazza(0, raro)
    stato.case.piazza(1, altro_raro)
    stato.case.piazza(2, epico)
    atteso(stato.case.prestigio() == 16, f"sinergia prestigio {stato.case.prestigio()}")
    atteso(stato.case.rendita() == 26, "sinergia rendita")
    monete = stato.monete
    stato.chiudi_lavoro(0, "rendita")
    atteso(stato.monete == monete + 26, "la rendita entra a lavoro chiuso")
    stato.case.togli(2)
    atteso(stato.case.prestigio() == 4, "il prestigio non resta se togli il pezzo")

    stato.inventario[comune] = 3
    rari_prima = sum(q for i, q in stato.inventario.items() if CATALOGO[i].rarita == "Raro")
    random.seed(1)
    stato.fondi(comune)
    rari_dopo = sum(q for i, q in stato.inventario.items() if CATALOGO[i].rarita == "Raro")
    atteso(stato.inventario.get(comune, 0) == 0, "tre copie consumate")
    atteso(rari_dopo == rari_prima + 1, "fusione al grado sopra")
    mitico = next(c.id for c in CATALOGO_LISTA if c.rarita == "Mitico")
    stato.inventario[mitico] = 3
    atteso(stato.fondi(mitico) is False, "il mitico non si fonde")

    ricavo = prezzo_vendita(20)
    atteso(ricavo == 9, "vendita comune")
    stato.monete = -5
    stato.vendi(mitico)
    atteso(stato.monete == -5 + prezzo_vendita(700), "vendita per coprire il rosso")
    atteso(not stato.in_rosso(), "rosso saldato")

    random.seed(2)
    conteggi = {"Comune": 0, "Raro": 0, "Epico": 0}
    for _ in range(3000):
        conteggi[CATALOGO[estrai_cimelio("polveroso")].rarita] += 1
    atteso(conteggi["Comune"] > 1800, "polveroso per lo più comune")
    atteso(all(CATALOGO[estrai_cimelio("polveroso")].rarita != "Mitico" for _ in range(200)), "niente mitici nel polveroso")
    reliquie = [CATALOGO[estrai_cimelio("reliquiario")].rarita for _ in range(400)]
    atteso(all(r in ("Epico", "Leggendario", "Mitico") for r in reliquie), "reliquiario solo alto")

    random.seed(3)
    scasso = LockpickGame(0)
    scasso.pos = scasso.centro
    scasso.tenta()
    atteso(scasso.corrente == 1 and scasso.errori == 0, "spazio nel verde")
    scasso.pos = 0 if scasso.centro > 0.5 else 1
    scasso.tenta()
    scasso.tenta()
    atteso(scasso.errori == 2 and not scasso.finita, "due errori ancora aperti")
    scasso.tenta()
    atteso(scasso.finita and not scasso.successo, "terzo errore chiude")

    asta = AuctionGame(0)
    asta.attesa_irruento = 10
    asta.attesa_calcolo = 10
    asta.tempo = 0.01
    asta.aggiorna(0.1)
    atteso(asta.finita and asta.leader is None, "senza rilancio non si paga")
    scavo_trappola = MinesweeperGame(0)
    scavo_trappola.scava(0, 0)
    tx, ty = next(iter(scavo_trappola.trappole))
    scavo_trappola.bandiera(tx, ty)
    scavo_trappola.montepremi = 40
    scavo_trappola.scava(tx, ty)
    atteso(not scavo_trappola.trappola and scavo_trappola.montepremi == 40, "la bandierina blocca lo scavo")
    scavo_trappola.bandiera(tx, ty)
    scavo_trappola.scava(tx, ty)
    atteso(scavo_trappola.trappola and scavo_trappola.montepremi == 0, "la trappola azzera il montepremi")

    stato.salva()
    caricato = GameState.carica()
    atteso(caricato.monete == stato.monete and caricato.casa == stato.casa, "save.json rilegge le monete")
    atteso(caricato.inventario.get(mitico, 0) == stato.inventario.get(mitico, 0), "save.json rilegge i cimeli")

    if errori:
        raise SystemExit("Controlli falliti:\n- " + "\n- ".join(errori))
    print("Controlli ok")


def anteprima(cartella):
    """Disegna le schermate e le salva, per verificare che la finestra non sia vuota."""
    global SALVATAGGIO_FORZATO
    os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
    SALVATAGGIO_FORZATO = os.path.join(cartella, "save.json")
    pygame.init()
    schermo = pygame.display.set_mode((LARGHEZZA, ALTEZZA))
    stato = GameState.nuovo()
    ui = UIManager(stato=stato, schermo=schermo)
    os.makedirs(cartella, exist_ok=True)

    def scatta(nome):
        ui._disegna()
        pygame.image.save(schermo, os.path.join(cartella, nome))

    scatta("casa.png")
    ui.scheda = "negozio"
    scatta("negozio.png")
    ui.scheda = "lavori"
    scatta("lavori.png")
    ui.scheda = "collezione"
    scatta("collezione.png")
    ui._inizia_scavo(0)
    ui.scavo.scava(1, 1)
    ui._disegna()
    pygame.image.save(schermo, os.path.join(cartella, "scavo.png"))
    ui.scavo.incassa()
    ui._aggiorna(0.016)
    scatta("scavo-incasso.png")
    pygame.quit()


def main():
    if "--check" in sys.argv:
        controlli()
        return
    if "--preview" in sys.argv:
        cartella = sys.argv[sys.argv.index("--preview") + 1] if len(sys.argv) > sys.argv.index("--preview") + 1 else "/tmp/vault-preview"
        anteprima(cartella)
        return
    UIManager().esegui()


if __name__ == "__main__":
    main()

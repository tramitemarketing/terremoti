"""
patch8.py — Review fixes
  1. Accenti mancanti in tutto l'HTML (e'→è, a'→à, etc.)
  2. Nessun altro cambiamento strutturale
"""

PATH = 'C:/Users/gioff/Desktop/CLAUDE CODE/TERREMOTO/terremoti-main/index.html'
with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

fixes = [
    # Anime Sante body
    (
        'Conosciuta come "delle Anime Sante", e\' uno dei gioielli barocchi del centro storico aquilano. Gravemente danneggiata — i meccanismi di ribaltamento hanno compromesso la facciata e parte della struttura interna. Il restauro, ancora in corso, e\' parte di un processo che dura da 15 anni.',
        'Conosciuta come "delle Anime Sante", è uno dei gioielli barocchi del centro storico aquilano. Gravemente danneggiata — i meccanismi di ribaltamento hanno compromesso la facciata e parte della struttura interna. Il restauro, ancora in corso, è parte di un processo che dura da 15 anni.'
    ),
    # Filosofia quote
    (
        'Il restauro non e\' mai solo tecnico. E\' un atto di memoria collettiva.',
        'Il restauro non è mai solo tecnico. È un atto di memoria collettiva.'
    ),
    # Collemaggio body
    (
        "dell'Universita' di Firenze. La riapertura nel 2017 e' diventata il simbolo di una rinascita possibile.",
        "dell'Università di Firenze. La riapertura nel 2017 è diventata il simbolo di una rinascita possibile."
    ),
    # Messa in sicurezza body
    (
        "Una citta' tenuta in piedi da strutture provvisorie, per anni.",
        "Una città tenuta in piedi da strutture provvisorie, per anni."
    ),
    # Intro title
    (
        "di arte medievale piu' dense",
        "di arte medievale più dense"
    ),
    # Intro body — all in one go
    (
        "Fondata nel 1254, L'Aquila costrui' la sua identita' sulla molteplicita': 88 chiese, 88 piazze, 88 fontane — la leggenda dei villaggi fondatori, ciascuno con la propria identita', uniti in una sola citta'. Un corpus artistico sedimentato in sette secoli. Alle 3:32 del 6 aprile 2009, si trovo' sotto attacco.",
        "Fondata nel 1254, L'Aquila costruì la sua identità sulla molteplicità: 88 chiese, 88 piazze, 88 fontane — la leggenda dei villaggi fondatori, ciascuno con la propria identità, uniti in una sola città. Un corpus artistico sedimentato in sette secoli. Alle 3:32 del 6 aprile 2009, si trovò sotto attacco."
    ),
    # CASE numeri body
    (
        "il Progetto C.A.S.E. aveva gia' alloggiato quasi 15.000 persone. Non in baracche — in abitazioni con standard qualitativi elevati, tecnologia antisismica di isolamento alla base, sostenibilita' energetica. Un risultato che diverra' caso studio internazionale.",
        "il Progetto C.A.S.E. aveva già alloggiato quasi 15.000 persone. Non in baracche — in abitazioni con standard qualitativi elevati, tecnologia antisismica di isolamento alla base, sostenibilità energetica. Un risultato che diverrà caso studio internazionale."
    ),
    # CASE processo heading
    (
        "l'<strong>identita'</strong>.",
        "l'<strong>identità</strong>."
    ),
    # CASE processo body
    (
        "Due obiettivi in tensione costante: velocita' della risposta emergenziale e preservazione dell'identita' territoriale.",
        "Due obiettivi in tensione costante: velocità della risposta emergenziale e preservazione dell'identità territoriale."
    ),
    # CASE oggi body
    (
        "L'Aquila e' diventata un caso studio internazionale per la gestione post-sisma. Il \"Modello L'Aquila\" e' studiato in tutto il mondo. Ma a 15 anni dal sisma, la ricostruzione non e' ancora terminata. Forse non lo sara' mai del tutto.",
        "L'Aquila è diventata un caso studio internazionale per la gestione post-sisma. Il \"Modello L'Aquila\" è studiato in tutto il mondo. Ma a 15 anni dal sisma, la ricostruzione non è ancora terminata. Forse non lo sarà mai del tutto."
    ),
]

for old, new in fixes:
    assert old in content, f"NOT FOUND: {old[:60]}..."
    content = content.replace(old, new, 1)
    print(f"Fixed: {old[:55]}...")

print(f"\nAll {len(fixes)} fixes applied.")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"File written. Lines: {content.count(chr(10))}")

# SWIPR — VISION DOCUMENT
### Version 1.3 — Final
> Da usare all'inizio di una nuova feature o quando si prendono decisioni di prodotto.
> NON usare da solo per generare codice. Accoppiare con SWIPR_CONSTRUCTION.md.

---

## 0. IDENTITÀ

**App:** Swipr
**Developer / Titolare:** TramiteMarketing
**Tagline:** "The fastest way to clean your gallery."
**Sottotitolo trust:** "Everything happens on your device. Your photos never leave your phone."

---

## 1. COSA È SWIPR

Swipr è uno **strumento gesture-based, ultra-veloce per fare pulizia nella libreria fotografica**.

NON è:
- una gallery app
- un photo manager
- un prodotto cloud
- un AI assistant

È:
> Un motore di decisione in tempo reale per pulire la libreria fotografica del tuo telefono.

L'innovazione core è il **sistema swipe**, non il posizionamento privacy.

---

## 2. POSIZIONAMENTO

### Hook principale:
> "The fastest way to clean your gallery."

### Trust layer (secondario):
> "Everything happens on your device. Your photos never leave your phone."

### NON comunicare:
- "No AI"
- "Privacy-first" come headline
- Qualsiasi claim in negativo

### Esempi corretti:
- ✔ "Fastest way to clean your gallery"
- ✔ "Built with on-device processing"
- ✔ "Your photos never leave your phone"
- ✘ "No AI app"
- ✘ "Privacy-first app" come hook principale

**La privacy è la garanzia di fiducia, non il titolo.**

---

## 3. TARGET

Primario:
- Gen Z con librerie fotografiche traboccanti
- Persone con "storage full" anxiety
- Utenti non tecnici che trovano la pulizia manuale della galleria frustrante

Secondario:
- Chiunque abbia mai scrollato centinaia di screenshot cercando cosa eliminare

**Vincolo critico**: L'UX deve essere completamente comprensibile entro 5 secondi dall'apertura dell'app. Zero learning curve.

---

## 4. FILOSOFIA UX CORE

### Il principio:
> "The UI should disappear behind the gesture."

### In pratica:
- La foto occupa l'intero schermo
- I controlli sono minimali, periferici, context-aware
- Il feedback è immediato ma non distraente (gradient overlay, non popup)
- Nessun dialog di conferma durante il flow di swipe
- Nessun loading spinner durante lo swiping

### Il feeling che stiamo costruendo:
> "This is the fastest way I've ever cleaned my phone."
> "Why wasn't this always like this?"

---

## 5. SISTEMA GESTURE

| Gesture | Azione | Feedback |
|---|---|---|
| Swipe Right | KEEP | Overlay verde |
| Swipe Left | TRASH (in coda, non eliminato) | Overlay rosso |
| Swipe Up | DECIDE LATER | Overlay blu/grigio |
| Tap Undo | Ripristina solo l'ultima azione | Animazione card inversa |

**Regole:**
- I feedback gradient sono sottili — devono sembrare una reazione dell'immagine, non un elemento UI che appare
- No vibrazione spam
- No effetti sonori
- No confetti o gamification pesante nel flow
- Undo ripristina **solo l'ultima singola azione**

---

## 6. SESSION FLOW (IN ORDINE)

```
1. Apertura app
2. Onboarding minimale (skippabile)
3. Richiesta permessi
4. Mode selection (Entire Library / Albums / Time Range)
5. Sessione swipe inizia immediatamente — nessuna loading screen
6. Swipe fino al termine o pausa
7. Review Decide Later
8. Review Trash
9. Conferma eliminazione batch — UN solo popup di sistema, una volta per sessione
10. Recap screen + achievement unlock
11. Generazione share card (opzionale)
```

Nessuna interruzione tra i passi 5 e 9.

---

## 7. FILOSOFIA ELIMINAZIONE

**Non esiste eliminazione immediata.**

Swipe Left = spostamento nella Trash Queue interna.
L'eliminazione reale avviene **una volta sola**, alla fine della sessione, come operazione batch con un singolo popup di sistema.

Questo è intenzionale:
- Riduce l'ansia dell'utente ("posso ancora annullare")
- Previene eliminazioni accidentali permanenti
- Rende "Decide Later" un vero escape valve

---

## 8. SORT ORDER — ENTIRE LIBRARY

La galleria intera non viene mostrata né completamente casuale né strettamente cronologica.

**Modalità: cluster semi-random**

L'algoritmo raggruppa foto in cluster da 5 scatti consecutivi (per data), poi mescola l'ordine dei cluster. Dentro ogni cluster le foto mantengono l'ordine cronologico.

**Perché**: foto dello stesso evento rimangono vicine (consistency), ma l'utente non swipa in modo noioso dall'ultima foto all'immagine più vecchia in sequenza lineare. Si trova a saltare tra periodi diversi, il che mantiene alta l'attenzione e rende la sessione più dinamica.

Il seed del shuffle è basato sulla data del giorno: stesso giorno = stesso ordine. Sessione diversa (giorno diverso) = ordine diverso.

---

## 9. DECIDE LATER

Swipe Up = spostamento nella DecideLater Queue.

- Persistita localmente across sessions
- Rivista dopo la sessione principale
- Scopo: ridurre il cognitive fatigue su foto ambigue
- L'utente non deve mai sentirsi forzato a decidere su ogni foto immediatamente

---

## 10. DESIGN LANGUAGE

### Stile:
- **Dark mode only** (no light mode in MVP)
- Minimal UI chrome — la foto è l'interfaccia
- Nessun glassmorphism eccessivo
- Gradient solo sottili, mai decorativi
- Spacing, radius, durations: sempre da `AppTokens`, mai hardcoded

### Colori (da `AppColors`):
- Background: `#0D0D0D`
- Card: `#1A1A1A`
- Keep: `#2ECC71` (verde)
- Trash: `#E74C3C` (rosso)
- Later: `#5B8DEF` (blu)
- Flag: `#F39C12` (ambra)

### HUD live (visibile durante lo swiping):
- MB da liberare (aggiornamento real-time)
- Count degli elementi nel trash
- Ad ogni azione: floating `+17 MB` con smooth easing

---

## 11. ACHIEVEMENT SYSTEM (GAMIFICATION CORE)

Gli achievement sono un layer di gamification persistente che trasforma Swipr da utility one-shot a abitudine.

### Filosofia:
- Tono: **ironico, pop, leggero** — mai aggressivo
- Lingua copy: italiano (target market primario) con nomi achievement in italiano/inglese misto
- Non sono notifiche push — appaiono solo nel recap e nella share card
- L'utente non li insegue attivamente — li scopre per sorpresa

### Tre categorie:

**Session achievements** — sbloccati in una singola sessione:

| ID | Nome | Condizione |
|---|---|---|
| `lightning` | Fulmine ⚡ | 100+ swipe in una sessione |
| `ruthless` | Spietato 🗑️ | 80%+ foto mandate in trash |
| `decisive` | Perfezionista ✓ | 0 elementi in Decide Later |
| `big_clean` | Grande Pulizia 🧹 | 500MB+ liberati in una sessione |
| `marathon` | Maratoneta 🏃 | 500+ foto swipate |
| `first_time` | Primo Passo 👋 | Prima sessione completata |

**Cumulative milestones** — basati su stats totali cross-session:

| ID | Nome | Soglia |
|---|---|---|
| `c_100` | Cento Foto | 100 foto processate in totale |
| `c_500` | Cinquecento | 500 foto processate |
| `c_1k` | Mille | 1.000 foto processate |
| `c_10k` | Diecimila | 10.000 foto processate |
| `gb_1` | Un Giga Libero 💾 | 1GB totale liberato |
| `gb_5` | Cinque Giga | 5GB totale liberato |
| `gb_10` | Gallery Master 🏆 | 10GB totale liberato |

**Streak achievements** — basati su sessioni regolari:

| ID | Nome | Condizione |
|---|---|---|
| `streak_3` | Tre di Fila | 3 sessioni in una settimana |
| `habit` | Abitudine | 7 sessioni totali |
| `monthly` | Mese di Pulizia | 4 sessioni in un mese |

### Tono dei messaggi achievement

Esempi dal registro corretto:

- Fulmine: *"Hai swippato come se avessi un treno da prendere. Rispetto."*
- Spietato: *"Nessuna pietà per le foto brutte. Bene così."*
- Grande Pulizia: *"Mezzo giga. In una sessione. Sei un problema per gli screenshot inutili."*
- Un Giga Libero: *"Un intero giga di foto dimenticate. Ora il tuo telefono respira."*
- Gallery Master: *"10GB. Non è pulizia, è archeologia digitale."*

---

## 12. RECAP SCREEN

### Tone: 70% utility, 30% personalità

Mostra:
- MB totali liberati nella sessione
- Foto totali rimosse
- Achievement sbloccati in questa sessione (massimo 2 mostrati)
- Cumulative milestone raggiunto (se applicabile)
- Messaggio ironico one-liner

### Copy esempi:
- "Your gallery feels lighter."
- "Less clutter. More clarity."
- "Anche oggi salvi la faccia dalle foto brutte."
- "Finalmente. Ce l'hai fatta."

### Mai usare:
- Linguaggio da streak aggressivo
- Numeri falsi o gonfiati
- Pressione a continuare immediatamente

---

## 13. SHARE CARDS (SPOTIFY WRAPPED STYLE)

Dopo il recap, l'utente può generare una share card:

- Più template visivi (minimal / dark premium / clean)
- Mostra: MB liberati, foto eliminate, achievement sbloccato
- Estetica: dark, premium, quiet — non chiassosa
- Esportabile come immagine

**Meccanismo virale**: il loop social passa dalla share card, non da un in-app sharing forzato.

Esempi di contenuto card:
- "Ho liberato 2.3 GB in 8 minuti. 📱✨"
- Achievement badge visibile: "Gallery Master 🏆"
- Stats session: "234 foto, 156 eliminate"

---

## 14. MONETIZZAZIONE

**Il free tier deve offrire valore genuino e completo.**

| Feature | Free | Premium |
|---|---|---|
| Sistema swipe completo | ✔ | ✔ |
| Decide Later | ✔ | ✔ |
| Recap + achievement | ✔ | ✔ |
| Share cards | ✔ | ✔ |
| Smart detection (prime 100 foto) | ✔ | ✔ |
| Smart detection illimitata | — | ✔ |
| Blur detection | — | ✔ |
| Duplicate detection | — | ✔ |
| Heavy media detection | — | ✔ |
| Remove ads | — | ✔ |

**Il paywall pitch**: "Hai pulito X foto. Premium ne avrebbe trovate Y in automatico."

**Trigger paywall**: tra sessioni, mai mid-sessione o mid-review.

---

## 15. PRIVACY — PRINCIPI

- Nessun upload di foto a server esterni
- Nessuna AI cloud
- Nessun account utente
- Unica telemetria: AdMob SDK (anonima) e RevenueCat (acquisti)
- TramiteMarketing è il titolare del trattamento ai sensi del GDPR
- Tutto il processing avviene on-device

---

## 16. EDGE CASES — RISPOSTA PRODOTTO

| Situazione | Esperienza utente |
|---|---|
| Libreria vuota | Empty state amichevole, nessun crash |
| Permesso limitato (iOS) | Banner non bloccante, swipe continua con foto disponibili |
| Permesso negato | Schermata fallback con deeplink a Impostazioni |
| Foto iCloud non scaricate | Skip silenzioso, count mostrato nel recap |
| Sessione interrotta | Ripristino queue state al prossimo avvio |
| App chiusa durante sessione | Trash queue e Decide Later persistiti localmente |
| Storage dispositivo pieno | Warning prima del tentativo di eliminazione |

---

## 17. SCOPE MVP — COSA NON COSTRUIAMO

- Account utente
- Cloud sync
- Light mode
- Layout iPad
- Photo editing
- In-app camera
- Condivisione social diretta (solo export share card)
- AI cloud tagging
- Server-side qualsiasi
- Push notifications
- Widget / extensions

---

## 18. PRIORITÀ PIATTAFORMA

**Fase 1: iOS**
Matrix dispositivi ridotto, API permessi migliori, monetizzazione più alta.

**Fase 2: Android**
Stesso codebase Flutter, gestione matrix dispositivi più ampia e modello permessi diverso.

L'architettura deve essere cross-platform dal giorno zero — nessun code path iOS-only salvo dove strettamente necessario per il sistema permessi.

---

*Fine SWIPR Vision Document — v1.3*

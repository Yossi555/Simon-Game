# Milestone 2 – משחק מלא מקצה לקצה

> תוכנית בנייה. מקורות: `PRD.md`, `ARCHITECTURE.md` (כולל ADR-1, ADR-2, ADR-5), `DESIGN.md` (כולל `mockups.png`, `wireframes.png`), `MILESTONES.md`.
> נקודת פתיחה: הקוד של Milestone 1 (App Shell, `SimonBoard` סטטי, `HomeScreen` עם "התחל משחק" שאינו עושה דבר).
> מחוץ לתחום: השהיה/"המשך משחק" (Milestone 3), היסטוריה ו-`localStorage` (Milestone 4), PWA (Milestone 5).

## 0. תלויות חדשות

- `canvas-confetti` (dependency) ו-`@types/canvas-confetti` (devDependency). אין תלויות נוספות.

## 1. מבנה הקוד

```text
src/
├── game/
│   ├── colors.ts            ← קיים; נוסף אליו מיפוי תדרי צליל לכל צבע
│   ├── timing.ts            ← חדש: קבועי הקצב מ-DESIGN §1.1
│   ├── random.ts            ← חדש: randomColor() עם Math.random (ADR-2)
│   ├── gameReducer.ts       ← חדש: State, Actions, Reducer טהור
│   └── useGame.ts           ← חדש: Hook שמחזיק את ה-Reducer, הצגת הרצף, קלט, אודיו וקונפטי
├── audio/
│   └── audioEngine.ts       ← חדש: AudioContext, צלילי צבעים, צלילי ניצחון/הפסד, עצירה
├── components/
│   ├── SimonBoard.tsx/.css  ← עדכון: הארה, עמעום, חסימה, קלט pointerdown
│   └── ResultDialog.tsx/.css← חדש: חלונית ניצחון/הפסד עם "אישור"
├── screens/
│   └── HomeScreen.tsx/.css  ← עדכון: מצבי תצוגה לפי סטטוס המשחק
├── App.tsx                  ← עדכון: useGame מוחזק כאן; מעבר לאודות מבטל משחק פעיל
└── test/
    ├── gameReducer.test.ts  ← חדש: בדיקות יחידה של חוקי המשחק
    ├── audioEngine.test.ts  ← חדש: ארבעה תדרים שונים
    ├── game.test.tsx        ← חדש: בדיקות אינטגרציה עם Fake Timers
    └── App.test.tsx         ← קיים; מתעדכן אם צריך
```

## 2. קבועי קצב (`game/timing.ts`)

ערכים מחייבים מ-DESIGN §1.1, זהים בכל השלבים (ללא האצה):

| קבוע | ערך |
|---|---|
| `TONE_MS` – הארה וצליל של צבע ברצף | `600` |
| `GAP_MS` – הפסקה בין צבעים | `250` |
| `START_DELAY_MS` – מ"התחל משחק" עד הצבע הראשון | `1000` |
| `ROUND_HOLD_MS` – חיווי השלב שהושלם נשאר לפני הצגת מספר השלב הבא | `1000` |
| `NEXT_ROUND_DELAY_MS` – מהצגת מספר השלב הבא עד הצבע הראשון | `1000` |
| `RESULT_DELAY_MS` – מהלחיצה האחרונה (נכונה בשלב 10 / שגויה) עד הודעה + צליל סיום (+ קונפטי בניצחון) | `1000` |
| `PRESS_MIN_MS` – הארה וצליל מינימליים בלחיצת שחקן | `300` |

## 3. Game Reducer (`game/gameReducer.ts`)

Reducer טהור: ללא אודיו, ללא Timers, ללא רנדום (הצבע האקראי מגיע בתוך ה-Action, ADR-2).

**State:**

| שדה | משמעות |
|---|---|
| `status` | `'idle' \| 'presenting' \| 'awaitingInput' \| 'won' \| 'lost'` (`paused` יתווסף ב-Milestone 3) |
| `sequence` | `ColorId[]`, אורך 1–10 |
| `round` | השלב המוצג, 1–10 (ב-`idle` = 1) |
| `inputIndex` | אינדקס הלחיצה הבאה |
| `completedRounds` | 0–10 |
| `gameId` | מונה עולה; משחק חדש = מזהה חדש |
| `presentationId` | מונה עולה; כל הצגת רצף מקבלת מזהה חדש. Action מהצגה ישנה (מזהה לא תואם) נזרק |
| `resultShown` | האם הודעת הסיום כבר מוצגת (אחרי ההמתנה של `RESULT_DELAY_MS`) |

**Actions** (כל Action שלא חוקי במצב הנוכחי מחזיר את ה-State ללא שינוי):

| Action | מותר מ- | תוצאה |
|---|---|---|
| `start { firstColor }` | `idle` | `sequence=[firstColor]`, `round=1`, `completedRounds=0`, `inputIndex=0`, `gameId+1`, `presentationId+1`, `status='presenting'` |
| `showNextRound { presentationId }` | `presenting` | `round = sequence.length` (מעדכן את חיווי השלב אחרי `ROUND_HOLD_MS`) |
| `presentationDone { presentationId }` | `presenting` | `status='awaitingInput'`, `inputIndex=0` |
| `press { color, nextColor }` | `awaitingInput` | ראה למטה |
| `revealResult { gameId }` | `won`/`lost` | `resultShown=true` |
| `dismiss` | `won`/`lost` | חזרה ל-`idle` (שומר `gameId` ו-`presentationId`, ADR-5) |
| `abandon` | `presenting`/`awaitingInput` | **זמני ל-Milestone 2:** חזרה ל-`idle` בלי תוצאה; `presentationId+1` כדי לבטל Callbacks ישנים. יוסר ב-Milestone 3 (ADR-3) |

**`press` בפירוט:**
- צבע שגוי → `status='lost'` מיד (הקלט נחסם מיד; ההודעה מוצגת רק אחרי `revealResult`). `completedRounds` נשאר `round - 1` (0 בשלב 1).
- צבע נכון שאינו האחרון בשלב → `inputIndex+1` בלבד.
- צבע נכון אחרון בשלב:
  - שלב 10 → `completedRounds=10`, `status='won'`. אין שלב 11.
  - אחרת → `completedRounds=round`, `sequence=[...sequence, nextColor]`, `inputIndex=0`, `presentationId+1`, `status='presenting'`. ה-`round` עדיין לא מתעדכן: הוא יעלה ב-`showNextRound` אחרי `ROUND_HOLD_MS`, כדי שחיווי השלב שהושלם יישאר שנייה על המסך (DESIGN §1.1).

`nextColor` נשלח בכל `press` (נבחר מראש ב-Hook) ונעשה בו שימוש רק בסיום שלב. כך ה-Reducer נשאר דטרמיניסטי.

## 4. מנוע אודיו (`audio/audioEngine.ts`)

- `unlockAudio(): Promise<boolean>` – יוצר `AudioContext` (פעם אחת) או קורא ל-`resume()`. נקרא **רק** מתוך הלחיצה על "התחל משחק". מחזיר `false` אם אין תמיכה, אם `resume()` נכשל, או אם ה-`state` לא הפך ל-`running`.
- `startTone(color): () => void` – Oscillator (`sine`/`triangle`) + `GainNode` עם Envelope קצר (~10ms עלייה/ירידה, למניעת קליקים). מחזיר פונקציית עצירה. משמש גם להצגת הרצף (עצירה אחרי `TONE_MS`) וגם ללחיצת שחקן (עצירה בשחרור, מינימום `PRESS_MIN_MS`).
- תדרים נבדלים לכל צבע (ב-`colors.ts`), בהשראת ה-Simon המקורי: ירוק `415Hz`, אדום `310Hz`, צהוב `252Hz`, כחול `209Hz`.
- `playWin()` – מוטיב עולה קצר (ארבעה צלילים, למשל C5-E5-G5-C6). `playLoss()` – צליל נמוך ויורד (Sawtooth/Square מעומעם, ~600ms). שני מוטיבים שונים זה מזה ומצלילי הצבעים.
- `stopAll()` – עוצר מיד כל Oscillator פעיל (נשמרים ב-Set). נקרא בביטול הצגה, ב-`abandon` וביציאה ממצב סיום.

## 5. Hook `useGame` (`game/useGame.ts`)

מוחזק ב-`App` (ADR-2), ולכן מעבר מסכים לא מפרק אותו. מחזיר: `state`, `litColor` (הצבע המואר כרגע, מהצגה או מלחיצה), `audioError`, ופעולות `startGame`, `padDown(color)`, `padUp()`, `dismiss`, `abandon`.

**התחלת משחק (`startGame`):** `await unlockAudio()`. בכשל: נשארים ב-`idle` ומוצגת הודעה (ראה §7), בלי להתחיל רצף שקט. בהצלחה: מנקים את ההודעה ושולחים `start { firstColor: randomColor() }`.

**הצגת הרצף (Effect לפי `status` + `presentationId`):**
- רץ כש-`status==='presenting'`. יוצר `AbortController`; כל `setTimeout` נרשם ומבוטל ב-Cleanup.
- תחילת משחק: המתנה `START_DELAY_MS` ← הצגת הרצף.
- שלב הבא: המתנה `ROUND_HOLD_MS` ← `showNextRound` ← המתנה `NEXT_ROUND_DELAY_MS` ← הצגת הרצף. (מבחינים בין השניים לפי `sequence.length > round`.)
- הצגת הרצף: לכל צבע – `litColor=color` + `startTone` למשך `TONE_MS`, כיבוי, הפסקה `GAP_MS` (לא אחרי האחרון) ← `presentationDone { presentationId }`.
- Cleanup (שינוי סטטוס, `abandon`, Unmount): `abort()`, ביטול כל ה-Timers, `stopAll()`, `litColor=null`. בנוסף ה-Reducer זורק Actions עם `presentationId` ישן.

**קלט שחקן (`padDown` / `padUp`, ADR-2):**
- `padDown(color)`: מתעלמים אם `status!=='awaitingInput'`. אחרת מדליקים את הצבע, מפעילים `startTone`, ושולחים מיד `press { color, nextColor: randomColor() }` (שיפוט ב-`pointerdown`).
- `padUp()`: מכבה הארה וצליל, אבל לא לפני `PRESS_MIN_MS` מרגע הלחיצה. השחרור נקלט גם ב-`window` (`pointerup`/`pointercancel`), כי הרבע עשוי להפוך ל-`disabled` מיד אחרי הלחיצה.
- לחיצה שגויה משמיעה את צליל הרבע כרגיל (כמו כל לחיצה).

**סיום משחק (Effect לפי `status` won/lost + `gameId`):**
- המתנה `RESULT_DELAY_MS` ← `revealResult { gameId }` + `playLoss()` / `playWin()`.
- קונפטי: Effect נפרד כש-`status==='won' && resultShown` – קריאה אחת ל-`confetti()` עם צבעי המשחק ו-`disableForReducedMotion: true` (נגישות, ARCH §2.4). Cleanup ביציאה מהמצב: `confetti.reset()`. לא נקרא בהפסד.
- Cleanup של ה-Timer אם יוצאים מהמצב לפני שעבר הזמן.

**`abandon` (זמני):** שולח `abandon`; ה-Cleanups של ה-Effects עוצרים הארה, צליל ו-Timers. `App` קורא לו לפני מעבר ל"אודות" כשהסטטוס `presenting`/`awaitingInput`. במצב `won`/`lost` המשחק כבר הסתיים, ולכן אינו מבוטל; ההודעה תופיע בחזרה לבית.

**Refresh:** המצב קיים רק בזיכרון, ולכן Refresh מחזיר ל-`idle`. אין שום כתיבה ל-`localStorage`.

## 6. `SimonBoard` – עדכון

Props: `litColor`, `dimmed` (הצגת רצף/סיום), `disabled` (כל מצב שאינו `awaitingInput`), `onPadDown(color)`, `onPadUp()`.
- כל רבע: `onPointerDown` (עם `preventDefault` למניעת Focus/בחירה), ותמיכה במקלדת: `Enter`/`Space` ב-`keydown` ← `onPadDown`, `keyup` ← `onPadUp`. `disabled` על הכפתור כשהקלט חסום.
- **הארה (`.is-lit`):** בהירות מוגברת (`filter: brightness(1.35)`) ו-Glow בצבע הרבע (`box-shadow` עם `cssVar`), מעבר קצר (~80ms).
- **עמעום (`.is-dimmed` על הלוח):** הרבעים שאינם מוארים בגוון כהה (`filter: brightness(0.45) saturate(0.7)`), כמו ב-Mockup "הצגת רצף". הרבע המואר נשאר בהיר.
- **תור השחקן:** כל הרבעים בצבע מלא (כמו ב-Mockup "התור שלך").
- `disabled` לא משנה את המראה בנפרד (המראה נקבע לפי `dimmed`), ולא מוסיף Glow.
- `touch-action: none` על הרבעים, למניעת גלילה/זום בזמן לחיצה.

## 7. `HomeScreen` – מצבי תצוגה

מקבל את נתוני ה-`useGame` מ-`App` כ-Props. חיווי השלב: **"שלב X מתוך 10"** עם `X = state.round` (ב-`idle` = 1; בסיום נשאר על השלב האחרון).

| סטטוס | שורת סטטוס (מעל הלוח) | לוח | אזור פעולה (מתחת ללוח) |
|---|---|---|---|
| `idle` | ריקה, או הודעת שגיאת אודיו אם קיימת | מלא, חסום | כפתור **"התחל משחק"** |
| `presenting` | **"המשחק מציג את הרצף"** | מעומעם + הצבע המואר | טקסט משני **"המתן…"** (לפי ההמחשות), בלי כפתור |
| `awaitingInput` | **"התור שלך"** | מלא, פעיל | טקסט משני **"הקש על הצבעים לפי הסדר"** |
| `won` / `lost` | ריקה | מעומעם, חסום | ריק; כשה-`resultShown` – מוצג `ResultDialog` |

- הודעת כשל אודיו (ARCH §2.4 מחייב הודעה קצרה בעברית): **"לא ניתן להפעיל את הצליל. לחץ שוב על "התחל משחק"."** – בשורת הסטטוס, `role="alert"`. נמחקת בהתחלה מוצלחת.
- **הערה:** ב-Mockups מופיע "שחק שוב" בחלונית הסיום ו"התחל" בכפתור; ה-PRD ו-DESIGN קובעים **"אישור"** ו-**"התחל משחק"**, והם הקובעים.

## 8. `ResultDialog`

- שכבת Overlay מעל אזור הלוח (Scrim חצי-שקוף שמשאיר את הלוח מזוהה ברקע), ובמרכזה כרטיס `--surface` עם גבול `--blue` עדין ופינות מעוגלות, כמו ב-Mockups.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` לכותרת; פוקוס עובר לכפתור "אישור" בפתיחה.
- **ניצחון:** כותרת H1 **"כל הכבוד! ניצחת!"** ("כל הכבוד!" בירוק/צהוב, "ניצחת!" בלבן, כמו ב-Mockup).
- **הפסד:** כותרת H1 **"נפסלת!"** באדום, ושורה **"השלמת N שלבים"** (ל-1: **"השלמת שלב אחד"**), כאשר N = `completedRounds` – מספר השלבים שהושלמו ולא השלב שבו הייתה הטעות (DESIGN §1.1).
- כפתור `PrimaryButton` **"אישור"** ← `dismiss` ← מסך הבית במצב "לפני תחילת משחק". "אישור" אינו מתחיל משחק ואינו פותח אודיו (ADR-5).
- הקונפטי מוצג מעל החלונית (ה-Canvas של `canvas-confetti` הוא שכבה גלובלית עם `z-index` גבוה).

## 9. `App.tsx` – עדכון

- `const game = useGame()` ברמת `App`, והעברת הנתונים ל-`HomeScreen`.
- `handleNavigate(screen)`: אם `screen==='about'` והסטטוס `presenting`/`awaitingInput` ← `game.abandon()` לפני המעבר.

## 10. בדיקות

**`gameReducer.test.ts` (יחידה, בלי Mocks):**
- `start` יוצר רצף באורך 1; סיום שלב מוסיף בדיוק צבע אחד, והרצף הקודם הוא prefix של החדש; רצף יכול להכיל צבע חוזר.
- אורכי רצף: שלב 1 = 1, שלב 2 = 2, שלב 10 = 10.
- `press` ב-`presenting` / `idle` / `won` / `lost` לא משנה דבר.
- לחיצה נכונה מקדמת `inputIndex`; שגויה ← `lost` מיד; `completedRounds=0` בהפסד בשלב 1, ו-`round-1` בהפסד בשלב מתקדם.
- שחזור שלב 10 ← `won`, `completedRounds=10`, ואין שלב 11 (אין `presenting` נוסף).
- `presentationDone` / `showNextRound` עם `presentationId` ישן נזרקים.
- `dismiss` ← `idle`; `start` הבא מקבל `gameId` חדש ורצף חדש.
- `abandon` רק מ-`presenting`/`awaitingInput`.

**`audioEngine.test.ts`:** ארבעה תדרים שונים זה מזה לארבעת הצבעים.

**`game.test.tsx` (אינטגרציה על `App`, `vi.useFakeTimers`, `fireEvent` סינכרוני):**
- Mocks: `audio/audioEngine` (פונקציות מעקב; `unlockAudio` מחזיר `true` כברירת מחדל), `game/random` (רצף צבעים נשלט), `canvas-confetti`.
- התחלה: "התחל משחק" ← "המשחק מציג את הרצף"; הרבע נדלק אחרי `1000ms` בדיוק, כבה אחרי `600ms` נוספים; `startTone` נקרא עם הצבע הנכון.
- קצב קבוע: מרווחי ההדלקה בשלב 3 זהים לשלב 1 (`600`/`250`), ושנייה + שנייה בין סיום שלב לתחילת השלב הבא; חיווי "שלב 1" נשאר שנייה ואז "שלב 2".
- לחיצות על הרבעים בזמן הצגה לא משפיעות (המשחק לא נפסל ולא מתקדם).
- **הפסד בשלב 1:** לחיצה שגויה ← צליל הרבע מיד; `playLoss` והודעת **"נפסלת!"** + **"השלמת 0 שלבים"** רק אחרי `1000ms`; `confetti` לא נקרא.
- **הפסד בשלב מתקדם:** למשל אחרי שני שלבים ← "השלמת 2 שלבים".
- **ניצחון:** משחק מלא של 10 שלבים ← אחרי `1000ms` "כל הכבוד! ניצחת!", `playWin`, `confetti` נקרא פעם אחת; אין שלב 11.
- **"אישור" ומשחק חדש:** "אישור" ← "התחל משחק" ו"שלב 1 מתוך 10"; משחק חדש משתמש ברצף אקראי חדש (קריאות חדשות ל-`randomColor`).
- **כשל אודיו:** `unlockAudio` מחזיר `false` ← הודעת השגיאה, נשארים ב-`idle`, אין הדלקה.
- **מעבר ל"אודות" באמצע הצגה ובאמצע תור השחקן:** `stopAll` נקרא, `vi.getTimerCount()===0`, ובחזרה לבית: "התחל משחק" ו"שלב 1 מתוך 10" ואין רבע מואר.
- **אין שמירה מתמידה:** `localStorage` ריק בסוף משחק (Refresh = Mount חדש ← `idle`).

## 11. בדיקה עצמית לפני סימון 🟡

1. `npm run typecheck`, `npm run test`, `npm run build` – כולם עוברים.
2. `npm run dev` ובדיקה בדפדפן המובנה באמולציית מובייל (375×812):
   - התחלת משחק, צפייה בהארה ובעמעום, שחזור כמה שלבים, הפסד (הודעה אחרי שנייה), "אישור" וחזרה למצב התחלה.
   - ניצחון: משחק ידני של 10 שלבים בדפדפן (קריאת הרצף מה-DOM בזמן ההצגה), וצילום מסך של חלונית הניצחון עם קונפטי. לא מוסיפים לקוד "מצב בדיקה" או קיצור דרך.
   - מעבר ל"אודות" באמצע הצגה וחזרה – אין הארה ואין צליל.
   - Refresh באמצע משחק ← מצב התחלה.
   - אין גלילה אופקית ב-375px וב-320px, גם כשהחלונית פתוחה.
   - הצלילים עצמם (גובה ונבדלות) – לא ניתן לשמוע בבדיקה האוטומטית; יצוין שזה ממתין לבדיקה של המשתמש בטלפון.
3. סגירת שרת הפיתוח.
4. ADR חדש ב-`ARCHITECTURE.md` (ADR-10): "חיווי השלב הבא והודעת הסיום מתעכבים דרך Actions מוגנים (`showNextRound`, `revealResult`)" – הסטטוס `won`/`lost` נקבע מיד כדי לחסום קלט, וההצגה מתעכבת `1000ms`.
5. סימון 🟡 ליד כותרת Milestone 2 ב-`MILESTONES.md`. ללא commit.

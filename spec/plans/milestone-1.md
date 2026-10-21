# Milestone 1 – בסיס אפליקציה ושני מסכים מעוצבים

> תוכנית בנייה. מקורות: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md` (כולל `wireframes.png`, `mockups.png`, `style-guide.png`), `MILESTONES.md`.
> בשלב זה אין לוגיקת משחק: הלוח והכפתור **"התחל משחק"** מוצגים בלבד ואינם עושים דבר.

## 0. דרישה מקדימה

- Node.js `v24` (LTS) ו-npm מותקנים במחשב (`/usr/local/bin`), ולכן אין צורך בהתקנה נוספת לפני הבנייה.

## 1. הקמת הפרויקט

הקמה ידנית של הקבצים (לא דרך אשף אינטראקטיבי), בשורש הריפו:

| קובץ | תוכן |
|---|---|
| `package.json` | `name: "simon-game"`, `private`, `type: "module"`. Scripts: `dev` (`vite`), `build` (`tsc -b && vite build`), `typecheck` (`tsc -b --noEmit` או `tsc -p ... --noEmit`), `test` (`vitest run`), `preview` (`vite preview`) |
| `vite.config.ts` | `@vitejs/plugin-react`; `base: '/Simon-Game/'` (ADR-8, בכל הסביבות); בלוק `test` של Vitest: `environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`, `css: true` |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript strict, `jsx: react-jsx`, `types` כוללים `vitest/globals` ו-`@testing-library/jest-dom` |
| `index.html` | `<html lang="he" dir="rtl">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="theme-color" content="#0A1628">`, `<title>סיימון</title>`, `<div id="root">` |
| `package-lock.json` | נוצר ע"י `npm install` ונשמר בריפו |

**Dependencies:** `react`, `react-dom`, `@fontsource/heebo`.
**Dev dependencies:** `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
לא מותקנים עדיין: `canvas-confetti` (Milestone 2), `vite-plugin-pwa` (Milestone 5).

`.gitignore` הקיים כבר כולל `node_modules` ו-`dist`. אם חסר משהו, להוסיף שורות בלבד ולא להחליף את הקובץ.

## 2. מבנה הקוד

```text
src/
├── main.tsx                 ← createRoot, StrictMode, ייבוא גופנים ו-CSS גלובלי
├── App.tsx                  ← App Shell: מצב מסך פעיל ('home' | 'about') ופס ניווט
├── App.css                  ← פריסת המעטפת (גובה מלא, עמודה, פס תחתון)
├── styles/
│   ├── tokens.css           ← CSS Variables: צבעים, ריווח, טיפוגרפיה, רדיוסים
│   └── global.css           ← reset בסיסי, body, גופן, כפתורים משותפים
├── game/
│   └── colors.ts            ← הגדרת ארבעת הצבעים: id, תווית עברית, HEX, grid-area
├── components/
│   ├── NavBar.tsx / .css     ← פס ניווט "בית" / "אודות"
│   ├── SimonBoard.tsx / .css ← הלוח העגול
│   └── PrimaryButton.tsx     ← כפתור ראשי כחול (משותף; ישמש גם ל"המשך משחק" ול"אישור")
├── screens/
│   ├── HomeScreen.tsx / .css
│   └── AboutScreen.tsx / .css
└── test/
    ├── setup.ts             ← ייבוא @testing-library/jest-dom
    └── App.test.tsx         ← בדיקות Render וניווט
```

## 3. פירוט רכיבים

### 3.1 `main.tsx`
- ייבוא `@fontsource/heebo/400.css`, `600.css`, `700.css` בלבד (Regular, Semibold, Bold).
- ייבוא `tokens.css` ו-`global.css`, ורינדור `<App />` בתוך `StrictMode`.

### 3.2 Design Tokens (`tokens.css`)
- צבעים מ-`DESIGN.md` §2.1: `--green #00D26A`, `--red #FF3B30`, `--yellow #FFD600`, `--blue #00A3FF`, `--charcoal #0F0F0F`, `--soft-gray #E5E5E5`, `--white #FFFFFF`, `--bg #0A1628`, `--surface #12213A`, `--border #1E3556`.
- ריווח: `--space-1: 8px`, `--space-2: 12px`, `--space-3: 16px`, `--space-4: 24px`.
- טיפוגרפיה לפי §2.2: H1 32/Bold, H2 24/Bold, H3 20/Semibold, Body 16/Regular, Caption 14/Regular, Button 16/Semibold. `font-family: 'Heebo', Arial, sans-serif`.
- רדיוסים: כפתורים בצורת Pill, כרטיסים ופס ניווט ~12–16px.

### 3.3 `global.css`
- `box-sizing: border-box`, `margin: 0`; `body` ברקע `--bg` וטקסט בהיר.
- `html, body, #root` בגובה מלא; `overflow-x: hidden` כדי למנוע גלילה אופקית.
- מניעת בחירת טקסט ו-Double-tap zoom על רכיבי משחק: `user-select: none`, `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`.

### 3.4 `App.tsx` – App Shell
- `useState<'home' | 'about'>('home')`. המסכים מוחלפים בתוך אותו React Tree, בלי Router ובלי טעינת דף (ARCHITECTURE §2.1).
- מעטפת: עמודה בגובה `100dvh` (עם Fallback ל-`100vh`), רוחב מקסימלי ~480px וממורכזת, תוכן גולל בתוך האזור המרכזי, ו-`NavBar` קבוע בתחתית. ריווח תחתון ל-`env(safe-area-inset-bottom)`.
- בעתיד (Milestone 2) ה-`useGame` יוחזק כאן, ולכן מעבר מסכים לא יפרק אותו.

### 3.5 `NavBar`
- `<nav aria-label="ניווט ראשי">` עם שני כפתורים: **"בית"** ו-**"אודות"**. "בית" מימין ו"אודות" משמאל, לפי ה-RTL וההמחשות.
- הלשונית הפעילה מקבלת `aria-current="page"`, טקסט לבן מודגש ורקע מודגש. הלא-פעילה בטקסט אפור-בהיר.
- משטח `--surface`, גבול `--border`, פינות מעוגלות ופס הפרדה דק בין שתי הלשוניות (כמו ב-Mockups). ללא אייקונים: התוויות בעברית מספיקות, ואייקונים הם אופציונליים לפי DESIGN §2.3.

### 3.6 `game/colors.ts`
- `type ColorId = 'green' | 'red' | 'yellow' | 'blue'`.
- מערך של ארבעת הצבעים עם `id`, `label` בעברית (`ירוק`, `אדום`, `צהוב`, `כחול`), משתנה הצבע ו-`gridArea`.
- הסידור המחייב (DESIGN §1.1, Mockups גוברים על Wireframes): **ירוק למעלה-שמאל, אדום למעלה-ימין, צהוב למטה-שמאל, כחול למטה-ימין**.

### 3.7 `SimonBoard` (ADR-1)
- מיכל עגול (`aspect-ratio: 1`, `border-radius: 50%`) ברקע `--charcoal`, עם מסגרת חיצונית כהה וקו מתאר עדין ב-`--border`.
- `display: grid` בגודל 2×2, `gap` עבה (~10–12px) שיוצר את פסי ההפרדה הכהים. המיכל מוגדר `direction: ltr`, וכל רבע ממוקם ב-`grid-area` מפורש, כך שה-RTL לא הופך את הסידור.
- כל רבע הוא `<button type="button">` עם `aria-label` בעברית (למשל "ירוק"), בצבע מלא. פינה חיצונית אחת מעוגלת ברדיוס גדול, כך שארבעת הרבעים יוצרים יחד עיגול.
- דיסק מרכזי כהה (~30% מקוטר הלוח) ממוקם באבסולוטי מעל המרכז, `aria-hidden`, `pointer-events: none`, ללא טקסט.
- גודל: `width: min(82vw, 46dvh, 360px)`, כדי שהלוח יהיה גדול אך כל המסך יכנס בטלפון אנכי.
- Milestone 1: הכפתורים ללא `onClick` ובמראה מלא (כמו במצב "התחלה" ב-Mockups). מצבי Glow ועמעום יתווספו ב-CSS ב-Milestone 2. ה-Props יוכנו כבר עכשיו כך שיקבלו `activeColor` ו-`dimmed` אופציונליים, אבל לא ייעשה בהם שימוש עדיין.

### 3.8 `HomeScreen`
מלמעלה למטה:
1. כותרת מותג `<h1>`**"סיימון"** (32px Bold), עם קו הפרדה דק ב-`--border` מתחתיה (כמו ב-Mockups).
2. חיווי שלב: **"שלב 1 מתוך 10"** (H3, 20px Semibold). ה-Wireframe מראה "שלב 0", אבל DESIGN §1.1 קובע "שלב 1 מתוך 10" לפני תחילת משחק. המספרים עטופים בבידוד כיווניות (`<bdi>`) לפי §2.5.
3. שורת סטטוס מתחת לחיווי, ריקה במצב התחלה (שומרת מקום קבוע, כדי שהלוח לא יזוז בין מצבים ב-Milestones הבאים).
4. `SimonBoard`.
5. אזור פעולה: `PrimaryButton` עם הטקסט **"התחל משחק"** (DESIGN גובר על "התחל" שבהמחשות). ללא פעולה ב-Milestone זה.

### 3.9 `PrimaryButton`
- כחול מלא (`--blue`), רחב (~80% מרוחב התוכן, מקסימום ~320px), צורת Pill, טקסט לבן 16px Semibold, צל רך כחלחל, ומצב `:active` עם הקטנה קלה. גובה ≥ 48px לנוחות מגע.
- תמיכה ב-`disabled` (מעומעם, ללא צל) לשימוש עתידי.

### 3.10 `AboutScreen`
1. כותרת `<h1>`**"אודות"** (לפי ה-Wireframes ו-DESIGN §1.2; ב-Mockup מופיע "סיימון", אבל ה-Wireframes מנצחים על תוכן).
2. כרטיס **"על המשחק"** (`<h2>` + Body) על משטח `--surface` עם גבול `--border`:
   - תיאור: "סיימון הוא משחק זיכרון של צבעים וצלילים."
   - הוראות: "זכור את רצף הצבעים שמוצג. לחץ על הצבעים באותו סדר. בכל שלב נוסף צבע אחד לרצף. טעות אחת מסיימת את המשחק. נסה להגיע עד שלב 10!"
3. כותרת `<h2>`**"10 המשחקים האחרונים"**.
4. חיווי ריק בכרטיס או בטקסט משני: **"עדיין אין משחקים שמורים."**
5. **אין** כפתור "מחק היסטוריה": הוא מוצג רק כשיש רשומות (PRD §4.4), וההיסטוריה עצמה תתווסף ב-Milestone 4.
- המסך גולל אנכית אם התוכן ארוך, בלי גלילה אופקית.

## 4. בדיקות (`src/test/App.test.tsx`)

- **Render של מסך הבית:** כותרת "סיימון", הטקסט "שלב 1 מתוך 10", כפתור "התחל משחק", ו-4 כפתורי לוח לפי שמות נגישים ("ירוק", "אדום", "צהוב", "כחול").
- **סידור הלוח:** לכל רבע `grid-area` נכון לפי `colors.ts`. זו בדיקת יחידה על המערך, כי jsdom לא מחשב פריסה.
- **ניווט:** לחיצה על "אודות" מציגה "על המשחק" ואת הודעת ההיסטוריה הריקה, ולא מציגה את "התחל משחק". לחיצה על "בית" מחזירה. `aria-current` עובר ללשונית הפעילה.
- **אין כפתור "מחק היסטוריה"** במסך אודות.
- `document.documentElement` עם `lang="he"` ו-`dir="rtl"`: נבדק ידנית מול `index.html` (jsdom לא טוען את הקובץ).

## 5. בדיקה עצמית לפני סימון 🟡

1. `npm run typecheck`, `npm run test`, `npm run build`: כולם עוברים.
2. `npm run dev` ופתיחת `http://localhost:5173/Simon-Game/` בדפדפן המובנה באמולציית מובייל (375×812):
   - צילום מסך של בית ושל אודות והשוואה מול ה-Mockups (צבעים, סידור הלוח, טיפוגרפיה, פס ניווט).
   - מעבר בין המסכים ללא רענון דף (למשל, לוודא שהכתובת לא משתנה ושאין בקשת רשת למסמך חדש).
   - בדיקה שאין גלילה אופקית (`scrollWidth <= clientWidth`) בשני המסכים, וגם ברוחב 320px.
   - בדיקה שהגופן Heebo נטען מהאפליקציה עצמה ולא מ-Google Fonts.
3. סגירת שרת הפיתוח בסיום.
4. מילוי **פקודות הרצה** ב-`CLAUDE.md`: הרצה `npm run dev`, בדיקות `npm run test`.
5. סימון 🟡 ליד כותרת Milestone 1 ב-`MILESTONES.md`. ללא commit.

## 6. מחוץ לתחום של Milestone זה

לוגיקת משחק, צלילים, הארות, קונפטי, השהיה, היסטוריה ו-`localStorage`, PWA/Manifest/אייקונים ו-GitHub Actions: כל אלה שייכים ל-Milestones 2–5.

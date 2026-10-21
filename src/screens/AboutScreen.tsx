import './HomeScreen.css';
import './AboutScreen.css';

export default function AboutScreen() {
  return (
    <section className="about-screen">
      <header className="screen-header">
        <h1 className="screen-title">אודות</h1>
      </header>

      <article className="card about-card">
        <h2 className="section-title">על המשחק</h2>
        <p>דיסקו גו הוא משחק זיכרון של צבעים וצלילים.</p>
        <p>
          זכור את רצף הצבעים שמוצג. לחץ על הצבעים באותו סדר. בכל שלב נוסף צבע אחד לרצף. טעות
          אחת מסיימת את המשחק. נסה להגיע עד שלב <bdi>10</bdi>!
        </p>
      </article>

      <h2 className="section-title history-title">
        <bdi>10</bdi> המשחקים האחרונים
      </h2>
      <p className="card history-empty">עדיין אין משחקים שמורים.</p>
    </section>
  );
}

import styles from "./NgramStats.module.css";

interface Props {
  text: string;
}

interface GramStat {
  gram: string;
  count: number;
  percent: number;
}

export const NgramStats: React.FC<Props> = ({ text }) => {
  const clean = normalizeLetters(text);
  const totalLetters = clean.length;

  const bigrams = computeNgrams(clean, 2);
  const trigrams = computeNgrams(clean, 3);
  const fourgrams = computeNgrams(clean, 4);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>N-gram statistics</h3>
        <span className={styles.total}>Letters used: {totalLetters || 0}</span>
      </div>

      <div className={styles.columns}>
        <NgramColumn title="Bigrams (2-letters)" stats={bigrams} />
        <NgramColumn title="Trigrams (3-letters)" stats={trigrams} />
        <NgramColumn title="4-grams (4-letters)" stats={fourgrams} />
      </div>
    </div>
  );
};

const TOP_N = 12;

function computeNgrams(text: string, n: number): GramStat[] {
  if (text.length < n) return [];

  const map: Record<string, number> = {};
  for (let i = 0; i <= text.length - n; i++) {
    const gram = text.slice(i, i + n);
    map[gram] = (map[gram] || 0) + 1;
  }

  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;

  return Object.entries(map)
    .map(([gram, count]) => ({
      gram,
      count,
      percent: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
}

function normalizeLetters(text: string): string {
  const lower = text.toLowerCase();
  let res = "";
  for (const ch of lower) {
    if (isSloveneLetter(ch)) {
      res += ch;
    }
  }
  return res;
}

function isSloveneLetter(ch: string): boolean {
  // groba, a praktična definicija
  const code = ch.charCodeAt(0);
  if (code >= 97 && code <= 122) return true; // a-z
  return "čšž".includes(ch);
}

interface ColProps {
  title: string;
  stats: GramStat[];
}

const NgramColumn: React.FC<ColProps> = ({ title, stats }) => {
  return (
    <div className={styles.column}>
      <h4>{title}</h4>
      {stats.length === 0 ? (
        <p className={styles.empty}>Not enough data.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Gram</th>
              <th>Count</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((g) => (
              <tr key={g.gram}>
                <td>{g.gram.toUpperCase()}</td>
                <td>{g.count}</td>
                <td>{g.percent.toFixed(1).replace(".", ",")}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

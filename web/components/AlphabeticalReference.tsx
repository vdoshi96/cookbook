import Link from "next/link";

export interface ReferenceColumn {
  label: string;
  value: string;
}

export interface ReferenceEntry {
  id: string;
  label: string;
  href: string;
  columns: ReferenceColumn[];
}

interface AlphabeticalReferenceProps {
  entries: ReferenceEntry[];
  label: string;
}

function firstLetter(label: string) {
  const letter = label.trim().charAt(0).toUpperCase();

  return /^[A-Z]$/.test(letter) ? letter : "#";
}

function groupEntries(entries: ReferenceEntry[]) {
  const sortedEntries = [...entries].sort((first, second) => first.label.localeCompare(second.label));
  const groups = new Map<string, ReferenceEntry[]>();

  for (const entry of sortedEntries) {
    const letter = firstLetter(entry.label);
    groups.set(letter, [...(groups.get(letter) ?? []), entry]);
  }

  return [...groups.entries()].sort(([first], [second]) => first.localeCompare(second));
}

export function AlphabeticalReference({ entries, label }: AlphabeticalReferenceProps) {
  const groups = groupEntries(entries);
  const columns = entries[0]?.columns.map((column) => column.label) ?? [];

  return (
    <div className="alphabetical-reference" aria-label={label}>
      {groups.map(([letter, letterEntries]) => (
        <section className="reference-letter-section" aria-labelledby={`${label}-${letter}-heading`} key={letter}>
          <h2 id={`${label}-${letter}-heading`}>{letter}</h2>
          <div className="reference-table-wrap">
            <table className="reference-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th scope="col" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {letterEntries.map((entry) => (
                  <tr key={entry.id}>
                    {entry.columns.map((column, index) => (
                      <td key={`${entry.id}-${column.label}`}>
                        {index === 0 ? <Link href={entry.href}>{column.value}</Link> : column.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

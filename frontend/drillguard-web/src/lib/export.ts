/**
 * Client-side file export. Real downloads (blob + <a download>), no backend.
 */
type Row = Record<string, string | number | null | undefined>;

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  const cols = Array.from(rows.reduce<Set<string>>((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set()));
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

function stamp(): string {
  // avoids new Date() at module scope; called only inside click handlers
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "").replace(/-/g, "");
}

export function download(filename: string, content: string, mime = "text/plain"): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(basename: string, rows: Row[]): void {
  download(`${basename}_${stamp()}.csv`, toCsv(rows), "text/csv");
}

export function downloadJson(basename: string, data: unknown): void {
  download(`${basename}_${stamp()}.json`, JSON.stringify(data, null, 2), "application/json");
}

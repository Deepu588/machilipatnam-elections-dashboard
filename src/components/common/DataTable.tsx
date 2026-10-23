import { useMemo, useState, type ReactNode } from 'react';
import { Form, Pagination, Table } from 'react-bootstrap';
import StatusMessage from './StatusMessage';

export interface Column<T> {
  key: string;
  header: string;
  /** Raw value used for sorting and searching. */
  accessor: (row: T) => string | number | null;
  /** Optional custom cell renderer. */
  render?: (row: T) => ReactNode;
  align?: 'start' | 'end';
}

interface Props<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  pageSize?: number;
  emptyMessage?: string;
}

/** Reusable table: client-side search, click-to-sort headers, pagination, empty state. */
export default function DataTable<T>({ caption, columns, rows, rowKey, searchable = false, pageSize = 8, emptyMessage }: Props<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => String(c.accessor(r) ?? '').toLowerCase().includes(q)));
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = col.accessor(a);
      const y = col.accessor(b);
      if (x === null && y === null) return 0;
      if (x === null) return 1; // missing values always last
      if (y === null) return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [filtered, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));
  };
  const ariaSort = (key: string) => (sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');

  return (
    <div className="data-table">
      {searchable && (
        <Form.Group className="mb-2" controlId={`search-${caption.replace(/\W+/g, '-')}`}>
          <Form.Label className="visually-hidden">Search {caption}</Form.Label>
          <Form.Control
            type="search"
            size="sm"
            placeholder="Search table…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </Form.Group>
      )}
      {sorted.length === 0 ? (
        <StatusMessage kind="empty" message={emptyMessage ?? 'No rows match.'} />
      ) : (
        <div className="table-scroll">
          <Table striped hover size="sm" className="mb-2">
            <caption className="visually-hidden">{caption}</caption>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" aria-sort={ariaSort(c.key)} className={c.align === 'end' ? 'text-end' : ''}>
                    <button type="button" className="sort-btn" onClick={() => toggleSort(c.key)}>
                      {c.header}
                      <span aria-hidden="true" className="sort-icon">
                        {sort?.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={rowKey(r)}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.align === 'end' ? 'text-end' : ''}>
                      {c.render ? c.render(r) : (c.accessor(r) ?? <span className="text-muted">Unavailable</span>)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {pages > 1 && (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <small className="text-muted" aria-live="polite">
            Page {current} of {pages} ({sorted.length} rows)
          </small>
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page" />
            <Pagination.Next disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page" />
          </Pagination>
        </div>
      )}
    </div>
  );
}

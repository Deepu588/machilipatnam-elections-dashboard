import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DataTable, { type Column } from '../components/common/DataTable';

interface Row { id: string; name: string; votes: number | null }
const rows: Row[] = [
  { id: '1', name: 'Alpha', votes: 30 },
  { id: '2', name: 'Bravo', votes: null },
  { id: '3', name: 'Charlie', votes: 10 },
  { id: '4', name: 'Delta', votes: 20 },
];
const cols: Column<Row>[] = [
  { key: 'name', header: 'Name', accessor: (r) => r.name },
  { key: 'votes', header: 'Votes', accessor: (r) => r.votes },
];
const names = () => within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => r.querySelector('td')!.textContent);

describe('DataTable', () => {
  it('filters rows with search', async () => {
    render(<DataTable caption="t" columns={cols} rows={rows} rowKey={(r) => r.id} searchable />);
    await userEvent.type(screen.getByRole('searchbox'), 'del');
    expect(names()).toEqual(['Delta']);
  });
  it('sorts numerically and keeps missing values last', async () => {
    render(<DataTable caption="t" columns={cols} rows={rows} rowKey={(r) => r.id} />);
    await userEvent.click(screen.getByRole('button', { name: /votes/i }));
    expect(names()).toEqual(['Charlie', 'Delta', 'Alpha', 'Bravo']);
    await userEvent.click(screen.getByRole('button', { name: /votes/i }));
    expect(names()).toEqual(['Alpha', 'Delta', 'Charlie', 'Bravo']);
  });
  it('paginates', async () => {
    render(<DataTable caption="t" columns={cols} rows={rows} rowKey={(r) => r.id} pageSize={3} />);
    expect(names()).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(names()).toEqual(['Delta']);
  });
  it('shows an empty state when nothing matches', async () => {
    render(<DataTable caption="t" columns={cols} rows={rows} rowKey={(r) => r.id} searchable />);
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText(/no rows match/i)).toBeInTheDocument();
  });
  it('shows "Unavailable" for null cells', () => {
    render(<DataTable caption="t" columns={cols} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});

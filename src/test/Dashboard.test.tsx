import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import constituency from '../../public/data/constituency.json';
import parliament from '../../public/data/parliament.json';
import assembly from '../../public/data/assembly.json';
import App from '../App';
import { normalizeAssembly, normalizeParliament } from '../services/normalize';
import type { AssemblyData, Constituency, ParliamentData } from '../types';

vi.mock('../services/api', () => ({ api: { getConstituency: vi.fn(), getParliament: vi.fn(), getAssembly: vi.fn() } }));
import { api } from '../services/api';

const mocked = api as unknown as Record<string, ReturnType<typeof vi.fn>>;
const okData = () => {
  mocked.getConstituency.mockResolvedValue(constituency as unknown as Constituency);
  mocked.getParliament.mockResolvedValue(normalizeParliament(parliament as unknown as ParliamentData));
  mocked.getAssembly.mockResolvedValue(normalizeAssembly(assembly as unknown as AssemblyData));
};
const renderAt = (path = '/') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

beforeEach(() => { vi.clearAllMocks(); okData(); });

describe('Dashboard', () => {
  it('shows a loading state then renders the overview with seven assembly segments', async () => {
    renderAt('/');
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(await screen.findByRole('heading', { level: 1, name: /machilipatnam lok sabha/i })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /assembly constituencies/i });
    expect(within(table).getAllByRole('row')).toHaveLength(8); // header + 7
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0); // demographics are not invented
  });

  it('shows an error state with retry when loading fails', async () => {
    mocked.getParliament.mockRejectedValue(new Error('Could not load parliament.json (HTTP 500).'));
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent(/parliament\.json/);
    mocked.getParliament.mockResolvedValue(normalizeParliament(parliament as unknown as ParliamentData));
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('year filter updates the summary table on the Lok Sabha page', async () => {
    renderAt('/parliament');
    const summary = await screen.findByRole('table', { name: /election summary by year/i });
    expect(within(summary).getAllByRole('row')).toHaveLength(5); // header + 4 years
    await userEvent.click(screen.getByRole('checkbox', { name: '2009' }));
    await userEvent.click(screen.getByRole('checkbox', { name: '2014' }));
    expect(within(screen.getByRole('table', { name: /election summary by year/i })).getAllByRole('row')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText(/no election year selected/i)).toBeInTheDocument();
  });

  it('assembly selector and year filter change the results table', async () => {
    renderAt('/assembly');
    await screen.findByRole('heading', { level: 1, name: /assembly constituency explorer/i });
    let table = screen.getByRole('table', { name: /gannavaram results/i });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    await userEvent.selectOptions(screen.getByLabelText(/assembly constituency/i), '75');
    table = screen.getByRole('table', { name: /machilipatnam results/i });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    await userEvent.selectOptions(screen.getByLabelText(/election year/i), '2024');
    table = screen.getByRole('table', { name: /machilipatnam results/i });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getByText('Kollu Ravindra')).toBeInTheDocument();
  });

  it('shows a clear message when a segment has no result for the chosen year', async () => {
    const data = normalizeAssembly(assembly as unknown as AssemblyData);
    data.constituencies[0].elections = data.constituencies[0].elections.filter((e) => e.year !== 2009);
    mocked.getAssembly.mockResolvedValue(data);
    renderAt('/assembly');
    await screen.findByRole('heading', { level: 1, name: /assembly constituency explorer/i });
    await userEvent.selectOptions(screen.getByLabelText(/election year/i), '2009');
    expect(screen.getByText(/no result is available for gannavaram in 2009/i)).toBeInTheDocument();
  });

  it('trends page lists the formulas and the cross-segment matrix', async () => {
    renderAt('/trends');
    expect(await screen.findByText(/how each indicator is calculated/i)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /winning party and margin percentage/i })).toBeInTheDocument();
  });

  it.each([[375], [768], [1280]])('renders navigation and content at %ipx viewport width', async (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
    renderAt('/');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.getByRole('navigation', { name: /dashboard sections/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle navigation/i })).toBeInTheDocument();
  });
});

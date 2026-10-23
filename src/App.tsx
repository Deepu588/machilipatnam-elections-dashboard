import { Container } from 'react-bootstrap';
import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import StatusMessage from './components/common/StatusMessage';
import { DataProvider, useDashboardStatus } from './context/DataContext';
import { FilterProvider } from './context/FilterContext';
import AssemblyPage from './pages/AssemblyPage';
import OverviewPage from './pages/OverviewPage';
import ParliamentPage from './pages/ParliamentPage';
import TrendsPage from './pages/TrendsPage';

function Content() {
  const { status, error, reload } = useDashboardStatus();
  if (status === 'loading') return <StatusMessage kind="loading" message="Loading election data…" />;
  if (status === 'error') return <StatusMessage kind="error" message={error ?? undefined} onRetry={reload} />;
  return (
    <FilterProvider>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/parliament" element={<ParliamentPage />} />
        <Route path="/assembly" element={<AssemblyPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </FilterProvider>
  );
}

export default function App() {
  return (
    <DataProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      <NavBar />
      <Container as="main" id="main" className="app-main" tabIndex={-1}>
        <Content />
      </Container>
      <footer className="app-footer">
        <Container>
          Data compiled from public sources (Election Commission of India and Wikipedia citing ECI). Not an official publication.
          Fields marked “Unavailable” were not found and are intentionally left blank.
        </Container>
      </footer>
    </DataProvider>
  );
}

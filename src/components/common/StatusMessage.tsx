import { Alert, Button, Spinner } from 'react-bootstrap';

type Kind = 'loading' | 'error' | 'empty' | 'info';
interface Props { kind: Kind; message?: string; onRetry?: () => void }

/** Single component for loading, error, empty and info states. */
export default function StatusMessage({ kind, message, onRetry }: Props) {
  if (kind === 'loading') {
    return (
      <div className="status-box" role="status" aria-live="polite">
        <Spinner animation="border" size="sm" className="me-2" />
        {message ?? 'Loading data…'}
      </div>
    );
  }
  if (kind === 'error') {
    return (
      <Alert variant="danger" role="alert" className="mb-3">
        <Alert.Heading as="h2" className="h6">Something went wrong</Alert.Heading>
        <p className="mb-2">{message ?? 'The data could not be loaded.'}</p>
        {onRetry && <Button size="sm" variant="outline-danger" onClick={onRetry}>Try again</Button>}
      </Alert>
    );
  }
  return (
    <Alert variant={kind === 'empty' ? 'secondary' : 'info'} role="status" className="mb-3">
      {message ?? 'No data to show.'}
    </Alert>
  );
}

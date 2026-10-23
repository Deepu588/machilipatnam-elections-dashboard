import type { Source } from '../../types';

export default function SourceNote({ sources, children }: { sources?: Source[]; children?: React.ReactNode }) {
  return (
    <p className="source-note">
      {children}
      {sources && sources.length > 0 && (
        <>
          {' '}Source:{' '}
          {sources.map((s, i) => (
            <span key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a>
              {i < sources.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </>
      )}
    </p>
  );
}

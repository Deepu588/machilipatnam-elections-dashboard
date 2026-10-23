import { partyColor, PARTY_NAMES } from '../../utils/constants';

export default function PartyBadge({ party }: { party: string }) {
  return (
    <span className="party-badge" title={PARTY_NAMES[party] ?? party}>
      <span className="party-dot" style={{ background: partyColor(party) }} aria-hidden="true" />
      {party}
    </span>
  );
}

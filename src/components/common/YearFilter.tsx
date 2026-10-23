import { Button, ButtonGroup, Form } from 'react-bootstrap';

interface Props {
  legend: string;
  years: number[];
  selected: number[];
  onChange: (years: number[]) => void;
}

/** Multi-select year chips (checkboxes) with select-all / clear. At least one year can always be re-selected. */
export default function YearFilter({ legend, years, selected, onChange }: Props) {
  const toggle = (y: number) =>
    onChange(selected.includes(y) ? selected.filter((v) => v !== y) : [...selected, y].sort((a, b) => a - b));
  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      <div className="d-flex flex-wrap align-items-center gap-3">
        {years.map((y) => (
          <Form.Check
            inline
            key={y}
            type="checkbox"
            id={`year-${legend}-${y}`}
            label={String(y)}
            checked={selected.includes(y)}
            onChange={() => toggle(y)}
          />
        ))}
        <ButtonGroup size="sm" aria-label="Quick year selection">
          <Button variant="outline-secondary" onClick={() => onChange(years)}>All</Button>
          <Button variant="outline-secondary" onClick={() => onChange([])}>Clear</Button>
        </ButtonGroup>
      </div>
    </fieldset>
  );
}

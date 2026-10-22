import { RANGES, type RangeId } from "../format";

interface RangeSelectorProps {
  value: RangeId;
  onChange: (range: RangeId) => void;
}

// Native radio buttons styled as a segmented control. The browser gives us
// keyboard support for free: Tab into the group, arrow keys to move, and
// screen readers announce "Chart range, 1M, selected, 2 of 3".
export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <fieldset className="range">
      <legend className="visually-hidden">Chart range</legend>
      {RANGES.map((range) => (
        <label key={range.id}>
          <input
            type="radio"
            name="range"
            value={range.id}
            checked={range.id === value}
            onChange={() => onChange(range.id)}
          />
          <span>{range.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

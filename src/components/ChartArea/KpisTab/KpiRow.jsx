import { COL } from '../../../state/definitions.js';
import { fmtE } from '../../../engine/utils.js';
import { InfoButton } from '../../common/Popover.jsx';
import { parseNum, findBestIdx } from './kpiFormat.js';
import { DataCell, LabelCell } from './KpisTab.styles.js';

/** One KPI row: label + one cell per active sim (with best-column highlight) + ETF cell. */
export default function KpiRow({ row, activeKeys }) {
  const formatted = activeKeys.map(k => ({ key: k, val: row.fmt(k) }));
  const nums = formatted.map(({ val }) => parseNum(val));
  const bestIdx = findBestIdx(nums, row.better, activeKeys.length);

  return (
    <tr>
      <LabelCell $muted={row.muted}>
        {row.tooltipKey && <InfoButton tooltipKey={row.tooltipKey} />} {row.label}
      </LabelCell>
      {formatted.map(({ key: k, val }, si) => {
        const isBest = si === bestIdx;
        const isNeg = row.neg && nums[si] != null && nums[si] < 0;
        return (
          <DataCell key={k} $best={isBest} $color={COL[k]} $neg={isNeg} $muted={row.muted}>
            {val}
          </DataCell>
        );
      })}
      <DataCell
        $color="#94a3b8"
        $muted={row.muted}
        $neg={row.neg && row.etfVal != null && row.etfVal < 0}
      >
        {row.etfVal != null ? (row.etfFmt ? row.etfFmt(row.etfVal) : fmtE(row.etfVal)) : '—'}
      </DataCell>
    </tr>
  );
}

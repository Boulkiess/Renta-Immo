import { COL } from '../../../state/definitions.js';
import KpiRow from './KpiRow.jsx';
import { SectionCell } from './KpisTab.styles.js';

const headTh = {
  textAlign: 'right',
  padding: '6px 10px',
  borderBottom: '1px solid var(--border)',
  fontSize: 11,
  fontWeight: 800,
};

/** The full KPI comparison table: header (sims + ETF column) + grouped sections. */
export default function KpiTable({ sections, sims, activeKeys, indicatorLabel }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th
            style={{
              textAlign: 'left',
              padding: '6px 10px',
              borderBottom: '1px solid var(--border)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--muted)',
            }}
          >
            {indicatorLabel}
          </th>
          {activeKeys.map(k => (
            <th key={k} style={{ ...headTh, color: COL[k] }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: COL[k],
                    display: 'inline-block',
                  }}
                />
                {sims[k].label}
              </span>
            </th>
          ))}
          <th style={{ ...headTh, color: '#94a3b8' }}>ETF pur</th>
        </tr>
      </thead>
      <tbody>
        {sections.map(sec => [
          <tr key={sec.cat}>
            <SectionCell colSpan={activeKeys.length + 2}>{sec.cat}</SectionCell>
          </tr>,
          ...sec.rows.map(row => <KpiRow key={row.label} row={row} activeKeys={activeKeys} />),
        ])}
      </tbody>
    </table>
  );
}

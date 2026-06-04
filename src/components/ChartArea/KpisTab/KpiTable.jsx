import { COL } from '../../../state/definitions.js';
import KpiRow from './KpiRow.jsx';
import { SectionCell, SectionLabel, TableScroll, Table, IndicatorTh } from './KpisTab.styles.js';

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
    <TableScroll>
      <Table>
        <thead>
          <tr>
            <IndicatorTh>{indicatorLabel}</IndicatorTh>
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
            <th style={{ ...headTh, color: '#94a3b8' }}>Pure ETF</th>
          </tr>
        </thead>
        <tbody>
          {sections.map(sec => [
            <tr key={sec.cat}>
              <SectionCell colSpan={activeKeys.length + 2}>
                <SectionLabel>{sec.cat}</SectionLabel>
              </SectionCell>
            </tr>,
            ...sec.rows.map(row => <KpiRow key={row.label} row={row} activeKeys={activeKeys} />),
          ])}
        </tbody>
      </Table>
    </TableScroll>
  );
}

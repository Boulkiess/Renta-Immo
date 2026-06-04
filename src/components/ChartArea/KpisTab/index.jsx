import { useTranslation } from 'react-i18next';
import { useApp } from '../../../state/AppContext.jsx';
import { KEYS } from '../../../state/definitions.js';
import { computeEtfKpis } from '@immo-renta/engine';
import { buildSections } from './kpiSections.js';
import KpiTable from './KpiTable.jsx';
import SummaryCards from './SummaryCards.jsx';
import { Wrap, TableWrap, TableTitle, TableDesc } from './KpisTab.styles.js';

export default function KpisTab() {
  const { t } = useTranslation();
  const { sims, RES, etfScenarioGlobal, crossovers, G } = useApp();

  const hz = G.horizon;
  const infl = G.inflation / 100;
  const activeKeys = KEYS.filter(k => sims[k].enabled);
  const etfKpis = computeEtfKpis(G);

  const sections = buildSections(t, { G, RES, sims, etfScenarioGlobal, etfKpis, crossovers });

  return (
    <Wrap>
      <TableWrap>
        <TableTitle>
          {t('kpisTable.title')}{' '}
          <span style={{ fontWeight: 400 }}>{t(`global.regimes.${G.regime}`)}</span>
        </TableTitle>
        <TableDesc>{t('kpisTable.desc')}</TableDesc>
        {infl > 0 && (
          <TableDesc style={{ marginTop: 2 }}>
            {t('kpisTable.descReal', { inflation: G.inflation })}
          </TableDesc>
        )}

        <KpiTable
          sections={sections}
          sims={sims}
          activeKeys={activeKeys}
          indicatorLabel={t('kpisTable.indicator')}
          etfLabel={t('charts.etfPure')}
        />
      </TableWrap>

      <SummaryCards
        activeKeys={activeKeys}
        sims={sims}
        RES={RES}
        hz={hz}
        infl={infl}
        real={G.displayReal}
      />
    </Wrap>
  );
}

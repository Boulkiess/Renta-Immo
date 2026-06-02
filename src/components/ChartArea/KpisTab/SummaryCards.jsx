import { useTranslation } from 'react-i18next';
import { COL } from '../../../state/definitions.js';
import { fmtE } from '../../../engine/utils.js';
import { Cards, Card, CardLabel, CardValue, CardSub } from './KpisTab.styles.js';

/** Total-worth summary card per active sim, at the chosen horizon. */
export default function SummaryCards({ activeKeys, sims, RES, hz, infl, real }) {
  const { t } = useTranslation();
  if (activeKeys.length === 0) return null;
  const deflate = (v, yr) => (v == null ? null : v / Math.pow(1 + infl, yr));
  return (
    <Cards>
      {activeKeys.map(k => {
        const nominal = RES[k].flows[hz - 1]?.totalWorth;
        const realVal = deflate(nominal, hz);
        // In real mode, the deflated value is the headline; nominal becomes the sub-note.
        const primary = real ? realVal : nominal;
        return (
          <Card key={k} $col={COL[k]}>
            <CardLabel>{t('summary.totalWorthCard', { hz })}</CardLabel>
            <CardValue $col={COL[k]}>{fmtE(primary)}</CardValue>
            <CardSub>
              {sims[k].label}
              {infl > 0 && (
                <>
                  {' · '}
                  {real ? t('common.nominal') : t('common.real')}&nbsp;:{' '}
                  {fmtE(real ? nominal : realVal)}
                </>
              )}
            </CardSub>
          </Card>
        );
      })}
    </Cards>
  );
}

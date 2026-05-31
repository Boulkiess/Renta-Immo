import { COL } from '../../../state/definitions.js';
import { fmtE } from '../../../engine/utils.js';
import { Cards, Card, CardLabel, CardValue, CardSub } from './KpisTab.styles.js';

/** Patrimoine-total summary card per active sim, at the chosen horizon. */
export default function SummaryCards({ activeKeys, sims, RES, hz, infl }) {
  if (activeKeys.length === 0) return null;
  const deflate = (v, yr) => (v == null ? null : v / Math.pow(1 + infl, yr));
  return (
    <Cards>
      {activeKeys.map(k => (
        <Card key={k} $col={COL[k]}>
          <CardLabel>Patrimoine total · {hz} ans</CardLabel>
          <CardValue $col={COL[k]}>{fmtE(RES[k].flux[hz - 1]?.patTotal)}</CardValue>
          <CardSub>
            {sims[k].label}
            {infl > 0 && <> · réel&nbsp;: {fmtE(deflate(RES[k].flux[hz - 1]?.patTotal, hz))}</>}
          </CardSub>
        </Card>
      ))}
    </Cards>
  );
}

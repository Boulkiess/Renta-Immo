import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import CanvasChart from '../common/CanvasChart.jsx';
import { drawLine, drawBars } from '../../engine/charts.js';
import { fmtE, fmtP, fmtTRI } from '../../engine/utils.js';

// ── Layout ───────────────────────────────────────────────────────────────
const Card = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const Title = styled.h3`
  color: ${({ theme }) => theme.text};
  font-size: 15px;
  font-weight: 700;
  margin: 0;
`;
const Body = styled.p`
  color: ${({ theme }) => theme.muted};
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
`;
const Code = styled.code`
  display: block;
  background: ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 6px 10px;
  font-family: ${({ theme }) => theme.mono};
  font-size: 11px;
  color: ${({ theme }) => theme.yellow};
  overflow-x: auto;
  white-space: pre;
`;
const Inputs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px 16px;
`;
const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
`;
const FieldTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
`;
const FieldVal = styled.span`
  color: ${({ theme }) => theme.text};
  font-family: ${({ theme }) => theme.mono};
  font-size: 11px;
`;
const Select = styled.select`
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  padding: 4px 6px;
  font-family: inherit;
  font-size: 12px;
`;
const FlowsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: 6px;
`;
const FlowIn = styled.input`
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  padding: 4px 5px;
  font-family: ${({ theme }) => theme.mono};
  font-size: 11px;
  width: 100%;
  box-sizing: border-box;
`;
const Result = styled.div`
  color: ${({ theme }) => theme.a};
  font-size: 26px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.mono};
`;
const Notes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
`;
const Note = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.muted};
  strong {
    color: ${({ theme }) => theme.text};
    font-family: ${({ theme }) => theme.mono};
    margin-left: 5px;
  }
`;

// ── Value formatting ────────────────────────────────────────────────────────
function fmtUnit(value, unit, t) {
  if (unit === 'tri') return fmtTRI(value); // returns 'N/C' for null
  if (value == null || !Number.isFinite(value)) return '—';
  switch (unit) {
    case 'eur':
      return fmtE(value);
    case 'eurMonth':
      return `${fmtE(value)}${t('doc.units.perMonth')}`;
    case 'pct':
    case 'pctPoint':
      return fmtP(value);
    case 'ratio':
      return `×${value.toFixed(2)}`;
    case 'years':
      return `${value} ${t('doc.units.years')}`;
    default:
      return String(value);
  }
}

// Mount charts only once scrolled into view (keeps many cards cheap).
function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: '100px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

export default function ConceptCard({ concept, ctx }) {
  const { t } = useTranslation();

  // Seed inputs from the live sim (ctx) when available, else descriptor default.
  // Re-seeds on remount (DocPanel bumps a key on "reset to my simulation").
  const [vals, setVals] = useState(() => {
    const init = {};
    concept.inputs.forEach(inp => {
      init[inp.key] = inp.seed ? (inp.seed(ctx) ?? inp.default) : inp.default;
    });
    return init;
  });

  const setVal = (key, value) => setVals(prev => ({ ...prev, [key]: value }));

  const result = concept.compute(vals, ctx);
  const [chartRef, chartSeen] = useInView();
  const palette = ['a', 'b', 'c', 'yellow'];

  const inputLabel = key => t(`fields.${key}.label`, '') || t(`doc.inputs.${key}`, key);

  const draw = canvas => {
    const datasets = result.series.map((s, i) => ({
      label: t(s.label, s.label),
      data: s.data,
      color:
        getComputedStyle(document.documentElement).getPropertyValue(`--${palette[i]}`).trim() ||
        '#6C9AFF',
    }));
    if (result.kind === 'bars') drawBars(canvas, datasets, result.xLabels, !!result.stacked);
    else drawLine(canvas, datasets, result.xLabels, [], { baseZero: false });
  };

  return (
    <Card>
      <Title>{t(`${concept.i18nKey}.title`)}</Title>
      <Body
        dangerouslySetInnerHTML={{
          __html: t(`${concept.i18nKey}.body`).replace(/\n/g, '<br>'),
        }}
      />
      {t(`${concept.i18nKey}.code`, '') && <Code>{t(`${concept.i18nKey}.code`)}</Code>}

      {concept.inputs.length > 0 && (
        <Inputs>
          {concept.inputs.map(inp => {
            if (inp.type === 'select') {
              return (
                <Field key={inp.key}>
                  <FieldTop>
                    <span>{inputLabel(inp.key)}</span>
                  </FieldTop>
                  <Select value={vals[inp.key]} onChange={e => setVal(inp.key, e.target.value)}>
                    {inp.options.map(opt => (
                      <option key={opt} value={opt}>
                        {t(`global.regimes.${opt}`, opt)}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            }
            if (inp.type === 'flows') {
              return (
                <Field key={inp.key} style={{ gridColumn: '1 / -1' }}>
                  <FieldTop>
                    <span>{inputLabel(inp.key)}</span>
                  </FieldTop>
                  <FlowsGrid>
                    {vals[inp.key].map((f, i) => (
                      <FlowIn
                        key={i}
                        type="number"
                        aria-label={t('resale.yr', { n: i })}
                        value={f}
                        onChange={e => {
                          const next = [...vals[inp.key]];
                          next[i] = +e.target.value;
                          setVal(inp.key, next);
                        }}
                      />
                    ))}
                  </FlowsGrid>
                </Field>
              );
            }
            return (
              <Field key={inp.key}>
                <FieldTop>
                  <span>{inputLabel(inp.key)}</span>
                  <FieldVal>{fmtUnit(vals[inp.key], inp.unit, t)}</FieldVal>
                </FieldTop>
                <input
                  type="range"
                  min={inp.min}
                  max={inp.max}
                  step={inp.step}
                  value={vals[inp.key]}
                  onChange={e => setVal(inp.key, +e.target.value)}
                />
              </Field>
            );
          })}
        </Inputs>
      )}

      {concept.render === 'number' ? (
        <Result>{fmtUnit(result.value, result.unit, t)}</Result>
      ) : (
        <div ref={chartRef} style={{ minHeight: 200 }}>
          {chartSeen && <CanvasChart draw={draw} deps={[JSON.stringify(vals)]} height={200} />}
        </div>
      )}

      {result.notes && result.notes.length > 0 && (
        <Notes>
          {result.notes.map(n => (
            <Note key={n.label}>
              {t(n.label, n.label)}
              <strong>{fmtUnit(n.value, n.unit, t)}</strong>
            </Note>
          ))}
        </Notes>
      )}
    </Card>
  );
}

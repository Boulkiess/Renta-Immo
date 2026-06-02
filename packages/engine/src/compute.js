// Pure financial engine — all functions receive global settings (g) as parameter

/**
 * Global settings shared across the 3 simulations. Mirrors state's DEFAULT_G.
 * @typedef {object} Globals
 * @property {'lmnp'|'microbic'|'nu'} regime   Rental tax regime (global).
 * @property {number} horizon            Calculation horizon in years (1–30).
 * @property {number} discountRate       Discount rate for NPV (%).
 * @property {number} altReturn          Alternative (ETF) annual return (%).
 * @property {number} personalRent       Personal monthly rent (€/month).
 * @property {number} personalRentGrowth Annual revaluation of personal rent (%).
 * @property {number} monthlyBudget      Available monthly budget (€/month).
 * @property {number} budgetGrowth       Annual budget revaluation (%).
 * @property {number} [chargesGrowth]    Annual fixed-charges revaluation (%, default 2).
 * @property {boolean} investSurplus     Reinvest the monthly surplus into the ETF pocket.
 * @property {number} etfDownPayment     Hypothetical capital invested in the ETF reference.
 * @property {number} inflation          Inflation (%), used by real-terms KPIs.
 */

/**
 * One simulation's financial parameters. Mirrors state's mkDef(). The rental
 * ('rental'), primary-residence ('primary') and viager ('viager') field sets are
 * always present; compute() reads the subset matching `mode`.
 * @typedef {object} SimParams
 * @property {'rental'|'primary'|'viager'} mode
 * @property {number} purchasePrice
 * @property {number} notaryFees
 * @property {number} renovationCosts
 * @property {number} agencyFees
 * @property {number} [loanFees]
 * @property {number} downPayment
 * @property {number} interestRate
 * @property {number} loanTerm
 * @property {number} insuranceRate
 * @property {number} propertyGrowth
 * @property {number} sellingFees
 * @property {number} rent
 * @property {number} vacancyRate
 * @property {number} propertyTax
 * @property {number} condoFees
 * @property {number} landlordInsurance
 * @property {number} managementFees
 * @property {number} maintenanceReserve
 * @property {number} rentGrowth
 * @property {number} marginalTaxRate
 * @property {number} socialCharges
 * @property {number} propertyDepreciation
 * @property {number} renovationDepreciation
 * @property {number} capitalGainsTax
 * @property {number} capitalGainsSocialCharges
 * @property {number} propertyTaxPrimary
 * @property {number} condoFeesPrimary
 * @property {number} homeInsurance
 * @property {number} maintenanceReservePrimary
 * @property {number} [marketValue]        Viager: free (vacant) market value.
 * @property {number} [occupationDiscount] Viager: décote d'occupation (%).
 * @property {number} [bouquet]            Viager: upfront lump (plays purchasePrice role).
 * @property {number} [monthlyAnnuity]     Viager: rente viagère (€/month).
 * @property {number} [annuityGrowth]      Viager: annual rente indexation (%).
 * @property {number} [expectedDuration]   Viager: seller's expected remaining lifespan (years).
 * @property {number} [ownerCharges]       Viager: owner-borne charges (€/yr).
 * @property {number} [ownerChargesGrowth] Viager: owner-charges revaluation (%).
 */

// ── Tax constants ─────────────────────────────────────────────
const PFU_RATE = 0.3; // flat tax (PFU) on the ETF capital gain (CTO)
const MICROBIC_ABATTEMENT = 0.5; // flat Micro-BIC allowance (non-classified furnished)
// Progressive allowances on the real-estate capital gain (art. 150 VC CGI)
const ALLOWANCE_INCOME_TAX_PER_YEAR = 6; // %/yr, years 6→21 (96 % cumulative at year 21)
const ALLOWANCE_SOCIAL_TAX_PER_YEAR = 1.65; // %/yr, years 6→21
const ALLOWANCE_SOCIAL_TAX_AT_22 = (21 - 5) * ALLOWANCE_SOCIAL_TAX_PER_YEAR + 1.6; // 28.0 % cumulative at year 22 (social-tax bonus 1.6)
const ALLOWANCE_SOCIAL_TAX_LATE_PER_YEAR = 9; // %/yr, years 23→30
const ALLOWANCE_FULL = 100; // full exemption

/**
 * Compound revaluation: base × (1 + ratePct%)^periods.
 * Exported for the interactive documentation (DocPanel) — a single source of
 * truth shared with the engine. Do not duplicate this formula elsewhere.
 * @param {number} base
 * @param {number} ratePct
 * @param {number} periods
 * @returns {number}
 */
export const compound = (base, ratePct, periods) => base * Math.pow(1 + ratePct / 100, periods);

// Annual surplus of the ETF REFERENCE scenario: revalued budget − revalued personal rent.
// ⚠️ Do NOT confuse with compute()'s in-loop surplus (budget − real property outflows):
// these are two distinct quantities. annualSurplus() unifies only computeEtfScenario + computeEtfKpis.
/**
 * @param {Globals} g
 * @param {number} yr
 * @returns {number}
 */
export const annualSurplus = (g, yr) =>
  Math.max(
    0,
    compound(g.monthlyBudget * 12, g.budgetGrowth, yr - 1) -
      compound(g.personalRent * 12, g.personalRentGrowth, yr - 1)
  );

/**
 * Internal rate of return via Newton-Raphson. Returns null on non-convergence.
 * @param {number[]} flows
 * @param {number} [guess]
 * @param {number} [maxIter]
 * @param {number} [tol]
 * @returns {number|null}
 */
export function irr(flows, guess = 0.1, maxIter = 100, tol = 1e-7) {
  let r = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0,
      dnpv = 0;
    for (let t = 0; t < flows.length; t++) {
      const d = Math.pow(1 + r, t);
      npv += flows[t] / d;
      if (t > 0) dnpv -= (t * flows[t]) / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(dnpv) < 1e-15) return null;
    const nr = r - npv / dnpv;
    if (Math.abs(nr - r) < tol) return nr;
    r = nr;
    if (!isFinite(r) || r < -1) return null;
  }
  return null;
}

/** @param {number} yr @returns {number} Income-tax allowance (%) — art. 150 VC CGI. */
export function allowanceIncomeTax(yr) {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ALLOWANCE_INCOME_TAX_PER_YEAR; // 6 %/yr from year 6 to 21 → 96 %
  return ALLOWANCE_FULL; // 4 % at year 22 = full exemption
}

/** @param {number} yr @returns {number} Social-tax allowance (%) — art. 150 VC CGI. */
export function allowanceSocialTax(yr) {
  if (yr <= 5) return 0;
  if (yr <= 21) return (yr - 5) * ALLOWANCE_SOCIAL_TAX_PER_YEAR; // 1.65 %/yr from year 6 to 21
  if (yr === 22) return ALLOWANCE_SOCIAL_TAX_AT_22; // 28.0 %
  if (yr <= 30) return ALLOWANCE_SOCIAL_TAX_AT_22 + (yr - 22) * ALLOWANCE_SOCIAL_TAX_LATE_PER_YEAR; // 9 %/yr, years 23→30
  return ALLOWANCE_FULL;
}

/**
 * Rental income tax for one year.
 * @param {number} effectiveRent  Effective rent (after vacancy).
 * @param {number} charges        Annual charges.
 * @param {number} buildingDepreciation  Building depreciation (LMNP).
 * @param {number} worksDepreciation     Works depreciation (LMNP).
 * @param {number} marginalTaxRate Marginal income tax rate (%).
 * @param {number} socialCharges  Social levies (%).
 * @param {'lmnp'|'microbic'|'nu'} regime
 * @param {number} [annualInterest] Deductible loan interest for the year.
 * @returns {number}
 */
export function rentalTax(
  effectiveRent,
  charges,
  buildingDepreciation,
  worksDepreciation,
  marginalTaxRate,
  socialCharges,
  regime,
  annualInterest = 0
) {
  let taxable;
  if (regime === 'lmnp')
    taxable = Math.max(
      0,
      effectiveRent - charges - buildingDepreciation - worksDepreciation - annualInterest
    );
  else if (regime === 'microbic') taxable = Math.max(0, effectiveRent * MICROBIC_ABATTEMENT);
  else taxable = Math.max(0, effectiveRent - charges - annualInterest); // 'nu' (bare ownership)
  return taxable * ((marginalTaxRate + socialCharges) / 100);
}

/** @param {Globals} g @returns {{yr:number, cap:number, capNet:number}[]} */
export function computeEtfScenario(g) {
  const result = [];
  let cap = g.etfDownPayment;
  let totalContribs = g.etfDownPayment;
  const r = g.altReturn / 100;
  for (let yr = 1; yr <= 30; yr++) {
    const surplus = annualSurplus(g, yr);
    cap = cap * (1 + r) + surplus;
    totalContribs += surplus;
    const gain = Math.max(0, cap - totalContribs);
    const capNet = cap - gain * PFU_RATE;
    result.push({ yr, cap, capNet });
  }
  return result;
}

// ETF KPIs (IRR/NPV/MOIC) at horizon g.horizon — moved here from KpisTab.jsx to sit
// under the golden-master net. See CLAUDE.md § "ETF column — KpisTab".
//   IRR_ETF      = altReturn (exact: ETF flows cancel out in NPV at rate altReturn)
//   IRR_real_ETF = (1 + altReturn) / (1 + inflation) − 1
//   NPV_ETF      = −etfDownPayment + Σ (−annualSurplus) / (1+discountRate)^t + cap[hz] / (1+discountRate)^hz
//   MOIC_ETF     = (cap[hz] − Σ annualSurplus) / etfDownPayment   (null if etfDownPayment = 0)
/**
 * @param {Globals} g
 * @returns {{tri:number, triReal:number, van:number, moic:number|null, surplusTotal:number}}
 */
export function computeEtfKpis(g) {
  const hz = g.horizon;
  const capHz = computeEtfScenario(g)[hz - 1]?.cap ?? 0;
  const tri = g.altReturn / 100;
  const triReal = (1 + tri) / (1 + g.inflation / 100) - 1;
  let van = -g.etfDownPayment;
  let surplusTotal = 0;
  for (let t = 1; t <= hz; t++) {
    const s = annualSurplus(g, t);
    van += -s / Math.pow(1 + g.discountRate / 100, t);
    surplusTotal += s;
  }
  van += capHz / Math.pow(1 + g.discountRate / 100, hz);
  const moic = g.etfDownPayment > 0 ? (capHz - surplusTotal) / g.etfDownPayment : null;
  return { tri, triReal, van, moic, surplusTotal };
}

// ── Pure islands extracted from compute() (tested transitively via golden-master) ──

// Monthly amortization schedule (constant annuity). amortization[m-1] = month m.
// Loop ≥ 12 months to guarantee at least one year even on a very short loan.
/**
 * @param {number} loanAmount      Borrowed principal.
 * @param {number} monthlyRate     Monthly rate.
 * @param {number} numPayments     Number of monthly payments.
 * @param {number} monthlyPayment  Monthly payment.
 * @param {number} monthlyInsurance Monthly insurance.
 * @returns {{interest:number, principal:number, insurance:number, remaining:number}[]}
 */
export function buildAmortization(
  loanAmount,
  monthlyRate,
  numPayments,
  monthlyPayment,
  monthlyInsurance
) {
  const amortization = [];
  let balance = loanAmount;
  for (let m = 1; m <= Math.max(numPayments, 12); m++) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.max(0, monthlyPayment - interest);
    balance = Math.max(0, balance - principalPaid);
    amortization.push({
      interest,
      principal: principalPaid,
      insurance: monthlyInsurance,
      remaining: balance,
    });
  }
  return amortization;
}

// Resale at year yr: resale price (renovation included), fees, taxed capital gain,
// then net proceeds. Capital-gains tax with progressive allowances in 'rental' mode; primary is exempt.
// Viager: the décote lifts at death (value steps occupiedValue → marketValue at
// expectedDuration), the cost basis is bouquet + cumulative rente + notary, and the
// gain is taxed like rental (a viager resale is not exempt). See computeViagerResale.
/**
 * @param {SimParams} p
 * @param {number} remaining Outstanding loan capital at year yr.
 * @param {number} yr
 * @returns {{resalePrice:number, sellingFee:number, netResaleProceeds:number}}
 */
export function computeResale(p, remaining, yr) {
  if (p.mode === 'viager') return computeViagerResale(p, remaining, yr);
  const resalePrice = compound(p.purchasePrice + p.renovationCosts, p.propertyGrowth, yr);
  const sellingFee = resalePrice * (p.sellingFees / 100);
  const grossGain = Math.max(0, resalePrice - p.purchasePrice - p.renovationCosts);
  let capitalGainsTax = 0;
  if (p.mode === 'rental') {
    const allowanceIR = Math.min(100, allowanceIncomeTax(yr));
    const allowancePS = Math.min(100, allowanceSocialTax(yr));
    capitalGainsTax =
      (grossGain *
        (p.capitalGainsTax * (1 - allowanceIR / 100) +
          p.capitalGainsSocialCharges * (1 - allowancePS / 100))) /
      100;
  }
  return {
    resalePrice,
    sellingFee,
    netResaleProceeds: resalePrice - remaining - sellingFee - capitalGainsTax,
  };
}

// Viager occupied value (before property growth) at year yr. The décote amortizes
// linearly to zero by the expected-death year: the occupation discount reflects the
// foregone use, which shrinks as the remaining occupation shortens. At yr = 0 the full
// décote applies; at yr ≥ expectedDuration the discount is zero (full market value), so
// the value rises smoothly across the death year instead of stepping.
/** @param {SimParams} p @param {number} yr @returns {number} */
function viagerOccupiedBase(p, yr) {
  const ed = Math.max(1, p.expectedDuration);
  const remainingFraction = Math.max(0, (ed - yr) / ed); // 1 at yr 0 → 0 at yr ≥ ed
  const discount = Math.min(99, p.occupationDiscount) * remainingFraction;
  return p.marketValue * (1 - discount / 100);
}

// Cumulative rente actually paid up to year yr (caps at expectedDuration).
/** @param {SimParams} p @param {number} yr @returns {number} */
function viagerRenteToDate(p, yr) {
  let total = 0;
  const lastYear = Math.min(yr, Math.max(1, p.expectedDuration));
  for (let y = 1; y <= lastYear; y++)
    total += compound(p.monthlyAnnuity * 12, p.annuityGrowth, y - 1);
  return total;
}

// Viager resale at year yr. The resale price is the décote-amortized occupied value
// (which reaches the full market value by the expected-death year) grown by property
// appreciation. Cost basis = bouquet + cumulative rente paid + notary (nominal — a
// documented simplification, cf. CLAUDE.md); the gain is taxed with the same
// progressive allowances as a rental resale.
/**
 * @param {SimParams} p
 * @param {number} remaining Outstanding loan capital at year yr.
 * @param {number} yr
 * @returns {{resalePrice:number, sellingFee:number, netResaleProceeds:number}}
 */
export function computeViagerResale(p, remaining, yr) {
  const resalePrice = compound(viagerOccupiedBase(p, yr), p.propertyGrowth, yr);
  const sellingFee = resalePrice * (p.sellingFees / 100);
  const costBasis = p.bouquet + viagerRenteToDate(p, yr) + p.notaryFees;
  const grossGain = Math.max(0, resalePrice - costBasis);
  const allowanceIR = Math.min(100, allowanceIncomeTax(yr));
  const allowancePS = Math.min(100, allowanceSocialTax(yr));
  const capitalGainsTax =
    (grossGain *
      (p.capitalGainsTax * (1 - allowanceIR / 100) +
        p.capitalGainsSocialCharges * (1 - allowancePS / 100))) /
    100;
  return {
    resalePrice,
    sellingFee,
    netResaleProceeds: resalePrice - remaining - sellingFee - capitalGainsTax,
  };
}

// IRR / NPV / MOIC at a horizon. Pure. flows 0-based; irrFlows[0] = −downPayment.
/**
 * @param {{netResaleProceeds:number}[]} flows
 * @param {number[]} irrFlows  0-based; irrFlows[0] = −downPayment.
 * @param {number} horizon
 * @returns {number|null}
 */
export function calcTRI(flows, irrFlows, horizon) {
  if (horizon > 30 || horizon < 1) return null;
  const flowsAtHorizon = [...irrFlows.slice(0, horizon + 1)];
  flowsAtHorizon[horizon] += flows[horizon - 1].netResaleProceeds;
  return irr(flowsAtHorizon);
}

/**
 * @param {{netResaleProceeds:number}[]} flows
 * @param {number[]} irrFlows
 * @param {Globals} g
 * @param {number} horizon
 * @returns {number|null}
 */
export function calcVAN(flows, irrFlows, g, horizon) {
  if (horizon > 30 || horizon < 1) return null;
  const r = g.discountRate / 100;
  let van = irrFlows[0]; // −downPayment
  for (let t = 1; t <= horizon && t <= 30; t++) {
    let cf = irrFlows[t]; // same flows as the IRR: personal rent reintegrated
    if (t === horizon) cf += flows[t - 1].netResaleProceeds;
    van += cf / Math.pow(1 + r, t);
  }
  return van;
}

/**
 * @param {{netResaleProceeds:number}[]} flows
 * @param {number[]} irrFlows
 * @param {number} horizon
 * @param {number} downPayment
 * @returns {number}
 */
export function calcMoic(flows, irrFlows, horizon, downPayment) {
  const last = flows[horizon - 1];
  if (!last) return 0;
  return (
    (last.netResaleProceeds + irrFlows.slice(1, horizon + 1).reduce((a, b) => a + b, 0)) /
    downPayment
  );
}

/**
 * Core financial engine. Pure: given a simulation's params and globals, returns
 * monthly payments, the 30-year flows array, IRR at 10/15/20y, NPV, MOIC, resale.
 * @param {SimParams} p
 * @param {Globals} g
 */
export function compute(p, g) {
  const isViager = p.mode === 'viager';
  // Viager: the bouquet is the t0 price component (it plays purchasePrice's role); the
  // rente is the deferred price paid over time, NOT financed by the bank loan. The
  // décote-amortized occupied value drives resale, not the loan. See CLAUDE.md.
  const totalCost = isViager
    ? p.bouquet + p.notaryFees
    : p.purchasePrice + p.notaryFees + p.renovationCosts + p.agencyFees + (p.loanFees ?? 0);
  const loanAmount = Math.max(0, totalCost - p.downPayment);
  // Capital actually tied up in the property: capped at the total cost. A down
  // payment that exceeds `totalCost` (over-funded cash purchase) leaves a cash
  // remainder. That remainder is not part of the property return (IRR/NPV/MOIC,
  // netWorth, operational balances stay anchored on investedDownPayment).
  const investedDownPayment = Math.min(p.downPayment, totalCost);
  // Down-payment remainder beyond the acquisition cost: invested in the ETF if the
  // surplus→ETF toggle is on (otherwise kept as cash, outside the model). It feeds
  // the ETF pocket (totalWorth / totalBalance); the total starting stake then
  // becomes investedDownPayment + etfSeed (= p.downPayment when the remainder is invested).
  const etfSeed = g.investSurplus ? Math.max(0, p.downPayment - totalCost) : 0;
  const totalDownPayment = investedDownPayment + etfSeed;
  const monthlyRate = p.interestRate / 100 / 12,
    numPayments = p.loanTerm * 12;
  const monthlyPayment =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments))
      : loanAmount > 0
        ? loanAmount / numPayments
        : 0;
  const monthlyInsurance = (loanAmount * (p.insuranceRate / 100)) / 12;

  const amortization = buildAmortization(
    loanAmount,
    monthlyRate,
    numPayments,
    monthlyPayment,
    monthlyInsurance
  );

  // Depreciation only applies to the rental LMNP path; guard against the viager
  // params (which have no purchasePrice/renovationCosts) producing NaN.
  const buildingDepreciation = isViager ? 0 : p.purchasePrice * (p.propertyDepreciation / 100),
    worksDepreciation = isViager ? 0 : p.renovationCosts * (p.renovationDepreciation / 100);
  const flows = [];
  let cumulativeCashFlow = 0;
  let irrCumulative = 0; // cumulative adjusted flows (netCashFlow + personalRentAnnual) — IRR/NPV/MOIC basis
  const irrFlows = [-investedDownPayment];
  const altRate = g.altReturn / 100;
  let etfCapital = etfSeed; // down-payment remainder invested in ETF from year 0 (compounds like etfDownPayment)
  let depreciationCarry = 0; // unused LMNP depreciation carried over (loss-making years)

  for (let yr = 1; yr <= 30; yr++) {
    const monthIdx = Math.min(yr * 12, amortization.length) - 1;
    const remaining = amortization[monthIdx]?.remaining ?? 0;
    const annuity = yr <= p.loanTerm ? monthlyPayment * 12 : 0;
    const annualInsurance = yr <= p.loanTerm ? monthlyInsurance * 12 : 0;
    // Viager: the décote-amortized occupied value (rising to full market value by the
    // expected-death year) grown by appreciation. Rental/primary use purchasePrice growth.
    const propertyValue = isViager
      ? compound(viagerOccupiedBase(p, yr), p.propertyGrowth, yr)
      : compound(p.purchasePrice, p.propertyGrowth, yr);
    const personalRentAnnual = compound(g.personalRent * 12, g.personalRentGrowth, yr - 1);

    let netCashFlow,
      effectiveRent = 0,
      charges = 0,
      tax = 0;

    if (p.mode === 'rental') {
      const grossRent = compound(p.rent * 12, p.rentGrowth, yr - 1);
      effectiveRent = grossRent * (1 - p.vacancyRate / 100);
      const chargesFactor = compound(1, g.chargesGrowth ?? 2, yr - 1);
      charges =
        (p.propertyTax + p.condoFees + p.landlordInsurance + p.maintenanceReserve) * chargesFactor +
        grossRent * (p.managementFees / 100);
      const annualInterest = amortization
        .slice((yr - 1) * 12, yr * 12)
        .reduce((s, m) => s + m.interest, 0);
      if (g.regime === 'lmnp') {
        // LMNP real: interest + depreciation deductible; loss carried over to later years
        const taxableRaw =
          effectiveRent -
          charges -
          buildingDepreciation -
          worksDepreciation -
          annualInterest -
          depreciationCarry;
        const taxable = Math.max(0, taxableRaw);
        depreciationCarry = taxableRaw < 0 ? -taxableRaw : 0;
        tax = taxable * ((p.marginalTaxRate + p.socialCharges) / 100);
      } else {
        tax = rentalTax(
          effectiveRent,
          charges,
          buildingDepreciation,
          worksDepreciation,
          p.marginalTaxRate,
          p.socialCharges,
          g.regime,
          annualInterest
        );
      }
      netCashFlow = effectiveRent - charges - annuity - annualInsurance - tax - personalRentAnnual;
    } else if (p.mode === 'primary') {
      const chargesFactor = compound(1, g.chargesGrowth ?? 2, yr - 1);
      charges =
        (p.propertyTaxPrimary +
          p.condoFeesPrimary +
          p.homeInsurance +
          p.maintenanceReservePrimary) *
        chargesFactor;
      netCashFlow = -(charges + annuity + annualInsurance);
      effectiveRent = personalRentAnnual;
    } else if (p.mode === 'viager') {
      // Viager occupied: no rental income (the seller occupies). The buyer pays the
      // rente (stops at death), owner charges (all years), and the bouquet loan if
      // financed. Personal rent is reintegrated like rental — the investor still rents
      // their own home, so it is a sunk cost neutralized in the IRR/NPV flows.
      const rente =
        yr <= Math.max(1, p.expectedDuration)
          ? compound(p.monthlyAnnuity * 12, p.annuityGrowth, yr - 1)
          : 0;
      const chargesFactor = compound(1, p.ownerChargesGrowth ?? g.chargesGrowth ?? 2, yr - 1);
      charges = p.ownerCharges * chargesFactor + rente;
      netCashFlow = -(charges + annuity + annualInsurance) - personalRentAnnual;
    } else {
      throw new Error(`compute(): unknown sim mode "${p.mode}"`);
    }
    cumulativeCashFlow += netCashFlow;

    // Real money out of pocket (feeds the ETF surplus). For rental/viager the personal
    // rent is part of it (the investor rents elsewhere); for primary it is not.
    const realOutflow = p.mode === 'primary' ? charges + annuity + annualInsurance : -netCashFlow;
    const annualBudget = compound(g.monthlyBudget * 12, g.budgetGrowth, yr - 1);
    const budgetSurplus = Math.max(0, annualBudget - realOutflow);
    etfCapital = etfCapital * (1 + altRate) + (g.investSurplus ? budgetSurplus : 0);

    const { resalePrice, netResaleProceeds } = computeResale(p, remaining, yr);
    irrCumulative += netCashFlow + personalRentAnnual;
    const resaleBalance = netResaleProceeds + cumulativeCashFlow - investedDownPayment;
    const totalBalance = netResaleProceeds + etfCapital - totalDownPayment;
    // cashBalance: resale balance in cash on the same basis as IRR/NPV/MOIC — the
    // personal rent (rental: sunk cost / primary: saved rent) is reintegrated, which
    // makes the zero-crossing interpretable as "holding period to not lose money".
    const cashBalance = netResaleProceeds + irrCumulative - investedDownPayment;
    const totalWorth = propertyValue - remaining + etfCapital;

    flows.push({
      yr,
      effectiveRent,
      charges,
      annuity: annuity + annualInsurance,
      tax,
      netCashFlow,
      cumulativeCashFlow,
      coc: investedDownPayment > 0 ? (netCashFlow / investedDownPayment) * 100 : null,
      propertyValue,
      remainingCapital: remaining,
      netWorth: propertyValue - remaining + cumulativeCashFlow - investedDownPayment,
      totalWorth,
      etfPocket: etfCapital,
      netResaleProceeds,
      resaleBalance,
      totalBalance,
      cashBalance,
      resalePrice,
    });

    // Both modes add personalRentAnnual to IRR/NPV flows:
    // rental: removes personal rent from costs (sunk cost unrelated to the investment)
    // primary: adds saved rent as a benefit (you no longer pay it)
    irrFlows.push(netCashFlow + personalRentAnnual);
  }

  const totalInterest = amortization.reduce((s, m) => s + m.interest, 0);
  const totalInsurance = amortization.reduce((s, m) => s + m.insurance, 0);
  const grossYield = p.mode === 'rental' ? ((p.rent * 12) / totalCost) * 100 : 0;
  let netYield = 0;
  if (p.mode === 'rental') {
    const netAnnual =
      p.rent * (1 - p.vacancyRate / 100) * 12 -
      (p.propertyTax +
        p.condoFees +
        p.landlordInsurance +
        p.maintenanceReserve +
        p.rent * 12 * (p.managementFees / 100));
    netYield = (netAnnual / totalCost) * 100;
  }
  const monthlyCashFlow =
    p.mode === 'rental'
      ? p.rent - monthlyPayment - monthlyInsurance - g.personalRent
      : p.mode === 'viager'
        ? -(monthlyPayment + monthlyInsurance + (p.monthlyAnnuity ?? 0))
        : g.personalRent - monthlyPayment - monthlyInsurance;
  const breakEven = flows.findIndex(f => f.cumulativeCashFlow >= 0);
  const resaleBreakEven = flows.findIndex(f => f.cashBalance >= 0);

  return {
    totalCost,
    loanAmount,
    monthlyPayment,
    monthlyInsurance,
    // Viager monthly rente (0 for rental/primary). The "Monthly payment" KPI chip adds
    // it to the loan payment so a bouquet-only viager doesn't display €0.
    monthlyAnnuity: isViager ? p.monthlyAnnuity : 0,
    totalInterest,
    totalInsurance,
    grossYield,
    netYield,
    monthlyCashFlow,
    breakEven: breakEven >= 0 ? breakEven + 1 : null,
    resaleBreakEven: resaleBreakEven >= 0 ? resaleBreakEven + 1 : null,
    flows,
    amortization,
    tri10: calcTRI(flows, irrFlows, 10),
    tri15: calcTRI(flows, irrFlows, 15),
    tri20: calcTRI(flows, irrFlows, 20),
    van: calcVAN(flows, irrFlows, g, g.horizon),
    moic: calcMoic(flows, irrFlows, g.horizon, investedDownPayment),
    resaleByYear: flows.map(f => ({
      yr: f.yr,
      resalePrice: f.resalePrice,
      remainingCapital: f.remainingCapital,
      resaleBalance: f.resaleBalance,
    })),
  };
}

/**
 * First year where property totalWorth ≥ ETF reference cap. Null if surplus not invested.
 * @param {{flows:{totalWorth:number}[]}} res  A compute() result.
 * @param {{cap:number}[]} etfScenarioGlobal   A computeEtfScenario() result.
 * @param {Globals} g
 * @returns {number|null}
 */
export function crossoverYear(res, etfScenarioGlobal, g) {
  if (!etfScenarioGlobal.length || !g.investSurplus) return null;
  for (let i = 0; i < 30; i++) {
    const property = res.flows[i]?.totalWorth;
    const etf = etfScenarioGlobal[i]?.cap;
    if (property != null && etf != null && property >= etf) return i + 1;
  }
  return null;
}

/**
 * Sensitivity band for a viager simulation: re-run the deterministic engine at
 * expectedDuration ± delta and report the min/mid/max of the headline KPIs at the
 * horizon. This communicates the longevity bet (die early → bargain, die late →
 * overpay) without restructuring the engine into a multi-scenario model. Pure: it
 * just calls compute() on cloned params; it is NEVER called by compute() itself
 * (no recursion). Returns null for non-viager sims.
 * @param {SimParams} p
 * @param {Globals} g
 * @param {number} [delta] Years either side of expectedDuration (default 5).
 * @returns {null | {expectedDuration:number, delta:number,
 *   totalWorth:{min:number, mid:number, max:number},
 *   cashBalance:{min:number, mid:number, max:number}}}
 */
export function computeViagerBand(p, g, delta = 5) {
  if (p.mode !== 'viager') return null;
  const hz = g.horizon;
  const at = duration => {
    const f = compute({ ...p, expectedDuration: Math.max(1, duration) }, g).flows[hz - 1];
    return { totalWorth: f?.totalWorth ?? 0, cashBalance: f?.cashBalance ?? 0 };
  };
  const ed = Math.max(1, p.expectedDuration);
  const lo = at(ed - delta),
    mid = at(ed),
    hi = at(ed + delta);
  const span = key => ({
    min: Math.min(lo[key], mid[key], hi[key]),
    mid: mid[key],
    max: Math.max(lo[key], mid[key], hi[key]),
  });
  return {
    expectedDuration: ed,
    delta,
    totalWorth: span('totalWorth'),
    cashBalance: span('cashBalance'),
  };
}

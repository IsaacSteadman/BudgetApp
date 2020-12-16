import { calculateTaxes } from "./taxes";

let avgRoi: HTMLInputElement;
let avgRoiPeriod: HTMLSelectElement;
let initialValue: HTMLInputElement;

let estimatedTaxesPaidInput: HTMLInputElement;
let preTaxProfitInput: HTMLInputElement;
let startMonthInput: HTMLSelectElement;
let startYearInput: HTMLInputElement;

let takeOutTaxes: HTMLSelectElement;
let taxCustomData: HTMLInputElement;
let taxStatus: HTMLSelectElement;

let moneyAdd: HTMLInputElement;
let moneyAddPeriod: HTMLSelectElement;
let moneyAddIncrease: HTMLInputElement;

let expectedAnnualInflation: HTMLInputElement;

// let tablePeriod: HTMLSelectElement;
let tableStopCondition: HTMLSelectElement;
let tableStopValue: HTMLInputElement;

let investTable: HTMLTableElement;

let investTimeToStop: HTMLSpanElement;

const months = [
  'January', 'February', 'March',
  'April', 'May', 'June',
  'July', 'August', 'September',
  'October', 'November', 'December'
];

export async function init() {
  avgRoi = document.getElementById('invest-avg-return') as HTMLInputElement;
  avgRoiPeriod = document.getElementById('invest-return-period') as HTMLSelectElement;
  initialValue = document.getElementById('invest-initial-value') as HTMLInputElement;
  estimatedTaxesPaidInput = document.getElementById('estimated-taxes-paid') as HTMLInputElement;
  preTaxProfitInput = document.getElementById('pre-tax-profit') as HTMLInputElement;
  startMonthInput = document.getElementById('start-month') as HTMLSelectElement;
  startYearInput = document.getElementById('start-year') as HTMLInputElement;
  takeOutTaxes = document.getElementById('invest-taxes') as HTMLSelectElement;
  taxCustomData = document.getElementById('invest-taxes-custom') as HTMLInputElement;
  taxStatus = document.getElementById('invest-taxes-status') as HTMLSelectElement;
  moneyAdd = document.getElementById('invest-money-input') as HTMLInputElement;
  moneyAddPeriod = document.getElementById('invest-money-input-period') as HTMLSelectElement;
  moneyAddIncrease = document.getElementById('invest-money-input-increase') as HTMLInputElement;
  expectedAnnualInflation = document.getElementById('invest-inflation-rate') as HTMLInputElement;
  // tablePeriod = document.getElementById('invest-table-period') as HTMLSelectElement;
  tableStopCondition = document.getElementById('invest-table-stop') as HTMLSelectElement;
  tableStopValue = document.getElementById('invest-table-stop-value') as HTMLInputElement;
  investTable = document.getElementById('invest-table') as HTMLTableElement;

  investTimeToStop = document.getElementById('invest-time-to-stop') as HTMLSpanElement;

  avgRoi.addEventListener('input', onChange);
  avgRoiPeriod.addEventListener('change', onChange);
  initialValue.addEventListener('input', onChange);
  estimatedTaxesPaidInput.addEventListener('input', onChange);
  preTaxProfitInput.addEventListener('input', onChange);
  startMonthInput.addEventListener('input', onChange);
  startYearInput.addEventListener('input', onChange);
  takeOutTaxes.addEventListener('change', onChange);
  taxCustomData.addEventListener('input', onChange);
  taxStatus.addEventListener('change', onChange);
  moneyAdd.addEventListener('input', onChange);
  moneyAddPeriod.addEventListener('change', onChange);
  moneyAddIncrease.addEventListener('input', onChange);
  expectedAnnualInflation.addEventListener('input', onChange);
  // tablePeriod.addEventListener('change', onChange);
  tableStopCondition.addEventListener('change', onChange);
  tableStopValue.addEventListener('input', onChange);

  startYearInput.value = `${(new Date()).getFullYear()}`;
  startMonthInput.value = `${(new Date()).getMonth()}`
}

function formatDollars(total: number): string {
  const dollars = Math.floor(total);
  const cents = Math.floor(100 * (total - dollars));
  const centsStr = '' + cents;
  return `$${Math.floor(dollars)}.${'0'.repeat(2 - centsStr.length)}${centsStr}`;
}

type MonthId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type TaxationOption = 'none' | '15-only' | '15-and-net' | '20-only' | '20-and-net' | 'short-term' | 'short-term-custom';
type TaxStatus = 'single' | 'joint';

/*class TaxCalculator {
  type: TaxationOption;
  taxStatus: TaxStatus;
  customData: number;
  prevYearProfit: number;
  constructor (type: TaxationOption, taxStatus: TaxStatus, customData: number) {
    this.type = type;
    this.taxStatus = taxStatus;
    this.customData = customData;
    this.prevYearProfit = 0;
  }
  getCurrentValue(month: MonthId, prevYearValue: number, currentValue: number): number {
    const { type, taxStatus, customData } = this;
    if (type === 'none') {
      return currentValue;
    } else if (type === '15-only') {
      if (month === 11) {
        return (currentValue - prevYearValue) * 0.85 + prevYearValue;
      }
    } else if (type === '15-and-net') {
      if (month === 11) {
        return (currentValue - prevYearValue) * 0.812 + prevYearValue;
      }
    } else if (type === '20-only') {
      if (month === 11) {
        return (currentValue - prevYearValue) * 0.8 + prevYearValue;
      }
    } else if (type === '20-and-net') {
      if (month === 11) {
        return (currentValue - prevYearValue) * 0.762 + prevYearValue;
      }
    } else if (type === 'short-term') {
      if (month === 11) {
        return calculateTaxes(currentValue - prevYearValue, taxStatus).netIncome + prevYearValue;
      }
    } else if (type === 'short-term-custom') {
      if (month === 11) {
        const baseNetIncome = calculateTaxes(customData, taxStatus).netIncome;
        return calculateTaxes(customData + currentValue - prevYearValue, taxStatus).netIncome - baseNetIncome + prevYearValue;
      }
    } else if (type === 'short-term-custom-110') {
      if ([3,5,7]month === 3) {
        currentValue -= 1.1 * this.prevYearProfit / 4;
      }
    }
    return currentValue;
  }
}*/

interface TableState {
  year: number;
  month: MonthId;
  preTaxProfit: number;
  estimatedTaxesPaid: number;
  currentValue: number;
  valueAdded: number;
  memos: string[];
  isInitial?: boolean;
}

type MonthlyCallback = (prevMonthStates: [TableState, TableState][], currentState: TableState) => TableState;
type MonthlyStopCondition = (prevMonthStates: [TableState, TableState][], currentState: TableState) => boolean;

class MonthlyTableReportBuilder {
  initialState: TableState;
  states: [TableState, TableState][];
  preMonthStep: MonthlyCallback;
  midMonthStep: MonthlyCallback;
  postMonthStep: MonthlyCallback;
  postMonthStopCondition: MonthlyStopCondition;
  constructor (initialState: TableState, preMonthStep: MonthlyCallback, midMonthStep: MonthlyCallback, postMonthStep: MonthlyCallback, postMonthStopCondition: MonthlyStopCondition) {
    this.initialState = initialState;
    this.states = [];
    this.preMonthStep = preMonthStep;
    this.midMonthStep = midMonthStep;
    this.postMonthStep = postMonthStep;
    this.postMonthStopCondition = postMonthStopCondition;
  }
  execute() {
    this.states = [];
    const {initialState, states, preMonthStep, midMonthStep, postMonthStep, postMonthStopCondition} = this;
    let current: [TableState, TableState] = [initialState, initialState];
    states.push(current);
    while (!postMonthStopCondition(states, current[0])) {
      current[1] = preMonthStep(states, current[1]);
      current[1] = midMonthStep(states, current[1]);
      current[1] = postMonthStep(states, current[1]);
      const state: TableState = {
        year: current[1].year + (current[1].month === 11 ? 1 : 0),
        month: ((current[1].month + 1) % 12) as MonthId,
        currentValue: current[1].currentValue,
        preTaxProfit: 0,
        valueAdded: current[1].valueAdded,
        estimatedTaxesPaid: 0,
        memos: [],
      };
      current = [state, state];
      states.push(current);
    }
    states.pop();
  }
}

function rfindIndex<T>(arr: T[], fn: (v: T, i: number) => boolean, end?: number, defaultValue: number = -1): number {
  if (end == null) {
    end = arr.length;
  }
  while (end-- > 0) {
    const v = arr[end];
    if (fn(v, end)) {
      return end;
    }
  }
  return defaultValue;
}

function rfind<T>(arr: T[], fn: (v: T, i: number) => boolean, end?: number): T {
  const i = rfindIndex(arr, fn, end);
  if (i === -1) {
    return null;
  }
  return arr[i];
}

function fmtNum2(n: number): string {
  const s = `${Math.floor(n * 100 + .5)}`;
  const s1 = '0'.repeat(Math.max(0, 3 - s.length)) + s;
  return `${s1.substring(0, s1.length - 2)}.${s1.substring(s1.length - 2)}`;
}

const preMonthStep: MonthlyCallback = (prevStates, currentState) => {
  if ([0, 3, 5, 8].indexOf(currentState.month) !== -1) {
    const nextState = {...currentState};
    if (currentState.month === 3) {
      const iEndYear = rfindIndex(prevStates, v => v[0].month === 11);
      let totalProfit = 0;
      let totalEstimatedPayments = prevStates.length >= 4 ? prevStates[prevStates.length - 4][1].estimatedTaxesPaid : 0;
      for (let i = Math.max(0, iEndYear - 11); i <= iEndYear; ++i) {
        const cur = prevStates[i][1];
        totalProfit += cur.preTaxProfit;
        if (cur.month > 0) {
          totalEstimatedPayments += cur.estimatedTaxesPaid;
        }
      }
      const lastYearTaxes = totalProfit - removeTaxes(totalProfit);
      nextState.memos = [...nextState.memos];
      nextState.memos.push(`TAX_YEAR: taxes for last year: $${fmtNum2(lastYearTaxes)}`);
      nextState.memos.push(`TAX_YEAR: you paid $${fmtNum2(totalEstimatedPayments)} in estimated payments`);
      if (lastYearTaxes > totalEstimatedPayments) {
        const diff = lastYearTaxes - totalEstimatedPayments;
        nextState.memos.push(`TAX_YEAR: you owe $${fmtNum2(diff)} in taxes`);
        nextState.currentValue -= diff;
      } else if (lastYearTaxes < totalEstimatedPayments) {
        const diff = totalEstimatedPayments - lastYearTaxes;
        nextState.memos.push(`TAX_YEAR: you get a tax refund of $${fmtNum2(diff)} in taxes`);
        nextState.currentValue += diff;
      }
      const currentEstimatedPayment = 1.1 * lastYearTaxes / 4;
      nextState.estimatedTaxesPaid += currentEstimatedPayment;
      nextState.memos.push(`TAX_EST: you pay $${fmtNum2(currentEstimatedPayment)} in estimated payment`);
    } else {
      const prevEstimatedPayment = rfind(prevStates, v => [0, 3, 5, 8].indexOf(v[0].month) !== -1);
      if (prevEstimatedPayment == null || prevEstimatedPayment[0].isInitial) {
        return currentState;
      }
      const currentEstimatedPayment = prevEstimatedPayment[1].estimatedTaxesPaid;
      nextState.memos.push(`TAX_EST: you pay $${fmtNum2(currentEstimatedPayment)} in estimated payment`);
      nextState.currentValue -= currentEstimatedPayment;
      nextState.estimatedTaxesPaid += currentEstimatedPayment;
    }
    return nextState;
  }
  return currentState;
}

type MoneyAddPeriod = 'month' | 'quarter-begin' | 'quarter-end' | 'year-begin' | 'year-end';

const midMonthStep: MonthlyCallback = (prevStates, currentState) => {
  const period = moneyAddPeriod.value as MoneyAddPeriod;
  if (period === 'quarter-begin' && currentState.month % 3 !== 0) {
    return currentState;
  }
  if (period === 'quarter-end' && currentState.month % 3 !== 2) {
    return currentState;
  }
  if (period === 'year-begin' && currentState.month !== 0) {
    return currentState;
  }
  if (period === 'year-end' && currentState.month !== 11) {
    return currentState;
  }
  if (moneyAdd.value.length === 0 || +moneyAdd.value === 0) {
    return currentState;
  }
  const nextState = {...currentState};
  const startTime = prevStates[0][0].year * 12 + prevStates[0][0].month;
  const curTime = currentState.year * 12 + currentState.month;
  const add: number = +moneyAdd.value * (1 + +moneyAddIncrease.value / 100) ** ((curTime - startTime) / 12);
  nextState.valueAdded += add
  nextState.currentValue += add;
  nextState.memos = [...currentState.memos, `ADD: you added $${fmtNum2(add)} to your investments`];
  return nextState;
}

const postMonthStep: MonthlyCallback = (prevStates, currentState) => {
  const nextState = {...currentState};
  nextState.currentValue *= monthlyRoi;
  nextState.preTaxProfit += nextState.currentValue - currentState.currentValue;
  nextState.memos = [...currentState.memos, `GROWTH: you grew your value by ${fmtNum2((monthlyRoi - 1) * 100)}%`];
  return nextState;
}

const postMonthStopCondition: MonthlyStopCondition = (prevStates, currentState) => {
  if (tableStopCondition.value === 'invest-nominal-value') {
    return currentState.currentValue >= +tableStopValue.value;
  } else if (tableStopCondition.value === 'invest-real-value') { 
    const startTime = prevStates[0][0].year * 12 + prevStates[0][0].month;
    const curTime = currentState.year * 12 + currentState.month;
    const inflation = monthlyInflation ** (curTime - startTime);
    return currentState.currentValue / inflation >= +tableStopValue.value;
  } else {
    return true;
  }
}

const MONTHS = months.map(x => x.substring(0, 3));

function generateTableRowFromStateGroup(states: [TableState, TableState][], idx: number): HTMLTableRowElement {
  const { currentValue: preValue, year, month } = states[idx][0];
  const { currentValue, valueAdded, memos } = states[idx][1];

  const startTime = states[0][0].year * 12 + states[0][0].month;
  const curTime = year * 12 + month;
  const inflation = (1 + +expectedAnnualInflation.value / 100) ** ((curTime - startTime) / 12);
  const tr = document.createElement('tr');
  // Date
  let td = document.createElement('td');
  td.innerText = `${MONTHS[month]} ${year}`;
  tr.appendChild(td);
  // Dollars Added
  td = document.createElement('td');
  td.innerText = `$${fmtNum2(valueAdded)}`;
  tr.appendChild(td);
  // Investment Value <br/> (nominal before month)
  td = document.createElement('td');
  td.innerText = `$${fmtNum2(preValue)}`;
  tr.appendChild(td);
  // Investment Value <br/> (nominal after month)
  td = document.createElement('td');
  td.innerText = `$${fmtNum2(currentValue)}`;
  tr.appendChild(td);
  // Investment Value <br/> (real relative to start)
  td = document.createElement('td');
  td.innerText = `$${fmtNum2(currentValue / inflation)}`;
  tr.appendChild(td);
  // Memos
  td = document.createElement('td');
  td.innerText = memos.join('\n');
  tr.appendChild(td);
  return tr;
}

function removeTaxes(value: number): number {
  if (takeOutTaxes.value === '15-only') {
    return value * 0.85;
  } else if (takeOutTaxes.value === '15-and-net') {
    return value * 0.812;
  } else if (takeOutTaxes.value === '20-only') {
    return value * 0.8;
  } else if (takeOutTaxes.value === '20-and-net') {
    return value * 0.762;
  } else if (takeOutTaxes.value === 'short-term') {
    return calculateTaxes(value, <'single' | 'joint'>taxStatus.value).netIncome;
  } else if (takeOutTaxes.value === 'short-term-custom') {
    const status = <'single' | 'joint'>taxStatus.value
    const baseNetIncome = calculateTaxes(+taxCustomData.value, status).netIncome;
    return calculateTaxes(+taxCustomData.value + value, status).netIncome - baseNetIncome;
  } else if (takeOutTaxes.value === 'none') {
    return value;
  } else {
    return value;
  }
}

function shouldTableStop(value: number, inflation: number): boolean {
  if (tableStopCondition.value === 'invest-nominal-value') {
    return value >= +tableStopValue.value;
  } else if (tableStopCondition.value === 'invest-real-value') {
    return value / inflation >= +tableStopValue.value;
  } else {
    return true;
  }
}

function generateTableRow(date: string | [string, string], nominalDollars: number, investmentNominalValue: number, investmentRealValue: number): HTMLTableRowElement {
  const tr = document.createElement('tr');
  if (typeof date === 'string') {
    tr.innerHTML = `<td colspan="2">${date}</td>`;
  } else {
    tr.innerHTML = `<td>${date[0]}</td><td>${date[1]}</td>`;
  }
  tr.innerHTML += `<td>${formatDollars(nominalDollars)}</td><td>${formatDollars(investmentNominalValue)}</td><td>${formatDollars(investmentRealValue)}</td>`;
  return tr;
}

function fillTableOld() {
  const tBody = investTable.tBodies[0];
  tBody.innerHTML = '';
  let i = 0;
  let value = +initialValue.value;
  let prevYearValue = value;
  let inflation = 1;
  let totalAdded = 0;
  let m;
  while (!shouldTableStop(value, inflation)) {
    ++i;
    for (m = 0; m < 12; ++m) {
      const add: number = (+moneyAdd.value) * (1 + +moneyAddIncrease.value / 100) ** (i + m /12);
      // do money add
      if (moneyAddPeriod.value === 'month') {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      } else if (moneyAddPeriod.value === 'year-begin' && m === 0) {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      } else if (moneyAddPeriod.value === 'year-end' && m === 11) {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      } else if (moneyAddPeriod.value === 'quarter-begin' && m % 3 === 0) {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      } else if (moneyAddPeriod.value === 'quarter-end' && m % 3 === 2) {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      }
      // do appreciation
      inflation *= monthlyInflation;
      value *= monthlyRoi;
      // assess taxes
      if (m === 11) {
        const diff = value - prevYearValue;
        value -= diff - removeTaxes(diff);
        prevYearValue = value;
      }

      tBody.appendChild(generateTableRow([`Year ${i}`,` Month ${m}`], totalAdded, value, value / inflation));
      if (shouldTableStop(value, inflation)) {
        break;
      }

      /*if (tablePeriod.value === 'month') {
        tBody.appendChild(generateTableRow([`Year ${i}`,` Month ${m}`], totalAdded, value, value / inflation));
        if (shouldTableStop(value, inflation)) {
          break;
        }
      } else if (tablePeriod.value === 'year' && m === 11) {
        tBody.appendChild(generateTableRow(`Year ${i}`, totalAdded, value, value / inflation));
      } else if (tablePeriod.value === 'quarter' && m % 3 === 2) {
        tBody.appendChild(generateTableRow([`Year ${i}`, `Q${(m + 4) / 3}`], totalAdded, value, value / inflation));
        if (shouldTableStop(value, inflation)) {
          break;
        }
      }*/
    }
    if (i > 100) {
      tBody.appendChild(generateTableRow(`Year ${i}`, totalAdded, value, value / inflation));
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5">WARNING: TOO LONG - quiting further evaluation</td>';
      tBody.appendChild(tr);
      investTimeToStop.innerText = 'Way Too Long';
      return;
    }
  }
  investTimeToStop.innerText = `${i} years and ${m} months`;
}

function fillTable() {
  const tBody = investTable.tBodies[0];
  tBody.innerHTML = '';
  const builder = new MonthlyTableReportBuilder(
    {
      currentValue: +initialValue.value,
      estimatedTaxesPaid: +estimatedTaxesPaidInput.value,
      preTaxProfit: +preTaxProfitInput.value,
      memos: [],
      month: +startMonthInput.value as MonthId,
      year: +startYearInput.value,
      valueAdded: 0,
      isInitial: true,
    },
    preMonthStep,
    midMonthStep,
    postMonthStep,
    postMonthStopCondition
  );
  builder.execute();
  builder.states.forEach((x, i, states) => {
    tBody.appendChild(generateTableRowFromStateGroup(states, i));
  });
  const months = builder.states.length % 12;
  const years = (builder.states.length - months) / 12
  investTimeToStop.innerText = `${years} years and ${months} months`;
}

let annualRoi: number = 0;
let monthlyRoi: number = 0;
let annualInflation: number = 1;
let monthlyInflation: number = 1;

function onChange() {
  annualRoi = (1 + (+avgRoi.value) / 100) ** {'day': 365.25, 'week': 365.25 / 7, 'month': 12, 'quarter': 4, 'year': 1}[avgRoiPeriod.value];
  monthlyRoi = annualRoi ** (1/12);
  annualInflation = 1 + +expectedAnnualInflation.value / 100;
  monthlyInflation = annualInflation ** (1 / 12);
  fillTable();
}



import { calculateTaxes } from "./taxes";

let avgRoi: HTMLInputElement;
let avgRoiPeriod: HTMLSelectElement;
let initialValue: HTMLInputElement;

let takeOutTaxes: HTMLSelectElement;
let taxCustomData: HTMLInputElement;
let taxStatus: HTMLSelectElement;

let moneyAdd: HTMLInputElement;
let moneyAddPeriod: HTMLSelectElement;
let moneyAddIncrease: HTMLInputElement;

let expectedAnnualInflation: HTMLInputElement;

let tablePeriod: HTMLSelectElement;
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
  avgRoi = <HTMLInputElement>document.getElementById('invest-avg-return');
  avgRoiPeriod = <HTMLSelectElement>document.getElementById('invest-return-period');
  initialValue = <HTMLInputElement>document.getElementById('invest-initial-value');
  takeOutTaxes = <HTMLSelectElement>document.getElementById('invest-taxes');
  taxCustomData = <HTMLInputElement>document.getElementById('invest-taxes-custom');
  taxStatus = <HTMLSelectElement>document.getElementById('invest-taxes-status');
  moneyAdd = <HTMLInputElement>document.getElementById('invest-money-input');
  moneyAddPeriod = <HTMLSelectElement>document.getElementById('invest-money-input-period');
  moneyAddIncrease = <HTMLInputElement>document.getElementById('invest-money-input-increase');
  expectedAnnualInflation = <HTMLInputElement>document.getElementById('invest-inflation-rate');
  tablePeriod = <HTMLSelectElement>document.getElementById('invest-table-period');
  tableStopCondition = <HTMLSelectElement>document.getElementById('invest-table-stop');
  tableStopValue = <HTMLInputElement>document.getElementById('invest-table-stop-value');
  investTable = <HTMLTableElement>document.getElementById('invest-table');

  investTimeToStop = <HTMLSpanElement>document.getElementById('invest-time-to-stop');

  avgRoi.addEventListener('input', onChange);
  avgRoiPeriod.addEventListener('change', onChange);
  initialValue.addEventListener('input', onChange);
  takeOutTaxes.addEventListener('change', onChange);
  taxCustomData.addEventListener('input', onChange);
  taxStatus.addEventListener('change', onChange);
  moneyAdd.addEventListener('input', onChange);
  moneyAddPeriod.addEventListener('change', onChange);
  moneyAddIncrease.addEventListener('input', onChange);
  expectedAnnualInflation.addEventListener('input', onChange);
  tablePeriod.addEventListener('change', onChange);
  tableStopCondition.addEventListener('change', onChange);
  tableStopValue.addEventListener('input', onChange);
}

function formatDollars(total: number): string {
  const dollars = Math.floor(total);
  const cents = Math.floor(100 * (total - dollars));
  const centsStr = '' + cents;
  return `$${Math.floor(dollars)}.${'0'.repeat(2 - centsStr.length)}${centsStr}`;
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
    const baseNetIncome = calculateTaxes(+taxCustomData.value, ).netIncome;
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

function fillTable() {
  const tBody = investTable.tBodies[0];
  tBody.innerHTML = '';
  let i = 0;
  let value = +initialValue.value;
  let prevYearValue = value;
  let inflation = 1;
  const inflationRate = 1 + +expectedAnnualInflation.value / 100;
  const monthlyInflationRate = inflationRate ** (1/12);
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
      } else if (moneyAddPeriod.value === 'year' && m === 0) {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      } else if (moneyAddPeriod.value === 'quarter' && m % 3 === 0) {
        value += add;
        prevYearValue += add;
        totalAdded += add;
      }
      // do appreciation
      inflation *= monthlyInflationRate;
      value *= monthlyRoi;
      // assess taxes
      if (m === 11) {
        const diff = value - prevYearValue;
        value -= diff - removeTaxes(diff);
        prevYearValue = value;
      }
      if (tablePeriod.value === 'month') {
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
      }
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
  investTimeToStop.innerText = `${i} years and ${m} months`
}

let annualRoi: number = 0;
let monthlyRoi: number = 0;

function onChange() {
  annualRoi = (1 + (+avgRoi.value) / 100) ** {'day': 365.25, 'week': 365.25 / 7, 'month': 12, 'quarter': 4, 'year': 1}[avgRoiPeriod.value];
  monthlyRoi = annualRoi ** (1/12);
  fillTable();
}



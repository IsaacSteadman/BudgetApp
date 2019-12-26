import { EditTable, ValidColSpec } from "./EditTable";
import { loadedImagesPromise } from "./icons";
import { getPromiseFileReader, FR_AS_TXT, saveAs, saveFileA } from "./FileUtils";
import { PieChart } from "./PieChartSvg";

const centsNumToDollarStr = x => {
  const cents = x % 100;
  const dollars = (x - cents) / 100;
  if (cents < 10) {
    return `${dollars}.0${cents}`;
  } else {
    return `${dollars}.${cents}`;
  }
};
const dollarStrToCentsNum = x => {
  if (x.length === 0) return 0;
  const parts = x.split('.');
  if (parts.length > 2) {
    throw 'expected at most 1 dot';
  }
  const dollars = +parts[0];
  if (parts.length === 2 && parts[1].length > 2 && '0'.repeat(parts[1].length - 2) !== parts[1].substring(2)) {
    throw 'cannot have fractional cents';
  }
  if (parts.length === 2 && parts[1].length < 2) {
    parts[1] = parts[1] + '0'.repeat(2 - parts[1].length);
  }
  const cents = parts.length === 2 ? +parts[1].substring(0, 2) : 0;
  return dollars * 100 + cents;
};

const budgetColSpec: ValidColSpec[] = [
  {
    attrName: 'itemName',
    type: 'single-line-text'
  },
  {
    attrName: 'priority',
    type: 'number',
    min: 0,
    step: 1,
    max: null,
    valueToNum: x => x.length === 0 ? 0 : +x;
  },
  {
    attrName: 'amount',
    type: 'number',
    numToStaticStr: x => '$' + centsNumToDollarStr(x),
    numToValue: centsNumToDollarStr,
    valueToNum: dollarStrToCentsNum,
    min: 0,
    step: '0.01',
    max: null
  }
];

function calculateTaxes(income: number) {
  const brackets = [
    [12000, 0],
    [9875, 0.10],
    [40125 - 9875, 0.12],
    [85525 - 40125, 0.22],
    [163300 - 85525, 0.24],
    [207350 - 163300, 0.32],
    [518400 - 207350, 0.35],
    [Infinity, 0.37]
  ];
  income = Math.floor(income + 0.5);
  const incomeCalc = income;
  const socialMedicare = incomeCalc * 0.0765;
  let taxes = 0;
  for (let i = 0; i < brackets.length && income > 0; ++i) {
    const [amt, frac] = brackets[i];
    const amt1 = Math.min(income, amt);
    const tax = frac * amt1;
    taxes += tax;
    income -= amt1;
  }
  return { incomeCalc, socialMedicare, taxes, netIncome: incomeCalc - socialMedicare - taxes };
};
function invCalculateTaxes(netIncome: number): number {
  let lower = netIncome;
  let upper = 2 * netIncome;
  while (upper - lower > 2) {
    const mid = (lower + upper) / 2;
    const { netIncome: mine } = calculateTaxes(mid);
    if (mine > netIncome) {
      upper = mid;
    } else if (mine < netIncome) {
      lower = mid;
    } else {
      return mid;
    }
  }
  return (upper + lower) / 2;
};

document.addEventListener('DOMContentLoaded', async function () {
  await loadedImagesPromise;
  document.body.appendChild(saveFileA);
  const daily = <HTMLTableElement>document.getElementById('daily');
  const dayoffly = <HTMLTableElement>document.getElementById('dayoffly');
  const businessDaily = <HTMLTableElement>document.getElementById('business-daily');
  const businessWeekly = <HTMLTableElement>document.getElementById('business-weekly');
  const weekly = <HTMLTableElement>document.getElementById('weekly');
  const monthly = <HTMLTableElement>document.getElementById('monthly');
  const quarterly = <HTMLTableElement>document.getElementById('quarterly');
  const halfYearly = <HTMLTableElement>document.getElementById('half-yearly');
  const yearly = <HTMLTableElement>document.getElementById('yearly');
  const output = <HTMLTableElement>document.getElementById('output');
  const budgetFileLoad = <HTMLInputElement>document.getElementById('load-file');
  const budgetSaveFileName = <HTMLInputElement>document.getElementById('save-file-name');
  const budgetSaveFile = <HTMLInputElement>document.getElementById('save-file');
  const budgetPieChart = <SVGSVGElement><unknown>document.getElementById('pie-chart');
  const doms = [
    daily, dayoffly, businessDaily, businessWeekly,
    weekly, monthly, quarterly, halfYearly, yearly
  ];
  doms.forEach(dom => {
    dom.innerHTML = '<thead><tr><th>Line Item Name</th><th>Priority</th><th>Amount (USD)</th><th class="adder"></th></tr></thead><tbody></tbody>';
  });
  const multipliers = [
    365.25, 111.36, 365.25 - 111.36, (365.25 / 7) - 1,
    365.25 / 7, 12, 4, 2, 1
  ];
  const addArr = function (arr: number[], idx: number, val: number) {
    if (arr.length <= idx) {
      const old = arr.length;
      arr.length = idx + 1;
      for (let i = old; i < arr.length; ++i) {
        arr[i] = 0;
      }
    }
    arr[idx] += val;
  };
  const columns = 3;
  const datas: { itemName: string, priority: number, amount: number }[][] = doms.map(x => ([]));
  const tables = doms.map((dom, i) => {
    const tbl = new EditTable(datas[i], dom, budgetColSpec, true)
    tbl.createDefaultData = arg => {
      return {itemName: 'Untitled', priority: 0, amount: 0};
    };
    return tbl;
  });
  const pieChart = new PieChart(budgetPieChart, 256, [['red', 'black'], ['green', 'black'], ['blue', 'white'], ['yellow', 'black'], ['orange', 'black'], ['purple', 'white'], ['cyan', 'black'], ['pink', 'black']])
  const onChange = function () {
    const priArr = [];
    const dataLog = [];
    const lineItems = {};
    datas.forEach((dataArr, i) => {
      const m = multipliers[i];
      dataArr.map(dataObj => {
        const { itemName, priority, amount } = dataObj;
        dataLog.push(`${itemName}: ${amount}, multiplier=${m}`);
        const total = amount * m;
        const prev = lineItems[itemName];
        if (prev == null) {
          lineItems[itemName] = total;
        } else {
          lineItems[itemName] = total + prev;
        }
        addArr(priArr, priority, total);
      });
    });
    const lineItemsArr = Object.keys(lineItems).map(k => ({num: lineItems[k], label: k})).sort((a, b) => a.num - b.num);
    pieChart.loadData(lineItemsArr);
    console.log(dataLog);
    const outputTb = output.tBodies[0]
    outputTb.innerHTML = '';
    let sum = 0;
    for (let i = 0; i < priArr.length; ++i) {
      const tr = document.createElement('tr');
      const v = priArr[i];
      sum += v;
      tr.innerHTML = `<td>Priority ${
        i
      }</td><td>\$${
        centsNumToDollarStr((v + 0.5) | 0)
      }</td><td>\$${
        centsNumToDollarStr((sum + 0.5) | 0)
      }</td><td>\$${
        invCalculateTaxes(((sum + 0.5) | 0) / 100)
      }</td>`;
      outputTb.appendChild(tr);
    }
  };
  budgetFileLoad.addEventListener('change', async function (e) {
    if (budgetFileLoad.files.length === 0) {
      return;
    }
    const file = budgetFileLoad.files[0];
    const str = <string>await getPromiseFileReader(file, FR_AS_TXT);
    const loaded = JSON.parse(str);
    for (let i = 0; i < datas.length; ++i) {
      datas[i] = loaded[i];
    }
    datas.forEach((x, i) => {
      const tbl = tables[i];
      const tBody = tbl.tbl.tBodies[0];
      tBody.innerHTML = `<tr>${'<td></td>'.repeat(columns + 1)}</tr>`.repeat(x.length);
      tbl.backingData = x;
      x.forEach((y, j) => {
        tbl.makeStatic(tBody.rows[j]);
      });
    });
    alert('loaded');
    onChange();
  });
  budgetSaveFile.addEventListener('click', e => {
    saveAs(JSON.stringify(datas), budgetSaveFileName.value + '.json');
  })
  tables.forEach(tbl => tbl.onChangeCallback = onChange);
});

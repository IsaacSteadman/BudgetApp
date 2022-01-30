import { invCalculateTaxes, calculateTaxes } from './taxes';
let input: HTMLInputElement;
let inputAlt: HTMLInputElement;
let output: HTMLInputElement;
let outputAlt: HTMLInputElement;
let inputLabel: HTMLSpanElement;
let inputLabelAlt: HTMLSpanElement;
let outputLabel: HTMLSpanElement;
let outputLabelAlt: HTMLSpanElement;
let option: HTMLSelectElement;
let taxStatus: HTMLSelectElement;
let taxYear: HTMLSelectElement;

export async function init() {
  input = document.getElementById('tax-input') as HTMLInputElement;
  inputAlt = document.getElementById('tax-input-alt') as HTMLInputElement;
  output = document.getElementById('tax-output') as HTMLInputElement;
  outputAlt = document.getElementById('tax-output-alt') as HTMLInputElement;
  inputLabel = document.getElementById('tax-input-label') as HTMLSpanElement;
  inputLabelAlt = document.getElementById(
    'tax-input-label-alt'
  ) as HTMLSpanElement;
  outputLabel = document.getElementById('tax-output-label') as HTMLSpanElement;
  outputLabelAlt = document.getElementById(
    'tax-output-label-alt'
  ) as HTMLSpanElement;
  option = document.getElementById(
    'tax-calculation-direction'
  ) as HTMLSelectElement;
  taxStatus = document.getElementById('tax-status') as HTMLSelectElement;
  taxYear = document.getElementById('tax-year') as HTMLSelectElement;
  input.addEventListener('input', onChange);
  inputAlt.addEventListener('input', onChange);
  option.addEventListener('change', onChange);
  taxStatus.addEventListener('change', onChange);
  taxYear.addEventListener('change', onChange);
  option.addEventListener('change', onChangeLabels);
}

function onChangeLabels() {
  inputLabel.innerText =
    option.value === 'pre-to-post'
      ? 'Pre-tax income'
      : 'Net income after taxes';
  outputLabel.innerText =
    option.value === 'pre-to-post'
      ? 'Net income after taxes'
      : 'Pre-tax income';
}

function onChange() {
  const status = taxStatus.value as 'single' | 'joint';
  const year = +taxYear.value;
  const inputVal = +input.value;
  const inputAltVal = inputAlt.value.length ? +inputAlt.value : null;
  if (option.value === 'pre-to-post') {
    const outputVal = calculateTaxes(inputVal, year, status).netIncome;
    output.value = `${outputVal}`;
    if (inputAltVal == null) {
      outputAlt.value = '';
    } else {
      const outputAltVal =
        calculateTaxes(inputVal + inputAltVal, year, status).netIncome -
        outputVal;
      outputAlt.value = `${outputAltVal}`;
    }
  } else {
    const outputVal = invCalculateTaxes(inputVal, year, status);
    output.value = `${outputVal}`;
    if (inputAltVal == null) {
      outputAlt.value = '';
    } else {
      const outputAltVal =
        invCalculateTaxes(inputVal + inputAltVal, year, status) - outputVal;
      outputAlt.value = `${outputAltVal}`;
    }
  }
}

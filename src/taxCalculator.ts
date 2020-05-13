import { invCalculateTaxes, calculateTaxes } from "./taxes";
let input: HTMLInputElement;
let output: HTMLInputElement;
let option: HTMLSelectElement;
let singleOrJoint: HTMLSelectElement;
let inputLabel: HTMLSpanElement;
let outputLabel: HTMLSpanElement;

export async function init() {
  input = <HTMLInputElement>document.getElementById('tax-input');
  output = <HTMLInputElement>document.getElementById('tax-output');
  inputLabel = <HTMLSpanElement>document.getElementById('tax-input-label');
  outputLabel = <HTMLSpanElement>document.getElementById('tax-output-label');
  option = <HTMLSelectElement>document.getElementById('tax-calculation-direction');
  singleOrJoint = <HTMLSelectElement>document.getElementById('tax-single-or-joint');
  input.addEventListener('input', onChange);
  option.addEventListener('change', onChange);
  singleOrJoint.addEventListener('change', onChange);
  option.addEventListener('change', onChangeLabels);
}

function onChangeLabels() {
  inputLabel.innerText = option.value === 'pre-to-post' ? 'Pre-tax income' : 'Net income after taxes';
  outputLabel.innerText = option.value === 'pre-to-post' ? 'Net income after taxes' : 'Pre-tax income';
}

function onChange() {
  if (option.value === 'pre-to-post') {
    output.value = `${calculateTaxes(+input.value, <'single' | 'joint'>singleOrJoint.value).netIncome}`;
  } else {
    output.value = `${invCalculateTaxes(+input.value, <'single' | 'joint'>singleOrJoint.value)}`;
  }
}

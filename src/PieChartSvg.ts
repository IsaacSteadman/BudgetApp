const TAU = Math.PI * 2;
export class PieChart {
  svg: SVGSVGElement;
  data: { num: number; label: string }[];
  pieGroup: SVGGElement;
  r: number;
  colors: [string, string][];
  textGroup: SVGGElement;
  constructor(svg: SVGSVGElement, r: number, colors: [string, string][]) {
    this.svg = svg;
    this.data = [];
    this.r = r;
    const pieGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    svg.appendChild(pieGroup);
    this.pieGroup = pieGroup;
    const textGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    svg.appendChild(textGroup);
    this.textGroup = textGroup;
    this.colors = colors;
  }
  loadData(data: { num: number; label: string }[]) {
    this.data = data;
    let theta = 0;
    const r = this.r;
    let sum = 0;
    const cumsums = this.data.map((x) => (sum += x.num));
    cumsums.unshift(0);
    const cumrads = cumsums.map((x) => (x * TAU) / sum);
    const colorAlloc = data.map((x, i) => {
      const ri = data.length - i - 1;
      return this.colors[ri % this.colors.length];
    });
    const g = this.pieGroup;
    const tg = this.textGroup;
    g.innerHTML = '';
    tg.innerHTML = '';
    for (let i = 0; i < data.length; ++i) {
      const theta = cumrads[i];
      const theta1 = cumrads[i + 1];
      const sx = r + r * Math.cos(theta);
      const sy = r + r * Math.sin(theta);
      const dx = r + r * Math.cos(theta1);
      const dy = r + r * Math.sin(theta1);
      let ltheta = 0.5 * (theta + theta1);
      if (ltheta < 0) ltheta += TAU;
      else if (ltheta >= TAU) ltheta -= TAU;
      const lx = r + r * Math.cos(ltheta);
      let ly = r + r * Math.sin(ltheta);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute(
        'd',
        `M${r},${r}L${sx},${sy}A${r},${r},0,${
          theta1 - theta >= 0.5 * TAU ? '1' : '0'
        },1,${dx},${dy}`
      );
      p.style.stroke = 'none';
      const [fill, labelColor] = colorAlloc[i];
      p.style.fill = fill;
      g.appendChild(p);
      const label = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      );
      if (ltheta > TAU / 2) {
        ly += 22;
      }
      if (ltheta < TAU / 4 || ltheta > (TAU * 3) / 4) {
        label.setAttribute('text-anchor', 'end');
      }
      label.setAttribute('transform', `translate(${lx},${ly})`);
      label.textContent = data[i].label;
      label.style.fill = labelColor;
      tg.appendChild(label);
    }
  }
}

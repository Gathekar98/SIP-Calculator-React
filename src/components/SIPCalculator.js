import React, { useMemo, useState } from "react";
import RangeSlider from "./RangeSlider";

const formatCurrency = (amount, compact = false) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);

const buildPlanPdf = ({ investment, duration, returnRate, invested, gains, futureValue, points }) => {
  const width = 595;
  const height = 842;
  const ink = "0.141 0.208 0.212";
  const teal = "0.090 0.420 0.408";
  const seaGlass = "0.341 0.663 0.608";
  const paleAqua = "0.851 0.933 0.918";
  const paper = "0.957 0.976 0.973";
  const muted = "0.420 0.494 0.490";
  const white = "1 1 1";
  const commands = [];
  const money = (value) => `INR ${Math.round(value).toLocaleString("en-IN")}`;
  const safeText = (value) => String(value).replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
  const text = (value, x, y, size, color = ink, bold = false) => {
    commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${safeText(value)}) Tj ET`);
  };
  const rect = (x, y, w, h, color, strokeColor) => {
    if (strokeColor) commands.push(`${strokeColor} RG 0.7 w ${x} ${y} ${w} ${h} re S`);
    if (color) commands.push(`${color} rg ${x} ${y} ${w} ${h} re f`);
  };
  const line = (x1, y1, x2, y2, color, lineWidth = 1) => {
    commands.push(`${color} RG ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  rect(0, 0, width, height, paper);
  rect(36, 682, 523, 124, teal);
  text("SIP CALCULATOR  /  INVESTMENT PLAN", 58, 776, 9, paleAqua, true);
  text("Your plan, in focus", 58, 738, 27, white, true);
  text("A personalized SIP growth projection", 58, 715, 11, paleAqua);
  text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), 58, 697, 9, paleAqua);

  const cards = [
    ["TOTAL INVESTED", money(invested)],
    ["ESTIMATED RETURNS", money(gains)],
    ["PROJECTED VALUE", money(futureValue)],
  ];
  const cardY = 556;
  const cardW = 165;
  cards.forEach(([label, value], index) => {
    const x = 36 + index * 178;
    rect(x, cardY, cardW, 96, white, paleAqua);
    text(label, x + 13, cardY + 71, 8, muted, true);
    text(value, x + 13, cardY + 43, 13, index === 2 ? teal : ink, true);
    text(index === 0 ? "Your contributions" : index === 1 ? "Estimated growth" : "At the end of your plan", x + 13, cardY + 20, 8, muted);
  });

  text("PLAN ASSUMPTIONS", 36, 527, 9, teal, true);
  text(`Monthly investment: ${money(investment)}     |     Period: ${duration} years     |     Assumed annual return: ${returnRate}%`, 36, 507, 10, ink);

  text("PROJECTED GROWTH", 36, 476, 9, teal, true);
  text("Illustrative value over time", 36, 461, 8, muted);
  const plot = { x: 78, y: 323, w: 454, h: 118 };
  const max = Math.max(futureValue, 1);
  [0, 0.5, 1].forEach((fraction) => {
    const y = plot.y + plot.h * fraction;
    line(plot.x, y, plot.x + plot.w, y, paleAqua, 0.6);
    text(money(max * fraction), 36, y - 3, 7, muted);
  });
  const pointAt = (point) => ({
    x: plot.x + (point.year / duration) * plot.w,
    y: plot.y + (point.total / max) * plot.h,
    principalY: plot.y + (point.principal / max) * plot.h,
  });
  const coords = points.map(pointAt);
  if (coords.length) {
    const areaPath = [`${coords[0].x} ${plot.y} m`, ...coords.map((p) => `${p.x} ${p.y} l`), `${coords[coords.length - 1].x} ${plot.y} l h`].join(" ");
    commands.push(`q ${paleAqua} rg ${areaPath} f Q`);
    commands.push(`q ${seaGlass} RG 1.5 w ${coords.map((p, i) => `${p.x} ${p.principalY} ${i ? "l" : "m"}`).join(" ")} S Q`);
    commands.push(`q ${teal} RG 2.4 w ${coords.map((p, i) => `${p.x} ${p.y} ${i ? "l" : "m"}`).join(" ")} S Q`);
  }
  [0, Math.round(duration / 2), duration].filter((year, i, list) => list.indexOf(year) === i).forEach((year, index, list) => {
    const x = plot.x + (year / duration) * plot.w;
    text(`${year} yr`, Math.min(Math.max(x - (index === 0 ? 0 : 12), plot.x), plot.x + plot.w - 24), plot.y - 16, 8, muted);
  });
  line(36, 299, 52, 299, teal, 2.2);
  text("Projected value", 57, 296, 8, muted);
  line(154, 299, 170, 299, seaGlass, 1.5);
  text("Amount invested", 175, 296, 8, muted);

  text("YEAR-BY-YEAR MILESTONES", 36, 270, 9, teal, true);
  const tableTop = 252;
  const columns = [36, 128, 317, 559];
  rect(36, tableTop - 22, 523, 22, paleAqua);
  text("YEAR", columns[0] + 9, tableTop - 15, 8, teal, true);
  text("AMOUNT INVESTED", columns[1] + 9, tableTop - 15, 8, teal, true);
  text("PROJECTED VALUE", columns[2] + 9, tableTop - 15, 8, teal, true);
  const milestoneYears = [...new Set([0, Math.round(duration / 3), Math.round((duration * 2) / 3), duration])];
  milestoneYears.forEach((year, index) => {
    const point = points[year];
    const y = tableTop - 40 - index * 20;
    if (index % 2 === 0) rect(36, y - 5, 523, 19, white);
    text(`${year}`, columns[0] + 9, y, 9, ink);
    text(money(point.principal), columns[1] + 9, y, 9, ink);
    text(money(point.total), columns[2] + 9, y, 9, ink, true);
  });

  line(36, 87, 559, 87, paleAqua, 0.8);
  text("Illustrative estimates only; actual returns vary.", 36, 69, 8, muted);
  text("Mutual fund investments are subject to market risks.", 36, 56, 8, muted);
  text("Prepared with SIP Calculator", 36, 33, 8, teal, true);
  text("1 / 1", 530, 33, 8, muted);

  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
};
const SIPCalculator = () => {
  const [investment, setInvestment] = useState(5000);
  const [duration, setDuration] = useState(15);
  const [returnRate, setReturnRate] = useState(12);
  const [activePreset, setActivePreset] = useState("Balanced");

  const monthlyRate = returnRate / 100 / 12;
  const months = duration * 12;
  const invested = investment * months;
  const futureValue = monthlyRate === 0
    ? invested
    : investment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const gains = Math.max(0, futureValue - invested);

  const chart = useMemo(() => {
    const points = Array.from({ length: duration + 1 }, (_, year) => {
      const n = year * 12;
      const total = n === 0 ? 0 : monthlyRate === 0 ? investment * n : investment * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
      return { year, total, principal: investment * n };
    });
    const max = Math.max(futureValue, 1);
    const x = (year) => 48 + (year / duration) * 500;
    const y = (value) => 206 - (value / max) * 176;
    const line = (key) => points.map((point, index) => `${index ? "L" : "M"}${x(point.year)},${y(point[key])}`).join(" ");
    return { points, totalPath: line("total"), principalPath: line("principal"), area: `${line("total")} L${x(duration)},206 L48,206 Z`, max, x, y };
  }, [duration, investment, monthlyRate, futureValue]);

  const presets = [
    { name: "Starter", amount: 2500, years: 10, rate: 10 },
    { name: "Balanced", amount: 5000, years: 15, rate: 12 },
    { name: "Ambitious", amount: 10000, years: 20, rate: 14 },
  ];
  const selectPreset = (preset) => {
    setInvestment(preset.amount); setDuration(preset.years); setReturnRate(preset.rate); setActivePreset(preset.name);
  };

  const downloadPlan = () => {
    const pdf = buildPlanPdf({ investment, duration, returnRate, invested, gains, futureValue, points: chart.points });
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sip-investment-plan-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="home"><span className="brand-mark">S.</span><span>SIP Calculator<span className="brand-dot"></span></span></a>
        <div className="topbar-note"><span className="live-dot" /> Your future, in focus</div>
        <button className="topbar-action" onClick={downloadPlan}>Export plan <span aria-hidden="true">↗</span></button>
      </header>

      <section className="intro" id="top">
        <div className="eyebrow"><span>PLAN WITH PURPOSE</span><i /></div>
        <h1>Small steps.<br /><em>Remarkable</em> futures.</h1>
        <p>See how a little consistency today can grow into something meaningful tomorrow.</p>
      </section>

      <section className="workspace" aria-label="SIP investment planner">
        <div className="controls-card">
          <div className="section-heading"><div><span className="step-label">YOUR PLAN</span><h2>Make it yours</h2></div><span className="sparkle" aria-hidden="true">✳</span></div>
          <div className="preset-row" role="group" aria-label="Choose a plan preset">
            {presets.map((preset) => <button key={preset.name} className={`preset ${activePreset === preset.name ? "selected" : ""}`} onClick={() => selectPreset(preset)}>{preset.name}</button>)}
          </div>
          <RangeSlider min={500} max={100000} step={500} value={investment} onChange={(value) => { setInvestment(value); setActivePreset(""); }} label="Monthly investment" symbol="/ month" prefix="₹" formatValue={formatCurrency} />
          <RangeSlider min={1} max={40} step={1} value={duration} onChange={(value) => { setDuration(value); setActivePreset(""); }} label="Investment period" symbol=" years" />
          <RangeSlider min={1} max={20} step={0.5} value={returnRate} onChange={(value) => { setReturnRate(value); setActivePreset(""); }} label="Expected annual return" symbol="%" />
          <div className="assumption"><span className="info-icon">i</span>Returns are illustrative and not guaranteed.</div>
        </div>

        <div className="results-card">
          <div className="result-top"><div><span className="step-label">YOUR ESTIMATED FUTURE VALUE</span><div className="total-value" aria-live="polite">{formatCurrency(futureValue)}</div></div><div className="result-badge"><span>↗</span> {returnRate}% assumed</div></div>
          <div className="chart-wrap">
            <div className="chart-labels"><span>{formatCurrency(chart.max, true)}</span><span>{formatCurrency(chart.max * 0.5, true)}</span><span>₹0</span></div>
            <svg className="growth-chart" viewBox="0 0 570 230" role="img" aria-label={`Investment growth projection over ${duration} years`} preserveAspectRatio="none">
              <defs><linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e7b62c" stopOpacity=".28"/><stop offset="100%" stopColor="#e7b62c" stopOpacity="0"/></linearGradient></defs>
              {[30, 118, 206].map((y) => <line key={y} x1="48" x2="548" y1={y} y2={y} className="grid-line" />)}
              <path d={chart.area} fill="url(#growthFill)" />
              <path d={chart.principalPath} className="principal-line" />
              <path d={chart.totalPath} className="total-line" />
              <circle cx="548" cy={chart.y(futureValue)} r="5" className="chart-point" />
              {[0, Math.round(duration / 2), duration].filter((v, i, a) => a.indexOf(v) === i).map((year) => <text key={year} x={chart.x(year)} y="226" textAnchor={year === 0 ? "start" : year === duration ? "end" : "middle"} className="axis-label">{year} yr</text>)}
            </svg>
          </div>
          <div className="chart-legend"><span><i className="legend-total" />Projected value</span><span><i className="legend-principal" />Amount invested</span></div>
          <div className="breakdown">
            <div className="breakdown-item"><span className="breakdown-icon invested-icon">↘</span><div><small>Total invested</small><strong>{formatCurrency(invested)}</strong></div></div>
            <div className="breakdown-divider" />
            <div className="breakdown-item"><span className="breakdown-icon gains-icon">✳</span><div><small>Estimated returns</small><strong>{formatCurrency(gains)}</strong></div></div>
          </div>
          <div className="growth-note"><span>✦</span><p>Your money could grow by <strong>{Math.round((gains / Math.max(invested, 1)) * 100)}%</strong> over {duration} years through the power of compounding.</p></div>
        </div>
      </section>
      <footer className="footer"><span>Made for the long view.</span><span>Illustrations only · Mutual fund investments are subject to market risks.</span></footer>
    </main>
  );
};

export default SIPCalculator;

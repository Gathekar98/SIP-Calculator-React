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
  const ink = "0.114 0.169 0.314";
  const teal = "0.255 0.412 0.847";
  const seaGlass = "0.922 0.463 0.373";
  const paleAqua = "0.957 0.812 0.408";
  const paper = "0.961 0.945 0.910";
  const muted = "0.349 0.392 0.478";
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
  text('Rate conversion: effective monthly = (1 + R)^(1/12) - 1; contributions are modeled at month start.', 36, 491, 8, muted);

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
  const [openFaq, setOpenFaq] = useState(0);

  const annualRate = returnRate / 100;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const months = duration * 12;
  const invested = investment * months;
  const futureValue = monthlyRate === 0
    ? invested
    : investment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const gains = Math.max(0, futureValue - invested);
  const returnMultiple = invested > 0 ? futureValue / invested : 0;

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
    const gainsPath = points.map((point, index) => `${index ? "L" : "M"}${x(point.year)},${y(Math.max(point.total - point.principal, 0))}`).join(" ");
    return { points, totalPath: line("total"), principalPath: line("principal"), gainsPath, area: `${line("total")} L${x(duration)},206 L48,206 Z`, max, x, y };
  }, [duration, investment, monthlyRate, futureValue]);

  const presets = [
    { name: "Getting started", amount: 2500, years: 10, rate: 10, note: "A smaller monthly habit" },
    { name: "Steady builder", amount: 5000, years: 15, rate: 12, note: "A longer time horizon" },
    { name: "Long view", amount: 10000, years: 20, rate: 14, note: "A sample higher-rate scenario" },
  ];
  const faqs = [
    {
      question: "What is a SIP, in simple terms?",
      answer: "A Systematic Investment Plan is a way to put a chosen amount into a mutual fund at regular intervals. It describes the investing schedule; the mutual fund is the investment that holds units and has its own objectives and risks.",
    },
    {
      question: "How does investing a fixed amount buy units?",
      answer: "Each contribution buys units at the scheme's applicable net asset value (NAV). When NAV is lower, the same rupee amount buys more units; when it is higher, it buys fewer. This is often called rupee cost averaging, but it does not assure a profit or prevent a loss.",
    },
    {
      question: "How does this calculator estimate the future value?",
      answer: "It assumes a fixed contribution every month and one constant effective annual return assumption. It converts that annual rate to an effective monthly rate, compounds each contribution, and assumes each monthly contribution is invested at the beginning of its modeled month. Real market returns vary from month to month, so the result is only an illustration.",
    },
    {
      question: "Why convert the annual return before using it monthly?",
      answer: "Dividing an annual rate by 12 treats it as a nominal rate. Here, the entered annual assumption is treated as an effective annual rate, so the equivalent monthly rate is (1 + annual rate) raised to 1/12, minus 1. Compounding that monthly rate for 12 months returns the same annual assumption.",
    },
    {
      question: "Are the projected returns guaranteed?",
      answer: "No. Mutual fund values move with their underlying investments and can rise or fall. A steady rate in a calculator is a simplifying assumption, not a forecast, promise, or substitute for checking a scheme's documents and risk level.",
    },
    {
      question: "What is not included in this estimate?",
      answer: "It does not model changing returns, missed or changed instalments, taxes, scheme expenses, exit loads, or differences in transaction dates. Those details can affect an actual investment value.",
    },
  ];

  const selectPreset = (preset) => {
    setInvestment(preset.amount);
    setDuration(preset.years);
    setReturnRate(preset.rate);
    setActivePreset(preset.name);
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
    <main className="dashboard" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SIP Calculator home"><span className="brand-mark">S</span><span>SIP <strong>Calculator</strong></span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#calculator">Calculator</a>
          <a href="#calculation">How it works</a>
          <a href="#sip-guide">Insights</a>
        </nav>
        <button className="topbar-action" onClick={downloadPlan}><span className="download-icon" aria-hidden="true">↓</span> Download plan</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><i /> SYSTEMATIC INVESTMENT PLAN</div>
          <h1>SIP<br /><em>Calculator.</em></h1>
          <p>Plan monthly investing. Understand the estimate. Explore how contributions, time and an assumed return shape an illustrative result.</p>
          <a className="hero-cta" href="#calculator">Open the calculator <span aria-hidden="true">↓</span></a>
          <div className="hero-footnote"><span className="mini-spark">✳</span> A learning tool for thoughtful planning</div>
        </div>
        <div className="hero-visual" aria-label="Illustration of regular contributions building over time">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-caption"><span>CONSISTENCY</span><span className="caption-arrow">↗</span><span>TIME</span></div>
          <div className="visual-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="visual-growth"><span>Small, regular contributions</span><strong>add up over time.</strong></div>
          <div className="visual-coin coin-one">₹</div><div className="visual-coin coin-two">₹</div>
          <div className="visual-leaf">✳</div>
        </div>
      </section>

      <section className="calculator-section" id="calculator">
        <div className="section-kicker"><span>01</span> SIP CALCULATOR</div>
        <div className="section-title-row calculator-title"><div><h2>Build a clearer monthly plan.</h2><p>Adjust your contribution, return assumption and investment period to explore an illustration.</p></div><span className="live-pill"><i /> LIVE ESTIMATE</span></div>
        <div className="calculator-banner">
          <div className="calculator-banner-copy"><span>YOUR FUTURE, IN FOCUS</span><h3>Turn small, regular investments<br />into a <em>bigger tomorrow.</em></h3><p>See how your monthly contributions could grow over time.</p></div>
          <div className="banner-growth" aria-hidden="true"><i/><i/><i/><i/><b>↗</b><span>✦</span></div>
        </div>
        <div className="workspace" aria-label="SIP investment planner">
          <div className="controls-card">
            <div className="section-heading"><div><span className="step-label">START WITH A SCENARIO</span><h3>Shape your plan</h3></div><span className="sparkle" aria-hidden="true">✳</span></div>
            <div className="preset-row" role="group" aria-label="Choose an example scenario">
              {presets.map((preset) => <button key={preset.name} className={`preset ${activePreset === preset.name ? "selected" : ""}`} onClick={() => selectPreset(preset)} aria-pressed={activePreset === preset.name}><span>{preset.name}</span><small>{preset.note}</small></button>)}
            </div>
            <RangeSlider min={500} max={100000} step={500} value={investment} onChange={(value) => { setInvestment(value); setActivePreset(""); }} label="Monthly investment" symbol="/ month" prefix="₹" />
            <RangeSlider min={1} max={20} step={0.5} value={returnRate} onChange={(value) => { setReturnRate(value); setActivePreset(""); }} label="Assumed annual return" symbol="%" />
            <RangeSlider min={1} max={40} step={1} value={duration} onChange={(value) => { setDuration(value); setActivePreset(""); }} label="Investment period" symbol=" years" />
            <div className="assumption"><span className="info-icon">i</span>Change any value; the presets are only examples.</div>
          </div>

          <div className="results-card">
            <div className="result-top summary-headline">
              <div className="corpus-stat"><small>Estimated corpus</small><strong aria-live="polite">{formatCurrency(futureValue)}</strong></div>
              <div className="invested-stat"><small>Total invested</small><strong>{formatCurrency(invested)}</strong></div>
            </div>
            <div className="chart-wrap">
              <div className="chart-labels"><span>{formatCurrency(chart.max, true)}</span><span>{formatCurrency(chart.max * 0.5, true)}</span><span>₹0</span></div>
              <svg className="growth-chart" viewBox="0 0 570 230" role="img" aria-label={`Illustrative investment growth over ${duration} years`} preserveAspectRatio="none">
                <defs><linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4169d8" stopOpacity=".16"/><stop offset="100%" stopColor="#4169d8" stopOpacity="0"/></linearGradient></defs>
                {[30, 118, 206].map((y) => <line key={y} x1="48" x2="548" y1={y} y2={y} className="grid-line" />)}
                <path d={chart.area} fill="url(#growthFill)" />
                <path d={chart.principalPath} className="principal-line" />
                <path d={chart.gainsPath} className="gains-line" />
                <path d={chart.totalPath} className="total-line" />
                <circle cx="548" cy={chart.y(futureValue)} r="5" className="chart-point" />
                {[0, Math.round(duration / 2), duration].filter((v, i, a) => a.indexOf(v) === i).map((year) => <text key={year} x={chart.x(year)} y="226" textAnchor={year === 0 ? "start" : year === duration ? "end" : "middle"} className="axis-label">{year} yr</text>)}
              </svg>
            </div>
            <div className="chart-legend"><span><i className="legend-total" />Total value</span><span><i className="legend-principal" />Total invested</span><span><i className="legend-gains" />Estimated returns</span></div>
            <div className="growth-note"><span>✦</span><p><strong>{formatCurrency(gains)}</strong> estimated growth · about <strong>{returnMultiple.toFixed(1)}×</strong> your contributions at a <strong>{returnRate}%</strong> annual assumption. Actual returns change with the market.</p></div>
            <div className="result-footnote">For illustration only · Taxes and scheme expenses are not included.</div>
          </div>
        </div>
      </section>

      <section className="basics-section" id="sip-basics">
        <div className="section-kicker"><span>02</span> SIP BASICS</div>
        <div className="section-title-row basics-heading"><div><h2>A SIP is a rhythm,<br /><em>not a return promise.</em></h2><p>It’s a way to invest regularly in a mutual fund. Here’s what happens between your contribution and the estimate on screen.</p></div><div className="basics-stamp"><span>LEARN</span><strong>by doing</strong><i>↘</i></div></div>
        <div className="basics-grid">
          <article className="info-card"><span className="info-number">01</span><div className="info-icon-large">◷</div><h3>Choose a cadence</h3><p>Set an amount and a regular schedule. In this calculator, we model one contribution every month.</p><span className="card-tag">REGULAR CONTRIBUTIONS</span></article>
          <article className="info-card featured-info"><span className="info-number">02</span><div className="info-icon-large">◉</div><h3>Receive fund units</h3><p>Each instalment buys mutual fund units at the applicable NAV. The number of units can differ each time.</p><span className="card-tag">UNITS VARY WITH NAV</span></article>
          <article className="info-card"><span className="info-number">03</span><div className="info-icon-large">↗</div><h3>Stay aware of risk</h3><p>Regular investing can build discipline. It cannot remove market risk or make returns certain.</p><span className="card-tag">NO GUARANTEE OF PROFIT</span></article>
        </div>
        <div className="nav-note"><span>NAV in a nutshell</span><p>Net asset value is the per-unit value of a mutual fund scheme. A fixed rupee contribution buys more units at a lower NAV and fewer at a higher NAV. This averaging effect does not protect against loss.</p><a href="https://www.amfiindia.com/investor/become-mf-distributor?zoneName=sip" target="_blank" rel="noreferrer">Read AMFI’s SIP explainer <span aria-hidden="true">↗</span></a></div>
      </section>

      <section className="guide-section" id="sip-guide">
        <div className="section-kicker"><span>03</span> A PRACTICAL SIP GUIDE</div>
        <div className="guide-heading"><div><h2>A SIP is the schedule.<br /><em>The fund is the investment.</em></h2><p>Systematic Investment Plan (SIP) describes a way of investing a set amount at regular intervals. The mutual fund is the investment that receives each instalment and allocates it according to its stated objective. A SIP is different from a mutual fund itself and from a lump-sum investment, where money is invested all at once. Funds may offer different schedules; this calculator models monthly instalments.</p></div><div className="guide-index"><span>THE IDEA</span><strong>Regularity<br />over timing</strong><i>01 / 03</i></div></div>
        <div className="guide-grid">
          <article className="guide-card"><span className="guide-card-label">01 · WHAT GOES IN</span><h3>Your contribution</h3><p>Choose an amount and a cadence that suits your plan. This calculator models monthly instalments and totals the amount contributed over your chosen period.</p><div className="guide-math">Monthly amount × months invested</div></article>
          <article className="guide-card guide-card-accent"><span className="guide-card-label">02 · WHAT HAPPENS</span><h3>Units are purchased</h3><p>Each instalment buys units at the scheme’s applicable net asset value (NAV). A fixed amount buys more units when NAV is lower and fewer when it is higher. This averaging effect cannot prevent a loss.</p><div className="guide-math">Contribution ÷ applicable NAV = units</div></article>
          <article className="guide-card"><span className="guide-card-label">03 · WHAT COMES OUT</span><h3>An estimate to explore</h3><p>The calculator projects a possible future value from your monthly contribution, duration and assumed annual return. It also separates your contributions from the modelled growth. It holds the assumed rate constant and excludes taxes, scheme expenses, exit loads and transaction-date differences.</p><div className="guide-math">Estimate ≠ promised outcome</div></article>
        </div>
        <div className="guide-callout"><span className="guide-callout-mark">↗</span><div><strong>How can the estimate help?</strong><p>Try different amounts, time periods and return assumptions to see how each input changes the illustration. Use it to understand the math and compare scenarios; actual mutual fund values move with the market and can be lower or higher.</p></div></div>
      </section>
      <section className="formula-section" id="calculation">
        <div className="formula-copy"><div className="section-kicker"><span>04</span> HOW THE ESTIMATE WORKS</div><h2>Every instalment<br />gets its own <em>time.</em></h2><p>A SIP return calculator turns your monthly contribution, investment duration and assumed return into an illustrative maturity value. Earlier contributions have more months to compound, so the model adds each instalment’s estimated value.</p><div className="formula-display"><span>Monthly rate</span><strong>(1 + R)<sup>1/12</sup> − 1</strong><small>R is the annual return assumption, written as a decimal.</small></div><div className="formula-note"><span>ⓘ</span><p>We treat the entered annual rate as an effective annual rate. Contributions are modeled at the beginning of each month, so each gets one extra month in the estimate.</p></div></div>
        <div className="formula-visual"><div className="formula-visual-head"><span>ONE CONTRIBUTION</span><span className="formula-arrow">→</span><span>TIME TO GROW</span></div><div className="timeline"><i /><i /><i /><i /><i /><b>✳</b></div><div className="timeline-labels"><span>Monthly deposit</span><span>Compounding periods</span></div><div className="mini-formula"><span>FV</span><strong>= P × [((1 + i)<sup>n</sup> − 1) / i] × (1 + i)</strong></div><p className="formula-key">P = monthly contribution&nbsp; · &nbsp;i = effective monthly rate&nbsp; · &nbsp;n = number of months</p><div className="formula-example"><span>For example</span><p>For example, ₹1,000 invested at the beginning of each month for 12 months, using a 12% effective annual assumption, gives an illustrative value of about ₹12,766. That includes ₹12,000 contributed and about ₹766 in modelled growth. The effective monthly rate is <strong>{((Math.pow(1.12, 1 / 12) - 1) * 100).toFixed(2)}%</strong> — not simply 1% by dividing 12 by 12.</p></div></div>
      </section>

      <section className="faq-section" id="faqs">
        <div className="section-kicker"><span>05</span> GOOD QUESTIONS</div>
        <div className="section-title-row faq-heading"><div><h2>Before you make a plan.</h2><p>Clear up the assumptions, then use the calculator with context.</p></div><span className="faq-doodle" aria-hidden="true">?</span></div>
        <div className="faq-layout"><div className="faq-list">
          {faqs.map((faq, index) => <article className={`faq-item ${openFaq === index ? "open" : ""}`} key={faq.question}><h3><button aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{faq.question}</span><i aria-hidden="true">{openFaq === index ? "−" : "+"}</i></button></h3>{openFaq === index && <div className="faq-answer" id={`faq-answer-${index}`}>{faq.answer}</div>}</article>)}
        </div><aside className="risk-card"><span className="risk-icon">!</span><span className="step-label">A NOTE ON RISK</span><h3>Markets don’t move in a straight line.</h3><p>The projected line uses one steady rate to make the math understandable. Real mutual fund values fluctuate, and you may receive less than you invested.</p><a href="https://investor.sebi.gov.in/" target="_blank" rel="noreferrer">Explore SEBI investor education <span aria-hidden="true">↗</span></a></aside></div>
      </section>

      <section className="sources-section" aria-labelledby="sources-title"><div><span className="section-kicker" id="sources-title"><span>06</span> FURTHER READING</span><h2>Keep learning, at your pace.</h2></div><div className="source-links"><a href="https://www.amfiindia.com/investor/become-mf-distributor?zoneName=sip" target="_blank" rel="noreferrer"><span>AMFI</span><strong>Understanding SIPs</strong><i>↗</i></a><a href="https://investor.sebi.gov.in/" target="_blank" rel="noreferrer"><span>SEBI INVESTOR</span><strong>Mutual fund basics & risk</strong><i>↗</i></a><a href="https://groww.in/calculators/sip-calculator" target="_blank" rel="noreferrer"><span>REFERENCE</span><strong>Groww SIP calculator</strong><i>↗</i></a></div></section>

      <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark">S</span><span>SIP <strong>Calculator</strong></span></a><span>Educational estimates only · Mutual fund investments are subject to market risks.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  );
};

export default SIPCalculator;

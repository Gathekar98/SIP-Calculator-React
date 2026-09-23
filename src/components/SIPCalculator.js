import React, { useMemo, useState } from "react";
import RangeSlider from "./RangeSlider";

const formatCurrency = (amount, compact = false) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);

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

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="home"><span className="brand-mark">S.</span><span>SIP Calculator<span className="brand-dot"></span></span></a>
        <div className="topbar-note"><span className="live-dot" /> Your future, in focus</div>
        <button className="topbar-action" onClick={() => window.print()}>Export plan <span aria-hidden="true">↗</span></button>
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

import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const RangeSlider = ({ min, max, step, value, onChange, label, symbol, prefix }) => (
  <div className="range-slider">
    <div className="slider-heading">
      <label>{label}</label>
      <div className="value-field">
        {prefix && <span>{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
          }}
        />
        {symbol && <span>{symbol}</span>}
      </div>
    </div>
    <Slider min={min} max={max} step={step} value={value} onChange={onChange} ariaLabelForHandle={label} />
    <div className="slider-range">
      <span>{prefix ? `${prefix}${min.toLocaleString("en-IN")}` : `${min}${symbol || ""}`}</span>
      <span>{prefix ? `${prefix}${max.toLocaleString("en-IN")}` : `${max}${symbol || ""}`}</span>
    </div>
  </div>
);

export default RangeSlider;

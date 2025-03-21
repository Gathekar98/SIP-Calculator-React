import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const RangeSlider = ({ min, max, step, value, onChange, label, symbol }) => {
  return (
    <div className="range-slider">
      <label>
        {label}: {value}
        {symbol}
      </label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default RangeSlider;

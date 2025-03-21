import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const RangeSlider = ({ min, max, step, value, onChange, label, symbols }) => {
  return (
    <div className="range-slider">
      <label>
        {label}: {value}
        {symbols}
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

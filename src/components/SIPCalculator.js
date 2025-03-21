import React, { useState } from "react";
import RangeSlider from "./RangeSlider";

const SIPCalculator = () => {
  // State for investment, duration, and expected return rate
  const [investment, setInvestment] = useState(5000); // Monthly Investment
  const [duration, setDuration] = useState(10); // Years
  const [returnRate, setReturnRate] = useState(12); // Annual Return Rate in %

  // Function to calculate the future value of SIP
  const calculateSIP = () => {
    const monthlyRate = returnRate / 100 / 12;
    const months = duration * 12;
    const futureValue =
      investment *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
    return futureValue.toFixed(2);
  };

  return (
    <div>
      <h2>SIP Calculator</h2>
      <hr />

      <RangeSlider
        min={500}
        max={50000}
        step={100}
        value={investment}
        onChange={setInvestment}
        label="Monthly Investment"
        symbol="Rs."
      />

      <RangeSlider
        min={1}
        max={30}
        step={1}
        value={duration}
        onChange={setDuration}
        label="Duration (Years)"
        symbol="yrs"
      />

      <RangeSlider
        min={1}
        max={20}
        step={0.5}
        value={returnRate}
        onChange={setReturnRate}
        label="Expected Return Rate"
        symbol="%"
      />

      <h3>Estimated Future Value: ₹{calculateSIP()}</h3>
    </div>
  );
};

export default SIPCalculator;
z;

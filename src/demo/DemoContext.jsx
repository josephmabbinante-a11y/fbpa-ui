// src/demo/DemoContext.jsx
import { createContext, useContext, useState } from 'react';

const DemoContext = createContext();

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(() => {
    try {
      return localStorage.getItem('demoMode') === 'true';
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(0);

  const enableDemo = () => {
    setDemoMode(true);
    localStorage.setItem('demoMode', 'true');
    setStep(1);
  };
  const disableDemo = () => {
    setDemoMode(false);
    localStorage.setItem('demoMode', 'false');
    setStep(0);
  };
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <DemoContext.Provider value={{ demoMode, enableDemo, disableDemo, step, setStep, nextStep, prevStep }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}

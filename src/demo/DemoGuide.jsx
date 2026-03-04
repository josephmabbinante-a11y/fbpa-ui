// src/demo/DemoGuide.jsx
import { useDemo } from './DemoContext';
import { demoSteps } from './DemoSteps';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function DemoGuide() {
  const { demoMode, step, nextStep, prevStep, disableDemo } = useDemo();
  const { theme } = useTheme();
  const t = theme;
  t.surface = t.surface || '#fff';
  t.text = t.text || '#111827';
  t.accent = t.accent || '#1D4ED8';

  if (!demoMode || !demoSteps[step]) return null;
  const { title, description } = demoSteps[step];

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 2000,
      background: t.surface,
      color: t.text,
      border: `2px solid ${t.accent}`,
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      padding: 24,
      minWidth: 320,
      maxWidth: 400,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 15, marginBottom: 8 }}>{description}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {step > 0 && <button onClick={prevStep} style={btnStyle(t)}>Back</button>}
        {step < demoSteps.length - 1 && <button onClick={nextStep} style={btnStyle(t)}>Next</button>}
        {step === demoSteps.length - 1 && <button onClick={disableDemo} style={btnStyle(t, true)}>Finish</button>}
      </div>
    </div>
  );
}

function btnStyle(t, accent) {
  return {
    padding: '6px 16px',
    background: accent ? t.accent : t.bgAlt,
    color: accent ? '#fff' : t.text,
    border: `1px solid ${accent ? t.accent : t.border}`,
    borderRadius: 4,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
  };
}

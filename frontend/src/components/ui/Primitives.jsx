import './primitives.css';

export function PageHeader({ title, description, right, loading }) {
  return (
    <div className="ui-header">
      <div>
        <h1 className="ui-title">{title}</h1>
        {description ? <div className="ui-subtitle">{description}</div> : null}
      </div>
      <div className="ui-row">
        {right}
        {loading ? <span className="ui-subtitle">Loading...</span> : null}
      </div>
    </div>
  );
}

export function InlineAlert({ children }) {
  return <div className="ui-alert">{children}</div>;
}

export function InputField({ label, children }) {
  return (
    <div>
      {label ? <label className="ui-label">{label}</label> : null}
      {children}
    </div>
  );
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button className="ui-button neon-outline" {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ children, ...props }) {
  return (
    <button className="ui-link-button" {...props}>
      {children}
    </button>
  );
}

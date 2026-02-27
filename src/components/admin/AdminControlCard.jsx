import React from 'react';

function IconShell({ children }) {
  return (
    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
      {children}
    </div>
  );
}

function Icon({ type }) {
  if (type === 'company') {
    return (
      <IconShell>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20h16" />
          <path d="M6 20V7l6-3 6 3v13" />
          <path d="M10 10h.01M14 10h.01M10 14h.01M14 14h.01" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'users') {
    return (
      <IconShell>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'freight') {
    return (
      <IconShell>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="6" width="15" height="11" rx="2" />
          <path d="M16 9h4l3 3v5h-7z" />
          <circle cx="5.5" cy="18.5" r="1.5" />
          <circle cx="18.5" cy="18.5" r="1.5" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'audit') {
    return (
      <IconShell>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'documents') {
    return (
      <IconShell>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v5h5" />
          <path d="M10 13h6M10 17h6" />
        </svg>
      </IconShell>
    );
  }

  return (
    <IconShell>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 11h8M8 15h5" />
      </svg>
    </IconShell>
  );
}

export default function AdminControlCard({ icon, title, description, actions }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <Icon type={icon} />
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="space-y-1">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm text-blue-600 transition-colors duration-150 hover:bg-gray-50"
            >
              <span>{action}</span>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

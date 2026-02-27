import React, { useEffect, useMemo, useState } from 'react';
import AdminControlCard from '../components/admin/AdminControlCard';
import { useTheme, themes } from '../contexts/ThemeContext';

const adminSections = [
  {
    icon: 'company',
    title: 'Company & Organization',
    description: 'Manage company profile, branding, and operational defaults.',
    actions: [
      'Edit Company Info',
      'Upload Logo',
      'Currency & Units Settings',
      'Default Margin Targets',
      'Routing Defaults',
      'Notification Settings',
    ],
  },
  {
    icon: 'users',
    title: 'User & Permissions',
    description: 'Manage users, roles, and department access control.',
    actions: [
      'Add/Edit Users',
      'Manage Roles',
      'Permission Groups',
      'Commission Overrides',
      'Branch Management',
    ],
  },
  {
    icon: 'freight',
    title: 'Load & Freight Configuration',
    description: 'Control load workflows and operational behaviors.',
    actions: [
      'Load Numbering Rules',
      'Manifest Settings',
      'Default Equipment Types',
      'Workflow Automation Rules',
      'Rate Logic Configuration',
    ],
  },
  {
    icon: 'audit',
    title: 'Audit & Financial Controls',
    description: 'Configure audit rules and financial safeguards.',
    actions: [
      'Accessorial Validation Rules',
      'Carrier Overcharge Thresholds',
      'Invoice Audit Settings',
      'Profit Margin Alerts',
      'Payment Terms Settings',
    ],
  },
  {
    icon: 'documents',
    title: 'Documents & Reporting',
    description: 'Customize document templates and reporting output.',
    actions: [
      'Carrier Confirmations',
      'Invoice Templates',
      'Bill of Lading Defaults',
      'Font & Branding Settings',
      'Reporting Configuration',
    ],
  },
  {
    icon: 'billing',
    title: 'Billing & Subscription',
    description: 'Manage subscription plan and feature access.',
    actions: [
      'View Current Plan',
      'Upgrade Plan',
      'Payment Methods',
      'Usage Limits',
      'Feature Access Controls',
    ],
  },
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  // Always use the real hook, not a fallback
  const { demoMode, enableDemo, disableDemo } = useDemo();
  const t = themes[theme];

  const [activeSectionTitle, setActiveSectionTitle] = useState(adminSections[0].title);
  const activeSection = useMemo(
    () => adminSections.find((section) => section.title === activeSectionTitle) ?? adminSections[0],
    [activeSectionTitle],
  );
  const [activeAction, setActiveAction] = useState(adminSections[0].actions[0]);

  useEffect(() => {
    setActiveAction(activeSection.actions[0]);
  }, [activeSection]);

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 8 }}>
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          style={{
            borderRadius: 8,
            border: `1.5px solid ${theme === 'dark' ? t.accent : t.border}`,
            background: theme === 'dark' ? t.bgAlt : t.surface,
            color: theme === 'dark' ? t.text : t.text,
            fontSize: 14,
            fontWeight: 700,
            padding: '7px 18px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          aria-label="Toggle light/dark theme"
        >
          {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
        {/* Mock data mode toggle button */}
        <button
          onClick={demoMode ? disableDemo : enableDemo}
          style={{
            borderRadius: 8,
            border: `1.5px solid ${demoMode ? t.accent : t.border}`,
            background: demoMode ? t.accent : t.surface,
            color: demoMode ? t.text : t.textSecondary,
            fontSize: 14,
            fontWeight: 700,
            padding: '7px 18px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          aria-label="Toggle mock data mode"
        >
          {demoMode ? '🟢 Mock Data Mode: ON' : '⚪ Mock Data Mode: OFF'}
        </button>
      </div>
      <div
        style={{
          background:
            theme === 'light'
              ? 'linear-gradient(145deg, rgba(239, 247, 255, 0.96), rgba(227, 239, 255, 0.95))'
              : 'linear-gradient(155deg, rgba(16, 30, 58, 0.94), rgba(9, 19, 38, 0.94))',
          padding: '18px 20px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15, letterSpacing: 0.2 }}>Admin Control Center</h1>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: t.textSecondary }}>
          Select a control area, then choose an action to configure settings with a clear active context.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <section
          style={{
            flex: '2 1 720px',
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          {adminSections.map((section) => (
            <AdminControlCard
              key={section.title}
              icon={section.icon}
              title={section.title}
              description={section.description}
              actions={section.actions}
              isActive={section.title === activeSection.title}
              onSelect={() => setActiveSectionTitle(section.title)}
            />
          ))}
        </section>

        <aside
          style={{
            flex: '1 1 320px',
            minWidth: 300,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            background:
              theme === 'light'
                ? 'linear-gradient(170deg, rgba(247, 251, 255, 0.95), rgba(236, 245, 255, 0.95))'
                : 'linear-gradient(170deg, rgba(19, 35, 71, 0.88), rgba(13, 25, 51, 0.9))',
            padding: 16,
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 999,
              border: `1px solid ${t.border}`,
              color: t.textSecondary,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.4,
              padding: '3px 9px',
            }}
          >
            ACTIVE SECTION
          </div>

          <h2 style={{ margin: '10px 0 6px', fontSize: 19, lineHeight: 1.25 }}>{activeSection.title}</h2>
          <p style={{ margin: 0, color: t.textSecondary, fontSize: 13, lineHeight: 1.45 }}>{activeSection.description}</p>

          <div style={{ marginTop: 14, borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
            <div style={{ marginBottom: 8, color: t.textSecondary, fontSize: 12, fontWeight: 700 }}>ACTIONS</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {activeSection.actions.map((action) => {
                const isActionActive = action === activeAction;
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setActiveAction(action)}
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${isActionActive ? t.accent : t.border}`,
                      background: isActionActive
                        ? theme === 'light'
                          ? 'rgba(10, 124, 255, 0.12)'
                          : 'rgba(24, 210, 255, 0.15)'
                        : 'transparent',
                      color: isActionActive ? t.text : t.textSecondary,
                      textAlign: 'left',
                      padding: '9px 10px',
                      fontSize: 13,
                      fontWeight: isActionActive ? 700 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {action}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Implementation area for selected action */}
          <div
            style={{
              marginTop: 14,
              borderRadius: 10,
              border: `1.5px dashed ${t.accent}`,
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(6, 14, 28, 0.55)',
              padding: 16,
              minHeight: 80,
            }}
          >
            <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 700, marginBottom: 4 }}>SELECTED ACTION</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>{activeAction}</div>
            {/* Placeholder for future implementation: route to correct admin form/component here */}
            <div style={{ fontSize: 13, color: t.textSecondary }}>
              {(() => {
                switch (activeAction) {
                  case 'Edit Company Info':
                    return 'Edit company information form goes here.';
                  case 'Upload Logo':
                    return 'Logo upload component goes here.';
                  case 'Currency & Units Settings':
                    return 'Currency and units settings form goes here.';
                  case 'Default Margin Targets':
                    return 'Default margin targets configuration goes here.';
                  case 'Routing Defaults':
                    return 'Routing defaults configuration goes here.';
                  case 'Notification Settings':
                    return 'Notification settings configuration goes here.';
                  case 'Add/Edit Users':
                    return 'User management form goes here.';
                  case 'Manage Roles':
                    return 'Role management form goes here.';
                  case 'Permission Groups':
                    return 'Permission groups configuration goes here.';
                  case 'Commission Overrides':
                    return 'Commission overrides configuration goes here.';
                  case 'Branch Management':
                    return 'Branch management form goes here.';
                  case 'Load Numbering Rules':
                    return 'Load numbering rules configuration goes here.';
                  case 'Manifest Settings':
                    return 'Manifest settings configuration goes here.';
                  case 'Default Equipment Types':
                    return 'Default equipment types configuration goes here.';
                  case 'Workflow Automation Rules':
                    return 'Workflow automation rules configuration goes here.';
                  case 'Rate Logic Configuration':
                    return 'Rate logic configuration form goes here.';
                  case 'Accessorial Validation Rules':
                    return 'Accessorial validation rules configuration goes here.';
                  case 'Carrier Overcharge Thresholds':
                    return 'Carrier overcharge thresholds configuration goes here.';
                  case 'Invoice Audit Settings':
                    return 'Invoice audit settings form goes here.';
                  case 'Profit Margin Alerts':
                    return 'Profit margin alerts configuration goes here.';
                  case 'Payment Terms Settings':
                    return 'Payment terms settings configuration goes here.';
                  case 'Carrier Confirmations':
                    return 'Carrier confirmations template configuration goes here.';
                  case 'Invoice Templates':
                    return 'Invoice templates configuration goes here.';
                  case 'Bill of Lading Defaults':
                    return 'Bill of Lading defaults configuration goes here.';
                  case 'Font & Branding Settings':
                    return 'Font and branding settings configuration goes here.';
                  case 'Reporting Configuration':
                    return 'Reporting configuration form goes here.';
                  case 'View Current Plan':
                    return 'Current subscription plan details go here.';
                  case 'Upgrade Plan':
                    return 'Upgrade plan options go here.';
                  case 'Payment Methods':
                    return 'Payment methods management goes here.';
                  case 'Usage Limits':
                    return 'Usage limits configuration goes here.';
                  case 'Feature Access Controls':
                    return 'Feature access controls configuration goes here.';
                  default:
                    return 'Select an action to begin configuration.';
                }
              })()}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

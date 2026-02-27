import React from 'react';
import AdminControlCard from '../components/admin/AdminControlCard';

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
  return (
    <div className="w-full rounded-2xl bg-gray-50">
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Control Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system configuration, users, workflows, and operational settings.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => (
            <AdminControlCard
              key={section.title}
              icon={section.icon}
              title={section.title}
              description={section.description}
              actions={section.actions}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

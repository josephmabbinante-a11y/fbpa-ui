// src/demo/DemoStepsLocal.js
export const demoStepsLocal = {
  uploads: [
    {
      selector: '#upload-invoice-form',
      title: 'Upload Invoice File',
      description: 'Select a CSV, XLSX, or XLS file and click Upload to add invoices. Download the template if needed.'
    },
    {
      selector: '#rate-confirmation-upload',
      title: 'Rate Confirmation Upload',
      description: 'Upload rate confirmation images (PDF, JPG, PNG) here. Click Upload after selecting a file.'
    },
    {
      selector: '#upload-history',
      title: 'Upload History',
      description: 'Review the status of all uploads, including errors and successes.'
    }
  ],
  customers: [
    {
      selector: '#create-customer-btn',
      title: 'Create Customer',
      description: 'Click here to open the form for adding a new customer.'
    },
    {
      selector: '#csv-upload-form',
      title: 'Bulk Upload Customers',
      description: 'Use this form to upload a CSV file and add multiple customers at once.'
    },
    {
      selector: '#customer-list',
      title: 'Customer List',
      description: 'Select a customer to view their details, analysis, and statistics.'
    },
    {
      selector: '#customer-analysis',
      title: 'Customer Analysis',
      description: 'View detailed billing, audit, and payment statistics, with interactive charts.'
    }
  ]
};

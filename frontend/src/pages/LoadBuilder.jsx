// Load Details Section
function LoadDetailsSection({ load, setLoad, onComplete }) {
  const [details, setDetails] = useState({
    equipment: load.details?.equipment || 'Van',
    serviceLevel: load.details?.serviceLevel || '',
    commodity: load.details?.commodity || '',
    poNumber: load.details?.poNumber || '',
    refNumber: load.details?.refNumber || '',
  });

  const handleInput = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
    setLoad(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [e.target.name]: e.target.value
      }
    }));
  };

  return (
    <div>
      <h3>Load Details</h3>
      <label>
        Equipment Type:
        <select name="equipment" value={details.equipment} onChange={handleInput} style={{ marginLeft: 8 }}>
          <option value="Van">Van</option>
          <option value="Reefer">Reefer</option>
          <option value="Flatbed">Flatbed</option>
        </select>
      </label>
      <label style={{ marginLeft: 8 }}>
        Service Level:
        <input name="serviceLevel" value={details.serviceLevel} onChange={handleInput} />
      </label>
      <label style={{ marginLeft: 8 }}>
        Commodity:
        <input name="commodity" value={details.commodity} onChange={handleInput} />
      </label>
      <label style={{ marginLeft: 8 }}>
        PO Number:
        <input name="poNumber" value={details.poNumber} onChange={handleInput} />
      </label>
      <label style={{ marginLeft: 8 }}>
        Ref Number:
        <input name="refNumber" value={details.refNumber} onChange={handleInput} />
      </label>
      <button style={{ marginTop: 12 }} onClick={onComplete}>Mark Load Details Complete</button>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import LoadHeader from '../../components/StickyLoadHeader';
import AccordionSection from '../../components/CollapsibleSection';
import CustomerSection from '../../components/CustomerSection';
import StopsSection from '../../components/StopsSection';
import LaneIntelligencePanel from '../../components/LaneIntelligencePanel';
import CarrierSection from '../../components/CarrierSection';
import FinancialSection from '../../components/FinancialSection';
// TODO: Implement DocsSection and ActivitySection as real components
const DocsSection = ({ load, setLoad }) => <div>Documents & Dispatch section coming soon.</div>;
const ActivitySection = ({ load, setLoad }) => <div>Activity Log section coming soon.</div>;

const initialLoad = {
  id: null,
  status: 'DRAFT',
  customer: {},
  stops: [],
  lane: {},
  carrier: {},
  financials: { sellRate: 0, buyRate: 0, margin: 0 },
  documents: [],
  activity: []
};

export default function LoadBuilder() {
  const [load, setLoad] = useState(initialLoad);
  const [openSection, setOpenSection] = useState('customer');

  // Real-time margin calculation
  useEffect(() => {
    const margin = (load.financials.sellRate || 0) - (load.financials.buyRate || 0);
    if (load.financials.margin !== margin) {
      setLoad(prev => ({
        ...prev,
        financials: { ...prev.financials, margin }
      }));
    }
  }, [load.financials.sellRate, load.financials.buyRate]);

  // TODO: Add useEffect for miles (from stops) and risk logic

  return (
    <div style={{ width: '100%' }}>
      <LoadHeader {...{
        loadNumber: load.id || 'NEW',
        status: load.status,
        customer: load.customer?.name || '',
        totalMiles: load.lane?.miles || 0,
        sellRate: load.financials.sellRate,
        buyRate: load.financials.buyRate,
        grossMargin: load.financials.margin,
        marginPct: load.financials.sellRate ? ((load.financials.margin / load.financials.sellRate) * 100).toFixed(2) : '0',
        risk: 'TODO' // Placeholder
      }} />
      <AccordionSection title="Load Details" complete={!!load.details?.equipment} defaultOpen={openSection === 'details'}>
        <LoadDetailsSection load={load} setLoad={setLoad} onComplete={() => setOpenSection('customer')} />
      </AccordionSection>
      <AccordionSection title="Customer" complete={!!load.customer?.id} defaultOpen={openSection === 'customer'}>
        <CustomerSection load={load} setLoad={setLoad} onComplete={() => setOpenSection('stops')} />
      </AccordionSection>
      <AccordionSection title="Stops" complete={load.stops.length > 0} defaultOpen={openSection === 'stops'}>
        <StopsSection load={load} setLoad={setLoad} onComplete={() => setOpenSection('lane')} />
      </AccordionSection>
      <AccordionSection title="Lane Intelligence" complete={!!load.lane?.miles} defaultOpen={openSection === 'lane'}>
        <LaneIntelligencePanel load={load} setLoad={setLoad} onComplete={() => setOpenSection('carrier')} />
      </AccordionSection>
      <AccordionSection title="Carrier" complete={!!load.carrier?.id} defaultOpen={openSection === 'carrier'}>
        <CarrierSection load={load} setLoad={setLoad} onComplete={() => setOpenSection('financials')} />
      </AccordionSection>
      <AccordionSection title="Financials" complete={!!load.financials?.sellRate && !!load.financials?.buyRate} defaultOpen={openSection === 'financials'}>
        <FinancialSection load={load} setLoad={setLoad} onComplete={() => setOpenSection('documents')} />
      </AccordionSection>
      <AccordionSection title="Documents & Dispatch" complete={false} defaultOpen={openSection === 'documents'}>
        <DocsSection load={load} setLoad={setLoad} />
      </AccordionSection>
      <AccordionSection title="Activity Log" complete={false} defaultOpen={openSection === 'activity'}>
        <ActivitySection load={load} setLoad={setLoad} />
      </AccordionSection>
    </div>
  );
}

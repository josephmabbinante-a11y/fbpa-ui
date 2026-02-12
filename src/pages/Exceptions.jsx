import React, { useMemo, useState, useEffect } from 'react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { sendCustomerMessage } from '../api/client';
import mockExceptions from '../mock/exceptions';
import { getExceptions } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import CollapsibleSection from '../components/CollapsibleSection';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const CATEGORIES = ['Rate Discrepancy', 'Missing Docs', 'Duplicate', 'Other'];
const ACTIONS = ['Review', 'Approve', 'Reject', 'Escalate'];

export default function Exceptions() {
	const { theme } = useTheme();
	const t = themes[theme];
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('All');
	
	// Wrap API call to handle both array and object responses
	const fetchExceptions = async () => {
		const res = await getExceptions();
		// Handle both direct array and { exceptions: [...] } structure
		return res && res.exceptions ? res.exceptions : res;
	};
	
	const { data, loading, error, setData } = useApi(fetchExceptions, mockExceptions);
	const [categories, setCategories] = useState({}); // { [exceptionId]: category }
	const [actions, setActions] = useState({}); // { [exceptionId]: action }

	// Modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [modalException, setModalException] = useState(null);
	// Handler for opening modal
	const handleContactClick = (exception) => {
		setModalException(exception);
		setModalOpen(true);
	};

	// Handler for sending message
	const handleSendMessage = async ({ message, customer, invoice, exception }) => {
		return await sendCustomerMessage({ message, customer, invoice, exception });
	};

	const statuses = useMemo(() => {
		const set = new Set(data.map((e) => e.status));
		return ['All', ...Array.from(set)];
	}, [data]);

	const filtered = useMemo(() => {
		return data.filter((e) => {
			const matchesQuery =
				query.trim() === '' ||
				e.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
				e.carrier.toLowerCase().includes(query.toLowerCase()) ||
				e.reason.toLowerCase().includes(query.toLowerCase());

			const matchesStatus = statusFilter === 'All' || e.status === statusFilter;

			return matchesQuery && matchesStatus;
		});
	}, [data, query, statusFilter]);

	const containerStyle = {
		padding: '24px 32px',
		backgroundColor: t.bg,
		color: t.text,
		minHeight: '100vh',
	};

	const headerStyle = {
		marginBottom: 24,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	};

	const titleStyle = {
		fontSize: '24px',
		fontWeight: '700',
		letterSpacing: '-0.5px',
	};

	const filterBarStyle = {
		display: 'flex',
		gap: 12,
		marginBottom: 24,
		alignItems: 'center',
	};

	const inputStyle = {
		flex: 1,
		padding: '8px 12px',
		backgroundColor: t.surface,
		border: `1px solid ${t.border}`,
		borderRadius: 4,
		color: t.text,
		fontSize: '13px',
		minWidth: 200,
	};

	const selectStyle = {
		padding: '8px 12px',
		backgroundColor: t.surface,
		border: `1px solid ${t.border}`,
		borderRadius: 4,
		color: t.text,
		fontSize: '13px',
		minWidth: 140,
	};

	const tableStyle = {
		width: '100%',
		borderCollapse: 'collapse',
		fontSize: '13px',
	};

	const thStyle = {
		padding: '8px 12px',
		textAlign: 'left',
		fontWeight: '600',
		backgroundColor: t.surface,
		borderBottom: `1px solid ${t.border}`,
		color: t.textSecondary,
		fontSize: '11px',
		textTransform: 'uppercase',
		letterSpacing: '0.3px',
	};

	const tdStyle = {
		padding: '8px 12px',
		borderBottom: `1px solid ${t.borderLight}`,
		color: t.text,
	};

	const currencyStyle = {
		...tdStyle,
		color: t.positive,
		fontWeight: '500',
	};

	return (
		<div style={containerStyle}>
			<div style={headerStyle}>
				<h1 style={titleStyle}>Exceptions</h1>
				{loading && <span style={{ fontSize: '12px', color: t.textSecondary }}>Loading...</span>}
			</div>

			{error && (
				<div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.warning}`, borderRadius: 4, fontSize: '13px', color: t.warning, marginBottom: 24 }}>
					Backend error, using mock data: {error}
				</div>
			)}

			<div style={filterBarStyle}>
				<input
					type="text"
					placeholder="Search by invoice, carrier, or reason"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					style={{ ...inputStyle, flex: 1 }}
				/>
				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
					{statuses.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</div>

			{filtered.length === 0 ? (
				<div style={{ padding: '32px', textAlign: 'center', color: t.textSecondary }}>
					No exceptions found.
				</div>
			) : (
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thStyle}>Invoice</th>
							<th style={thStyle}>Carrier</th>
							<th style={thStyle}>Amount</th>
							<th style={thStyle}>Savings</th>
							<th style={thStyle}>Status</th>
							<th style={thStyle}>Reason</th>
							<th style={thStyle}>Category</th>
							<th style={thStyle}>Action</th>
							<th style={thStyle}>Created</th>
							<th style={thStyle}></th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((ex) => (
							<tr key={ex.id}>
								<td style={tdStyle}>{ex.invoiceNumber}</td>
								<td style={tdStyle}>{ex.carrier}</td>
								<td style={currencyStyle}>
									${ex.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</td>
								<td style={currencyStyle}>
									{ex.savings ? `$${ex.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
								</td>
								<td style={tdStyle}>{ex.status}</td>
								<td style={{ ...tdStyle, fontSize: '12px' }}>{ex.reason}</td>
								<td style={tdStyle}>
									<select
										value={categories[ex.id] || ''}
										onChange={e => setCategories(c => ({ ...c, [ex.id]: e.target.value }))}
										style={{ ...selectStyle, minWidth: 120 }}
									>
										<option value="">Uncategorized</option>
										{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
									</select>
								</td>
								<td style={tdStyle}>
									<select
										value={actions[ex.id] || ''}
										onChange={e => setActions(a => ({ ...a, [ex.id]: e.target.value }))}
										style={{ ...selectStyle, minWidth: 100 }}
									>
										<option value="">No Action</option>
										{ACTIONS.map(act => <option key={act} value={act}>{act}</option>)}
									</select>
								</td>
								<td style={{ ...tdStyle, fontSize: '12px', color: t.textSecondary }}>
									{new Date(ex.createdAt).toLocaleDateString()}
								</td>
								<td style={tdStyle}>
									<Link
										to={`/exceptions/${ex.id}`}
										style={{
											background: '#fff',
											color: '#1976d2',
											border: '1px solid #1976d2',
											borderRadius: 4,
											padding: '6px 14px',
											fontWeight: 600,
											fontSize: 13,
											cursor: 'pointer',
											textDecoration: 'none',
									}}
									>
										Drilldown
									</Link>
									<button
										style={{
											background: '#1976d2',
											color: '#fff',
											border: 'none',
											borderRadius: 4,
											padding: '6px 14px',
											fontWeight: 600,
											fontSize: 13,
											cursor: 'pointer',
									}}
									onClick={() => handleContactClick(ex)}
									>
									Contact
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<ContactCustomerModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSend={handleSendMessage}
				exception={modalException}
				customer={null}
				invoice={null}
			/>
		</div>
	);
}

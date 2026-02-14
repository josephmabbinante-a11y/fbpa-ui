import React, { useMemo, useState, useEffect } from 'react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { sendCustomerMessage } from '../api/client';
import mockExceptions from '../mock/exceptions';
import { getExceptions } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import CollapsibleSection from '../components/CollapsibleSection';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Rate Discrepancy', 'Missing Docs', 'Duplicate', 'Other'];
const ACTIONS = ['Review', 'Approve', 'Reject', 'Escalate'];

export default function Exceptions() {
	const { theme } = useTheme();
	const t = themes[theme];
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('All');
	// import mockExceptions from '../mock/exceptions'; // Retained for demo mode only
	const [data, setData] = useState([]);
	const [categories, setCategories] = useState({}); // { [exceptionId]: category }
	const [actions, setActions] = useState({}); // { [exceptionId]: action }
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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

		useEffect(() => {
			let mounted = true;
			getExceptions()
				.then((res) => {
					if (!mounted) return;
					if (res && !res.error && Array.isArray(res.exceptions)) {
						setData(res.exceptions);
					} else {
						if (res && res.error) setError(res.error);
					}
				})
				.catch((err) => {
					if (!mounted) return;
					setError(err.message || String(err));
				})
				.finally(() => mounted && setLoading(false));
			return () => (mounted = false);
		}, []);

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
	};

		if (loading) return <div style={{ padding: '8px 12px', backgroundColor: themes[theme].bgAlt, border: `1px solid ${themes[theme].info}`, borderRadius: 4, fontSize: '13px', color: themes[theme].info, margin: 32 }}>Loading exceptions...</div>;
		if (error) return <div style={{ padding: '8px 12px', backgroundColor: themes[theme].bgAlt, border: `1px solid ${themes[theme].error}`, borderRadius: 4, fontSize: '13px', color: themes[theme].error, margin: 32 }}>Error loading exceptions: {error}</div>;
		if (!data.length) return <div style={{ padding: '8px 12px', backgroundColor: themes[theme].bgAlt, border: `1px solid ${themes[theme].warning}`, borderRadius: 4, fontSize: '13px', color: themes[theme].warning, margin: 32 }}>No exceptions found.</div>;
		return (
			<div style={containerStyle}>
			<div style={headerStyle}>
				<h1 style={titleStyle}>Exceptions</h1>
			</div>
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
// Demo mode: Uncomment to use mock data
// useEffect(() => { setData(mockExceptions); setLoading(false); }, []);
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

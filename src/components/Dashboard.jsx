import { useState, useEffect, useMemo } from "react";
import * as api from '../api';

const PERIOD_PRESETS = [
  { id: 'year', label: 'Este año' },
  { id: 'q1', label: 'T1' }, { id: 'q2', label: 'T2' },
  { id: 'q3', label: 'T3' }, { id: 'q4', label: 'T4' },
  { id: 'custom', label: 'Personalizado' },
];

function getPresetDates(presetId) {
  const y = new Date().getFullYear();
  switch (presetId) {
    case 'year': return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'q1': return { from: `${y}-01-01`, to: `${y}-03-31` };
    case 'q2': return { from: `${y}-04-01`, to: `${y}-06-30` };
    case 'q3': return { from: `${y}-07-01`, to: `${y}-09-30` };
    case 'q4': return { from: `${y}-10-01`, to: `${y}-12-31` };
    default: return { from: '', to: '' };
  }
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #EEE', borderRadius: 10, padding: '10px 12px', flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 9, color: '#8A9A86', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: color || '#1A2016' }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#8A9A86', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, maxVal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 100, fontSize: 10, color: '#4A5A46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, background: '#F0F9EE', borderRadius: 4, height: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: `${maxVal ? (d.value / maxVal * 100) : 0}%`, background: d.color || '#4B6848', height: '100%', borderRadius: 4, transition: 'width .5s' }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#1A2016', minWidth: 50, textAlign: 'right' }}>{d.display}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ clientId, products, deliveryPoints }) {
  const [period, setPeriod] = useState('year');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dpFilter, setDpFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (period !== 'custom') {
      const d = getPresetDates(period);
      setDateFrom(d.from); setDateTo(d.to);
    }
  }, [period]);

  useEffect(() => {
    if (!dateFrom || !dateTo || !clientId) return;
    setLoading(true);
    api.getDashboardData(clientId, dateFrom, dateTo, dpFilter || null).then(({ data }) => {
      if (data) setOrders(data);
      setLoading(false);
    });
  }, [clientId, dateFrom, dateTo, dpFilter]);

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const pending = orders.filter(o => o.status === 'pending');
    const invoiced = delivered.filter(o => o.wants_invoice);
    const notInvoiced = delivered.filter(o => !o.wants_invoice);

    const totalAmount = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const totalBase = orders.reduce((s, o) => s + (o.total_base || 0), 0);
    const totalVat = orders.reduce((s, o) => s + (o.total_vat || 0), 0);
    const invoicedAmount = invoiced.reduce((s, o) => s + (o.total_amount || 0), 0);
    const notInvoicedAmount = notInvoiced.reduce((s, o) => s + (o.total_amount || 0), 0);

    // Top products
    const prodMap = {};
    orders.forEach(o => (o.order_items || []).forEach(i => {
      if (!prodMap[i.product_id]) prodMap[i.product_id] = { qty: 0, amount: 0 };
      prodMap[i.product_id].qty += i.quantity || 0;
      prodMap[i.product_id].amount += i.line_total || 0;
    }));
    const topByQty = Object.entries(prodMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5)
      .map(([pid, d]) => ({ pid, ...d, name: products.find(p => p.id === pid)?.name || pid }));
    const topByAmount = Object.entries(prodMap).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5)
      .map(([pid, d]) => ({ pid, ...d, name: products.find(p => p.id === pid)?.name || pid }));

    // Payment breakdown
    const payMap = {};
    delivered.forEach(o => {
      const m = o.delivery_payment || 'sin_dato';
      if (!payMap[m]) payMap[m] = { count: 0, amount: 0 };
      payMap[m].count++;
      payMap[m].amount += o.total_amount || 0;
    });

    // Pending payments
    const pendingPayments = delivered.filter(o => o.delivery_payment === 'pendiente');

    return {
      totalOrders: orders.length, deliveredCount: delivered.length, pendingCount: pending.length,
      totalAmount, totalBase, totalVat, invoicedAmount, notInvoicedAmount,
      topByQty, topByAmount, payMap, pendingPayments
    };
  }, [orders, products]);

  const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
  const payLabels = { efectivo: '💶 Efectivo', tarjeta: '💳 Tarjeta', transferencia: '🏦 Transferencia', pendiente: '⏳ Pendiente', sin_dato: '—' };

  return (
    <>
      <div className="stit">Dashboard</div>

      {/* Period filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {PERIOD_PRESETS.map(p => (
          <span key={p.id} className={`chip ${period === p.id ? 'on' : ''}`} style={{ fontSize: 10, padding: '4px 10px' }}
            onClick={() => setPeriod(p.id)}>{p.label}</span>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input className="fi" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ flex: 1 }} />
          <input className="fi" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ flex: 1 }} />
        </div>
      )}
      {deliveryPoints.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <span className={`chip ${!dpFilter ? 'on' : ''}`} style={{ fontSize: 9, padding: '3px 8px' }} onClick={() => setDpFilter('')}>Todos</span>
            {deliveryPoints.map(dp => (
              <span key={dp.id} className={`chip ${dpFilter === dp.id ? 'on' : ''}`} style={{ fontSize: 9, padding: '3px 8px' }} onClick={() => setDpFilter(dp.id)}>{dp.name}</span>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="loading"><div className="loading-spin" /><p>Cargando...</p></div> : <>

        {/* KPIs row 1 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <KPI label="Total pedidos" value={stats.totalOrders} sub={`${stats.deliveredCount} entregados · ${stats.pendingCount} pendientes`} />
          <KPI label="Importe total" value={fmt(stats.totalAmount)} color="#1A2016" />
        </div>

        {/* KPIs row 2 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <KPI label="Base imponible" value={fmt(stats.totalBase)} />
          <KPI label="IVA" value={fmt(stats.totalVat)} />
        </div>

        {/* Invoiced breakdown */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <KPI label="Facturado" value={fmt(stats.invoicedAmount)} color="#2E7D32" />
          <KPI label="Sin factura" value={fmt(stats.notInvoicedAmount)} color="#E65100" />
        </div>

        {/* Top products by volume */}
        {stats.topByQty.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Top 5 — Por volumen (cajas)</div>
            <BarChart data={stats.topByQty.map(t => ({ label: t.name, value: t.qty, display: t.qty + ' ud', color: '#4B6848' }))}
              maxVal={Math.max(...stats.topByQty.map(t => t.qty))} />
          </div>
        )}

        {/* Top products by revenue */}
        {stats.topByAmount.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Top 5 — Por importe</div>
            <BarChart data={stats.topByAmount.map(t => ({ label: t.name, value: t.amount, display: fmt(t.amount), color: '#E6A817' }))}
              maxVal={Math.max(...stats.topByAmount.map(t => t.amount))} />
          </div>
        )}

        {/* Payment breakdown */}
        {Object.keys(stats.payMap).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Desglose de pagos</div>
            {Object.entries(stats.payMap).map(([method, d]) => (
              <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F5F5F5', fontSize: 11 }}>
                <span>{payLabels[method] || method}</span>
                <span><strong>{d.count}</strong> pedidos · <strong>{fmt(d.amount)}</strong></span>
              </div>
            ))}
          </div>
        )}

        {/* Pending payments */}
        {stats.pendingPayments.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#E65100' }}>⏳ Pagos pendientes ({stats.pendingPayments.length})</div>
            {stats.pendingPayments.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F5F5F5', fontSize: 11 }}>
                <span>{o.id} · {new Date(o.delivered_at || o.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                <span style={{ fontWeight: 600, color: '#E65100' }}>{fmt(o.total_amount || 0)}</span>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, marginTop: 6, color: '#E65100' }}>
              Total: {fmt(stats.pendingPayments.reduce((s, o) => s + (o.total_amount || 0), 0))}
            </div>
          </div>
        )}
      </>}
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import * as api from '../api';

const STATUS_STYLES = {
  pending: { bg: '#FFF3E0', color: '#E65100', label: 'Pendiente' },
  delivered: { bg: '#E8F5E9', color: '#2E7D32', label: 'Entregado' },
  cancelled: { bg: '#FFEBEE', color: '#C62828', label: 'Cancelado' },
};

function OrderDetail({ order, products, onClose, onClone, onCancel }) {
  const items = order.order_items || [];
  const fmt = (n) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
  const st = STATUS_STYLES[order.status] || {};

  return (
    <div className="mov" onClick={onClose}>
      <div className="mod" onClick={e => e.stopPropagation()} style={{ borderRadius: 14, maxWidth: 480 }}>
        <div className="mod-h">
          <span className="mod-h-t">Pedido {order.id}</span>
          <button className="mod-close" onClick={onClose}>✕</button>
        </div>
        <div className="mod-b">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#8A9A86' }}>
              {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
          </div>

          {order.delivery_points && (
            <div style={{ fontSize: 10, color: '#4A5A46', marginBottom: 8 }}>📍 {order.delivery_points.name} — {order.delivery_points.address}</div>
          )}

          {/* Items table */}
          <div style={{ fontSize: 9, fontWeight: 600, color: '#8A9A86', textTransform: 'uppercase', marginBottom: 4 }}>Productos</div>
          {items.map((item, i) => {
            const p = products.find(x => x.id === item.product_id);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F5F5F5', fontSize: 11 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{p?.name || item.product_id}</span>
                  <span style={{ color: '#8A9A86', marginLeft: 4 }}>×{item.quantity}</span>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  {item.unit_price > 0 && <div style={{ fontSize: 10 }}>{fmt(item.unit_price)}/ud</div>}
                  {item.line_total > 0 && <div style={{ fontWeight: 600 }}>{fmt(item.line_total)}</div>}
                </div>
              </div>
            );
          })}

          {/* Totals */}
          {order.total_amount > 0 && (
            <div style={{ marginTop: 8, borderTop: '2px solid #EEE', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>Base imponible</span><span>{fmt(order.total_base)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>IVA</span><span>{fmt(order.total_vat)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                <span>Total</span><span>{fmt(order.total_amount)}</span>
              </div>
              {order.discount_pct > 0 && (
                <div style={{ fontSize: 9, color: '#2E7D32', marginTop: 2 }}>Descuento aplicado: {order.discount_pct}%</div>
              )}
            </div>
          )}

          {order.notes && <div style={{ fontSize: 10, color: '#E65100', background: '#FFF3E0', padding: '4px 8px', borderRadius: 6, marginTop: 8 }}>📝 {order.notes}</div>}

          {order.wants_invoice && <div style={{ fontSize: 9, color: '#1565C0', marginTop: 4 }}>📄 Factura solicitada</div>}

          {order.delivery_payment && (
            <div style={{ fontSize: 10, color: '#4A5A46', marginTop: 6 }}>
              💳 Pagado con: <strong style={{ textTransform: 'capitalize' }}>{order.delivery_payment}</strong>
              {order.delivery_date && <> · Entregado: {order.delivery_date}</>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button className="btn-confirm" style={{ flex: 1, fontSize: 11, padding: 8 }} onClick={() => onClone(order)}>📋 Clonar pedido</button>
            {order.status === 'pending' && (
              <button className="btn-cancel" style={{ fontSize: 11, padding: 8, color: '#C62828', borderColor: '#ECC' }} onClick={() => onCancel(order.id)}>✕ Cancelar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderManager({ clientId, products, deliveryPoints, onCloneOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '', deliveryPointId: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    const f = {};
    if (filters.status) f.status = filters.status;
    if (filters.dateFrom) f.dateFrom = filters.dateFrom;
    if (filters.dateTo) f.dateTo = filters.dateTo;
    if (filters.deliveryPointId) f.deliveryPointId = filters.deliveryPointId;
    const { data } = await api.getClientOrders(clientId, f);
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId, filters]);

  const handleCancel = async (orderId) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    const { error } = await api.cancelOrder(orderId, clientId);
    if (error) { alert('Error: ' + error.message); return; }
    setSelectedOrder(null);
    setToast('Pedido cancelado');
    setTimeout(() => setToast(null), 3000);
    load();
  };

  const handleClone = (order) => {
    setSelectedOrder(null);
    const items = {};
    (order.order_items || []).forEach(i => { items[i.product_id] = i.quantity; });
    onCloneOrder(items);
  };

  const exportCSV = () => {
    const header = 'Pedido,Fecha,Estado,Factura,Base,IVA,Total,Pago,Productos\n';
    const rows = orders.map(o => {
      const prods = (o.order_items || []).map(i => {
        const p = products.find(x => x.id === i.product_id);
        return `${i.quantity}x ${p?.name || i.product_id}`;
      }).join(' | ');
      return `${o.id},${new Date(o.created_at).toLocaleDateString('es-ES')},${o.status},${o.wants_invoice ? 'Sí' : 'No'},${o.total_base || 0},${o.total_vat || 0},${o.total_amount || 0},${o.delivery_payment || ''},${prods}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const fmt = (n) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><div className="stit">Mis Pedidos</div><div className="ssub">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</div></div>
        <button className="contact-btn" style={{ fontSize: 10 }} onClick={exportCSV}>📥 Exportar CSV</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {[{ id: '', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'delivered', label: 'Entregados' }, { id: 'cancelled', label: 'Cancelados' }].map(s => (
          <span key={s.id} className={`chip ${filters.status === s.id ? 'on' : ''}`} style={{ fontSize: 10, padding: '3px 10px' }}
            onClick={() => setFilters({ ...filters, status: s.id })}>{s.label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input className="fi" type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} placeholder="Desde" style={{ flex: 1 }} />
        <input className="fi" type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} placeholder="Hasta" style={{ flex: 1 }} />
      </div>
      {deliveryPoints.length > 1 && (
        <div style={{ display: 'flex', gap: 3, marginBottom: 10, flexWrap: 'wrap' }}>
          <span className={`chip ${!filters.deliveryPointId ? 'on' : ''}`} style={{ fontSize: 9, padding: '2px 8px' }} onClick={() => setFilters({ ...filters, deliveryPointId: '' })}>Todos</span>
          {deliveryPoints.map(dp => (
            <span key={dp.id} className={`chip ${filters.deliveryPointId === dp.id ? 'on' : ''}`} style={{ fontSize: 9, padding: '2px 8px' }} onClick={() => setFilters({ ...filters, deliveryPointId: dp.id })}>{dp.name}</span>
          ))}
        </div>
      )}

      {/* Order list */}
      {loading ? <div className="loading"><div className="loading-spin" /><p>Cargando...</p></div> :
        !orders.length ? <div style={{ textAlign: 'center', padding: 30, color: '#8A9A86', fontSize: 12 }}>No hay pedidos con estos filtros</div> :
        orders.map(o => {
          const st = STATUS_STYLES[o.status] || {};
          const items = o.order_items || [];
          return (
            <div key={o.id} className="ro" onClick={() => setSelectedOrder(o)}>
              <div className="ro-top">
                <div className="ro-h">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{o.id}</div>
                    <div style={{ fontSize: 10, color: '#8A9A86' }}>
                      {new Date(o.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {o.delivery_points && <> · 📍 {o.delivery_points.name}</>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
                    {o.total_amount > 0 && <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginTop: 2 }}>{fmt(o.total_amount)}</div>}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#4A5A46', marginTop: 4 }}>
                  {items.map(i => { const p = products.find(x => x.id === i.product_id); return `${i.quantity}× ${p?.name || i.product_id}`; }).join(' · ')}
                </div>
                {o.wants_invoice && <div style={{ fontSize: 8, color: '#1565C0', marginTop: 2 }}>📄 Factura</div>}
              </div>
            </div>
          );
        })
      }

      {/* Detail modal */}
      {selectedOrder && <OrderDetail order={selectedOrder} products={products} onClose={() => setSelectedOrder(null)} onClone={handleClone} onCancel={handleCancel} />}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

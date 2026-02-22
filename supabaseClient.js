import { useState, useCallback, useMemo, useEffect } from "react";
import * as api from './api';
import { FALLBACK_CATALOG, SEC_COLORS, SECTION_BG, FILTER_CATS } from './constants';
import Dashboard from './components/Dashboard';
import OrderManager from './components/OrderManager';
import ClientTariff from './components/ClientTariff';
import './styles.css';

if (!document.querySelector('link[data-at-font]')) {
  const fl = document.createElement("link");
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
  fl.rel = "stylesheet"; fl.setAttribute("data-at-font","1"); document.head.appendChild(fl);
}

// ============================================================
// PRODUCT IMAGE
// ============================================================
function ProductImage({ src, section }) {
  const [failed, setFailed] = useState(false);
  const emojis = { "PET Filtrado":"\u{1F4E6}\u{1FAD2}","Vidrio Filtrado":"\u{1F376}\u{1FAD2}","PET Sin Filtrar":"\u{1F4E6}\u{1F33F}","Monodosis AOVE":"\u{1F538}","Vidrio Sin Filtrar":"\u{1F376}\u{1F33F}","Verde Oleum":"\u{1F33F}","Delirium":"\u2728" };
  if (failed) return <div className="pimg-fb" style={{ background: SECTION_BG[section] || "#F5F5F5" }}>{emojis[section] || "\u{1FAD2}"}</div>;
  return <img className="pimg" src={src} alt="" loading="lazy" onError={() => setFailed(true)} referrerPolicy="no-referrer" />;
}

// ============================================================
// AUTH SCREEN
// ============================================================
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError("Rellena todos los campos"); return; }
    setLoading(true); setError("");
    const { error: e } = mode === "login" ? await api.signIn(email, password) : await api.signUp(email, password);
    setLoading(false);
    if (e) setError(mode === "login" ? "Email o contrase\u00f1a incorrectos" : e.message);
  };

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-m">AT</div>
          <div className="auth-logo-t">Aceites Tapia</div>
          <div className="auth-logo-s">Portal HORECA</div>
        </div>
        {error && <div className="auth-err">{error}</div>}
        <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
        <div className="fg"><label className="fl">Contrase\u00f1a</label><input className="fi" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></div>
        <button className="bp" style={{ padding: 12 }} disabled={loading} onClick={handleSubmit}>{loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
        <div className="div" style={{ marginTop: 16 }}><span className="div-t">o</span></div>
        <button className="btn-cancel" style={{ width: "100%", padding: 10, marginTop: 6 }} onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear cuenta nueva" : "Ya tengo cuenta"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// NEW ORDER SCREEN
// ============================================================
function NewOrder({ catalog, client, deliveryPoints, onDone }) {
  const [qty, setQty] = useState({});
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("Todos");
  const [wantInv, setWantInv] = useState(client?.wants_invoice_default ?? true);
  const [notes, setNotes] = useState("");
  const [selectedDP, setSelectedDP] = useState(deliveryPoints.find(dp => dp.is_default) || deliveryPoints[0] || null);
  const [step, setStep] = useState("select");
  const [submitting, setSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  const products = catalog.length ? catalog : FALLBACK_CATALOG;

  const sections = useMemo(() => {
    const secs = []; let cur = null;
    const af = FILTER_CATS.find(c => c.label === catF);
    products.filter(p => {
      const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.section.toLowerCase().includes(search.toLowerCase());
      const mc = !af?.match || af.match.includes(p.section);
      return ms && mc;
    }).forEach(p => {
      if (p.section !== cur) { cur = p.section; secs.push({ name: p.section, products: [] }); }
      secs[secs.length - 1].products.push(p);
    });
    return secs;
  }, [products, search, catF]);

  const cartItems = useMemo(() => Object.entries(qty).filter(([_, q]) => q > 0).map(([id, q]) => ({ product: products.find(p => p.id === id), qty: q })).filter(i => i.product), [qty, products]);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const handleQty = useCallback((id, n) => setQty(prev => { const next = { ...prev }; if (n <= 0) delete next[id]; else next[id] = n; return next; }), []);

  // Allow cloning: set initial qty from props
  useEffect(() => {
    if (client?._cloneItems) { setQty(client._cloneItems); }
  }, [client]);

  const submit = async () => {
    setSubmitting(true);
    const items = cartItems.map(i => ({ productId: i.product.id, qty: i.qty }));
    const { data, error } = await api.createOrder(client.id, items, wantInv, notes, selectedDP?.id);
    setSubmitting(false);
    if (error) { alert("Error: " + error.message); return; }
    setLastOrderId(data.id);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{"\u2705"}</div>
        <div className="stit">{"\u00a1Pedido enviado!"}</div>
        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5, margin: "8px 0 16px" }}>
          Tu pedido <strong>{lastOrderId}</strong> ha sido registrado correctamente.
        </div>
        <button className="btn-confirm" style={{ padding: "10px 24px" }} onClick={() => { setQty({}); setNotes(""); setStep("select"); }}>Hacer otro pedido</button>
      </div>
    );
  }

  return (
    <>
      {deliveryPoints.length > 1 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "var(--t2)", textTransform: "uppercase", marginBottom: 4 }}>Punto de entrega</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {deliveryPoints.map(dp => (
              <span key={dp.id} className={`chip ${selectedDP?.id === dp.id ? "on" : ""}`} style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => setSelectedDP(dp)}>{dp.name}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 8 }}>
        <input className="fi" placeholder={"\u{1F50D} Buscar producto..."} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="chips">{FILTER_CATS.map(c => <span key={c.label} className={`chip ${catF === c.label ? "on" : ""}`} onClick={() => setCatF(c.label)}>{c.label}</span>)}</div>

      {sections.map(sec => {
        const sc = SEC_COLORS[sec.name] || { bg: "#F5F5F5", color: "#333", icon: "\u{1F4E6}" };
        return (
          <div key={sec.name}>
            <div className="sec-h" style={{ background: sc.bg, color: sc.color }}><span>{sc.icon}</span> {sec.name}</div>
            <div className="pgrid">
              {sec.products.map(p => (
                <div key={p.id} className={`pcard ${(qty[p.id] || 0) > 0 ? "sel" : ""}`}>
                  <div className="pimg-w" style={{ background: SECTION_BG[p.section] || "#FAF6EF" }}>
                    {(qty[p.id] || 0) > 0 && <span className="psel-b">{"\u00d7"}{qty[p.id]}</span>}
                    <ProductImage src={p.image_url} section={p.section} />
                  </div>
                  <div className="pc-b">
                    <div className="pn">{p.name}</div>
                    <div className="pd">{p.description}</div>
                    {p.base_price > 0 && <div style={{ fontSize: 9, color: "var(--b5)", fontWeight: 600, marginBottom: 3 }}>{p.base_price?.toFixed(2)}{"\u20ac"}</div>}
                    {(qty[p.id] || 0) === 0
                      ? <button className="ab" onClick={() => handleQty(p.id, 1)}>+ A\u00f1adir</button>
                      : <div className="qc">
                          <button className="qb rm" onClick={() => handleQty(p.id, (qty[p.id] || 0) - 1)}>{"\u2212"}</button>
                          <span className="qv">{qty[p.id]}</span>
                          <button className="qb" onClick={() => handleQty(p.id, (qty[p.id] || 0) + 1)}>+</button>
                        </div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {cartCount > 0 && (
        <div className="cart-bar">
          <div><div className="cart-count">{cartCount} caja{cartCount !== 1 ? "s" : ""}</div><div className="cart-refs">{cartItems.length} ref.</div></div>
          <button className="btn-confirm" style={{ background: "var(--g5)", color: "var(--b9)" }} onClick={() => setStep("confirm")}>Revisar {"\u2192"}</button>
        </div>
      )}

      {step === "confirm" && (
        <div className="mov" onClick={() => setStep("select")}>
          <div className="mod" onClick={e => e.stopPropagation()} style={{ borderRadius: 14 }}>
            <div className="mod-h"><span className="mod-h-t">Confirmar Pedido</span></div>
            <div className="mod-b">
              {selectedDP && <div style={{ fontSize: 10, color: "var(--tm)", marginBottom: 8 }}>{"\u{1F4CD}"} {selectedDP.name} {"\u2014"} {selectedDP.address}</div>}
              {cartItems.map(i => (
                <div key={i.product.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F5F5F5", fontSize: 11 }}>
                  <span>{i.product.name}</span>
                  <span style={{ color: "var(--tm)" }}>{i.qty} {i.qty === 1 ? "caja" : "cajas"}</span>
                </div>
              ))}
              <div className="div" />
              <div className="trow" style={{ borderBottom: "none" }}>
                <div className="tl" style={{ fontSize: 11 }}>Solicitar factura</div>
                <button className={`tog ${wantInv ? "on" : ""}`} onClick={() => setWantInv(!wantInv)} />
              </div>
              <div className="fg" style={{ marginTop: 6 }}><label className="fl">Notas</label>
                <textarea className="fi" style={{ minHeight: 40, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas para la entrega..." /></div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setStep("select")}>Volver</button>
                <button className="btn-confirm" style={{ flex: 1 }} disabled={submitting} onClick={submit}>{submitting ? "Enviando..." : "\u2713 Enviar Pedido"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// PROFILE SCREEN
// ============================================================
function ProfileScreen({ client, deliveryPoints, onUpdate, onDPChange }) {
  const [dpForm, setDpForm] = useState({ name: "", address: "", contact_person: "", phone: "" });
  const [showDPForm, setShowDPForm] = useState(false);

  const addDP = async () => {
    if (!dpForm.name || !dpForm.address) return;
    await api.createDeliveryPoint({ ...dpForm, client_id: client.id, is_default: !deliveryPoints.length });
    setDpForm({ name: "", address: "", contact_person: "", phone: "" });
    setShowDPForm(false);
    onDPChange();
  };
  const removeDP = async (id) => { await api.deleteDeliveryPoint(id); onDPChange(); };

  return (
    <>
      <div className="stit">Mi Perfil</div>
      <div style={{ background: "var(--b0)", padding: 12, borderRadius: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{client.name}</div>
        <div style={{ fontSize: 11, color: "var(--tm)" }}>
          {client.cif_nif && <>{client.cif_nif} {"\u00b7"} </>}
          {client.price_levels?.name || "Silver"} {"\u00b7"} {client.zones?.name || "Sin zona"}
          {client.zones?.delivery_day && <> {"\u00b7"} {"\u{1F4C5}"} {client.zones.delivery_day}</>}
        </div>
        {client.email && <div style={{ fontSize: 10, color: "var(--t2)", marginTop: 4 }}>{"\u{1F4E7}"} {client.email}</div>}
        {client.phone && <div style={{ fontSize: 10, color: "var(--t2)" }}>{"\u{1F4DE}"} {client.phone}</div>}
        {client.address && <div style={{ fontSize: 10, color: "var(--t2)" }}>{"\u{1F4CD}"} {client.address}</div>}
      </div>

      <div className="trow">
        <div className="tl" style={{ fontSize: 11 }}>Factura por defecto</div>
        <button className={`tog ${client.wants_invoice_default ? "on" : ""}`} onClick={() => onUpdate({ wants_invoice_default: !client.wants_invoice_default })} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Puntos de Entrega</div>
        {deliveryPoints.map(dp => (
          <div key={dp.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F0F0F0" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{dp.name} {dp.is_default && <span style={{ fontSize: 8, color: "var(--b5)", background: "var(--b0)", padding: "1px 6px", borderRadius: 4 }}>Predeterminado</span>}</div>
              <div style={{ fontSize: 10, color: "var(--tm)" }}>{dp.address}{dp.phone && <> {"\u00b7"} {dp.phone}</>}</div>
            </div>
            <button onClick={() => removeDP(dp.id)} style={{ background: 0, border: "none", color: "var(--rd)", cursor: "pointer", fontSize: 14 }}>{"\u2715"}</button>
          </div>
        ))}
        {!showDPForm ? (
          <button className="add-prod-btn" onClick={() => setShowDPForm(true)}>+ A\u00f1adir punto de entrega</button>
        ) : (
          <div style={{ background: "var(--b0)", padding: 10, borderRadius: 8, marginTop: 8 }}>
            <div className="fg"><label className="fl">Nombre</label><input className="fi" value={dpForm.name} onChange={e => setDpForm({ ...dpForm, name: e.target.value })} placeholder="Terraza, Almac\u00e9n..." /></div>
            <div className="fg"><label className="fl">Direcci\u00f3n</label><input className="fi" value={dpForm.address} onChange={e => setDpForm({ ...dpForm, address: e.target.value })} /></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn-confirm" style={{ flex: 1, padding: 8, fontSize: 11 }} onClick={addDP}>Guardar</button>
              <button className="btn-cancel" style={{ padding: 8, fontSize: 11 }} onClick={() => setShowDPForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <button className="btn-cancel" style={{ width: "100%", marginTop: 20, color: "var(--rd)", borderColor: "#ECC" }} onClick={() => api.signOut()}>Cerrar sesi\u00f3n</button>
    </>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [tab, setTab] = useState("pedir");
  const [loading, setLoading] = useState(false);
  const [cloneItems, setCloneItems] = useState(null);

  useEffect(() => {
    api.getSession().then(s => { setSession(s); setAuthLoading(false); });
    const { data: { subscription } } = api.onAuthChange((_ev, s) => { setSession(s); if (!s) setClient(null); });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data: profile } = await api.getClientProfile(session.user.id);
    if (profile) {
      setClient(profile);
      const { data: dps } = await api.getDeliveryPoints(profile.id);
      if (dps) setDeliveryPoints(dps);
    }
    const { data: products } = await api.getProducts();
    if (products?.length) setCatalog(products);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleClone = (items) => {
    setCloneItems(items);
    setTab("pedir");
  };

  const handleProfileUpdate = async (updates) => {
    const { data } = await api.updateClientProfile(client.id, updates);
    if (data) setClient({ ...client, ...data });
  };

  if (authLoading) return <div className="app"><div className="loading"><div className="loading-spin" /><p>Cargando...</p></div></div>;
  if (!session) return <AuthScreen />;
  if (loading && !client) return <div className="app"><div className="loading"><div className="loading-spin" /><p>Cargando perfil...</p></div></div>;

  return (
    <div className="app">
      <div className="hdr">
        <div className="hdr-top">
          <div className="logo-a"><div className="logo-m">AT</div><div><div className="logo-t">Aceites Tapia</div><div className="logo-s">Portal HORECA</div></div></div>
          <div style={{ textAlign: "right" }}>
            <div className="driver-name">{client?.name || "Cliente"}</div>
            {client?.price_levels && <div style={{ fontSize: 8, color: "var(--b3)", marginTop: 1 }}>{client.price_levels.name}</div>}
          </div>
        </div>
        <div className="nav">
          <button className={"nb " + (tab === "pedir" ? "on" : "")} onClick={() => setTab("pedir")}>{"\u{1FAD2}"} Pedir</button>
          <button className={"nb " + (tab === "pedidos" ? "on" : "")} onClick={() => setTab("pedidos")}>{"\u{1F4CB}"} Pedidos</button>
          <button className={"nb " + (tab === "dashboard" ? "on" : "")} onClick={() => setTab("dashboard")}>{"\u{1F4CA}"} Dashboard</button>
          <button className={"nb " + (tab === "tarifa" ? "on" : "")} onClick={() => setTab("tarifa")}>{"\u{1F4CB}"} Tarifa</button>
          <button className={"nb " + (tab === "perfil" ? "on" : "")} onClick={() => setTab("perfil")}>{"\u{1F464}"} Perfil</button>
        </div>
      </div>

      <div className="main">
        {tab === "pedir" && client && (
          <NewOrder
            catalog={catalog}
            client={cloneItems ? { ...client, _cloneItems: cloneItems } : client}
            deliveryPoints={deliveryPoints}
            onDone={() => { setCloneItems(null); }}
          />
        )}

        {tab === "pedidos" && client && (
          <OrderManager
            clientId={client.id}
            products={catalog}
            deliveryPoints={deliveryPoints}
            onCloneOrder={handleClone}
          />
        )}

        {tab === "dashboard" && client && (
          <Dashboard
            clientId={client.id}
            products={catalog}
            deliveryPoints={deliveryPoints}
          />
        )}

        {tab === "tarifa" && (
          <ClientTariff />
        )}

        {tab === "perfil" && client && (
          <ProfileScreen
            client={client}
            deliveryPoints={deliveryPoints}
            onUpdate={handleProfileUpdate}
            onDPChange={loadProfile}
          />
        )}
      </div>
    </div>
  );
}

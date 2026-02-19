import { useState, useCallback, useMemo } from "react";

// ============================================================
// ACEITES TAPIA — Portal de Pedidos HORECA v3
// 3 columnas, orden personalizado, solo cajas + Delirium ud
// ============================================================

const B = "https://www.aceitestapia.com/wp-content/uploads";

// Orden fijo:
// 1. PET Filtrado (desc. tamaño)
// 2. Vidrio Filtrado (desc. tamaño)
// 3. PET Sin Filtrar (desc. tamaño)
// 4. Monodosis AOVE (justo después de SF PET)
// 5. Vidrio Sin Filtrar (desc. tamaño)
// 6. Verde Oleum (desc. tamaño)
// 7. Delirium

const CATALOG = [
  // — PET FILTRADO (desc. tamaño) —
  { id:"F-PET-5L",   name:"PET Filtrado 5L",       desc:"Caja 3 ud",  section:"PET Filtrado",    img:`${B}/2020/06/CAJA-PET-5L-300x300.jpg` },
  { id:"F-PET-2L",   name:"PET Filtrado 2L",       desc:"Caja 6 ud",  section:"PET Filtrado",    img:`${B}/2018/10/caja-PET-2L-300x300.jpg` },
  { id:"F-PET-1L",   name:"PET Filtrado 1L",       desc:"Caja 12 ud", section:"PET Filtrado",    img:`${B}/2018/10/caja-PET-1L-300x300.jpg` },
  { id:"F-PET-500",  name:"PET Filtrado 500ml",    desc:"Caja 20 ud", section:"PET Filtrado",    img:`${B}/2020/06/CAJA-PET-500ML-300x300.jpeg` },
  // — VIDRIO FILTRADO (desc. tamaño) —
  { id:"F-VT-750",   name:"Vidrio Filtrado 750ml", desc:"Caja 15 ud", section:"Vidrio Filtrado",  img:`${B}/2020/06/CAJA-MT750ML-300x300.jpg` },
  { id:"F-VT-500",   name:"Vidrio Filtrado 500ml", desc:"Caja 24 ud", section:"Vidrio Filtrado",  img:`${B}/2020/06/CAJA-MT500ML-300x300.jpg` },
  // — PET SIN FILTRAR (desc. tamaño) —
  { id:"SF-PET-5L",  name:"PET Sin Filtrar 5L",    desc:"Caja 3 ud",  section:"PET Sin Filtrar",  img:`${B}/2020/06/CAJA-PET-5L-300x300.jpg` },
  { id:"SF-PET-2L",  name:"PET Sin Filtrar 2L",    desc:"Caja 6 ud",  section:"PET Sin Filtrar",  img:`${B}/2018/10/caja-PET-2L-300x300.jpg` },
  { id:"SF-PET-1L",  name:"PET Sin Filtrar 1L",    desc:"Caja 15 ud", section:"PET Sin Filtrar",  img:`${B}/2018/10/caja-PET-1L-300x300.jpg` },
  { id:"SF-PET-500", name:"PET Sin Filtrar 500ml", desc:"Caja 20 ud", section:"PET Sin Filtrar",  img:`${B}/2020/06/CAJA-PET-500ML-300x300.jpeg` },
  // — MONODOSIS AOVE (solo aceite, justo tras SF PET) —
  { id:"MONO-AOVE",  name:"Monodosis AOVE 20ml",  desc:"Caja 160 ud",section:"Monodosis AOVE",   img:`${B}/2021/05/TARRINA-AOVE-20ML-300x300.jpg` },
  // — VIDRIO SIN FILTRAR (desc. tamaño) —
  { id:"SF-VT-750",  name:"Vidrio Sin Filtrar 750ml",desc:"Caja 15 ud",section:"Vidrio Sin Filtrar",img:`${B}/2020/06/CAJA-MT750ML-300x300.jpg` },
  { id:"SF-VT-500",  name:"Vidrio Sin Filtrar 500ml",desc:"Caja 24 ud",section:"Vidrio Sin Filtrar",img:`${B}/2020/06/CAJA-MT500ML-300x300.jpg` },
  // — VERDE OLEUM (desc. tamaño) —
  { id:"VO-L-5L",    name:"Verde Oleum Lata 5L",   desc:"Caja 4 ud",  section:"Verde Oleum",     img:`${B}/2018/10/CAJA-LATA-5L-VERDE-OLEUM-1-300x300.jpg` },
  { id:"VO-L-750",   name:"Verde Oleum Lata 750ml",desc:"Caja 15 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-LATA-750ML-VERDE-OLEUM-300x300.jpg` },
  { id:"VO-B-500",   name:"Verde Oleum Bot. 500ml",desc:"Caja 15 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-BOTELLA-500ML-VERDE-OLEUM-300x300.jpg` },
  { id:"VO-L-250",   name:"Verde Oleum Lata 250ml",desc:"Caja 28 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-LATA-250ML-VERDE-OLEUM-300x300.jpg` },
  { id:"VO-B-250",   name:"Verde Oleum Bot. 250ml",desc:"Caja 30 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-BOTELLA-250ML-VERDE-OLEUM-300x300.jpg` },
  // — DELIRIUM (unidad) —
  { id:"DEL-500",    name:"Delirium 500ml",        desc:"Unidad",     section:"Delirium",        img:`${B}/2021/01/DELIRIUM-300x300.jpg` },
];

// Section colors for headers
const SEC_COLORS = {
  "PET Filtrado":      { bg:"#FFF8E1", color:"#E65100", icon:"📦" },
  "Vidrio Filtrado":   { bg:"#FFF3E0", color:"#BF360C", icon:"🍶" },
  "PET Sin Filtrar":   { bg:"#E8F5E9", color:"#2E7D32", icon:"📦" },
  "Monodosis AOVE":    { bg:"#FBE9E7", color:"#D84315", icon:"🔸" },
  "Vidrio Sin Filtrar":{ bg:"#F1F8E9", color:"#33691E", icon:"🍶" },
  "Verde Oleum":       { bg:"#E0F2F1", color:"#00695C", icon:"🌿" },
  "Delirium":          { bg:"#F3E5F5", color:"#6A1B9A", icon:"✨" },
};

// Fallback colors for product cards when image fails
const SECTION_BG = {
  "PET Filtrado":"#FFF8E1", "Vidrio Filtrado":"#FFF3E0", "PET Sin Filtrar":"#E8F5E9",
  "Monodosis AOVE":"#FBE9E7", "Vidrio Sin Filtrar":"#F1F8E9", "Verde Oleum":"#E0F2F1", "Delirium":"#F3E5F5",
};

// ============================================================
// Fonts
// ============================================================
if (!document.querySelector('link[data-tapia-font]')) {
  const fl = document.createElement("link");
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
  fl.rel = "stylesheet";
  fl.setAttribute("data-tapia-font","1");
  document.head.appendChild(fl);
}

// ============================================================
// Styles
// ============================================================
{ // style block
  let s = document.querySelector("style[data-tapia3]");
  if (!s) { s = document.createElement("style"); s.setAttribute("data-tapia3","1"); document.head.appendChild(s); }
  s.textContent = `
  :root {
    --o9:#1A2E1A;--o8:#263D26;--o7:#3A5C3A;--o6:#4B7A4B;--o5:#5F9A5F;--o4:#7FB97F;
    --o3:#A8D4A8;--o2:#CBE8CB;--o1:#E4F3E4;--o0:#F3FAF3;
    --g5:#E6A817;--g4:#F4C430;--g3:#FFE082;--g2:#FFF3D0;
    --cr:#FDFCF8;--wm:#FAF6EF;--tx:#1A2E1A;--t2:#4A6A4A;--tm:#8AA08A;--rd:#C62828;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;background:var(--cr);color:var(--tx);-webkit-font-smoothing:antialiased}

  .app{min-height:100vh;max-width:540px;margin:0 auto;background:#fff;position:relative;box-shadow:0 12px 40px rgba(26,46,26,.12)}

  .hdr{background:linear-gradient(145deg,var(--o8),var(--o9) 70%);padding:16px 14px 12px;position:sticky;top:0;z-index:100}
  .hdr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .logo-a{display:flex;align-items:center;gap:8px}
  .logo-m{width:30px;height:30px;background:var(--g5);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--o9);font-family:'Playfair Display',serif}
  .logo-t{font-family:'Playfair Display',serif;font-size:15px;color:#fff}
  .logo-s{font-size:8px;color:var(--o3);letter-spacing:2.5px;text-transform:uppercase;font-weight:500}
  .u-p{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.1);padding:4px 10px;border-radius:18px;color:var(--o2);font-size:10px;cursor:pointer;border:none;transition:.2s;font-family:'DM Sans',sans-serif}
  .u-p:hover{background:rgba(255,255,255,.18)}
  .u-a{width:20px;height:20px;border-radius:50%;background:var(--g5);color:var(--o9);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700}

  .nav{display:flex;gap:2px;background:rgba(0,0,0,.15);border-radius:8px;padding:2px}
  .nb{flex:1;padding:6px 3px;text-align:center;font-size:10.5px;font-weight:500;color:var(--o3);border:none;background:0;border-radius:6px;cursor:pointer;transition:.2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
  .nb.on{background:#fff;color:var(--o8);font-weight:600;box-shadow:0 1px 3px rgba(26,46,26,.05)}
  .bdg{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:var(--g5);color:var(--o9);font-size:8px;font-weight:700;margin-left:3px}

  .main{padding:12px;padding-bottom:100px}
  .stit{font-family:'Playfair Display',serif;font-size:18px;color:var(--o9);margin-bottom:2px}
  .ssub{font-size:11px;color:var(--tm);margin-bottom:12px}

  .srch-w{position:relative;margin-bottom:12px}
  .srch-i{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--tm);font-size:12px;pointer-events:none}
  .srch{width:100%;padding:8px 12px 8px 32px;border:1.5px solid #EEE;border-radius:10px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--tx);background:var(--wm);transition:.2s}
  .srch:focus{outline:none;border-color:var(--o4);background:#fff}

  /* Filter chips */
  .chips{display:flex;gap:5px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none}
  .chips::-webkit-scrollbar{display:none}
  .chip{padding:5px 12px;border-radius:18px;font-size:11px;font-weight:500;white-space:nowrap;cursor:pointer;border:1.5px solid var(--o2);background:#fff;color:var(--t2);transition:.2s;font-family:'DM Sans',sans-serif}
  .chip:hover{border-color:var(--o4)}
  .chip.on{background:var(--o8);color:#fff;border-color:var(--o8)}

  /* Section headers */
  .sec-h{display:flex;align-items:center;gap:6px;padding:6px 10px;margin:10px 0 6px;border-radius:8px;font-size:11px;font-weight:600}
  .sec-h:first-of-type{margin-top:0}

  /* 3-column grid */
  .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}

  .pcard{
    background:#fff;border:1.5px solid #EEE;border-radius:10px;overflow:hidden;
    transition:all .15s;display:flex;flex-direction:column;
  }
  .pcard:hover{border-color:var(--o3);box-shadow:0 4px 16px rgba(26,46,26,.08);transform:translateY(-1px)}
  .pcard.sel{border-color:var(--o6);box-shadow:0 0 0 2px rgba(75,122,75,.18)}

  .pimg-w{
    width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;
    overflow:hidden;position:relative;background:var(--wm);
  }
  .pimg{width:88%;height:88%;object-fit:contain;transition:transform .3s}
  .pcard:hover .pimg{transform:scale(1.06)}

  /* Fallback when image fails */
  .pimg-fb{
    width:100%;height:100%;display:flex;align-items:center;justify-content:center;
    font-size:32px;opacity:.5;
  }

  .psel-b{position:absolute;top:4px;right:4px;background:var(--o7);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px}

  .pc-b{padding:6px 6px 8px;display:flex;flex-direction:column;align-items:center;text-align:center;flex:1}
  .pn{font-size:10.5px;font-weight:600;color:var(--tx);line-height:1.25;margin-bottom:1px}
  .pd{font-size:9px;color:var(--tm);margin-bottom:6px}

  .qc{display:flex;align-items:center;gap:0}
  .qb{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--o3);background:#fff;color:var(--o7);font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;font-family:'DM Sans',sans-serif}
  .qb:hover{background:var(--o1);border-color:var(--o5)}
  .qb.rm{border-color:var(--rd);color:var(--rd)}
  .qb.rm:hover{background:#FFEBEE}
  .qv{width:24px;text-align:center;font-size:14px;font-weight:700;color:var(--o9)}

  .ab{width:100%;padding:5px;border:1.5px solid var(--o3);border-radius:8px;background:0;color:var(--o7);font-size:10.5px;font-weight:600;cursor:pointer;transition:.2s;font-family:'DM Sans',sans-serif}
  .ab:hover{background:var(--o1);border-color:var(--o5)}

  /* Cart bar */
  .cart{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:540px;background:var(--o9);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;z-index:90;box-shadow:0 -4px 24px rgba(0,0,0,.18)}
  .cart-n{font-size:11px;color:var(--o3)}
  .cart-t{font-family:'Playfair Display',serif;font-size:18px;color:#fff}
  .cart-b{padding:9px 18px;background:var(--g5);color:var(--o9);font-weight:700;font-size:12px;border:none;border-radius:8px;cursor:pointer;transition:.2s;font-family:'DM Sans',sans-serif}
  .cart-b:hover{background:var(--g4);transform:translateY(-1px)}
  .cart-b:disabled{opacity:.4;cursor:not-allowed;transform:none}

  /* Forms */
  .fg{margin-bottom:12px}
  .fl{font-size:10px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;display:block}
  .fi{width:100%;padding:9px 12px;border:1.5px solid #DDD;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--tx);background:#fff;transition:.2s}
  .fi:focus{outline:none;border-color:var(--o5);box-shadow:0 0 0 3px rgba(95,154,95,.12)}
  .ft{width:100%;padding:9px 12px;border:1.5px solid #DDD;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--tx);resize:vertical;min-height:50px}
  .ft:focus{outline:none;border-color:var(--o5)}

  .trow{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F0F0F0}
  .tl{font-size:12px;color:var(--tx)}
  .td{font-size:10px;color:var(--tm);margin-top:1px}
  .tog{width:40px;height:22px;border-radius:11px;background:#CCC;position:relative;cursor:pointer;transition:.2s;border:none;flex-shrink:0}
  .tog.on{background:var(--o6)}
  .tog::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(26,46,26,.05)}
  .tog.on::after{transform:translateX(18px)}

  .ocard{background:#fff;border:1.5px solid #EEE;border-radius:10px;padding:12px;margin-bottom:8px}
  .ocard:hover{border-color:var(--o3)}
  .oh{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}
  .oid{font-weight:700;font-size:12px;color:var(--o8)}
  .odt{font-size:10px;color:var(--tm);margin-left:5px}
  .ost{display:inline-block;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:600}
  .st-p{background:var(--g2);color:#C4850A}
  .st-d{background:var(--o1);color:var(--o7)}
  .osum{font-size:11px;color:var(--t2);line-height:1.4}
  .clb{margin-top:6px;padding:5px 12px;border:1.5px solid var(--o4);background:0;color:var(--o7);border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;transition:.2s;font-family:'DM Sans',sans-serif}
  .clb:hover{background:var(--o1)}

  .sug{background:linear-gradient(135deg,var(--g2),#FFF8E1);border:1.5px solid var(--g3);border-radius:10px;padding:14px;margin-bottom:14px}
  .sug-t{font-family:'Playfair Display',serif;font-size:14px;color:var(--o9);margin-bottom:3px}
  .sug-d{font-size:10px;color:var(--t2);margin-bottom:8px}
  .sug-b{padding:7px 16px;background:var(--o8);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:.2s}
  .sug-b:hover{background:var(--o7)}

  .mov{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:14px;animation:fi .2s}
  @keyframes fi{from{opacity:0}to{opacity:1}}
  .mod{background:#fff;border-radius:14px;width:100%;max-width:460px;max-height:85vh;overflow-y:auto;box-shadow:0 12px 40px rgba(26,46,26,.12);animation:su .3s}
  @keyframes su{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  .mod-h{padding:16px 16px 10px;border-bottom:1px solid #F0F0F0}
  .mod-b{padding:12px 16px}
  .mod-f{padding:10px 16px 16px;display:flex;gap:8px}
  .bp{flex:1;padding:10px;background:var(--o8);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
  .bp:hover{background:var(--o7)}
  .bs{flex:1;padding:10px;background:0;border:1.5px solid #DDD;border-radius:8px;font-size:12px;cursor:pointer;color:var(--t2);font-family:'DM Sans',sans-serif}
  .bs:hover{border-color:var(--o3)}

  .li{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #F5F5F5;font-size:11px}
  .li:last-child{border-bottom:none}
  .li-n{color:var(--tx);flex:1}
  .li-q{color:var(--tm);margin:0 8px;white-space:nowrap}

  .div{height:1px;background:#F0F0F0;margin:12px 0}

  .suc{text-align:center;padding:32px 16px}
  .suc-ic{font-size:52px;margin-bottom:12px;animation:bi .5s}
  @keyframes bi{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
  .suc-t{font-family:'Playfair Display',serif;font-size:20px;color:var(--o9);margin-bottom:5px}
  .suc-m{font-size:12px;color:var(--t2);line-height:1.5;margin-bottom:16px}

  .emp{text-align:center;padding:32px 16px;color:var(--tm)}
  .emp-i{font-size:40px;margin-bottom:8px;opacity:.4}
  `;
}

const FILTER_CATS = [
  { label: "Todos", match: null },
  { label: "Filtrado", match: ["PET Filtrado", "Vidrio Filtrado"] },
  { label: "Sin Filtrar", match: ["PET Sin Filtrar", "Vidrio Sin Filtrar", "Monodosis AOVE"] },
  { label: "Verde Oleum", match: ["Verde Oleum"] },
  { label: "Delirium", match: ["Delirium"] },
  { label: "Monodosis", match: ["Monodosis AOVE"] },
];

// ============================================================
// Image component with fallback
// ============================================================
function ProductImage({ src, alt, section }) {
  const [failed, setFailed] = useState(false);
  const fallbackEmoji = { "PET Filtrado":"📦🫒", "Vidrio Filtrado":"🍶🫒", "PET Sin Filtrar":"📦🌿", "Monodosis AOVE":"🔸", "Vidrio Sin Filtrar":"🍶🌿", "Verde Oleum":"🌿", "Delirium":"✨" };

  if (failed) {
    return (
      <div className="pimg-fb" style={{ background: SECTION_BG[section] || "#F5F5F5" }}>
        {fallbackEmoji[section] || "🫒"}
      </div>
    );
  }
  return <img className="pimg" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} referrerPolicy="no-referrer" crossOrigin="anonymous" />;
}

// ============================================================
// Components
// ============================================================

function ProductCard({ product, qty, onQtyChange }) {
  return (
    <div className={`pcard ${qty > 0 ? "sel" : ""}`}>
      <div className="pimg-w" style={{ background: SECTION_BG[product.section] || "#FAF6EF" }}>
        {qty > 0 && <span className="psel-b">×{qty}</span>}
        <ProductImage src={product.img} alt={product.name} section={product.section} />
      </div>
      <div className="pc-b">
        <div className="pn">{product.name}</div>
        <div className="pd">{product.desc}</div>
        {qty === 0 ? (
          <button className="ab" onClick={() => onQtyChange(product.id, 1)}>+ Añadir</button>
        ) : (
          <div className="qc">
            <button className="qb rm" onClick={() => onQtyChange(product.id, qty - 1)}>−</button>
            <span className="qv">{qty}</span>
            <button className="qb" onClick={() => onQtyChange(product.id, qty + 1)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onClone }) {
  const stL = { pending:"Pendiente", delivered:"Entregado", transit:"En reparto" };
  const stC = { pending:"st-p", delivered:"st-d", transit:"st-d" };
  const summary = order.items.map(i => {
    const p = CATALOG.find(c => c.id === i.productId);
    return p ? `${i.qty}× ${p.name}` : "";
  }).filter(Boolean).join(", ");

  return (
    <div className="ocard">
      <div className="oh">
        <div><span className="oid">{order.id}</span><span className="odt">{new Date(order.date).toLocaleDateString("es-ES",{day:"numeric",month:"short"})}</span></div>
        <span className={`ost ${stC[order.status]}`}>{stL[order.status]}</span>
      </div>
      <div className="osum">{summary}</div>
      <button className="clb" onClick={() => onClone(order)}>🔄 Repetir pedido</button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

const DEMO_ORDERS = [
  { id:"PED-2026-047", date:"2026-02-10", status:"delivered", items:[{productId:"F-PET-5L",qty:6},{productId:"MONO-AOVE",qty:2},{productId:"VO-B-500",qty:4}], invoice:true },
  { id:"PED-2026-038", date:"2026-01-28", status:"delivered", items:[{productId:"F-PET-5L",qty:4},{productId:"MONO-AOVE",qty:3},{productId:"F-VT-500",qty:2}], invoice:true },
  { id:"PED-2026-025", date:"2026-01-14", status:"delivered", items:[{productId:"SF-PET-5L",qty:8},{productId:"MONO-AOVE",qty:2}], invoice:false },
];

export default function App() {
  const [tab, setTab] = useState("pedido");
  const [qty, setQty] = useState({});
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("Todos");
  const [showConf, setShowConf] = useState(false);
  const [showSucc, setShowSucc] = useState(false);
  const [wantInv, setWantInv] = useState(true);
  const [defInv, setDefInv] = useState(true);
  const [notes, setNotes] = useState("");
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [profile, setProfile] = useState({ name:"Bar El Rincón", phone:"654 321 987", email:"elrincon@email.com", address:"C/ Real 14, Villanueva de Tapia", contact:"Antonio López" });

  // Group products by section (maintaining catalog order)
  const sections = useMemo(() => {
    const secs = [];
    let currentSec = null;
    const activeFilter = FILTER_CATS.find(c => c.label === catF);
    const filtered = CATALOG.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.section.toLowerCase().includes(search.toLowerCase());
      const matchCat = !activeFilter?.match || activeFilter.match.includes(p.section);
      return matchSearch && matchCat;
    });

    filtered.forEach(p => {
      if (p.section !== currentSec) {
        currentSec = p.section;
        secs.push({ name: p.section, products: [] });
      }
      secs[secs.length - 1].products.push(p);
    });
    return secs;
  }, [search, catF]);

  const cartItems = useMemo(() => Object.entries(qty).filter(([_,q]) => q>0).map(([id,q]) => ({product:CATALOG.find(p=>p.id===id),qty:q})).filter(i=>i.product), [qty]);
  const cartCount = useMemo(() => cartItems.reduce((s,i) => s+i.qty, 0), [cartItems]);

  const handleQty = useCallback((id, n) => {
    setQty(prev => { const next={...prev}; if(n<=0) delete next[id]; else next[id]=n; return next; });
  }, []);

  const handleClone = useCallback((order) => {
    const nq = {};
    order.items.forEach(i => { nq[i.productId] = i.qty; });
    setQty(nq);
    setTab("pedido");
  }, []);

  const suggested = useMemo(() => {
    if (!orders.length) return null;
    const freq = {};
    orders.slice(0,3).forEach(o => o.items.forEach(i => {
      if(!freq[i.productId]) freq[i.productId]={total:0,count:0};
      freq[i.productId].total+=i.qty; freq[i.productId].count++;
    }));
    const s = {};
    Object.entries(freq).forEach(([id,d]) => { s[id] = Math.round(d.total/d.count); });
    return s;
  }, [orders]);

  const submit = () => {
    const newO = {
      id:`PED-2026-${String(48+orders.length).padStart(3,"0")}`,
      date:new Date().toISOString().split("T")[0],
      status:"pending",
      items:cartItems.map(i=>({productId:i.product.id,qty:i.qty})),
      invoice:wantInv,
    };
    setOrders([newO,...orders]);
    setQty({}); setNotes(""); setShowConf(false); setShowSucc(true);
  };

  return (
    <div className="app">
      {/* HEADER */}
      <div className="hdr">
        <div className="hdr-top">
          <div className="logo-a">
            <div className="logo-m">AT</div>
            <div><div className="logo-t">Aceites Tapia</div><div className="logo-s">Pedidos HORECA</div></div>
          </div>
          <button className="u-p" onClick={() => setTab("perfil")}>
            <div className="u-a">{profile.name.charAt(0)}</div>
            <span>{profile.name.split(" ").slice(0,2).join(" ")}</span>
          </button>
        </div>
        <div className="nav">
          <button className={`nb ${tab==="pedido"?"on":""}`} onClick={() => setTab("pedido")}>
            Nuevo Pedido{cartCount>0 && <span className="bdg">{cartCount}</span>}
          </button>
          <button className={`nb ${tab==="historial"?"on":""}`} onClick={() => setTab("historial")}>Historial</button>
          <button className={`nb ${tab==="perfil"?"on":""}`} onClick={() => setTab("perfil")}>Mi Perfil</button>
        </div>
      </div>

      <div className="main">
        {/* === NUEVO PEDIDO === */}
        {tab === "pedido" && <>
          {suggested && Object.keys(qty).length === 0 && (
            <div className="sug">
              <div className="sug-t">💡 Pedido sugerido</div>
              <div className="sug-d">Basado en tus últimos pedidos — tus productos y cantidades habituales.</div>
              <button className="sug-b" onClick={() => setQty(suggested)}>Aplicar sugerencia</button>
            </div>
          )}

          <div className="stit">Catálogo</div>
          <div className="ssub">{CATALOG.length} artículos disponibles</div>

          <div className="srch-w">
            <span className="srch-i">🔍</span>
            <input className="srch" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="chips">
            {FILTER_CATS.map(c => (
              <button key={c.label} className={`chip ${catF===c.label?"on":""}`} onClick={() => setCatF(c.label)}>{c.label}</button>
            ))}
          </div>

          {sections.map(sec => {
            const sc = SEC_COLORS[sec.name] || { bg:"#F5F5F5", color:"#666", icon:"📦" };
            return (
              <div key={sec.name}>
                <div className="sec-h" style={{ background: sc.bg, color: sc.color }}>
                  <span>{sc.icon}</span> {sec.name}
                </div>
                <div className="pgrid">
                  {sec.products.map(p => (
                    <ProductCard key={p.id} product={p} qty={qty[p.id]||0} onQtyChange={handleQty} />
                  ))}
                </div>
              </div>
            );
          })}

          {sections.length === 0 && <div className="emp"><div className="emp-i">🔍</div><p>No se encontraron productos</p></div>}
        </>}

        {/* === HISTORIAL === */}
        {tab === "historial" && <>
          <div className="stit">Historial de Pedidos</div>
          <div className="ssub">{orders.length} pedidos realizados</div>
          {orders.length === 0 ? (
            <div className="emp"><div className="emp-i">📋</div><p>Aún no tienes pedidos</p></div>
          ) : orders.map(o => <OrderCard key={o.id} order={o} onClone={handleClone} />)}
        </>}

        {/* === PERFIL === */}
        {tab === "perfil" && <>
          <div className="stit">Mi Perfil</div>
          <div className="ssub">Datos de tu establecimiento</div>
          <div className="fg"><label className="fl">Nombre del establecimiento</label><input className="fi" value={profile.name} onChange={e => setProfile({...profile,name:e.target.value})} /></div>
          <div className="fg"><label className="fl">Persona de contacto</label><input className="fi" value={profile.contact} onChange={e => setProfile({...profile,contact:e.target.value})} /></div>
          <div className="fg"><label className="fl">Teléfono</label><input className="fi" value={profile.phone} onChange={e => setProfile({...profile,phone:e.target.value})} /></div>
          <div className="fg"><label className="fl">Correo electrónico</label><input className="fi" type="email" value={profile.email} onChange={e => setProfile({...profile,email:e.target.value})} /></div>
          <div className="fg"><label className="fl">Dirección de entrega</label><input className="fi" value={profile.address} onChange={e => setProfile({...profile,address:e.target.value})} /></div>
          <div className="div" />
          <div className="stit" style={{fontSize:14}}>Preferencias de Facturación</div>
          <div className="trow">
            <div><div className="tl">Recibir factura por defecto</div><div className="td">Se incluirá factura salvo que indiques lo contrario</div></div>
            <button className={`tog ${defInv?"on":""}`} onClick={() => setDefInv(!defInv)} />
          </div>
        </>}
      </div>

      {/* CART BAR */}
      {tab === "pedido" && (
        <div className="cart">
          <div>
            <div className="cart-n">{cartCount} caja{cartCount!==1?"s":""} seleccionada{cartCount!==1?"s":""}</div>
            <div className="cart-t">{cartCount > 0 ? "Listo para enviar" : "Selecciona productos"}</div>
          </div>
          <button className="cart-b" disabled={cartCount===0} onClick={() => {setWantInv(defInv);setShowConf(true);}}>
            Revisar Pedido →
          </button>
        </div>
      )}

      {/* CONFIRM */}
      {showConf && (
        <div className="mov" onClick={() => setShowConf(false)}>
          <div className="mod" onClick={e => e.stopPropagation()}>
            <div className="mod-h">
              <div className="stit" style={{fontSize:16}}>Confirmar Pedido</div>
              <div className="ssub" style={{marginBottom:0}}>{profile.name} · {profile.address}</div>
            </div>
            <div className="mod-b">
              {cartItems.map(i => (
                <div key={i.product.id} className="li">
                  <span className="li-n">{i.product.name}</span>
                  <span className="li-q">{i.qty} {i.product.id==="DEL-500"?"ud":"caja"}{i.qty>1?"s":""}</span>
                </div>
              ))}
              <div className="div" />
              <div className="trow" style={{borderBottom:"none"}}>
                <div><div className="tl">Incluir factura</div><div className="td">Para este pedido</div></div>
                <button className={`tog ${wantInv?"on":""}`} onClick={() => setWantInv(!wantInv)} />
              </div>
              <div className="fg" style={{marginTop:8}}>
                <label className="fl">Notas / observaciones</label>
                <textarea className="ft" placeholder="Ej: Entregar antes de las 12h, puerta trasera..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="mod-f">
              <button className="bs" onClick={() => setShowConf(false)}>Volver</button>
              <button className="bp" onClick={submit}>Enviar Pedido ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {showSucc && (
        <div className="mov" onClick={() => setShowSucc(false)}>
          <div className="mod" onClick={e => e.stopPropagation()}>
            <div className="suc">
              <div className="suc-ic">✅</div>
              <div className="suc-t">¡Pedido enviado!</div>
              <div className="suc-m">Tu pedido ha sido recibido. Recibirás confirmación en <strong>{profile.email}</strong> y te avisaremos cuando salga a reparto.</div>
              <button className="bp" style={{width:"auto",padding:"10px 24px"}} onClick={() => {setShowSucc(false);setTab("historial");}}>Ver mis pedidos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

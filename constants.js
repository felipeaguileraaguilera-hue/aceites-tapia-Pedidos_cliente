import { useState, useEffect } from "react";
import * as api from '../api';

const fmt = (n) => n != null ? Math.round(n) + '€' : '';

const DISPLAY_GROUPS = [
  {
    title: 'Verde Oleum',
    bg: '#1A2016', titleColor: '#C4A54D',
    products: [
      { id: 'VO_LATA_5L', label: 'LATA VERDE OLEUM 5 LITROS', emoji: '🌿' },
      { id: 'VO_LATA_750', label: 'LATA VERDE OLEUM 750 ML', emoji: '🌿' },
      { id: 'VO_LATA_250', label: 'LATA VERDE OLEUM 250 ML', emoji: '🌿' },
      { id: 'VO_BOT_500', label: 'BOTELLA VERDE OLEUM 500 ML', emoji: '🌿' },
      { id: 'VO_BOT_250', label: 'BOTELLA VERDE OLEUM 250 ML', emoji: '🌿' },
    ],
    boxes: [
      { id: 'VO_CAJA_4x5L', label: 'Caja 4×5L' },
      { id: 'VO_CAJA_15x750', label: 'Caja 15×750ML' },
      { id: 'VO_CAJA_28x250', label: 'Caja 28×250ML' },
      { id: 'VO_CAJA_15x500', label: 'Caja 15×500ML' },
      { id: 'VO_CAJA_30x250', label: 'Caja 30×250ML' },
    ]
  },
  {
    title: 'Marasca Transparente',
    bg: '#5A4A2A', titleColor: '#fff',
    products: [
      { id: 'TO_MT_750', label: 'MARASCA TRANS. 750 ML', emoji: '🍾' },
      { id: 'TO_MT_500', label: 'MARASCA TRANS. 500 ML', emoji: '🍾' },
      { id: 'TO_MT_250', label: 'MARASCA TRANS. 250 ML', emoji: '🍾' },
    ],
    boxes: [
      { id: 'TO_CAJA_15x750', label: 'Caja 15×750ML' },
      { id: 'TO_CAJA_24x500MT', label: 'Caja 24×500ML' },
      { id: 'TO_CAJA_20x500MT', label: 'Caja 20×250ML' },
    ]
  },
  {
    title: 'PET — Tapia Original',
    bg: '#2A3326', titleColor: '#fff',
    products: [
      { id: 'TO_PET_5L', label: 'PET 5 LITROS', emoji: '📦' },
      { id: 'TO_PET_2L', label: 'PET 2 LITROS', emoji: '📦' },
      { id: 'TO_PET_1L', label: 'PET 1 LITRO', emoji: '📦' },
      { id: 'TO_PET_500', label: 'PET 500 ML', emoji: '📦' },
      { id: 'TO_PET_250', label: 'PET 250 ML', emoji: '📦' },
    ],
    boxes: [
      { id: 'TO_CAJA_3x5L', label: 'Caja 3×5L' },
      { id: 'TO_CAJA_6x2L', label: 'Caja 6×2L' },
      { id: 'TO_CAJA_15x1L', label: 'Caja 15×1L' },
      { id: 'TO_CAJA_28x500', label: 'Caja 28×500ML' },
      { id: 'TO_CAJA_24x250', label: 'Caja 24×250ML' },
    ]
  },
];

export default function ClientTariff() {
  const [tariff, setTariff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noTariff, setNoTariff] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await api.getActiveTariff();
      if (data) setTariff(data);
      else setNoTariff(true);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading"><div className="loading-spin" /><p>Cargando tarifa...</p></div>;
  
  if (noTariff) return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{ fontSize: 40, marginBottom: 8, opacity: .4 }}>📋</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#4A5A46' }}>No hay tarifa publicada</div>
      <div style={{ fontSize: 11, color: '#8A9A86', marginTop: 4 }}>La tarifa estará disponible próximamente.</div>
    </div>
  );

  const prices = tariff.product_prices || [];
  const getPrice = (id) => {
    const p = prices.find(x => x.id === id);
    return p?.horeca_r ? fmt(p.horeca_r) : '';
  };

  return (
    <div>
      <div className="stit">Tarifa Vigente</div>
      
      {/* Header card */}
      <div style={{ background: 'linear-gradient(135deg, #1A2016, #2A3326)', borderRadius: 10, padding: '14px 16px', color: '#fff', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>ACEITES TAPIA</div>
            <div style={{ fontSize: 9, opacity: .6 }}>Desde 1993 · Villanueva de Tapia</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, opacity: .6 }}>{tariff.version_code}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{tariff.name}</div>
          </div>
        </div>
        {tariff.published_at && (
          <div style={{ fontSize: 9, opacity: .7, marginTop: 6, textAlign: 'center' }}>
            Vigente desde: {new Date(tariff.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: '#8A9A86', marginBottom: 10 }}>Precios por unidad/caja · IVA incluido</div>

      {/* Product sections */}
      {DISPLAY_GROUPS.map(group => (
        <div key={group.title} style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #EEE' }}>
          <div style={{ background: group.bg, color: group.titleColor, padding: '8px 14px', fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13, letterSpacing: .5 }}>
            {group.title}
          </div>
          
          {/* Units */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, padding: '10px 10px 4px' }}>
            {group.products.map(prod => (
              <div key={prod.id} style={{ textAlign: 'center', width: 90, padding: '6px 2px' }}>
                <div style={{ fontSize: 22, marginBottom: 2 }}>{prod.emoji}</div>
                <div style={{ fontSize: 7, fontWeight: 600, color: '#777', textTransform: 'uppercase', lineHeight: 1.2, minHeight: 22 }}>{prod.label}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: '#1A2016', marginTop: 3 }}>{getPrice(prod.id)}</div>
              </div>
            ))}
          </div>

          {/* Boxes */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, padding: '2px 10px 10px' }}>
            {group.boxes.map(box => (
              <div key={box.id} style={{ background: '#FAFAF8', border: '1px solid #EEE', borderRadius: 4, padding: '4px 8px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 7, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{box.label}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A2016' }}>{getPrice(box.id)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: 8, color: '#AAA', padding: '8px 0', lineHeight: 1.5 }}>
        CARRETERA A-333 KM. 59 · 29315 VILLANUEVA DE TAPIA (MÁLAGA)<br />
        TLF.: +34 952 75 01 22 · www.aceitestapia.com
      </div>
    </div>
  );
}

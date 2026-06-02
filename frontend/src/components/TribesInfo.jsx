import { useState } from 'react';
import { BookOpen, TreePine, MapPin, Sparkles, Info } from 'lucide-react';

const TRIBES_DATA = [
  {
    name: 'Soliga',
    districts: 'Chamarajanagara (BR Hills), Mysuru',
    population: '~40,000',
    produce: 'Honey, Lichens, Bamboo shoot, Wild gooseberry (Amla), Soapnut',
    bg: '#edf5ed',
    text: '#2e7d32',
    desc: 'The Soligas are an indigenous community residing in the Biligirirangana Hills (BR Hills) and Male Mahadeshwara Hills. They are historically the first tribal community to reside in the core area of a tiger reserve to have their forest rights formally recognized under the FRA 2006. They practice shifting cultivation and are expert foragers of honey and non-timber forest produce (NTFP).',
    practices: 'Perform "Pooja" to forest trees, use organic conservation techniques, and have deep traditional knowledge of over 300 medicinal plant species.'
  },
  {
    name: 'Jenu Kuruba',
    districts: 'Mysuru, Kodagu, Chamarajanagara',
    population: '~35,000',
    produce: 'Wild Honey, Wax, Gums, Medicinal roots',
    bg: '#edf5ed',
    text: '#2e7d32',
    desc: 'The Jenu Kurubas ("Jenu" meaning honey and "Kuruba" meaning shepherd/gatherer) are a traditional honey-gathering tribe in the Western Ghats. They are designated as a Particularly Vulnerable Tribal Group (PVTG) due to low literacy and high forest dependency. Their dwellings ("haadis") are located inside the Nagarahole and Bandipur forests.',
    practices: 'Renowned for climbing tall trees using forest vines to harvest honey at night, respecting bee cycles so colonies regenerate.'
  },
  {
    name: 'Koraga',
    districts: 'Udupi, Dakshina Kannada, Kodagu',
    population: '~16,000',
    produce: 'Bamboo basketry, Coir items, Forest creepers',
    bg: '#edf5ed',
    text: '#2e7d32',
    desc: 'The Koragas are a small PVTG tribal community historically residing in the coastal districts and adjacent hilly areas. They are known for their exceptional skills in basket weaving and leaf-craft. The FRA has been a critical tool in helping them secure land rights outside of traditional landlord dependencies.',
    practices: 'Maintain distinct musical drumming traditions ("Koraga Dolla") and possess unique knowledge of coastal forest vine basketry.'
  },
  {
    name: 'Malekudiya',
    districts: 'Chikkamagaluru, Dakshina Kannada, Kodagu',
    population: '~25,000',
    produce: 'Areca palm leaves, Wild cardamom, Toddy tapping, Gums',
    bg: '#edf5ed',
    text: '#2e7d32',
    desc: 'The Malekudiyas ("Male" meaning forest-mountain and "Kudiya" meaning dweller) reside in the dense evergreen forests of the Western Ghats. They are traditional cultivators of forest cardamom and black pepper. They have active claims under Form A (Individual Farm Rights) for small forest patches.',
    practices: 'Incredibly skilled in building rope-bridges and harvesting wild cardamom on steep slopes without damaging surrounding forest canopies.'
  },
  {
    name: 'Hasala',
    districts: 'Shivamogga, Chikkamagaluru',
    population: '~22,000',
    produce: 'Wild fruits, Fuelwood, Soapnut, Gums',
    bg: '#edf5ed',
    text: '#2e7d32',
    desc: 'The Hasalas are a forest-dwelling tribe located in the Malnad region of Shivamogga and Chikkamagaluru. They are historically gatherers of forest herbs and are closely linked with the conservation of holy groves ("Devara Kadu") in their villages.',
    practices: 'Serve as keepers of village forest shrines and act as traditional herbal doctors for forest-border communities.'
  },
  {
    name: 'Hakki-Pikki',
    districts: 'Shivamogga, Mysuru, Hassan',
    population: '~12,000',
    produce: 'Medicinal oils, Lichens, Natural dyes, Wild flowers',
    bg: '#edf5ed',
    text: '#2e7d32',
    desc: 'The Hakki-Pikkis ("Hakki" meaning bird and "Pikki" meaning bird catchers) are semi-nomadic forest dwellers. Historically bird hunters, they have successfully transitioned into extracting and brewing herbal oils, hair care formulations, and organic forest remedies, exporting their products globally in recent years.',
    practices: 'Retain nomadic travel routes, harvesting seasonal plants from forest borders and brewing active herbal extracts.'
  }
];

export default function TribesInfo() {
  const [selected, setSelected] = useState(0);

  const active = TRIBES_DATA[selected];

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f4f9f4',
      padding: '20px 24px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Title & Help Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a301a', margin: 0 }}>Forest Tribes of Karnataka</h2>
          <p style={{ fontSize: 11, color: '#4a7c59', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Scheduled Tribes (ST) & Particularly Vulnerable Groups (PVTG)
          </p>
        </div>
        <div style={{
          background: '#e8f2e8',
          border: '1px solid #cbdcce',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 520
        }}>
          <Info size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#2d4030', lineHeight: 1.3 }}>
            <strong>Section Guide</strong>: Learn about the indigenous forest dwellers whose ancestral land rights are formally protected and recognized under the Forest Rights Act (FRA), 2006.
          </span>
        </div>
      </div>

      {/* Main Grid Layout (Fits screen, scrolls internally) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 16,
        flex: 1,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Tribe Selection List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', paddingRight: 4 }}>
          {TRIBES_DATA.map((t, idx) => (
            <div
              key={t.name}
              onClick={() => setSelected(idx)}
              style={{
                background: selected === idx ? '#355e3b' : 'white',
                color: selected === idx ? '#ffffff' : '#2d4030',
                border: `1px solid ${selected === idx ? '#355e3b' : '#c8dcd0'}`,
                borderRadius: 8,
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => {
                if (selected !== idx) e.currentTarget.style.background = '#edf5ed';
              }}
              onMouseLeave={e => {
                if (selected !== idx) e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
              <div style={{
                fontSize: 8,
                padding: '2px 6px',
                borderRadius: 4,
                background: selected === idx ? 'rgba(255,255,255,0.15)' : '#e8f2e8',
                color: selected === idx ? '#ffffff' : '#2e7d32',
                fontWeight: 800
              }}>
                {t.name === 'Jenu Kuruba' || t.name === 'Koraga' ? 'PVTG' : 'ST'}
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Detail Card (Scrolls internally) */}
        <div style={{
          background: 'white',
          borderRadius: 10,
          border: '1px solid #c8dcd0',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Header Accent block */}
          <div style={{ background: '#edf5ed', borderBottom: '1px solid #c8dcd0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#355e3b', margin: 0 }}>{active.name} Tribe Profile</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#556a59', fontWeight: 600 }}>
                <MapPin size={12}/>
                <span>{active.districts}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: '#556a59', fontWeight: 700 }}>Population</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#2e7d32' }}>{active.population}</div>
            </div>
          </div>

          {/* Details Body */}
          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Background */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59', marginBottom: 4 }}>
                <BookOpen size={12}/> Background & History
              </div>
              <p style={{ fontSize: 12.5, color: '#2d4030', lineHeight: 1.5, margin: 0 }}>
                {active.desc}
              </p>
            </div>

            {/* Produce & Practices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fcfdfc', border: '1px dashed #cbdcce', borderRadius: 6, padding: '12px 16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59', marginBottom: 4 }}>
                  <TreePine size={12}/> Non-Timber Forest Produce
                </div>
                <div style={{ fontSize: 12, color: '#132a13', fontWeight: 700 }}>
                  {active.produce}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59', marginBottom: 4 }}>
                  <Sparkles size={12}/> Traditional Customs
                </div>
                <div style={{ fontSize: 12, color: '#132a13', fontWeight: 700 }}>
                  Sustainable ecosystem maintenance & sacred groves guardianship.
                </div>
              </div>
            </div>

            {/* Environmental quote */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59', marginBottom: 4 }}>
                🌿 Forest Conservation Customs
              </div>
              <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                "{active.practices}"
              </p>
            </div>

            {/* Statutory Rights */}
            <div style={{ borderTop: '1px solid #edf5ed', paddingTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#355e3b', marginBottom: 6 }}>
                ⚖️ FRA Statutory Protections
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 11, color: '#4a5568', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <li>Right to own and cultivate forest land plots under IFR</li>
                <li>Right to gather and sell Minor Forest Produce</li>
                <li>Ownership rights over community forest resources (CFR)</li>
                <li>Protection from displacement without Gram Sabha consent</li>
              </ul>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

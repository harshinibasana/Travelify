const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

// Curated visa database — enriched and kept current
// Source references: IATA, official embassy sites
const VISA_DB = {
  USA:       { flag:'🇺🇸', type:'ESTA',                  color:'#0A4D6E', days:90,  fee:'$21',      processing:'Instant (within 72hrs)',  link:'https://esta.cbp.dhs.gov',          requirements:['Valid passport (6+ months validity)','Return/onward ticket','Proof of sufficient funds','No criminal record','Not from a travel-ban country'], notes:'Apply minimum 72 hours before travel. Valid for 2 years / multiple entries. Citizens of 42 ESTA-eligible countries only.', lastUpdated:'2025-01' },
  UK:        { flag:'🇬🇧', type:'eTA',                   color:'#1e3a5f', days:180, fee:'£10',      processing:'Same day to 3 days',       link:'https://www.gov.uk/apply-uk-visa',   requirements:['Valid passport','Return ticket','Proof of accommodation','Bank statements (3 months)'], notes:'UK eTA required from 2024 for visa-exempt visitors arriving by air. Check gov.uk for latest country list.', lastUpdated:'2024-12' },
  SCHENGEN:  { flag:'🇪🇺', type:'Schengen Visa (C)',      color:'#003399', days:90,  fee:'€80',      processing:'15 working days',          link:'https://www.schengenvisainfo.com',   requirements:['Valid passport (3+ months beyond stay)','Travel insurance min €30,000','Hotel/accommodation bookings','Return flight itinerary','Bank statements (last 3 months)','Visa application form','2 recent passport photos'], notes:'Covers 27 EU Schengen countries. Apply at embassy of your primary destination. Max 90 days in any 180-day period.', lastUpdated:'2025-01' },
  JAPAN:     { flag:'🇯🇵', type:'Visa-Free',              color:'#BC002D', days:90,  fee:'Free',      processing:'On arrival',               link:'https://www.mofa.go.jp/j_info/visit/visa/', requirements:['Valid passport','Return/onward ticket','Proof of sufficient funds (¥100,000+ recommended)'], notes:'Visa-free for 68 countries. India, Pakistan, Philippines & others require visa. Check MOFA website for your nationality.', lastUpdated:'2025-01' },
  AUSTRALIA: { flag:'🇦🇺', type:'eVisitor / ETA',         color:'#00008B', days:90,  fee:'Free/AUD$20',processing:'Instant to 24hrs',        link:'https://immi.homeaffairs.gov.au',    requirements:['Valid passport (eligible countries only)','Return/onward ticket','Sufficient funds','No serious criminal convictions'], notes:'eVisitor (651) free for EU/UK/US. ETA (601) AUD$20 for select Asian passports. Others require full tourist visa.', lastUpdated:'2025-01' },
  CANADA:    { flag:'🇨🇦', type:'eTA',                   color:'#FF0000', days:180, fee:'CAD$7',     processing:'Minutes (up to 72hrs)',    link:'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html', requirements:['Valid passport from visa-exempt country','Credit card for payment','Valid email address'], notes:'eTA required for air travel only. US citizens exempt. Land/sea border — eTA not required. Valid 5 years or passport expiry.', lastUpdated:'2024-11' },
  INDIA:     { flag:'🇮🇳', type:'e-Visa (Tourist)',       color:'#FF9933', days:90,  fee:'$25–$80',   processing:'3–5 business days',       link:'https://indianvisaonline.gov.in',    requirements:['Valid passport (6+ months)','Recent digital photo','Return ticket','Bank statement','Hotel confirmation for first night'], notes:'e-Visa allows double entry within 90 days. Apply minimum 4 days before arrival. Port of entry must be one of 28 designated airports.', lastUpdated:'2025-01' },
  THAILAND:  { flag:'🇹🇭', type:'Visa Exemption',         color:'#A51931', days:60,  fee:'Free',      processing:'On arrival',               link:'https://www.thaiembassy.com',        requirements:['Valid passport (6+ months)','Return/onward ticket','Proof of funds (10,000 THB or $500)','Accommodation proof'], notes:'Extended to 60 days for most nationalities from Nov 2024. One extension possible at immigration (500 THB). No visa for 93 countries.', lastUpdated:'2025-01' },
  DUBAI:     { flag:'🇦🇪', type:'Visa-Free / On Arrival', color:'#006600', days:30,  fee:'Free',      processing:'On arrival',               link:'https://u.ae/en/information-and-services/visa-and-emirates-id', requirements:['Valid passport (6+ months)','Return ticket','Hotel booking or sponsor letter','Proof of funds'], notes:'Free visa on arrival for 50+ nationalities. US, UK, EU, Australia get 30 days extendable. Indians with valid US/UK visa get on-arrival. Others need prior visa.', lastUpdated:'2025-01' },
  SINGAPORE: { flag:'🇸🇬', type:'Visa-Free',              color:'#EF3340', days:30,  fee:'Free',      processing:'On arrival',               link:'https://www.ica.gov.sg',             requirements:['Valid passport (6+ months)','Return/onward ticket','Sufficient funds','Proof of accommodation'], notes:'Visa-free for 162 countries for up to 30 days. Extendable once at ICA. Yellow fever vaccination required if arriving from endemic areas.', lastUpdated:'2024-10' },
  TURKEY:    { flag:'🇹🇷', type:'e-Visa',                 color:'#C8102E', days:90,  fee:'$51–$77',   processing:'Instant (minutes)',        link:'https://www.evisa.gov.tr',           requirements:['Valid passport (min 60 days beyond visa validity)','Valid credit/debit card','Valid email address'], notes:'e-Visa is single or multiple entry. Citizens of 95 countries eligible. Some nationalities pay different fees. US/UK: $51. Check evisa.gov.tr.', lastUpdated:'2025-01' },
  BRAZIL:    { flag:'🇧🇷', type:'eVisa / Visa-Free',      color:'#009C3B', days:90,  fee:'Free/$80',  processing:'On arrival / 5–10 days',  link:'https://www.gov.br/mre/pt-br/assuntos/portal-consular/vistos', requirements:['Valid passport','Return/onward ticket','Proof of funds','Yellow fever vaccination (some regions)'], notes:'US, Canada, Australia now require eVisa ($80). EU/UK still visa-free. eVisa: apply 72hrs before travel at migracao.serpro.gov.br.', lastUpdated:'2025-01' },
  BALI:      { flag:'🇮🇩', type:'Visa on Arrival',        color:'#CE1126', days:30,  fee:'IDR 500,000 (~$31)',processing:'On arrival (15–30 min)', link:'https://molina.imigrasi.go.id',    requirements:['Valid passport (6+ months)','Return/onward ticket','Sufficient funds','Cash for VoA fee'], notes:'Bali is part of Indonesia. VoA for 60 nationalities. Extendable once (30 more days). e-VOA also available online before departure.', lastUpdated:'2025-01' },
  MEXICO:    { flag:'🇲🇽', type:'Visa-Free (FMM)',        color:'#006847', days:180, fee:'Free',       processing:'On arrival',               link:'https://www.gob.mx/inm',             requirements:['Valid passport','Return/onward ticket','Sufficient funds ($50/day recommended)','FMM tourist card (issued on arrival/flight)'], notes:'No visa required for 60+ nationalities. FMM card (Forma Migratoria Múltiple) issued free on arrival or on the plane. Keep it — you need it to exit.', lastUpdated:'2024-09' },
  MALDIVES:  { flag:'🇲🇻', type:'Visa on Arrival',        color:'#D21034', days:30,  fee:'Free',       processing:'On arrival',               link:'https://www.immigration.gov.mv',     requirements:['Valid passport','Return/onward ticket','Hotel/resort booking confirmation','Sufficient funds ($100/day)'], notes:'Free 30-day visa on arrival for ALL nationalities. Extendable up to 90 days. Yellow fever certificate if arriving from endemic country.', lastUpdated:'2024-10' },
};

// GET /api/visa/check?destination=JAPAN
router.get('/check', protect, async (req, res) => {
  const dest = (req.query.destination || '').toUpperCase().trim();
  
  if (!dest) {
    return res.json({ success:true, destinations: Object.keys(VISA_DB), visa:null });
  }

  // Direct match
  if (VISA_DB[dest]) {
    return res.json({ success:true, visa:{ ...VISA_DB[dest], destination:dest }, cached:false, source:'Travelify verified database' });
  }

  // Fuzzy match — check if destination name contains a known key
  const match = Object.keys(VISA_DB).find(k =>
    dest.includes(k) || k.includes(dest) ||
    (k==='SCHENGEN' && ['FRANCE','GERMANY','ITALY','SPAIN','NETHERLANDS','GREECE','PORTUGAL','AMSTERDAM','PARIS','ROME','BARCELONA','BERLIN','ATHENS','LISBON','VIENNA','PRAGUE','AMSTERDAM','BRUSSELS','ZURICH'].some(e=>dest.includes(e)))
  );
  
  if (match) {
    return res.json({ success:true, visa:{ ...VISA_DB[match], destination:match }, cached:false, source:'Travelify verified database' });
  }

  // Not found
  return res.json({ success:true, visa:null, destination:dest, available: Object.keys(VISA_DB) });
});

// GET /api/visa/all — return full database
router.get('/all', protect, async (req, res) => {
  res.json({ success:true, destinations: VISA_DB, lastUpdated: new Date().toISOString() });
});

module.exports = router;

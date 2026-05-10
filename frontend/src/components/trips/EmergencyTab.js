import React, { useState, useEffect } from 'react';
import { Shield, Phone, Heart, AlertTriangle, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './EmergencyTab.css';

const LS_KEY = (tripId) => `travelify_emergency_${tripId}`;
const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

const BLANK = {
  bloodType:'', allergies:'', medications:'', conditions:'',
  emergencyName:'', emergencyPhone:'', emergencyRelation:'',
  insuranceName:'', insurancePolicy:'', insurancePhone:'',
  localEmergency:'', localHospital:'', localPolice:'', localAmbulance:'',
  passportNumber:'', passportExpiry:'', nationality:'',
};

export default function EmergencyTab({ tripId, trip }) {
  const [info, setInfo]   = useState(BLANK);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY(tripId));
      if (s) setInfo({ ...BLANK, ...JSON.parse(s) });
    } catch {}
  }, [tripId]);

  const f = (k,v) => setInfo(p => ({ ...p, [k]:v }));

  const handleSave = () => {
    try {
      localStorage.setItem(LS_KEY(tripId), JSON.stringify(info));
      setSaved(true);
      toast.success('Emergency info saved ✅');
      setTimeout(() => setSaved(false), 2500);
    } catch { toast.error('Save failed'); }
  };

  const Section = ({ icon:Icon, title, color, children }) => (
    <div className="em-section">
      <div className="em-section-head" style={{borderLeftColor:color}}>
        <Icon size={15} color={color}/>
        <span>{title}</span>
      </div>
      <div className="em-section-body">{children}</div>
    </div>
  );

  const Field = ({ label, k, type='text', placeholder='', options=null }) => (
    <div className="em-field">
      <label className="em-label">{label}</label>
      {options
        ? <select className="em-input" value={info[k]} onChange={e=>f(k,e.target.value)}>
            <option value="">Select...</option>
            {options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} className="em-input" placeholder={placeholder}
            value={info[k]} onChange={e=>f(k,e.target.value)}/>
      }
    </div>
  );

  return (
    <div className="emergency-tab">
      <div className="em-header">
        <div className="em-header-left">
          <Shield size={22} color="#EF4444"/>
          <div>
            <h3>Emergency Information Card</h3>
            <p>Saved locally on this device — show to medical staff if needed</p>
          </div>
        </div>
        <button className={`btn btn-sm ${saved?'btn-ghost':'btn-primary'}`} onClick={handleSave}>
          <Save size={14}/> {saved ? 'Saved ✅' : 'Save'}
        </button>
      </div>

      {/* Quick card preview */}
      {(info.bloodType || info.emergencyName) && (
        <div className="em-card-preview">
          <div className="em-card-top">
            <span className="em-card-name">{trip?.title || 'Traveler'}</span>
            {info.bloodType && <span className="em-blood-badge">🩸 {info.bloodType}</span>}
          </div>
          <div className="em-card-grid">
            {info.allergies       && <div className="em-card-item"><span>⚠️ Allergies</span><strong>{info.allergies}</strong></div>}
            {info.medications     && <div className="em-card-item"><span>💊 Medications</span><strong>{info.medications}</strong></div>}
            {info.emergencyName   && <div className="em-card-item"><span>📞 Emergency</span><strong>{info.emergencyName} {info.emergencyPhone}</strong></div>}
            {info.insuranceName   && <div className="em-card-item"><span>🏥 Insurance</span><strong>{info.insuranceName} · {info.insurancePolicy}</strong></div>}
          </div>
        </div>
      )}

      <div className="em-grid">
        <Section icon={Heart} title="Medical Information" color="#EF4444">
          <Field label="Blood Type" k="bloodType" options={BLOOD_TYPES}/>
          <Field label="Allergies" k="allergies" placeholder="e.g. Penicillin, Peanuts"/>
          <Field label="Current Medications" k="medications" placeholder="e.g. Metformin 500mg"/>
          <Field label="Medical Conditions" k="conditions" placeholder="e.g. Diabetes, Asthma"/>
        </Section>

        <Section icon={Phone} title="Emergency Contact" color="#0A4D6E">
          <Field label="Full Name" k="emergencyName" placeholder="Contact name"/>
          <Field label="Phone" k="emergencyPhone" placeholder="+1 555 000 0000" type="tel"/>
          <Field label="Relation" k="emergencyRelation" placeholder="e.g. Wife, Parent"/>
        </Section>

        <Section icon={Shield} title="Travel Insurance" color="#6B8F71">
          <Field label="Insurance Provider" k="insuranceName" placeholder="e.g. World Nomads"/>
          <Field label="Policy Number" k="insurancePolicy" placeholder="Policy #"/>
          <Field label="Claims Phone" k="insurancePhone" placeholder="24hr hotline"/>
        </Section>

        <Section icon={AlertTriangle} title="Local Emergency Numbers" color="#F5A623">
          <Field label="Local Emergency (destination)" k="localEmergency" placeholder="e.g. 911, 999, 112"/>
          <Field label="Nearest Hospital" k="localHospital" placeholder="Hospital name & address"/>
          <Field label="Police" k="localPolice" placeholder="Local police number"/>
          <Field label="Ambulance" k="localAmbulance" placeholder="Local ambulance number"/>
        </Section>

        <Section icon={Shield} title="Travel Documents" color="#8B5CF6">
          <Field label="Passport Number" k="passportNumber" placeholder="A12345678"/>
          <Field label="Passport Expiry" k="passportExpiry" type="date"/>
          <Field label="Nationality" k="nationality" placeholder="e.g. American"/>
        </Section>
      </div>

      <button className="btn btn-primary" style={{width:'100%',marginTop:4}} onClick={handleSave}>
        <Save size={15}/> Save Emergency Card
      </button>
    </div>
  );
}

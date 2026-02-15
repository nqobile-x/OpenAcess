import React from 'react';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
}

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm mb-2 cursor-pointer active:scale-[0.99] transition-transform">
    <span className="text-slate-700 font-medium">{label}</span>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
    />
  </label>
);

const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
    <div className="flex flex-col gap-1">
      {children}
    </div>
  </div>
);

export default function ProfileSetup({ profile, onSave }: Props) {
  const update = (category: keyof UserProfile, key: string, value: boolean) => {
    onSave({
      ...profile,
      [category]: {
        ...profile[category],
        [key]: value
      }
    });
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">My Accessibility Profile</h2>
        <p className="text-slate-600">Customize your experience. We filter search results and tailor AI responses based on these settings.</p>
      </div>

      <Section title="Mobility">
        <Toggle label="Wheelchair User" checked={profile.mobility.wheelchair} onChange={(v) => update('mobility', 'wheelchair', v)} />
        <Toggle label="Uses Walker" checked={profile.mobility.walker} onChange={(v) => update('mobility', 'walker', v)} />
        <Toggle label="Avoid Stairs" checked={profile.mobility.noStairs} onChange={(v) => update('mobility', 'noStairs', v)} />
      </Section>

      <Section title="Sensory">
        <Toggle label="Low Noise Preference" checked={profile.sensory.lowNoise} onChange={(v) => update('sensory', 'lowNoise', v)} />
        <Toggle label="Low Light Preference" checked={profile.sensory.lowLight} onChange={(v) => update('sensory', 'lowLight', v)} />
        <Toggle label="Scent-Free Environment" checked={profile.sensory.scentFree} onChange={(v) => update('sensory', 'scentFree', v)} />
      </Section>

      <Section title="Visual">
        <Toggle label="Braille Signage Needed" checked={profile.visual.braille} onChange={(v) => update('visual', 'braille', v)} />
        <Toggle label="Screen Reader User" checked={profile.visual.screenReader} onChange={(v) => update('visual', 'screenReader', v)} />
      </Section>

      <Section title="Other Needs">
        <Toggle label="Service Animal" checked={profile.other.serviceAnimal} onChange={(v) => update('other', 'serviceAnimal', v)} />
        <Toggle label="Accessible Restroom" checked={profile.other.accessibleRestroom} onChange={(v) => update('other', 'accessibleRestroom', v)} />
        <Toggle label="Accessible Parking" checked={profile.other.accessibleParking} onChange={(v) => update('other', 'accessibleParking', v)} />
      </Section>
    </div>
  );
}
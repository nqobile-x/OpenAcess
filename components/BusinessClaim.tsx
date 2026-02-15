import React from 'react';

export default function BusinessClaim() {
  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
            <span className="material-symbols-outlined text-3xl">storefront</span>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Claim Your Venue</h2>
            <p className="text-slate-600 mt-2">Business owners can manage their accessibility profile, respond to reviews, and request audits.</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm">
            <p><strong>Early Access:</strong> This feature is currently rolling out to businesses in Gauteng.</p>
        </div>
        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800">
            Request Verification
        </button>
    </div>
  );
}

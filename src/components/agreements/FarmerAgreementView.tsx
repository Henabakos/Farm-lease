import React from 'react';
import { Agreement } from '@/src/types';
import { AgreementList } from './AgreementList';

interface FarmerAgreementViewProps {
  onSelectAgreement: (agreement: Agreement) => void;
}

export function FarmerAgreementView({ onSelectAgreement }: FarmerAgreementViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Farm Agreements</h1>
          <p className="text-slate-500 text-xs mt-1">View your lease and investment agreements</p>
        </div>
      </div>
      <AgreementList onSelectAgreement={onSelectAgreement} />
    </div>
  );
}

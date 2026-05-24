import React from 'react';
import { Agreement } from '@/src/types';
import { AgreementList } from './AgreementList';

interface InvestorAgreementViewProps {
  onSelectAgreement: (agreement: Agreement) => void;
}

export function InvestorAgreementView({ onSelectAgreement }: InvestorAgreementViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Investment Agreements</h1>
          <p className="text-slate-500 text-xs mt-1">View and manage your investment contracts</p>
        </div>
      </div>
      <AgreementList onSelectAgreement={onSelectAgreement} />
    </div>
  );
}

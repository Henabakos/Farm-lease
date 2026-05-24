import React from 'react';
import { Agreement } from '@/src/types';
import { AgreementList } from './AgreementList';

interface RepresentativeAgreementViewProps {
  onSelectAgreement: (agreement: Agreement) => void;
}

export function RepresentativeAgreementView({ onSelectAgreement }: RepresentativeAgreementViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cluster Agreements</h1>
          <p className="text-slate-500 text-xs mt-1">Review and manage agreements for your cluster</p>
        </div>
      </div>
      <AgreementList onSelectAgreement={onSelectAgreement} />
    </div>
  );
}

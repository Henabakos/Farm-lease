import { api } from './api';

export type ClauseCategory =
  | 'PAYMENT'
  | 'TERMINATION'
  | 'DISPUTE'
  | 'CONFIDENTIALITY'
  | 'GENERAL'
  | 'CUSTOM';

export type TemplateVariableType = 'text' | 'number' | 'date' | 'boolean';

export interface TemplateVariable {
  name: string;
  type: TemplateVariableType;
  description?: string;
  required?: boolean;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  targetAudience?: 'FARMER' | 'INVESTOR' | 'BOTH';
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { versions: number };
  versions?: ContractTemplateVersion[];
}

export interface ContractTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  contentType?: 'MARKDOWN' | 'PDF';
  body?: string | null;
  pdfStorageKey?: string | null;
  variables: TemplateVariable[];
  publishedAt: string | null;
  createdById: string;
  createdAt: string;
  _count?: { clauses: number };
  clauses?: TemplateClauseWithClause[];
}

export interface ContractClause {
  id: string;
  title: string;
  category: ClauseCategory;
  body: string;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateClauseWithClause {
  id: string;
  templateVersionId: string;
  clauseId: string;
  ordering: number;
  clause: ContractClause;
}

export interface ListTemplatesParams {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTemplates {
  items: ContractTemplate[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
}

export interface CompareVersionsResult {
  version1: ContractTemplateVersion;
  version2: ContractTemplateVersion;
  diff: {
    addedVariables: TemplateVariable[];
    removedVariables: TemplateVariable[];
    commonVariables: TemplateVariable[];
    bodyChanged: boolean;
  };
}

const BASE = '/contract-templates';

export const contractTemplateService = {
  // ---------------- Templates
  listTemplates: async (params: ListTemplatesParams = {}): Promise<PaginatedTemplates> => {
    const { data } = await api.get(BASE, { params });
    return data;
  },

  getTemplate: async (templateId: string): Promise<ContractTemplate> => {
    const { data } = await api.get(`${BASE}/${templateId}`);
    return data;
  },

  createTemplate: async (template: {
    name: string;
    description?: string;
    category?: string;
    targetAudience?: 'FARMER' | 'INVESTOR' | 'BOTH';
  }): Promise<ContractTemplate> => {
    const { data } = await api.post(BASE, template);
    return data;
  },

  updateTemplate: async (
    templateId: string,
    updates: Partial<Pick<ContractTemplate, 'name' | 'description' | 'category' | 'isActive'>>,
  ): Promise<ContractTemplate> => {
    const { data } = await api.patch(`${BASE}/${templateId}`, updates);
    return data;
  },

  deleteTemplate: async (templateId: string) => {
    const { data } = await api.delete(`${BASE}/${templateId}`);
    return data as { success: boolean; softDeleted: boolean };
  },

  // ---------------- Versions
  createVersion: async (
    templateId: string,
    version: { 
      contentType?: string;
      body?: string;
      pdfStorageKey?: string;
      variables?: TemplateVariable[];
    },
  ): Promise<ContractTemplateVersion> => {
    const { data } = await api.post(`${BASE}/${templateId}/versions`, version);
    return data;
  },

  getVersion: async (
    templateId: string,
    versionId: string,
  ): Promise<ContractTemplateVersion> => {
    const { data } = await api.get(`${BASE}/${templateId}/versions/${versionId}`);
    return data;
  },

  publishVersion: async (
    templateId: string,
    versionId: string,
  ): Promise<ContractTemplateVersion> => {
    const { data } = await api.post(
      `${BASE}/${templateId}/versions/${versionId}/publish`,
    );
    return data;
  },

  compareVersions: async (
    templateId: string,
    version1: number,
    version2: number,
  ): Promise<CompareVersionsResult> => {
    const { data } = await api.post(`${BASE}/${templateId}/compare-versions`, {
      version1,
      version2,
    });
    return data;
  },

  // ---------------- Clause catalog
  listClauses: async (params: {
    category?: ClauseCategory;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{ items: ContractClause[] }> => {
    const { data } = await api.get(`${BASE}/clauses/list/all`, { params });
    return data;
  },

  listClausesByCategory: async (
    category: ClauseCategory,
  ): Promise<{ items: ContractClause[] }> => {
    const { data } = await api.get(`${BASE}/clauses/category/${category}`);
    return data;
  },

  createClause: async (clause: {
    title: string;
    category: ClauseCategory;
    body: string;
  }): Promise<ContractClause> => {
    const { data } = await api.post(`${BASE}/clauses`, clause);
    return data;
  },

  updateClause: async (
    clauseId: string,
    updates: Partial<Pick<ContractClause, 'title' | 'category' | 'body' | 'isActive'>>,
  ): Promise<ContractClause> => {
    const { data } = await api.patch(`${BASE}/clauses/${clauseId}`, updates);
    return data;
  },

  deleteClause: async (clauseId: string) => {
    const { data } = await api.delete(`${BASE}/clauses/${clauseId}`);
    return data as { success: boolean; softDeleted: boolean };
  },

  // ---------------- Template-version clauses (join)
  listTemplateClauses: async (
    templateId: string,
    versionId: string,
  ): Promise<TemplateClauseWithClause[]> => {
    const { data } = await api.get(
      `${BASE}/${templateId}/versions/${versionId}/clauses`,
    );
    return data;
  },

  addTemplateClause: async (
    templateId: string,
    versionId: string,
    payload: { clauseId: string; ordering: number },
  ): Promise<TemplateClauseWithClause> => {
    const { data } = await api.post(
      `${BASE}/${templateId}/versions/${versionId}/clauses`,
      payload,
    );
    return data;
  },

  updateTemplateClause: async (
    templateId: string,
    versionId: string,
    templateClauseId: string,
    updates: { ordering: number },
  ): Promise<TemplateClauseWithClause> => {
    const { data } = await api.patch(
      `${BASE}/${templateId}/versions/${versionId}/clauses/${templateClauseId}`,
      updates,
    );
    return data;
  },

  removeTemplateClause: async (
    templateId: string,
    versionId: string,
    templateClauseId: string,
  ) => {
    const { data } = await api.delete(
      `${BASE}/${templateId}/versions/${versionId}/clauses/${templateClauseId}`,
    );
    return data as { success: boolean };
  },
};

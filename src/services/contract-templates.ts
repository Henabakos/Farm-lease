import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const contractTemplateService = {
  // Templates
  getTemplates: async () => {
    const { data } = await axios.get(`${API_URL}/contract-templates`);
    return data;
  },

  getTemplate: async (templateId: string, versionNumber?: number) => {
    const params = versionNumber ? `?versionNumber=${versionNumber}` : '';
    const { data } = await axios.get(`${API_URL}/contract-templates/${templateId}${params}`);
    return data;
  },

  createTemplate: async (template: {
    name: string;
    description?: string;
    type: 'lease' | 'agreement' | 'amendment' | 'other';
    category?: string;
    tags?: string[];
  }) => {
    const { data } = await axios.post(`${API_URL}/contract-templates`, template);
    return data;
  },

  updateTemplate: async (templateId: string, updates: any) => {
    const { data } = await axios.put(`${API_URL}/contract-templates/${templateId}`, updates);
    return data;
  },

  // Versions
  createVersion: async (templateId: string, version: {
    versionName?: string;
    changeLogs?: string;
    preamble?: string;
    footer?: string;
  }) => {
    const { data } = await axios.post(
      `${API_URL}/contract-templates/${templateId}/versions`,
      version
    );
    return data;
  },

  publishVersion: async (templateId: string, versionId: string) => {
    const { data } = await axios.post(
      `${API_URL}/contract-templates/${templateId}/versions/${versionId}/publish`
    );
    return data;
  },

  compareVersions: async (templateId: string, version1: number, version2: number) => {
    const { data } = await axios.post(
      `${API_URL}/contract-templates/${templateId}/compare-versions`,
      { version1, version2 }
    );
    return data;
  },

  // Clauses
  getClausesByCategory: async (category: string) => {
    const { data } = await axios.get(`${API_URL}/contract-templates/clauses/category/${category}`);
    return data;
  },

  getAllClauses: async () => {
    const { data } = await axios.get(`${API_URL}/contract-templates/clauses/list/all`);
    return data;
  },

  addClause: async (templateId: string, versionId: string, clause: {
    clauseId: string;
    displayOrder: number;
    isCustomized?: boolean;
    customizedContent?: string;
    isOptional?: boolean;
  }) => {
    const { data } = await axios.post(
      `${API_URL}/contract-templates/${templateId}/versions/${versionId}/clauses`,
      clause
    );
    return data;
  }
};

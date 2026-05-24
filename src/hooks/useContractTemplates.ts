import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  contractTemplateService,
  type ContractTemplate,
  type ContractTemplateVersion,
  type TemplateVariable,
  type ListTemplatesParams,
} from '../services/contract-templates';

interface UseContractTemplatesOptions {
  autoFetch?: boolean;
  initialParams?: ListTemplatesParams;
}

export function useContractTemplates(options: UseContractTemplatesOptions = {}) {
  const { autoFetch = true, initialParams } = options;
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (params?: ListTemplatesParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await contractTemplateService.listTemplates(params ?? {});
      setTemplates(result.items);
      setPagination(result.pagination);
      return result;
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to fetch contract templates';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (templateId: string) => {
    try {
      return await contractTemplateService.getTemplate(templateId);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || 'Failed to load template';
      toast.error(msg);
      throw err;
    }
  }, []);

  const createTemplate = useCallback(
    async (input: { name: string; description?: string; category?: string }) => {
      try {
        const created = await contractTemplateService.createTemplate(input);
        toast.success('Template created');
        await fetchTemplates();
        return created;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to create template';
        toast.error(msg);
        throw err;
      }
    },
    [fetchTemplates],
  );

  const updateTemplate = useCallback(
    async (
      templateId: string,
      updates: Partial<
        Pick<ContractTemplate, 'name' | 'description' | 'category' | 'isActive'>
      >,
    ) => {
      try {
        const updated = await contractTemplateService.updateTemplate(
          templateId,
          updates,
        );
        toast.success('Template updated');
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, ...updated } : t)),
        );
        return updated;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to update template';
        toast.error(msg);
        throw err;
      }
    },
    [],
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        const result = await contractTemplateService.deleteTemplate(templateId);
        toast.success(
          result.softDeleted ? 'Template deactivated (in use)' : 'Template deleted',
        );
        await fetchTemplates();
        return result;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to delete template';
        toast.error(msg);
        throw err;
      }
    },
    [fetchTemplates],
  );

  const createVersion = useCallback(
    async (
      templateId: string,
      payload: { body: string; variables?: TemplateVariable[] },
    ) => {
      try {
        const created = await contractTemplateService.createVersion(
          templateId,
          payload,
        );
        toast.success(`Version ${created.versionNumber} created`);
        return created;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to create version';
        toast.error(msg);
        throw err;
      }
    },
    [],
  );

  const publishVersion = useCallback(
    async (templateId: string, versionId: string) => {
      try {
        const published = await contractTemplateService.publishVersion(
          templateId,
          versionId,
        );
        toast.success(`Version ${published.versionNumber} published`);
        return published;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to publish version';
        toast.error(msg);
        throw err;
      }
    },
    [],
  );

  const compareVersions = useCallback(
    async (templateId: string, version1: number, version2: number) => {
      try {
        return await contractTemplateService.compareVersions(
          templateId,
          version1,
          version2,
        );
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to compare versions';
        toast.error(msg);
        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchTemplates(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    templates,
    pagination,
    isLoading,
    error,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createVersion,
    publishVersion,
    compareVersions,
    // raw service for nested ops (clauses)
    service: contractTemplateService,
  };
}

export type ContractTemplateLike = ContractTemplate & {
  _count?: { versions: number };
};

// ============================================================================
// Contract templates module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ConflictError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';

/**
 * Create a new contract template with initial version.
 */
export async function createTemplate(userId, data) {
  const { name, description, category, targetAudience, contentType, body, pdfStorageKey, variables } = data;

  const template = await prisma.contractTemplate.create({
    data: {
      name,
      description,
      category,
      targetAudience: targetAudience || 'BOTH',
      isActive: true,
      createdById: userId,
      versions: {
        create: {
          versionNumber: 1,
          contentType: contentType || 'MARKDOWN',
          body: contentType === 'MARKDOWN' ? body : null,
          pdfStorageKey: contentType === 'PDF' ? pdfStorageKey : null,
          variables: variables || [],
          createdById: userId,
        },
      },
    },
    include: {
      versions: true,
    },
  });

  return template;
}

/**
 * Create a new version of a template.
 */
export async function createTemplateVersion(userId, templateId, data) {
  const { contentType, body, pdfStorageKey, variables } = data;

  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new NotFoundError('Template not found');

  // Get the latest version number
  const latestVersion = await prisma.contractTemplateVersion.findFirst({
    where: { templateId },
    orderBy: { versionNumber: 'desc' },
  });

  const nextVersion = (latestVersion?.versionNumber || 0) + 1;

  const version = await prisma.contractTemplateVersion.create({
    data: {
      templateId,
      versionNumber: nextVersion,
      contentType: contentType || 'MARKDOWN',
      body: contentType === 'MARKDOWN' ? body : null,
      pdfStorageKey: contentType === 'PDF' ? pdfStorageKey : null,
      variables: variables || [],
      createdById: userId,
    },
  });

  return version;
}

/**
 * Get a template by ID with its versions (and clause counts).
 */
export async function getTemplateById(_userId, templateId) {
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
          _count: { select: { clauses: true } },
        },
      },
    },
  });

  if (!template) throw new NotFoundError('Template not found');

  return template;
}

/**
 * Update template metadata.
 */
export async function updateTemplate(_userId, templateId, updates) {
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new NotFoundError('Template not found');

  const updated = await prisma.contractTemplate.update({
    where: { id: templateId },
    data: updates,
  });

  return updated;
}

/**
 * Delete a template.
 */
export async function deleteTemplate(_userId, templateId) {
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
    include: { versions: { include: { agreements: { select: { id: true } } } } },
  });

  if (!template) throw new NotFoundError('Template not found');

  // Refuse hard delete if any agreement references a version of this template.
  const inUse = template.versions.some((v) => v.agreements.length > 0);
  if (inUse) {
    // Soft-disable instead of hard delete.
    const updated = await prisma.contractTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
    return { success: true, softDeleted: true, template: updated };
  }

  await prisma.contractTemplate.delete({
    where: { id: templateId },
  });

  return { success: true, softDeleted: false };
}

/**
 * Publish a template version.
 */
export async function publishVersion(_userId, templateId, versionId) {
  const version = await prisma.contractTemplateVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) throw new NotFoundError('Version not found');
  if (version.templateId !== templateId) {
    throw new NotFoundError('Version does not belong to this template');
  }
  if (version.publishedAt) {
    throw new ConflictError('Version is already published');
  }

  const updated = await prisma.contractTemplateVersion.update({
    where: { id: versionId },
    data: { publishedAt: new Date() },
  });

  return updated;
}

/**
 * List templates with filtering.
 */
export async function listTemplates(filters) {
  const { category, isActive, search, page, pageSize } = filters;

  const where = {
    ...(category && { category }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [total, items] = await Promise.all([
    prisma.contractTemplate.count({ where }),
    prisma.contractTemplate.findMany({
      where,
      include: {
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
  ]);

  return {
    items,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  };
}

/**
 * Get a specific version of a template (with ordered clauses).
 */
export async function getVersionById(_userId, templateId, versionId) {
  const version = await prisma.contractTemplateVersion.findUnique({
    where: { id: versionId },
    include: {
      template: true,
      clauses: {
        orderBy: { ordering: 'asc' },
        include: { clause: true },
      },
    },
  });

  if (!version) throw new NotFoundError('Version not found');
  if (version.templateId !== templateId) {
    throw new NotFoundError('Version does not belong to this template');
  }

  return version;
}

// ---------------------------------------------------------------- Compare

/**
 * Compare two versions of a template by version number.
 * Returns both bodies + variable diffs so the client can render a diff.
 */
export async function compareVersions(templateId, version1, version2) {
  const [v1, v2] = await Promise.all([
    prisma.contractTemplateVersion.findUnique({
      where: { templateId_versionNumber: { templateId, versionNumber: version1 } },
    }),
    prisma.contractTemplateVersion.findUnique({
      where: { templateId_versionNumber: { templateId, versionNumber: version2 } },
    }),
  ]);

  if (!v1) throw new NotFoundError(`Version ${version1} not found`);
  if (!v2) throw new NotFoundError(`Version ${version2} not found`);

  const vars1 = Array.isArray(v1.variables) ? v1.variables : [];
  const vars2 = Array.isArray(v2.variables) ? v2.variables : [];
  const names1 = new Set(vars1.map((v) => v.name));
  const names2 = new Set(vars2.map((v) => v.name));

  const addedVariables = vars2.filter((v) => !names1.has(v.name));
  const removedVariables = vars1.filter((v) => !names2.has(v.name));
  const commonVariables = vars2.filter((v) => names1.has(v.name));

  return {
    version1: v1,
    version2: v2,
    diff: {
      addedVariables,
      removedVariables,
      commonVariables,
      bodyChanged: v1.body !== v2.body,
    },
  };
}

// ---------------------------------------------------------------- Clauses (catalog)

async function assertVersionEditable(versionId) {
  const version = await prisma.contractTemplateVersion.findUnique({
    where: { id: versionId },
  });
  if (!version) throw new NotFoundError('Version not found');
  if (version.publishedAt) {
    throw new ConflictError('Cannot modify clauses on a published version');
  }
  return version;
}

export async function listClauses(filters) {
  const { category, isActive, search } = filters;
  const where = {
    ...(category && { category }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const items = await prisma.contractClause.findMany({
    where,
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });
  return { items };
}

export async function listClausesByCategory(category) {
  const items = await prisma.contractClause.findMany({
    where: { category, isActive: true },
    orderBy: { title: 'asc' },
  });
  return { items };
}

export async function createClause(userId, data) {
  return prisma.contractClause.create({
    data: {
      title: data.title,
      category: data.category,
      body: data.body,
      isActive: true,
      createdById: userId,
    },
  });
}

export async function updateClause(_userId, clauseId, updates) {
  const existing = await prisma.contractClause.findUnique({ where: { id: clauseId } });
  if (!existing) throw new NotFoundError('Clause not found');
  return prisma.contractClause.update({
    where: { id: clauseId },
    data: updates,
  });
}

export async function deleteClause(_userId, clauseId) {
  const existing = await prisma.contractClause.findUnique({
    where: { id: clauseId },
    include: { _count: { select: { templates: true } } },
  });
  if (!existing) throw new NotFoundError('Clause not found');

  // Soft-delete if referenced anywhere; hard delete otherwise.
  if (existing._count.templates > 0) {
    const updated = await prisma.contractClause.update({
      where: { id: clauseId },
      data: { isActive: false },
    });
    return { success: true, softDeleted: true, clause: updated };
  }

  await prisma.contractClause.delete({ where: { id: clauseId } });
  return { success: true, softDeleted: false };
}

// ---------------------------------------------------------------- Template-version clauses (join)

export async function listTemplateClauses(templateId, versionId) {
  const version = await prisma.contractTemplateVersion.findUnique({
    where: { id: versionId },
  });
  if (!version) throw new NotFoundError('Version not found');
  if (version.templateId !== templateId) {
    throw new NotFoundError('Version does not belong to this template');
  }
  return prisma.templateClause.findMany({
    where: { templateVersionId: versionId },
    orderBy: { ordering: 'asc' },
    include: { clause: true },
  });
}

export async function addTemplateClause(templateId, versionId, { clauseId, ordering }) {
  const version = await assertVersionEditable(versionId);
  if (version.templateId !== templateId) {
    throw new NotFoundError('Version does not belong to this template');
  }
  const clause = await prisma.contractClause.findUnique({ where: { id: clauseId } });
  if (!clause) throw new NotFoundError('Clause not found');

  // Reject duplicates (unique [templateVersionId, clauseId]).
  const existing = await prisma.templateClause.findUnique({
    where: { templateVersionId_clauseId: { templateVersionId: versionId, clauseId } },
  });
  if (existing) throw new ConflictError('Clause already attached to this version');

  const created = await prisma.templateClause.create({
    data: { templateVersionId: versionId, clauseId, ordering },
    include: { clause: true },
  });
  return created;
}

export async function updateTemplateClause(templateId, versionId, templateClauseId, { ordering }) {
  await assertVersionEditable(versionId);
  const tc = await prisma.templateClause.findUnique({ where: { id: templateClauseId } });
  if (!tc) throw new NotFoundError('Template clause not found');
  if (tc.templateVersionId !== versionId) {
    throw new NotFoundError('Template clause does not belong to this version');
  }
  return prisma.templateClause.update({
    where: { id: templateClauseId },
    data: { ordering },
    include: { clause: true },
  });
}

export async function removeTemplateClause(templateId, versionId, templateClauseId) {
  await assertVersionEditable(versionId);
  const tc = await prisma.templateClause.findUnique({ where: { id: templateClauseId } });
  if (!tc) throw new NotFoundError('Template clause not found');
  if (tc.templateVersionId !== versionId) {
    throw new NotFoundError('Template clause does not belong to this version');
  }
  await prisma.templateClause.delete({ where: { id: templateClauseId } });
  return { success: true };
}

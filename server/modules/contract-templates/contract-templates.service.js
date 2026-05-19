// ============================================================================
// Contract templates module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';

/**
 * Create a new contract template.
 */
export async function createTemplate(userId, data) {
  const { name, description, category } = data;

  const template = await prisma.contractTemplate.create({
    data: {
      name,
      description,
      category,
      isActive: true,
      createdById: userId,
    },
  });

  return template;
}

/**
 * Create a new version of a template.
 */
export async function createTemplateVersion(userId, data) {
  const { templateId, body, variables } = data;

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
      body,
      variables: variables || [],
      createdById: userId,
    },
  });

  return version;
}

/**
 * Get a template by ID with its versions.
 */
export async function getTemplateById(userId, templateId) {
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
      },
    },
  });

  if (!template) throw new NotFoundError('Template not found');

  return template;
}

/**
 * Update template metadata.
 */
export async function updateTemplate(userId, templateId, updates) {
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new NotFoundError('Template not found');

  if (template.createdById !== userId) {
    throw new ForbiddenError('Only the template creator can update it');
  }

  const updated = await prisma.contractTemplate.update({
    where: { id: templateId },
    data: updates,
  });

  return updated;
}

/**
 * Delete a template.
 */
export async function deleteTemplate(userId, templateId) {
  const template = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new NotFoundError('Template not found');

  if (template.createdById !== userId) {
    throw new ForbiddenError('Only the template creator can delete it');
  }

  await prisma.contractTemplate.delete({
    where: { id: templateId },
  });

  return { success: true };
}

/**
 * Publish a template version.
 */
export async function publishVersion(userId, versionId) {
  const version = await prisma.contractTemplateVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) throw new NotFoundError('Version not found');

  const template = await prisma.contractTemplate.findUnique({
    where: { id: version.templateId },
  });

  if (!template) throw new NotFoundError('Template not found');

  if (template.createdById !== userId) {
    throw new ForbiddenError('Only the template creator can publish versions');
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
  const { category, isActive, page, limit } = filters;

  const where = {
    ...(category && { category }),
    ...(isActive !== undefined && { isActive }),
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
      ...paginate({ page, limit }),
    }),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get a specific version of a template.
 */
export async function getVersionById(userId, versionId) {
  const version = await prisma.contractTemplateVersion.findUnique({
    where: { id: versionId },
    include: {
      template: true,
    },
  });

  if (!version) throw new NotFoundError('Version not found');

  return version;
}

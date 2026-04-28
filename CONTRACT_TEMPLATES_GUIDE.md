# Contract Templates System

## Overview

The contract templates system provides enterprise-grade contract management with dynamic templates, reusable clause library, and version control.

## Features

### Template Management
- Create custom contract templates
- Organize by type (lease, agreement, amendment)
- Tag and categorize templates
- Set default templates per cluster
- Archive old templates

### Clause Library
- Pre-built clause library organized by category
- Mandatory vs optional clauses
- Conditional clauses support
- Customizable clause content
- Version control for clauses

### Version Control
- Multiple versions of each template
- Publish/draft workflow
- Compare versions side-by-side
- Change log tracking
- Rollback to previous version

### Contract Generation
- Auto-populate from template
- Customize on a per-agreement basis
- Track which template was used
- Store customizations with agreement

## Database Schema

### contract_templates
```sql
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  type VARCHAR (lease, agreement, amendment, other),
  created_by UUID REFERENCES auth.users,
  is_active BOOLEAN,
  is_default BOOLEAN,
  version INT,
  current_version_id UUID,
  category VARCHAR,
  tags JSONB
);
```

### contract_template_versions
```sql
CREATE TABLE contract_template_versions (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES contract_templates,
  version_number INT,
  preamble TEXT,
  footer TEXT,
  is_published BOOLEAN,
  created_by UUID,
  published_by UUID
);
```

### contract_clauses
```sql
CREATE TABLE contract_clauses (
  id UUID PRIMARY KEY,
  name VARCHAR,
  title VARCHAR,
  content TEXT,
  category VARCHAR,
  section_number VARCHAR,
  is_mandatory BOOLEAN,
  is_conditional BOOLEAN,
  version INT
);
```

### contract_template_clauses
```sql
CREATE TABLE contract_template_clauses (
  id UUID PRIMARY KEY,
  template_version_id UUID,
  clause_id UUID,
  display_order INT,
  is_customized BOOLEAN,
  customized_content TEXT,
  is_optional BOOLEAN
);
```

## API Endpoints

### Templates

#### List Templates
```
GET /api/contract-templates
Response: [ { id, name, type, version, is_active, ... } ]
```

#### Get Template with Clauses
```
GET /api/contract-templates/:templateId?versionNumber=2
Response: { name, version, preamble, clauses[], footer }
```

#### Create Template (Admin)
```
POST /api/contract-templates
Body: {
  name, description, type, category, tags, isDefault
}
Response: { id, name, type, ... }
```

#### Update Template (Admin)
```
PUT /api/contract-templates/:templateId
Body: { name, description, category, tags, is_active }
Response: { updated template }
```

### Versions

#### Create Version (Admin)
```
POST /api/contract-templates/:templateId/versions
Body: {
  versionName, changeLogs, preamble, footer
}
Response: { id, version_number, ... }
```

#### Publish Version (Admin)
```
POST /api/contract-templates/:templateId/versions/:versionId/publish
Response: { published version }
```

#### Compare Versions (Admin)
```
POST /api/contract-templates/:templateId/compare-versions
Body: { version1, version2 }
Response: [ { clause_id, changes, ... } ]
```

### Clauses

#### List Clauses by Category
```
GET /api/contract-templates/clauses/category/:category
Response: [ { id, title, content, section_number, ... } ]
```

#### List All Clauses
```
GET /api/contract-templates/clauses/list/all
Response: [ clauses sorted by category ]
```

#### Add Clause to Template (Admin)
```
POST /api/contract-templates/:templateId/versions/:versionId/clauses
Body: {
  clauseId, displayOrder, isCustomized, customizedContent, isOptional
}
Response: { clause mapping }
```

## Frontend Integration

### Contract Template Service
```typescript
import { contractTemplateService } from '@/src/services/contract-templates';

// Get templates
const templates = await contractTemplateService.getTemplates();

// Get template with clauses
const template = await contractTemplateService.getTemplate(templateId, versionNumber);

// Create template
await contractTemplateService.createTemplate({
  name: 'Farm Lease Agreement',
  type: 'lease',
  category: 'Standard'
});

// Publish version
await contractTemplateService.publishVersion(templateId, versionId);
```

## Clause Categories

Pre-configured categories:

- **Parties**: Lessor/lessee identification
- **Property**: Farm location and boundaries
- **Term**: Duration and renewal terms
- **Rent**: Payment amount and schedule
- **Maintenance**: Maintenance responsibilities
- **Insurance**: Insurance requirements
- **Default**: Default and remedies
- **Termination**: Termination conditions
- **Dispute**: Dispute resolution
- **Miscellaneous**: General provisions

## Workflow

### Creating a Template

1. Admin clicks "Create Template"
2. Fills in template info (name, type, category)
3. Creates version 1
4. Selects clauses for this version
5. Customizes clause content if needed
6. Publishes version
7. Sets as default (optional)

### Using a Template

1. Owner creates agreement
2. Selects template
3. System loads template version
4. Displays all clauses in order
5. Owner can customize specific clauses
6. Agreement saved with template reference
7. Customizations stored separately

### Updating a Template

1. Admin creates new version
2. Adds/removes clauses
3. Updates clause text
4. Adds change log entry
5. Tests preview
6. Publishes version
7. New agreements use new version

## Component: TemplateBuilder

Build and edit templates with clause selection.

```tsx
<TemplateBuilder templateId={templateId} onSave={handleSave} />
```

## Component: ClauseLibraryPanel

Browse and manage clause library.

```tsx
<ClauseLibraryPanel onSelectClause={handleSelect} />
```

## Component: ContractPreview

Preview generated contract with selected clauses.

```tsx
<ContractPreview templateId={templateId} customizations={customizations} />
```

## Component: VersionComparison

Side-by-side comparison of template versions.

```tsx
<VersionComparison templateId={templateId} version1={1} version2={2} />
```

## Security Features

- **RLS Policies**: Row-level access control
  - Anyone can view published templates
  - Only admins can create/edit templates
  - Only template creator can see drafts

- **Audit Logging**: Track all changes
  - Who created/published template
  - When each version was created
  - What clauses were modified

- **Version Control**: Immutable history
  - Each version is immutable
  - Full rollback capability
  - Change log per version

## Best Practices

1. **Create Standard Templates**: One template per common agreement type
2. **Use Categories**: Organize clauses logically
3. **Make Mandatory Clauses**: Legal requirements
4. **Allow Customization**: Let users modify as needed
5. **Review Before Publish**: Have legal review versions
6. **Document Changes**: Clear change logs
7. **Archive Old Versions**: Keep history clean

## Configuration

Environment variables:
```
VITE_API_URL=http://localhost:3001/api
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Troubleshooting

**Template not appearing in list**
- Check is_active flag
- Verify is_published for version
- Ensure RLS policies are correct

**Clauses not loading**
- Verify clause IDs exist
- Check display_order values
- Ensure template_version_id is correct

**Comparison not working**
- Verify both versions exist
- Check version_number values
- Ensure template_id matches

## Future Enhancements

- Clause conditions/logic (IF-THEN)
- Digital signature integration
- eSignature fields in templates
- Automatic clause numbering
- Multi-language support
- Clause recommendation engine

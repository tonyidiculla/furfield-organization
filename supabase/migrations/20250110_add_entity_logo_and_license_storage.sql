-- Add logo_storage and license_documents fields to hospitals table

-- Add logo_storage column (same structure as organizations)
ALTER TABLE master_data.hospitals
ADD COLUMN IF NOT EXISTS logo_storage JSONB;

-- Add license_documents column for storing multiple license documents
ALTER TABLE master_data.hospitals
ADD COLUMN IF NOT EXISTS license_documents JSONB;

-- Add comments
COMMENT ON COLUMN master_data.hospitals.logo_storage IS 
'JSON object containing logo storage information: {url: string, file_path: string, storage_type: string}';

COMMENT ON COLUMN master_data.hospitals.license_documents IS 
'JSON array containing license document storage information: [{name: string, url: string, file_path: string, storage_type: string, uploaded_at: timestamp}]';

-- Example data structure:
-- logo_storage: {"url": "https://...", "file_path": "entity-logos/123.png", "storage_type": "supabase"}
-- license_documents: [
--   {"name": "Veterinary License", "url": "https://...", "file_path": "entity-licenses/vet-123.pdf", "storage_type": "supabase", "uploaded_at": "2025-01-10T10:00:00Z"},
--   {"name": "Operating License", "url": "https://...", "file_path": "entity-licenses/op-456.pdf", "storage_type": "supabase", "uploaded_at": "2025-01-10T10:05:00Z"}
-- ]

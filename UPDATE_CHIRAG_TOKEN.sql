-- ============================================================================
-- 🔑 UPDATE ACCESS TOKEN - Digital Chirag
-- ============================================================================

UPDATE meta_pages
SET access_token = 'EAAMp6Xu8vQ8BQnStRMBBDTEtKYyEL3aZBFHHw7oCvg0l9n0aR0L0svzZBSkPUbfZCXX5JtMGJpTitKe6GRpsL1QhjZAVOuzrSpp9EPXmOTnEN5aXCLYH6a7wH0hG6FfAfJiJxWAgC2fXkdQAug64Hx8qpDdMxLlJ6YqGwZCIJ1NTfbRJlCNQ3z2gq9DsnVoHn8POj0NCOkVkn2jxXqL1eXG4BrpCUhbTyDM3cZCu8sNYUgHyKNapZCFfeKIm1v2b2LQDfxD8iFQlQOAeY4ZD'
WHERE page_name = 'Digital Chirag';

-- Verify update
SELECT 
    page_name,
    team_id,
    SUBSTRING(access_token, 1, 30) || '...' as token_preview,
    LENGTH(access_token) as token_length
FROM meta_pages
WHERE page_name = 'Digital Chirag';

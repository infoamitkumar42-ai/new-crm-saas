-- ============================================================================
-- 🔐 UPDATE EXPIRED ACCESS TOKENS - FEB 7 (v2 - FIXED COLS)
-- ============================================================================
-- Updates Facebook Access Tokens for Chirag, Himanshu, and Rajwinder.
-- Note: page_name matching is used for easy mapping.

DO $$
BEGIN
    -- 1. Update CHIRAG Tokens
    UPDATE meta_pages 
    SET access_token = 'EAAMp6Xu8vQ8BQoRyR9ZADpdX9dzOBIkRNNv6zZATAPiXYVHAUciZBLP4oII3rNroDqfOZBuYCg4ZBJBbQlmGny68ABZBr23AmoiUPbYyCJHP4qJAFXMjmL3hckWEHzYZALpFSxgYLHZBASbLnMCrdJSGzsPF6R6SZBpYmLunSiX7nKstZA2rgGt7GyzcqK5MhLlTnP7V3ZACDGKquoFZA8E87ZCXQwLJob6JfAGAFBwNYHPW9jN4Emat8Hx5PZCEcJ1Wk6kBORHQZC3lwtGQvE7VZBpM2AC2JroZC'
    WHERE page_name ILIKE '%Chirag%' OR page_name ILIKE '%New CBO%' OR page_name ILIKE '%Bhumit%';
    
    RAISE NOTICE '✅ Chirag Tokens Updated';

    -- 2. Update HIMANSHU Tokens
    UPDATE meta_pages 
    SET access_token = 'EAAMp6Xu8vQ8BQpq5acP4njUhmA1DEhVRedcyZAYRGn9s9rEDMstI2g5Wr60kGyhJnfa3dCe7mpkW2OUMyfCo4mtPpg4CAP7RmEAZBnxBsaeR6uhxL41l3akEhmzRvUlFwcvZB8aRyWjRZAzusTvuPBGU3xiTXILTsAJhAE4BMhZC8ThhpkcZCPMYXlV0uyQ9wKyAMvZAGjW9jW3bLjac01f2ufniNXFHUYAxq7ogoSIUuGq8W4728nFMoWbWajFRcMcrgZANVmbWrPD3lPxmnyLR61qZC'
    WHERE page_name ILIKE '%Himanshu%';

    RAISE NOTICE '✅ Himanshu Tokens Updated';

    -- 3. Update RAJWINDER Tokens
    UPDATE meta_pages 
    SET access_token = 'EAAMp6Xu8vQ8BQpxPUPmb7YW3b8TSUEzveU2WOancpG4n81zLi5aT0iDS3mjMA4m4EmkVdOWWCEwYvlZCafNFWcZBXi4JjOgimNkzXWzZCn7AOZB9K2F0ZBp1ZANqZAmbKbORUZBh3kcbYlbDqOdZC6YRWvfarR16knvV61DOQ7oaGNCF50mpBGr7ASxeF4xv0gbh55vX8am8CkGuofRS3Cs4ciikeNuv7GwPX9R7rP1kYcODtWxJa2l4wMEOmzgX5eMzyfc2PP5hHYqKQsutOZA9KqwpeVVat2'
    WHERE page_name ILIKE '%Rajwinder%';

    RAISE NOTICE '✅ Rajwinder Tokens Updated';

END $$;

-- Verify results
SELECT page_name, LEFT(access_token, 20) || '...' as token_preview
FROM meta_pages 
WHERE page_name ILIKE ANY(ARRAY['%Chirag%', '%New CBO%', '%Bhumit%', '%Himanshu%', '%Rajwinder%']);

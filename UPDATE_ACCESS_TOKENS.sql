-- ============================================================================
-- UPDATE PAGE ACCESS TOKENS
-- ============================================================================
-- Generated: 2026-02-07 06:23

-- Token 1: Himanshu Sharma Pages
UPDATE meta_pages 
SET access_token = 'EAAMp6Xu8vQ8BQhZAckrxw8pBvNxXq95VkOscaudXT0cXOYCqDxZCfu1hzKXeGjLKjxJYDx3Euf0gHVhbHdSrfWyA6UErW2A8dnK8Iisle9MVgd5H8DaBpM3N5Pagej8Ka3XWr2VmhZAS3jikpQxxkkfVWX7KQuUEOI4H9pRJ3RbJjwTL5VIX9MoJO0WRmhZAjngxee1ZBDW7ueZARgPWxDMqlj0uuaHq1ZAm4Qp6UVN4roSojStZCATXvvk24LCmBq0KdGZCy28yBVr3TTfDYwhZB9B3VP'
WHERE page_id IN ('61582413060584', '901700013018340');

-- Token 2: Rajwinder Page
UPDATE meta_pages 
SET access_token = 'EAAMp6Xu8vQ8BQrcZBwGRLyjLNSS0baI7u9N42iPBc95LMtDE9T8XT4YoFKIs1p8UTa85ZC2lUqIzG9ZBZAUY9ibjfbacLO6e9qcqYZCi3zP8fS9ccZA4MvlWHcHCUcdWbZCyH4ZBFHDPz5GPzcz0ZB3164m8XeGo3vLhUoXMqVd1NXwF2CuuZAsY3P3KZASIiCZBMTXCMScfSn1jTKjeW0mikz7GPqFB3dSibXFG2slZB1yBZCK1NdGsNlSTBwZC2sVg6ZAPay56uZC5COEkDaqL8rAiAHtqLn9AL'
WHERE page_id = '100895028112372';

-- Token 3: Digital Chirag (check page_id first)
UPDATE meta_pages 
SET access_token = 'EAAMp6Xu8vQ8BQp18tjdKgH0eihuwz9uHTwxnOADbJZAQizwQ1Kk2b93yjmcEnZBNKg1Y5zODb8a6Dgr0cUFz88ToKQbZAgfA2SMQ8jHZCB2Nre6ljFBr8RRltI706quNGT6wJeDgod3GZCry62f8ThpIvl9TgkArCcEN2JJcat3hysUryqK0YhZAwGs0ebfKZAZAuF1hYkwPOC4GGan7alEQn9OzJSyAAX8IxGKB6u9D3Sl4qzjyddGoUSl6brZAfa82554X3vXadpcCjW3AaxSLpzTu6'
WHERE page_name LIKE '%Digital%Chirag%';

-- TFE Community - Still needs token (manual update needed)
-- UPDATE meta_pages SET access_token = 'PASTE_TOKEN_HERE' WHERE page_id = '61587577081326';

-- ============================================================================
-- VERIFY TOKEN STATUS
-- ============================================================================
SELECT 
    page_id,
    page_name,
    CASE 
        WHEN access_token IS NULL THEN '❌ Missing'
        WHEN LENGTH(access_token) > 100 THEN '✅ Set (' || LENGTH(access_token) || ' chars)'
        ELSE '⚠️ Invalid'
    END as token_status
FROM meta_pages
ORDER BY 
    CASE WHEN access_token IS NULL THEN 1 ELSE 0 END DESC,
    page_name;

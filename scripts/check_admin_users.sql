-- Query to check admin users in the database
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN email = 'jukeramia@gmail.com' THEN 'YES ✓'
        ELSE 'NO'
    END as is_admin
FROM auth.users
ORDER BY created_at;

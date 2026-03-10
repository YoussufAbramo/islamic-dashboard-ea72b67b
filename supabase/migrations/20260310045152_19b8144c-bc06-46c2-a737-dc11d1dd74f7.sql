DELETE FROM support_tickets;
DELETE FROM profiles WHERE id IN ('6aa4e4c4-a867-4073-9aa4-2609d0b0c52b', 'a49ffa60-ad9c-4f3b-813c-64a5a1ee86a5', 'af00a229-d032-4d65-984f-6a82da687e10');
DELETE FROM user_roles WHERE user_id IN ('6aa4e4c4-a867-4073-9aa4-2609d0b0c52b', 'a49ffa60-ad9c-4f3b-813c-64a5a1ee86a5', 'af00a229-d032-4d65-984f-6a82da687e10');
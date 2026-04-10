-- ============================================================
-- Pencilation — Fix Services Table (run in phpMyAdmin SQL tab)
-- ============================================================
USE `portrait_drawing_db`;

-- Step 1: Reset bad image_url values (base64 blobs / absolute URLs)
UPDATE `services` SET
    `title`       = 'Pencil Realism Art',
    `description` = '"BINI Mikha" - A breathtaking hyper-realistic pencil portrait, meticulously crafted to capture every fine detail and expression.',
    `image_url`   = 'images/portrait_sample.png',
    `order_index` = 1
WHERE `id` = 1;

UPDATE `services` SET
    `title`       = 'Colored Drawing Art',
    `description` = '"Evil Demon Slayer" - A masterful triple-panel hand-drawn illustration with vibrant colored pencils and bold Japanese calligraphy.',
    `image_url`   = 'images/colored.jpg',
    `order_index` = 2
WHERE `id` = 2;

UPDATE `services` SET
    `title`       = 'Digital Masterpiece',
    `description` = '"ASEAN Diversity" - A professional digital commission celebrating Southeast Asian unity and cultural harmony.',
    `image_url`   = 'images/digital_art.png',
    `order_index` = 3
WHERE `id` = 3;

-- Step 2: Verify
SELECT id, title, LEFT(image_url, 60) AS image_url_preview, order_index FROM services ORDER BY order_index;

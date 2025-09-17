-- Add price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;

-- Update existing products with sample prices
UPDATE products SET price = 2500.00 WHERE product_name LIKE '%Fogão%';
UPDATE products SET price = 1800.00 WHERE product_name LIKE '%Forno%';
UPDATE products SET price = 3200.00 WHERE product_name LIKE '%Chapa%';
UPDATE products SET price = 4500.00 WHERE product_name LIKE '%Geladeira%';
UPDATE products SET price = 1200.00 WHERE product_name LIKE '%Mesa%';

-- Grant permissions for the price column
GRANT SELECT, INSERT, UPDATE ON products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
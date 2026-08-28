-- Crew phone number for SMS alerts (nullable; set from Settings).
ALTER TABLE users ADD COLUMN phone VARCHAR(40) NULL AFTER email;

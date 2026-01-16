-- Add show_thank_you flag for admin-triggered thank you modals
-- Admin sets true -> user sees modal -> dismisses -> back to false
ALTER TABLE users ADD COLUMN show_thank_you boolean DEFAULT false;

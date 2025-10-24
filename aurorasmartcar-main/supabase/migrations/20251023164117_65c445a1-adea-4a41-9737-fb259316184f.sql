-- Add status column to shopping_lists table
ALTER TABLE shopping_lists 
ADD COLUMN status text NOT NULL DEFAULT 'previous' 
CHECK (status IN ('previous', 'ongoing', 'completed'));
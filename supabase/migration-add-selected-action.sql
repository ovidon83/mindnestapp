-- Add best_action, selected_action and action_id columns to thoughts table
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS best_action TEXT CHECK (best_action IN ('Share', 'To-Do', 'Conversation')) DEFAULT NULL;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS selected_action TEXT CHECK (selected_action IN ('Share', 'To-Do', 'Conversation')) DEFAULT NULL;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS action_id UUID REFERENCES actions(id) ON DELETE SET NULL;

-- Create indexes for actions
CREATE INDEX IF NOT EXISTS thoughts_best_action_idx ON thoughts(best_action) WHERE best_action IS NOT NULL;
CREATE INDEX IF NOT EXISTS thoughts_selected_action_idx ON thoughts(selected_action) WHERE selected_action IS NOT NULL;


-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(10) NOT NULL, -- Format: "MM:SS"
    difficulty CHAR(1) NOT NULL, -- A, B, C etc.
    video_url TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create subtitles table
CREATE TABLE subtitles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_time DECIMAL(10, 3) NOT NULL, -- Supports milliseconds
    end_time DECIMAL(10, 3) NOT NULL,
    content_en TEXT NOT NULL,
    content_zh TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subtitles_time_check CHECK (end_time > start_time)
);

-- Create vocabulary items table (words, phrases, expressions)
CREATE TABLE vocabulary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('word', 'phrase', 'expression')),
    content TEXT NOT NULL, -- word/phrase/expression content
    phonetic VARCHAR(100),
    pos VARCHAR(50), -- part of speech
    definition_en TEXT NOT NULL,
    definition_zh TEXT NOT NULL,
    example_en TEXT,
    example_zh TEXT,
    first_appearance_time DECIMAL(10, 3),
    -- Fields specific to expressions
    analysis TEXT, -- 结构解析
    usage_scene TEXT, -- 使用场景
    similar_examples TEXT, -- 举一反三
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create user_favorites table
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will be linked to auth.users
    item_id UUID NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

-- Create user_learning_progress table
CREATE TABLE user_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will be linked to auth.users
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('unlearned', 'learning', 'learned')),
    progress INTEGER NOT NULL CHECK (progress BETWEEN 0 AND 100),
    last_learned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_subtitles_video_id ON subtitles(video_id);
CREATE INDEX idx_vocabulary_video_id ON vocabulary_items(video_id);
CREATE INDEX idx_vocabulary_type ON vocabulary_items(type);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_item_id ON user_favorites(item_id);
CREATE INDEX idx_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX idx_learning_progress_video_id ON user_learning_progress(video_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_progress_updated_at
    BEFORE UPDATE ON user_learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

-- Videos and related content are readable by all authenticated users
CREATE POLICY "Videos are viewable by all users"
    ON videos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Subtitles are viewable by all users"
    ON subtitles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Vocabulary items are viewable by all users"
    ON vocabulary_items FOR SELECT
    TO authenticated
    USING (true);

-- Users can only manage their own favorites
CREATE POLICY "Users can manage their own favorites"
    ON user_favorites FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can only manage their own learning progress
CREATE POLICY "Users can manage their own learning progress"
    ON user_learning_progress FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Comments for future maintenance
COMMENT ON TABLE videos IS 'Stores video metadata including title, difficulty level, and URLs';
COMMENT ON TABLE subtitles IS 'Stores bilingual subtitles with precise timing information';
COMMENT ON TABLE vocabulary_items IS 'Stores words, phrases and expressions with their explanations';
COMMENT ON TABLE user_favorites IS 'Tracks which vocabulary items users have favorited';
COMMENT ON TABLE user_learning_progress IS 'Tracks user progress in watching/learning videos';
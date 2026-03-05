-- 创建激活码表
CREATE TABLE activation_codes (
    code VARCHAR(32) PRIMARY KEY,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户档案表
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT false,
    activated_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    used_code VARCHAR(32) REFERENCES activation_codes(code),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建自动创建用户档案的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 添加 RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的档案
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 用户只能更新自己的档案
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 激活码查看策略（用户可以查看未使用的或自己使用过的激活码）
CREATE POLICY "Users can view available or own activation codes"
    ON activation_codes FOR SELECT
    TO authenticated
    USING (
        (NOT is_used) OR
        (used_by = auth.uid())
    );

-- 激活码使用策略（只能使用未使用的激活码）
CREATE POLICY "Users can use available activation codes"
    ON activation_codes FOR UPDATE
    TO authenticated
    USING (NOT is_used)
    WITH CHECK (NOT is_used);

-- 添加激活用户的存储过程
CREATE OR REPLACE FUNCTION activate_user(
    user_id UUID,
    activation_code VARCHAR(32)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code_duration INTEGER;
BEGIN
    -- 检查激活码是否有效且未使用
    SELECT duration_days INTO code_duration
    FROM activation_codes
    WHERE code = activation_code
    AND NOT is_used;

    IF code_duration IS NULL THEN
        RETURN false;
    END IF;

    -- 更新激活码状态
    UPDATE activation_codes
    SET is_used = true,
        used_by = user_id
    WHERE code = activation_code;

    -- 更新用户档案
    UPDATE profiles
    SET is_active = true,
        activated_at = CURRENT_TIMESTAMP,
        expiry_date = CURRENT_TIMESTAMP + (code_duration || ' days')::INTERVAL,
        used_code = activation_code
    WHERE id = user_id;

    RETURN true;
END;
$$;

-- 添加检查用户是否有效的函数
CREATE OR REPLACE FUNCTION is_user_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = user_id
        AND is_active = true
        AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
    );
END;
$$;

-- 为其他表添加访问控制策略
ALTER POLICY "Videos are viewable by all users"
    ON videos
    TO authenticated
    USING (is_user_active(auth.uid()));

ALTER POLICY "Subtitles are viewable by all users"
    ON subtitles
    TO authenticated
    USING (is_user_active(auth.uid()));

ALTER POLICY "Vocabulary items are viewable by all users"
    ON vocabulary_items
    TO authenticated
    USING (is_user_active(auth.uid()));

ALTER POLICY "Users can manage their own favorites"
    ON user_favorites
    TO authenticated
    USING (auth.uid() = user_id AND is_user_active(auth.uid()));

ALTER POLICY "Users can manage their own learning progress"
    ON user_learning_progress
    TO authenticated
    USING (auth.uid() = user_id AND is_user_active(auth.uid()));

-- 添加注释
COMMENT ON TABLE profiles IS '用户档案表，存储用户的激活状态和有效期';
COMMENT ON TABLE activation_codes IS '激活码表，用于管理用户订阅';
COMMENT ON FUNCTION activate_user IS '激活用户账号的存储过程';
COMMENT ON FUNCTION is_user_active IS '检查用户是否处于激活状态';
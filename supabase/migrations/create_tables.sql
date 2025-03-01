-- テーブルが既に存在する場合は削除
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- ユーザーテーブル
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  sheet_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- イベントテーブル
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  work_type TEXT NOT NULL, -- 'office' | 'remote'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 勤怠テーブル
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  attendance_log JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- プロジェクトテーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- タスクテーブル
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  tag TEXT,
  due_date DATE,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- プロジェクトメンバーテーブル
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- インデックスの作成
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- RLSポリシーの設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのポリシー
CREATE POLICY "ユーザーは自分自身のデータを読み取れる" ON users
  FOR SELECT USING (auth.uid()::text = google_sub OR role = 'admin');

CREATE POLICY "管理者はすべてのユーザーデータを読み取れる" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE google_sub = auth.uid()::text AND role = 'admin'
    )
  );

-- イベントテーブルのポリシー
CREATE POLICY "ユーザーは自分のイベントを読み取れる" ON events
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE google_sub = auth.uid()::text)
  );

CREATE POLICY "ユーザーは自分のイベントを作成・更新・削除できる" ON events
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE google_sub = auth.uid()::text)
  );

-- 勤怠テーブルのポリシー
CREATE POLICY "ユーザーは自分の勤怠を読み取れる" ON attendance
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE google_sub = auth.uid()::text)
  );

CREATE POLICY "ユーザーは自分の勤怠を作成・更新・削除できる" ON attendance
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE google_sub = auth.uid()::text)
  );

-- プロジェクトテーブルのポリシー
CREATE POLICY "すべてのユーザーがプロジェクトを読み取れる" ON projects
  FOR SELECT USING (true);

CREATE POLICY "管理者はプロジェクトを作成・更新・削除できる" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE google_sub = auth.uid()::text AND role = 'admin'
    )
  );

-- タスクテーブルのポリシー
CREATE POLICY "ユーザーは自分のタスクを読み取れる" ON tasks
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE google_sub = auth.uid()::text)
  );

CREATE POLICY "ユーザーは自分のタスクを作成・更新・削除できる" ON tasks
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE google_sub = auth.uid()::text)
  );

-- プロジェクトメンバーテーブルのポリシー
CREATE POLICY "すべてのユーザーがプロジェクトメンバーを読み取れる" ON project_members
  FOR SELECT USING (true);

CREATE POLICY "管理者はプロジェクトメンバーを作成・更新・削除できる" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE google_sub = auth.uid()::text AND role = 'admin'
    )
  );

-- トリガー関数の作成（updated_atの自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの設定
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 
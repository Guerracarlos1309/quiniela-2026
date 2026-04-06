CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    team1 TEXT NOT NULL,
    score1 INTEGER NOT NULL CHECK (score1 >= 0),
    team2 TEXT NOT NULL,
    score2 INTEGER NOT NULL CHECK (score2 >= 0)
);

CREATE TABLE IF NOT EXISTS official_results (
    match_id TEXT PRIMARY KEY,
    score1 INTEGER NOT NULL CHECK (score1 >= 0),
    score2 INTEGER NOT NULL CHECK (score2 >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

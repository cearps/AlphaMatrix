CREATE DATABASE IF NOT EXISTS alpha;

CREATE TABLE IF NOT EXISTS alpha.test_table
(
    id    UInt32,
    name  String
)
ENGINE = MergeTree()
ORDER BY id;
INSERT INTO alpha.test_table (id, name) VALUES (1, 'example');

-- Crew channel messages. One channel per well code (plus "ops" as the default).
-- is_system = 1 marks lines posted by DrillGuard itself (e.g. an Action alert).
CREATE TABLE IF NOT EXISTS messages (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    channel    VARCHAR(120) NOT NULL DEFAULT 'ops',
    user_id    INT UNSIGNED NULL,
    author     VARCHAR(120) NOT NULL,
    role       VARCHAR(60)  NULL,
    body       VARCHAR(1000) NOT NULL,
    is_system  TINYINT(1)   NOT NULL DEFAULT 0,
    alert_id   INT UNSIGNED NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_messages_channel (channel, id),
    CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_messages_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

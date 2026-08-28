-- DrillGuard schema (MySQL / MariaDB). Idempotent-ish: safe to re-run on a fresh DB.

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(40)  NOT NULL DEFAULT 'engineer',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wells (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code       VARCHAR(80)  NOT NULL,
    name       VARCHAR(160) NOT NULL,
    field      VARCHAR(120) NULL,
    rig        VARCHAR(120) NULL,
    operator   VARCHAR(120) NULL,
    status     VARCHAR(40)  NOT NULL DEFAULT 'active',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_wells_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    well_id          INT UNSIGNED NULL,
    dataset_id       VARCHAR(120) NULL,
    mechanism        VARCHAR(60)  NOT NULL DEFAULT 'unknown',
    tier             VARCHAR(30)  NOT NULL DEFAULT 'Watch',
    severity         VARCHAR(20)  NOT NULL DEFAULT 'medium',
    risk_score       DECIMAL(6,2) NULL,
    index_label      VARCHAR(40)  NULL,
    index_value      DECIMAL(14,3) NULL,
    title            VARCHAR(200) NOT NULL,
    description      VARCHAR(500) NULL,
    active_monitors  VARCHAR(120) NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'active',
    acknowledged_by  INT UNSIGNED NULL,
    acknowledged_at  DATETIME     NULL,
    source           VARCHAR(20)  NOT NULL DEFAULT 'replay',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_alerts_well (well_id),
    KEY idx_alerts_status (status),
    CONSTRAINT fk_alerts_well FOREIGN KEY (well_id) REFERENCES wells (id) ON DELETE SET NULL,
    CONSTRAINT fk_alerts_ackby FOREIGN KEY (acknowledged_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incidents (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code            VARCHAR(40)  NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT         NULL,
    type            VARCHAR(60)  NOT NULL DEFAULT 'Other',
    severity        VARCHAR(20)  NOT NULL DEFAULT 'medium',
    status          VARCHAR(20)  NOT NULL DEFAULT 'open',
    well_id         INT UNSIGNED NULL,
    well_label      VARCHAR(160) NULL,
    source_alert_id INT UNSIGNED NULL,
    origin          VARCHAR(20)  NOT NULL DEFAULT 'manual',
    detected_at     DATETIME     NULL,
    owner           VARCHAR(120) NULL,
    created_by      INT UNSIGNED NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_incidents_code (code),
    KEY idx_incidents_status (status),
    CONSTRAINT fk_incidents_well FOREIGN KEY (well_id) REFERENCES wells (id) ON DELETE SET NULL,
    CONSTRAINT fk_incidents_alert FOREIGN KEY (source_alert_id) REFERENCES alerts (id) ON DELETE SET NULL,
    CONSTRAINT fk_incidents_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incident_activity (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id INT UNSIGNED NOT NULL,
    actor       VARCHAR(120) NULL,
    action      VARCHAR(60)  NOT NULL,
    note        VARCHAR(500) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_incident (incident_id),
    CONSTRAINT fk_activity_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    alert_id   INT UNSIGNED NULL,
    channel    VARCHAR(20)  NOT NULL,
    recipient  VARCHAR(190) NOT NULL,
    status     VARCHAR(20)  NOT NULL DEFAULT 'dryrun',
    provider   VARCHAR(40)  NULL,
    detail     VARCHAR(500) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notif_alert (alert_id),
    CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

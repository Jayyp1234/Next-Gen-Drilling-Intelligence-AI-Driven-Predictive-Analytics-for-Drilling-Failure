-- Store-and-forward outbox: keep the message body so an SMS that could not be
-- delivered (no internet on the rig) is QUEUED and re-sent when the link returns.
ALTER TABLE notifications ADD COLUMN body VARCHAR(500) NULL AFTER detail;
ALTER TABLE notifications ADD INDEX idx_notif_status (status);

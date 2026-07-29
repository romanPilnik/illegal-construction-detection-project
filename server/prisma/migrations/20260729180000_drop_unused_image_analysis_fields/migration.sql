-- Align production DB with schema.prisma after unused fields were removed from the Prisma model.
-- Without this, Image inserts fail: Prisma only sends file_path, but MySQL still requires the old NOT NULL columns.

ALTER TABLE `Image`
  DROP COLUMN `file_size_bytes`,
  DROP COLUMN `mime_type`,
  DROP COLUMN `width`,
  DROP COLUMN `height`,
  DROP COLUMN `created_at`;

ALTER TABLE `Analysis`
  DROP COLUMN `bbox_x1`,
  DROP COLUMN `bbox_y1`,
  DROP COLUMN `bbox_x2`,
  DROP COLUMN `bbox_y2`,
  DROP COLUMN `location_address`;

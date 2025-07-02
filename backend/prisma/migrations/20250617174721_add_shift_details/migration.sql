/*
  Warnings:

  - Added the required column `breakMinutes` to the `shifts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "breakMinutes" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "role" TEXT;

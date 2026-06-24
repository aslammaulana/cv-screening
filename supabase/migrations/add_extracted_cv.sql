-- Migration: Tambah kolom extracted_cv ke tabel applicants
-- Jalankan di Supabase SQL Editor

ALTER TABLE applicants ADD COLUMN IF NOT EXISTS extracted_cv TEXT;

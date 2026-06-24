-- Menambahkan kolom id_no sebagai auto-increment (serial)
-- Digunakan untuk penamaan file PDF yang lebih rapi (1-nama-posisi.pdf)
ALTER TABLE applicants ADD COLUMN id_no BIGINT GENERATED ALWAYS AS IDENTITY;

-- Opsional: Jika ingin membuat unique constraint
-- ALTER TABLE applicants ADD CONSTRAINT unique_id_no UNIQUE(id_no);

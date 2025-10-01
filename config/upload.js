import multer from 'multer';
import path from 'path';

// Configure storage (memory storage for processing PDFs)
const storage = multer.memoryStorage();

// File filter for PDFs only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Multer upload configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Single file upload for JD (field name: jdFile)
export const uploadSinglePDF = upload.single('jdFile');

// Multiple files upload for CVs (field name: cvFiles, max 20 at once)
export const uploadMultiplePDFs = upload.array('cvFiles', 20);

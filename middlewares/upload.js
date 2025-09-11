import multer from 'multer';
import path from 'path';

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter for images only
function fileFilter(req, file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) are allowed'));
  }
}

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
});

export default upload;

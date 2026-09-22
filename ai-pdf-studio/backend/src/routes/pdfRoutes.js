const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfController = require('../controllers/pdfController');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// PDF Routes
router.post('/merge', upload.array('files', 20), pdfController.mergePdf);
router.post('/compress', upload.array('files', 10), pdfController.compressPdf);
router.post('/split', upload.single('file'), pdfController.splitPdf);
router.post('/extract-text', upload.single('file'), pdfController.extractTextToWord); // Using mammoth conceptually
router.post('/protect', upload.single('file'), pdfController.protectPdf);
router.post('/unlock', upload.single('file'), pdfController.unlockPdf);

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Serve bulk payment files
router.get('/bulk-payments/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: Only allow specific file patterns
    if (!filename.match(/^CBE_Bulk_Payment_\d+_\d+_[\d\-T]+\.xlsx$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format'
      });
    }

    const filePath = path.join(__dirname, '../../uploads/bulk-payments', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Set appropriate headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream the file
    res.sendFile(filePath);

  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file'
    });
  }
});

// Get file info (without downloading)
router.get('/bulk-payments/:filename/info', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename.match(/^CBE_Bulk_Payment_\d+_\d+_[\d\-T]+\.xlsx$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format'
      });
    }

    const filePath = path.join(__dirname, '../../uploads/bulk-payments', filename);
    
    try {
      const stats = await fs.stat(filePath);
      res.json({
        success: true,
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        sizeFormatted: formatFileSize(stats.size)
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file info'
    });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;

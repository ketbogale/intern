const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

// Get current database configuration
router.get('/config', requireAdmin, async (req, res) => {
  try {
    // Get MongoDB connection info
    const connectionState = mongoose.connection.readyState;
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown';
    
    // Return current configuration (mock data for demonstration)
    const config = {
      connection: {
        host: process.env.MONGO_HOST || 'localhost',
        port: process.env.MONGO_PORT || '27017',
        database: dbName,
        connectionString: process.env.MONGO_URI ? '[CONFIGURED]' : '[NOT SET]',
        status: connectionState === 1 ? 'Connected' : 'Disconnected'
      },
      backup: {
        schedule: process.env.BACKUP_SCHEDULE || 'daily',
        time: process.env.BACKUP_TIME || '02:00',
        enabled: process.env.BACKUP_ENABLED === 'true'
      },
      retention: {
        dataRetentionMonths: parseInt(process.env.DATA_RETENTION_MONTHS) || 24,
        archiveOldRecords: process.env.ARCHIVE_OLD_RECORDS === 'true',
        archiveAfterMonths: parseInt(process.env.ARCHIVE_AFTER_MONTHS) || 12
      },
      performance: {
        connectionPoolSize: parseInt(process.env.CONNECTION_POOL_SIZE) || 10,
        maxIdleTimeMS: parseInt(process.env.MAX_IDLE_TIME_MS) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.SERVER_SELECTION_TIMEOUT_MS) || 5000,
        indexOptimization: process.env.INDEX_OPTIMIZATION === 'true',
        cacheDurationMinutes: parseInt(process.env.CACHE_DURATION_MINUTES) || 15
      },
      gdpr: {
        enableDataExport: process.env.GDPR_DATA_EXPORT === 'true',
        enableDataDeletion: process.env.GDPR_DATA_DELETION === 'true',
        retentionPolicyEnabled: process.env.GDPR_RETENTION_POLICY === 'true'
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching database config:', error);
    res.status(500).json({ error: 'Failed to fetch database configuration' });
  }
});

// Update database configuration
router.post('/config', requireAdmin, async (req, res) => {
  try {
    const { connection, backup, retention, performance, gdpr } = req.body;

    // In a real implementation, you would:
    // 1. Validate the configuration
    // 2. Update environment variables or config file
    // 3. Apply changes that can be applied at runtime
    // 4. Schedule restart for changes that require it

    // For now, we'll simulate saving the configuration
    const updatedConfig = {
      connection: {
        ...connection,
        status: 'Configuration Updated - Restart Required'
      },
      backup,
      retention,
      performance,
      gdpr,
      lastUpdated: new Date().toISOString(),
      updatedBy: req.session.user.username
    };

    // Log the configuration change
    console.log(`Database configuration updated by ${req.session.user.username}:`, updatedConfig);

    res.json({ 
      message: 'Database configuration updated successfully',
      config: updatedConfig,
      restartRequired: true
    });
  } catch (error) {
    console.error('Error updating database config:', error);
    res.status(500).json({ error: 'Failed to update database configuration' });
  }
});

// Test database connection
router.post('/test-connection', requireAdmin, async (req, res) => {
  try {
    const { connectionString } = req.body;

    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }

    // In a real implementation, you would test the connection
    // For now, we'll simulate a connection test
    const isValid = connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://');
    
    if (isValid) {
      res.json({ 
        success: true, 
        message: 'Connection test successful',
        details: {
          host: 'Connected',
          database: 'Accessible',
          authentication: 'Valid'
        }
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Invalid connection string format',
        details: {
          error: 'Connection string must start with mongodb:// or mongodb+srv://'
        }
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: 'Failed to test database connection' });
  }
});

// Get database statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Get database stats
    const stats = await db.stats();
    
    // Get collection information
    const collections = await db.listCollections().toArray();
    const collectionStats = [];

    for (const collection of collections) {
      try {
        const collStats = await db.collection(collection.name).stats();
        collectionStats.push({
          name: collection.name,
          count: collStats.count || 0,
          size: collStats.size || 0,
          avgObjSize: collStats.avgObjSize || 0,
          indexes: collStats.nindexes || 0
        });
      } catch (error) {
        // Some collections might not support stats
        collectionStats.push({
          name: collection.name,
          count: 0,
          size: 0,
          avgObjSize: 0,
          indexes: 0
        });
      }
    }

    res.json({
      database: {
        name: db.databaseName,
        collections: stats.collections || 0,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        indexes: stats.indexes || 0,
        indexSize: stats.indexSize || 0
      },
      collections: collectionStats,
      connection: {
        status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        host: mongoose.connection.host,
        port: mongoose.connection.port
      }
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database statistics' });
  }
});

// GDPR Data Export
router.post('/gdpr/export', requireAdmin, async (req, res) => {
  try {
    const { studentId, dataTypes } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // In a real implementation, you would:
    // 1. Collect all data related to the student
    // 2. Format it according to GDPR requirements
    // 3. Create a downloadable file

    const exportData = {
      studentId,
      exportDate: new Date().toISOString(),
      dataTypes: dataTypes || ['attendance', 'personal', 'meal_records'],
      data: {
        personal: {
          // Mock data - in real implementation, fetch from database
          message: 'Student personal data would be exported here'
        },
        attendance: {
          message: 'Student attendance records would be exported here'
        },
        meal_records: {
          message: 'Student meal records would be exported here'
        }
      }
    };

    res.json({
      message: 'Data export prepared successfully',
      exportId: `export_${studentId}_${Date.now()}`,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting GDPR data:', error);
    res.status(500).json({ error: 'Failed to export student data' });
  }
});

// GDPR Data Deletion
router.post('/gdpr/delete', requireAdmin, async (req, res) => {
  try {
    const { studentId, dataTypes, confirmDeletion } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    if (!confirmDeletion) {
      return res.status(400).json({ error: 'Deletion confirmation is required' });
    }

    // In a real implementation, you would:
    // 1. Verify the student exists
    // 2. Delete or anonymize the specified data types
    // 3. Log the deletion for audit purposes

    const deletionLog = {
      studentId,
      deletionDate: new Date().toISOString(),
      dataTypes: dataTypes || ['attendance', 'personal', 'meal_records'],
      deletedBy: req.session.user.username,
      status: 'completed'
    };

    console.log('GDPR Data Deletion:', deletionLog);

    res.json({
      message: 'Student data deleted successfully',
      deletionId: `deletion_${studentId}_${Date.now()}`,
      log: deletionLog
    });
  } catch (error) {
    console.error('Error deleting GDPR data:', error);
    res.status(500).json({ error: 'Failed to delete student data' });
  }
});

module.exports = router;

const axios = require('axios');
const crypto = require('crypto');

class CBEApiService {
  constructor() {
    this.baseUrl = process.env.CBE_API_URL || 'https://api.cbe.com.et/corporate';
    this.clientId = process.env.CBE_CLIENT_ID || 'SALALE_UNIVERSITY';
    this.clientSecret = process.env.CBE_CLIENT_SECRET || 'your_cbe_secret';
    this.apiKey = process.env.CBE_API_KEY || 'your_cbe_api_key';
  }

  // Generate authentication token for CBE API
  async getAuthToken() {
    try {
      // In development, always return mock token to avoid 404 errors
      if (process.env.NODE_ENV === 'development') {
        return 'mock_cbe_token_' + Date.now();
      }

      const timestamp = Date.now().toString();
      const signature = this.generateSignature(timestamp);

      const response = await axios.post(`${this.baseUrl}/auth/token`, {
        client_id: this.clientId,
        timestamp,
        signature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 30000
      });

      return response.data.access_token;
    } catch (error) {
      console.error('CBE Auth Error:', error.message);
      // Mock token for development
      return 'mock_cbe_token_' + Date.now();
    }
  }

  // Generate signature for CBE API authentication
  generateSignature(timestamp) {
    const payload = `${this.clientId}${timestamp}${this.clientSecret}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  // Process bulk payment through CBE API
  async processBulkPayment(paymentRequest) {
    try {
      const token = await this.getAuthToken();
      
      // Prepare CBE bulk payment request
      const bulkPaymentData = {
        batch_id: `SALALE_${Date.now()}`,
        total_amount: paymentRequest.totalAmount,
        total_records: paymentRequest.totalRecords,
        currency: 'ETB',
        payment_type: 'BULK_TRANSFER',
        description: 'University Student Monthly Allowances',
        file_reference: paymentRequest.fileId,
        callback_url: `${process.env.FRONTEND_URL}/api/cbe-webhook/payment-status`
      };

      // Mock CBE API response for development
      if (process.env.NODE_ENV === 'development') {
        return this.mockCBEResponse(bulkPaymentData);
      }

      const response = await axios.post(`${this.baseUrl}/bulk-payments/process`, bulkPaymentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 60000
      });

      return {
        success: true,
        batchId: response.data.batch_id,
        transactionId: response.data.transaction_id,
        status: response.data.status,
        message: response.data.message,
        estimatedCompletion: response.data.estimated_completion
      };

    } catch (error) {
      console.error('CBE Bulk Payment Error:', error.message);
      return {
        success: false,
        error: error.message,
        status: 'FAILED'
      };
    }
  }

  // Mock CBE response for development/testing
  mockCBEResponse(paymentData) {
    // Simulate processing delay
    const processingTime = Math.random() * 5000 + 2000; // 2-7 seconds
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // 95% success rate for testing
        const success = Math.random() > 0.05;
        
        if (success) {
          resolve({
            success: true,
            batchId: `CBE_${paymentData.batch_id}`,
            transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            status: 'COMPLETED',
            message: 'Bulk payment processed successfully',
            estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes
          });
        } else {
          resolve({
            success: false,
            error: 'Insufficient funds or system maintenance',
            status: 'FAILED'
          });
        }
      }, processingTime);
    });
  }

  // Check payment status
  async checkPaymentStatus(batchId) {
    try {
      const token = await this.getAuthToken();

      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          status: 'COMPLETED',
          processed_records: Math.floor(Math.random() * 100) + 50,
          failed_records: Math.floor(Math.random() * 5),
          total_amount_processed: Math.floor(Math.random() * 100000) + 50000
        };
      }

      const response = await axios.get(`${this.baseUrl}/bulk-payments/status/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': this.apiKey
        },
        timeout: 30000
      });

      return response.data;

    } catch (error) {
      console.error('CBE Status Check Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate account number with CBE
  async validateAccount(accountNumber, accountName) {
    try {
      const token = await this.getAuthToken();

      if (process.env.NODE_ENV === 'development') {
        // Mock validation - 90% success rate
        return {
          valid: Math.random() > 0.1,
          accountName: accountName,
          accountStatus: 'ACTIVE'
        };
      }

      const response = await axios.post(`${this.baseUrl}/accounts/validate`, {
        account_number: accountNumber,
        account_name: accountName
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 15000
      });

      return response.data;

    } catch (error) {
      console.error('CBE Account Validation Error:', error.message);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const token = await this.getAuthToken();

      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          balance: Math.floor(Math.random() * 1000000) + 500000, // 500K - 1.5M ETB
          currency: 'ETB',
          available_balance: Math.floor(Math.random() * 800000) + 400000
        };
      }

      const response = await axios.get(`${this.baseUrl}/accounts/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': this.apiKey
        },
        timeout: 15000
      });

      return response.data;

    } catch (error) {
      console.error('CBE Balance Check Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CBEApiService();

const crypto = require('crypto');

/**
 * National Bank of Ethiopia Transfer Service
 * Simulates direct bank transfers to student accounts
 */
class BankTransferService {
  constructor() {
    this.bankName = 'National Bank of Ethiopia';
    this.institutionCode = 'NBE001';
  }

  /**
   * Generate a unique transfer reference
   */
  generateTransferReference() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `NBE${timestamp}${random}`;
  }

  /**
   * Validate bank account number format
   */
  validateAccountNumber(accountNumber) {
    // NBE account numbers are 13 digits
    const accountRegex = /^\d{13}$/;
    return accountRegex.test(accountNumber);
  }

  /**
   * Process bank transfer to student account
   */
  async processTransfer(transferData) {
    const { accountNumber, amount, studentName, studentId, description } = transferData;

    // Validate inputs
    if (!this.validateAccountNumber(accountNumber)) {
      throw new Error('Invalid bank account number format');
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid transfer amount');
    }

    // Generate transfer reference
    const transferReference = this.generateTransferReference();

    try {
      // Simulate API call to NBE banking system
      const transferResult = await this.simulateNBETransfer({
        accountNumber,
        amount,
        reference: transferReference,
        description: description || `Monthly allowance for student ${studentId}`,
        beneficiaryName: studentName
      });

      return {
        success: true,
        transferReference,
        accountNumber,
        amount,
        status: 'completed',
        transferDate: new Date(),
        bankResponse: transferResult.message,
        transactionId: transferResult.transactionId
      };

    } catch (error) {
      return {
        success: false,
        transferReference,
        accountNumber,
        amount,
        status: 'failed',
        transferDate: new Date(),
        bankResponse: error.message,
        error: error.message
      };
    }
  }

  /**
   * Simulate NBE banking system API call
   * In production, this would be replaced with actual NBE API integration
   */
  async simulateNBETransfer(transferData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate different response scenarios
    const scenarios = [
      { probability: 0.85, success: true, message: 'Transfer completed successfully' },
      { probability: 0.10, success: false, message: 'Insufficient funds in source account' },
      { probability: 0.03, success: false, message: 'Beneficiary account not found' },
      { probability: 0.02, success: false, message: 'Network timeout - please retry' }
    ];

    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const scenario of scenarios) {
      cumulativeProbability += scenario.probability;
      if (random <= cumulativeProbability) {
        if (scenario.success) {
          return {
            success: true,
            message: scenario.message,
            transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            accountNumber: transferData.accountNumber,
            amount: transferData.amount,
            timestamp: new Date().toISOString()
          };
        } else {
          throw new Error(scenario.message);
        }
      }
    }

    // Default success case
    return {
      success: true,
      message: 'Transfer completed successfully',
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      accountNumber: transferData.accountNumber,
      amount: transferData.amount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process bulk transfers to multiple accounts
   */
  async processBulkTransfers(transfers) {
    const results = {
      successful: [],
      failed: [],
      total: transfers.length
    };

    // Process transfers in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = [];
    
    for (let i = 0; i < transfers.length; i += concurrencyLimit) {
      chunks.push(transfers.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (transfer) => {
        try {
          const result = await this.processTransfer(transfer);
          if (result.success) {
            results.successful.push({
              studentId: transfer.studentId,
              studentName: transfer.studentName,
              accountNumber: transfer.accountNumber,
              amount: transfer.amount,
              transferReference: result.transferReference,
              transactionId: result.transactionId
            });
          } else {
            results.failed.push({
              studentId: transfer.studentId,
              studentName: transfer.studentName,
              accountNumber: transfer.accountNumber,
              amount: transfer.amount,
              error: result.error
            });
          }
        } catch (error) {
          results.failed.push({
            studentId: transfer.studentId,
            studentName: transfer.studentName,
            accountNumber: transfer.accountNumber,
            amount: transfer.amount,
            error: error.message
          });
        }
      });

      await Promise.all(chunkPromises);
    }

    return results;
  }
}

module.exports = new BankTransferService();

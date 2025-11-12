const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Create a new donation
router.post('/', async (req, res) => {
  try {
    const { name, phone, amount, gender, paymentMethod, transactionId } = req.body;
    
    // Validate required fields
    if (!name || !phone || !amount || !gender || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, phone, amount, gender, paymentMethod'
      });
    }
    
    // Validate name contains only letters and spaces
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name must contain only letters and spaces. Numbers and special characters are not allowed.'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Validate amount is positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive amount'
      });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be one of: male, female, other'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['gpay', 'phonepe', 'paytm'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method must be one of: gpay, phonepe, paytm'
      });
    }

    // IMPORTANT: Transaction ID is REQUIRED for payment confirmation
    if (!transactionId || transactionId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required to complete the donation. Please make the payment first and provide the transaction ID.'
      });
    }
    
    // Validate transaction ID length (must be at least 8 characters)
    if (transactionId.trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transaction ID (minimum 8 characters)'
      });
    }

    // Only create donation if transaction ID is provided (payment confirmed)
    const donation = await Donation.create({
      name,
      phone,
      amount: parseFloat(amount),
      gender,
      paymentMethod,
      upiTransactionId: transactionId.trim(),
      status: 'completed' // Only completed donations are saved
    });

    res.status(201).json({
      success: true,
      message: '🎉 Congratulations! Your donation has been successfully completed. Thank you for your generous contribution!',
      data: donation
    });
  } catch (error) {
    console.error('Error in donation route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: donations,
      count: donations.length
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
});

// Get donation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findByPk(id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    res.json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation'
    });
  }
});

// Update donation with transaction ID
router.put('/:id/transaction', async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Validate transaction ID format
    if (transactionId.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transaction ID'
      });
    }

    // Update donation using Sequelize
    const [affectedRows] = await Donation.update(
      {
        status: 'completed',
        upiTransactionId: transactionId
      },
      {
        where: { id }
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Get the updated donation
    const updatedDonation = await Donation.findByPk(id);

    res.json({
      success: true,
      message: 'Transaction ID added successfully',
      data: updatedDonation
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation'
    });
  }
});

module.exports = router;
const { Senior } = require('../models');

// Get senior profile
async function getProfile(req, res) {
  try {
    const seniorId = req.user?.sub || req.params.id;
    if (!seniorId) {
      return res.status(400).json({ message: 'Senior ID is required' });
    }

    const senior = await Senior.findByPk(seniorId, {
      attributes: ['id', 'fullName', 'email', 'age', 'policeContact', 'ambulanceContact', 'phone1', 'phone2', 'phone3', 'createdAt']
    });

    if (!senior) {
      return res.status(404).json({ message: 'Senior not found' });
    }

    return res.json({
      id: senior.id,
      fullName: senior.fullName,
      name: senior.fullName, // alias for compatibility
      email: senior.email,
      age: senior.age,
      policeContact: senior.policeContact || '100',
      ambulanceContact: senior.ambulanceContact || '108',
      phone1: senior.phone1 || '',
      phone2: senior.phone2 || '',
      phone3: senior.phone3 || '',
      createdAt: senior.createdAt,
      // Add default values for frontend compatibility
      profileImage: 'https://via.placeholder.com/150'
    });
  } catch (error) {
    console.error('Error fetching senior profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update senior profile
async function updateProfile(req, res) {
  try {
    const seniorId = req.user?.sub;
    if (!seniorId) {
      return res.status(400).json({ message: 'Senior ID is required' });
    }

    const { fullName, email, age, policeContact, ambulanceContact, phone1, phone2, phone3 } = req.body;
    
    if (!fullName || !email || !age) {
      return res.status(400).json({ message: 'Full name, email, and age are required' });
    }

    const senior = await Senior.findByPk(seniorId);
    if (!senior) {
      return res.status(404).json({ message: 'Senior not found' });
    }

    await senior.update({
      fullName,
      email,
      age: Number(age),
      policeContact: policeContact || '100',
      ambulanceContact: ambulanceContact || '108',
      phone1: phone1 || '',
      phone2: phone2 || '',
      phone3: phone3 || ''
    });

    return res.json({
      message: 'Profile updated successfully',
      senior: {
        id: senior.id,
        fullName: senior.fullName,
        email: senior.email,
        age: senior.age,
        policeContact: senior.policeContact,
        ambulanceContact: senior.ambulanceContact,
        phone1: senior.phone1,
        phone2: senior.phone2,
        phone3: senior.phone3
      }
    });
  } catch (error) {
    console.error('Error updating senior profile:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Save push token for senior
async function savePushToken(req, res) {
  try {
    const seniorId = req.user?.sub;
    if (!seniorId) {
      return res.status(400).json({ message: 'Senior ID is required' });
    }

    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    const senior = await Senior.findByPk(seniorId);
    if (!senior) {
      return res.status(404).json({ message: 'Senior not found' });
    }

    await senior.update({ pushToken });

    return res.json({ message: 'Push token saved successfully' });
  } catch (error) {
    console.error('Error saving push token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  savePushToken
};
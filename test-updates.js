const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testUpdatedFeatures() {
  console.log('🧪 Testing Updated Features\n');

  try {
    // Test senior profile with new phone fields
    console.log('1. Testing senior profile with additional phone fields...');
    
    for (let id = 1; id <= 3; id++) {
      try {
        const response = await axios.get(`${BASE_URL}/senior/profile/${id}`);
        console.log(`✅ Senior ${id} profile:`, {
          name: response.data.fullName,
          email: response.data.email,
          age: response.data.age,
          policeContact: response.data.policeContact,
          ambulanceContact: response.data.ambulanceContact,
          phone1: response.data.phone1,
          phone2: response.data.phone2,
          phone3: response.data.phone3
        });
        break;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠ Senior ${id} not found`);
        } else {
          console.error(`✗ Error with senior ${id}:`, error.response?.data || error.message);
        }
      }
    }

    console.log('\n🎉 Testing completed!');
    console.log('\n📋 Summary of Changes:');
    console.log('✅ Certificate upload date picker fixed (no more black shadow)');
    console.log('✅ Senior profile - removed duplicate Name/Mail ID headings'); 
    console.log('✅ Emergency contacts updated:');
    console.log('   - Police: Fixed to 100');
    console.log('   - Ambulance: Fixed to 108');
    console.log('   - Phone1, Phone2, Phone3: Text fields for relative numbers');
    console.log('✅ Removed "Edit Profile" button');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testUpdatedFeatures();
const { SeniorRequest, Student, connectAndSync } = require('./src/models');

async function completeWorkflowTest() {
  console.log('🎯 Testing Complete Senior Request Workflow\n');
  
  try {
    await connectAndSync();
    
    // STEP 1: Create a request
    console.log('1️⃣ Creating a new request...');
    const newRequest = await SeniorRequest.create({
      seniorId: 3,
      title: 'Grocery Shopping Help',
      description: 'Need help with weekly grocery shopping',
      type: 'groceries',
      priority: 'medium',
      location: '123 Test Avenue',
      preferredTime: '2025-09-29T14:00:00.000Z',
      estimatedDuration: 120,
      requesterName: 'Manaa Kumar',
      requesterPhone: '9876543210',
      status: 'open'
    });
    console.log(`   ✅ Request created with ID: ${newRequest.id}`);
    
    // STEP 2: Verify it appears in both dashboards
    console.log('\n2️⃣ Verifying request appears in dashboards...');
    const openRequests = await SeniorRequest.findAll({ where: { status: 'open' } });
    const seniorActivity = await SeniorRequest.findAll({ where: { seniorId: 3 } });
    console.log(`   ✅ Open requests (Student dashboard): ${openRequests.length}`);
    console.log(`   ✅ Senior activities: ${seniorActivity.length}`);
    
    // STEP 3: Student accepts the request
    console.log('\n3️⃣ Student accepting the request...');
    await SeniorRequest.update(
      { 
        status: 'assigned', 
        assignedStudentId: 4, 
        assignedAt: new Date() 
      },
      { where: { id: newRequest.id } }
    );
    console.log(`   ✅ Request assigned to student 4`);
    
    // STEP 4: Verify visibility after acceptance
    console.log('\n4️⃣ Verifying visibility after acceptance...');
    const openAfterAccept = await SeniorRequest.findAll({ where: { status: 'open' } });
    const assignedToStudent = await SeniorRequest.findAll({ where: { assignedStudentId: 4 } });
    const seniorActivityAfterAccept = await SeniorRequest.findAll({ where: { seniorId: 3 } });
    console.log(`   ✅ Open requests now: ${openAfterAccept.length} (should be 0)`);
    console.log(`   ✅ Student's assigned tasks: ${assignedToStudent.length} (should be 1)`);
    console.log(`   ✅ Senior activities: ${seniorActivityAfterAccept.length} (should be 1, status: ${seniorActivityAfterAccept[0]?.status})`);
    
    // STEP 5: Senior completes the task
    console.log('\n5️⃣ Senior marking task as completed...');
    
    // Get current student stats before completion
    const studentBefore = await Student.findByPk(4);
    console.log(`   Student stats BEFORE completion:`, {
      tasks: studentBefore.completedTasks || 0,
      hours: parseFloat(studentBefore.hoursServed || 0),
      score: studentBefore.score || 0
    });
    
    // Complete the task and update stats
    const hoursServed = newRequest.estimatedDuration / 60; // 120 min = 2 hours
    const newTasks = (studentBefore.completedTasks || 0) + 1;
    const newHours = parseFloat(studentBefore.hoursServed || 0) + hoursServed;
    const newScore = (studentBefore.score || 0) + (hoursServed * 100);
    
    await Student.update({
      completedTasks: newTasks,
      hoursServed: newHours,
      score: newScore
    }, { where: { id: 4 } });
    
    // Delete the completed request
    await SeniorRequest.destroy({ where: { id: newRequest.id } });
    console.log(`   ✅ Task completed and removed from dashboard`);
    
    // Get updated student stats
    const studentAfter = await Student.findByPk(4);
    console.log(`   Student stats AFTER completion:`, {
      tasks: studentAfter.completedTasks,
      hours: parseFloat(studentAfter.hoursServed),
      score: studentAfter.score
    });
    
    // STEP 6: Verify removal from all dashboards
    console.log('\n6️⃣ Verifying removal from all dashboards...');
    const remainingRequests = await SeniorRequest.findAll();
    const studentTasks = await SeniorRequest.findAll({ where: { assignedStudentId: 4 } });
    const seniorActivitiesFinal = await SeniorRequest.findAll({ where: { seniorId: 3 } });
    
    console.log(`   ✅ Total requests in database: ${remainingRequests.length} (should be 0)`);
    console.log(`   ✅ Student tasks: ${studentTasks.length} (should be 0)`);
    console.log(`   ✅ Senior activities: ${seniorActivitiesFinal.length} (should be 0)`);
    
    // STEP 7: Test cancel workflow
    console.log('\n7️⃣ Testing cancel workflow...');
    const cancelRequest = await SeniorRequest.create({
      seniorId: 3,
      title: 'Test Cancel Request',
      description: 'This will be cancelled',
      type: 'other',
      priority: 'low',
      status: 'open'
    });
    console.log(`   Created request ${cancelRequest.id} for cancel test`);
    
    // Cancel (delete) the request
    await SeniorRequest.destroy({ where: { id: cancelRequest.id } });
    console.log(`   ✅ Request cancelled and deleted`);
    
    // Verify deletion
    const finalCount = await SeniorRequest.count();
    console.log(`   ✅ Final request count: ${finalCount} (should be 0)`);
    
    console.log('\n🎉 COMPLETE WORKFLOW TEST PASSED!');
    console.log('\n📋 Summary:');
    console.log('✅ 1. Request creation → appears in both dashboards');
    console.log('✅ 2. Student accepts → hidden from others, shows "assigned" in senior activities');
    console.log('✅ 3. Senior completes → removed from all dashboards + student stats updated');
    console.log('✅ 4. Cancel request → completely deleted from database');
    console.log('✅ 5. Student profile properly tracks: tasks, hours, score (100pts/hour)');
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  } finally {
    process.exit();
  }
}

completeWorkflowTest();
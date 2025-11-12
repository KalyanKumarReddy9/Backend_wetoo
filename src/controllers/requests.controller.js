const { Request } = require('../models');

async function createRequest(req, res) {
  const { type } = req.body;
  const allowed = ['hospital', 'rides', 'groceries', 'companionship'];
  if (!allowed.includes(type)) return res.status(400).json({ message: 'Invalid type' });
  // seniors create requests; identify by email they used
  const seniorEmail = req.body.email || req.user?.email || req.body.seniorEmail;
  if (!seniorEmail) return res.status(400).json({ message: 'senior email required' });
  const r = await Request.create({ type, seniorEmail, status: 'new' });
  return res.status(201).json(r);
}

async function listRequests(req, res) {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;
  const rows = await Request.findAll({ where, order: [['createdAt', 'DESC']] });
  return res.json(rows);
}

async function updateRequest(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['assigned', 'in_progress', 'completed'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const assignedStudentId = req.user?.role === 'student' ? req.user.sub : null;
  const [count] = await Request.update(
    { status, assignedStudentId: assignedStudentId || null },
    { where: { id } }
  );
  if (!count) return res.status(404).json({ message: 'Not found' });
  const updated = await Request.findByPk(id);
  return res.json(updated);
}

module.exports = { createRequest, listRequests, updateRequest };


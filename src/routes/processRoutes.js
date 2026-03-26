const express = require('express');
const router = express.Router();
const {
  createProcess,
  getProcesses,
  getProcess,
  updateProcess,
  deleteProcess,
  analyzeProcessById,
} = require('../controllers/processController');

router.route('/').get(getProcesses).post(createProcess);

router.route('/:id').get(getProcess).put(updateProcess).delete(deleteProcess);

router.post('/:id/analyze', analyzeProcessById);

module.exports = router;

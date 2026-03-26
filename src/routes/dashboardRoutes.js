const express = require('express');
const router = express.Router();
const { getStats, getOverview } = require('../controllers/dashboardController');

router.get('/stats', getStats);
router.get('/overview', getOverview);

module.exports = router;

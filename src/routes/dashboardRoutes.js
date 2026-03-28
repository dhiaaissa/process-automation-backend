const express = require('express');
const router = express.Router();
const { getStats, getOverview, getBIData } = require('../controllers/dashboardController');

router.get('/stats', getStats);
router.get('/overview', getOverview);
router.get('/bi', getBIData);

module.exports = router;

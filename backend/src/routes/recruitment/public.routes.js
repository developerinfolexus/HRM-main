const express = require('express');
const router = express.Router();
const publicController = require('../../controllers/Recruitment/public.controller');

router.get('/jobs', publicController.getAllActiveJobs);
router.get('/job/:id', publicController.getJobDetails);
router.post('/apply', publicController.submitApplication);

module.exports = router;

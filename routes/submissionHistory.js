const express = require('express');
const router = express.Router();
const { getSubmissionHistory } = require('../controllers/submissionHistory'); // Destructure correctly

router.get("/", getSubmissionHistory);

module.exports = router;

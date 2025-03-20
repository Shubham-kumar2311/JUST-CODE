const Submission = require('../models/submission');

exports.getSubmissionHistory = async (req, res) => {
  try {
    const { userId, problemId } = req.query;

    if (!userId || !problemId) {
      return res.status(400).json({ error: 'User ID and Problem ID are required' });
    }

    // Fetch submissions for the user and problem, sorted by submission date (newest first)
    const submissions = await Submission.find({ userId, problemId })
      .sort({ submittedAt: -1 })
      .select('status submittedAt code language testCaseResults');

    if (!submissions || submissions.length === 0) {
      return res.status(200).json([]);
    }

    // Format the response
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      status: sub.status,
      submittedAt: sub.submittedAt,
      code: sub.code,
      language: sub.language,
      testCaseResults: sub.testCaseResults || [],
    }));

    res.status(200).json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submission history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
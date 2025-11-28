const User = require('../models/User');
const Feedback = require('../models/Feedback');

/**
 * Get admin dashboard with user count, feedback statistics
 */
const getAdminDashboard = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total user count
    const totalUsers = await User.countDocuments();

    // Get all feedback with pagination
    const feedbackList = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total feedback count
    const totalFeedback = await Feedback.countDocuments();

    // Calculate average rating
    const ratings = await Feedback.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratings.length > 0 ? ratings[0].avgRating.toFixed(1) : 'N/A';

    // Pagination info
    const totalPages = Math.ceil(totalFeedback / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.render('admin', {
      totalUsers,
      totalFeedback,
      averageRating,
      feedbackList,
      currentPage: parseInt(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
      prevPage: parseInt(page) - 1,
      nextPage: parseInt(page) + 1,
      showPagination: totalPages > 1
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    res.status(500).render('admin', { 
      error: 'Failed to load admin dashboard',
      totalUsers: 0,
      totalFeedback: 0,
      averageRating: 'N/A',
      feedbackList: []
    });
  }
};

module.exports = {
  getAdminDashboard
};


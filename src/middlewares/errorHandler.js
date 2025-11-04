exports.errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: 'Server error', message: err.message || '' });
};

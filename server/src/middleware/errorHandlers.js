export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
}

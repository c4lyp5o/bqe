const errorHandler = (err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
};

export default errorHandler;

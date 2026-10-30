// Creates an error that carries an HTTP status code.
export const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Lets controllers be async without try/catch in every function.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ message: 'A record with the same unique value already exists' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({ message: 'This record is in use by other records and cannot be removed' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'A referenced record (patient, doctor, department...) does not exist' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
};

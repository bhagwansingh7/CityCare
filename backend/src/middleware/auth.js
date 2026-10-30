import jwt from 'jsonwebtoken';
import { getUserWithProfile } from '../services/userService.js';

// Reads the JWT from the HTTP-only cookie and loads the user into req.user.
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Please log in to continue' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserWithProfile(payload.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Your account is not active' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again' });
    }
    next(err);
  }
};

// Allows only the listed roles, e.g. authorize('admin', 'doctor')
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to do this' });
  }
  next();
};

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/config';

// Generate JWT token
export const generateToken = (userId: string, email: string, role: string): string => {
  const options: SignOptions = { expiresIn: Number(config.jwtExpiresIn) };
  return jwt.sign(
    { id: userId, email, role },
    config.jwtSecret,
    options
  );
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Validate restaurant email domain
export const validateRestaurantEmail = (email: string): boolean => {
  const domain = email.split('@')[1];
  return domain === config.restaurantEmailDomain;
}; 
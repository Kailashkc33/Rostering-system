import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  restaurantEmailDomain: process.env.RESTAURANT_EMAIL_DOMAIN || 'yourrestaurant.com',
  allowedIPs: process.env.ALLOWED_IPS?.split(',') || [],
}; 
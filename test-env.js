import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== Environment Variables Check ===');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CLIENT_ID length:', process.env.GOOGLE_CLIENT_ID?.length);
console.log('GOOGLE_CLIENT_SECRET length:', process.env.GOOGLE_CLIENT_SECRET?.length);
console.log('GOOGLE_CLIENT_ID preview:', process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + '...');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Google OAuth should be enabled');
} else {
  console.log('❌ Google OAuth will be disabled');
  console.log('Missing variables:', {
    clientId: !process.env.GOOGLE_CLIENT_ID,
    clientSecret: !process.env.GOOGLE_CLIENT_SECRET
  });
}
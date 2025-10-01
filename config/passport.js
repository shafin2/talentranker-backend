import passport from 'passport';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Debug: Check if environment variables exist
console.log('🔍 Checking Google OAuth Environment Variables:');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);

// Configure Google OAuth strategy only if environment variables are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID.trim() && process.env.GOOGLE_CLIENT_SECRET.trim()) {
  
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID.trim(),
          clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
          callbackURL: 'http://localhost:5000/api/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists with Google ID
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
              return done(null, user);
            }

            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.avatar = profile.photos[0]?.value;
              await user.save();
              return done(null, user);
            }

            // Get Freemium plan for new users
            const Plan = (await import('../models/Plan.js')).default;
            const freemiumPlan = await Plan.findOne({ name: 'Freemium', region: 'Global' });
            
            // Create new user
            user = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0]?.value,
              role: 'user', // Always create as user
              plan: freemiumPlan?._id || null // Assign Freemium plan if available
            });

            await user.save();
            return done(null, user);

          } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id).select('-password -refreshTokens');
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    console.log('✅ Google OAuth strategy configured successfully');
  } catch (error) {
    console.error('❌ Error configuring Google OAuth:', error.message);
    console.log('⚠️  Google OAuth disabled due to configuration error');
  }
} else {
  console.log('⚠️  Google OAuth disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not found or empty');
  if (!process.env.GOOGLE_CLIENT_ID) console.log('   - GOOGLE_CLIENT_ID is missing');
  if (!process.env.GOOGLE_CLIENT_SECRET) console.log('   - GOOGLE_CLIENT_SECRET is missing');
}

export default passport;
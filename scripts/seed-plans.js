import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from '../models/Plan.js';

// Load environment variables
dotenv.config();

const seedPlans = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talentranker');
    console.log('Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    const plans = [
      // Freemium Global Plan
      {
        name: 'Freemium',
        region: 'Global',
        billingCycle: null,
        price: 0,
        currency: 'USD',
        jdLimit: 1,
        cvLimit: 10,
        description: 'Perfect for trying out TalentRanker',
        features: ['1 Job Description', '10 CV Reviews', 'Basic Matching', 'Email Support'],
        sortOrder: 1
      },

      // Pakistan Plans
      // Starter
      {
        name: 'Starter',
        region: 'Pakistan',
        billingCycle: 'Monthly',
        price: 5000,
        currency: 'PKR',
        jdLimit: 10,
        cvLimit: 500,
        description: 'Great for small teams and startups',
        features: ['10 Job Descriptions', '500 CV Reviews', 'Advanced Matching', 'Priority Support'],
        sortOrder: 2
      },
      {
        name: 'Starter',
        region: 'Pakistan',
        billingCycle: 'SixMonth',
        price: 25000,
        currency: 'PKR',
        jdLimit: 10,
        cvLimit: 500,
        description: 'Great for small teams and startups (6 months)',
        features: ['10 Job Descriptions', '500 CV Reviews', 'Advanced Matching', 'Priority Support'],
        sortOrder: 3
      },
      {
        name: 'Starter',
        region: 'Pakistan',
        billingCycle: 'Annual',
        price: 50000,
        currency: 'PKR',
        jdLimit: 10,
        cvLimit: 500,
        description: 'Great for small teams and startups (Annual)',
        features: ['10 Job Descriptions', '500 CV Reviews', 'Advanced Matching', 'Priority Support'],
        sortOrder: 4
      },

      // Growth
      {
        name: 'Growth',
        region: 'Pakistan',
        billingCycle: 'Monthly',
        price: 12000,
        currency: 'PKR',
        jdLimit: 25,
        cvLimit: 1500,
        description: 'Perfect for growing companies',
        features: ['25 Job Descriptions', '1500 CV Reviews', 'AI-Powered Matching', 'Phone Support', 'Custom Reports'],
        sortOrder: 5
      },
      {
        name: 'Growth',
        region: 'Pakistan',
        billingCycle: 'SixMonth',
        price: 60000,
        currency: 'PKR',
        jdLimit: 25,
        cvLimit: 1500,
        description: 'Perfect for growing companies (6 months)',
        features: ['25 Job Descriptions', '1500 CV Reviews', 'AI-Powered Matching', 'Phone Support', 'Custom Reports'],
        sortOrder: 6
      },
      {
        name: 'Growth',
        region: 'Pakistan',
        billingCycle: 'Annual',
        price: 120000,
        currency: 'PKR',
        jdLimit: 25,
        cvLimit: 1500,
        description: 'Perfect for growing companies (Annual)',
        features: ['25 Job Descriptions', '1500 CV Reviews', 'AI-Powered Matching', 'Phone Support', 'Custom Reports'],
        sortOrder: 7
      },

      // Pro
      {
        name: 'Pro',
        region: 'Pakistan',
        billingCycle: 'Monthly',
        price: 25000,
        currency: 'PKR',
        jdLimit: 50,
        cvLimit: 3000,
        description: 'For established businesses with high volume',
        features: ['50 Job Descriptions', '3000 CV Reviews', 'Advanced Analytics', 'Dedicated Support', 'API Access'],
        sortOrder: 8
      },
      {
        name: 'Pro',
        region: 'Pakistan',
        billingCycle: 'SixMonth',
        price: 130000,
        currency: 'PKR',
        jdLimit: 50,
        cvLimit: 3000,
        description: 'For established businesses with high volume (6 months)',
        features: ['50 Job Descriptions', '3000 CV Reviews', 'Advanced Analytics', 'Dedicated Support', 'API Access'],
        sortOrder: 9
      },
      {
        name: 'Pro',
        region: 'Pakistan',
        billingCycle: 'Annual',
        price: 260000,
        currency: 'PKR',
        jdLimit: 50,
        cvLimit: 3000,
        description: 'For established businesses with high volume (Annual)',
        features: ['50 Job Descriptions', '3000 CV Reviews', 'Advanced Analytics', 'Dedicated Support', 'API Access'],
        sortOrder: 10
      },

      // Enterprise Pakistan
      {
        name: 'Enterprise',
        region: 'Pakistan',
        billingCycle: null,
        price: null,
        currency: 'PKR',
        jdLimit: null,
        cvLimit: null,
        description: 'Custom solution for large enterprises',
        features: ['Unlimited Job Descriptions', 'Unlimited CV Reviews', 'White-label Solution', '24/7 Support', 'Custom Integrations', 'Dedicated Account Manager'],
        sortOrder: 11
      },

      // International Plans
      // Starter
      {
        name: 'Starter',
        region: 'International',
        billingCycle: 'Monthly',
        price: 50,
        currency: 'USD',
        jdLimit: 10,
        cvLimit: 1000,
        description: 'Great for small teams and startups',
        features: ['10 Job Descriptions', '1000 CV Reviews', 'Advanced Matching', 'Priority Support'],
        sortOrder: 12
      },
      {
        name: 'Starter',
        region: 'International',
        billingCycle: 'SixMonth',
        price: 250,
        currency: 'USD',
        jdLimit: 10,
        cvLimit: 1000,
        description: 'Great for small teams and startups (6 months)',
        features: ['10 Job Descriptions', '1000 CV Reviews', 'Advanced Matching', 'Priority Support'],
        sortOrder: 13
      },
      {
        name: 'Starter',
        region: 'International',
        billingCycle: 'Annual',
        price: 500,
        currency: 'USD',
        jdLimit: 10,
        cvLimit: 1000,
        description: 'Great for small teams and startups (Annual)',
        features: ['10 Job Descriptions', '1000 CV Reviews', 'Advanced Matching', 'Priority Support'],
        sortOrder: 14
      },

      // Growth
      {
        name: 'Growth',
        region: 'International',
        billingCycle: 'Monthly',
        price: 120,
        currency: 'USD',
        jdLimit: 25,
        cvLimit: 3000,
        description: 'Perfect for growing companies',
        features: ['25 Job Descriptions', '3000 CV Reviews', 'AI-Powered Matching', 'Phone Support', 'Custom Reports'],
        sortOrder: 15
      },
      {
        name: 'Growth',
        region: 'International',
        billingCycle: 'SixMonth',
        price: 600,
        currency: 'USD',
        jdLimit: 25,
        cvLimit: 3000,
        description: 'Perfect for growing companies (6 months)',
        features: ['25 Job Descriptions', '3000 CV Reviews', 'AI-Powered Matching', 'Phone Support', 'Custom Reports'],
        sortOrder: 16
      },
      {
        name: 'Growth',
        region: 'International',
        billingCycle: 'Annual',
        price: 1200,
        currency: 'USD',
        jdLimit: 25,
        cvLimit: 3000,
        description: 'Perfect for growing companies (Annual)',
        features: ['25 Job Descriptions', '3000 CV Reviews', 'AI-Powered Matching', 'Phone Support', 'Custom Reports'],
        sortOrder: 17
      },

      // Pro
      {
        name: 'Pro',
        region: 'International',
        billingCycle: 'Monthly',
        price: 250,
        currency: 'USD',
        jdLimit: 50,
        cvLimit: 5000,
        description: 'For established businesses with high volume',
        features: ['50 Job Descriptions', '5000 CV Reviews', 'Advanced Analytics', 'Dedicated Support', 'API Access'],
        sortOrder: 18
      },
      {
        name: 'Pro',
        region: 'International',
        billingCycle: 'SixMonth',
        price: 1250,
        currency: 'USD',
        jdLimit: 50,
        cvLimit: 5000,
        description: 'For established businesses with high volume (6 months)',
        features: ['50 Job Descriptions', '5000 CV Reviews', 'Advanced Analytics', 'Dedicated Support', 'API Access'],
        sortOrder: 19
      },
      {
        name: 'Pro',
        region: 'International',
        billingCycle: 'Annual',
        price: 2500,
        currency: 'USD',
        jdLimit: 50,
        cvLimit: 5000,
        description: 'For established businesses with high volume (Annual)',
        features: ['50 Job Descriptions', '5000 CV Reviews', 'Advanced Analytics', 'Dedicated Support', 'API Access'],
        sortOrder: 20
      },

      // Enterprise International
      {
        name: 'Enterprise',
        region: 'International',
        billingCycle: null,
        price: null,
        currency: 'USD',
        jdLimit: null,
        cvLimit: null,
        description: 'Custom solution for large enterprises',
        features: ['Unlimited Job Descriptions', 'Unlimited CV Reviews', 'White-label Solution', '24/7 Support', 'Custom Integrations', 'Dedicated Account Manager'],
        sortOrder: 21
      }
    ];

    // Insert all plans
    const insertedPlans = await Plan.insertMany(plans);
    console.log(`✅ Successfully seeded ${insertedPlans.length} plans`);

    // Display summary
    console.log('\n📋 Plan Summary:');
    const groupedPlans = insertedPlans.reduce((acc, plan) => {
      const key = `${plan.region} - ${plan.name}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    }, {});

    Object.entries(groupedPlans).forEach(([key, plans]) => {
      console.log(`  ${key}: ${plans.length} billing cycles`);
    });

  } catch (error) {
    console.error('❌ Error seeding plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedPlans();
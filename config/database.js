import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Trying local MongoDB connection...');
    
    try {
      const conn = await mongoose.connect('mongodb://localhost:27017/student_study_planner');
      console.log(`📊 Local MongoDB Connected: ${conn.connection.host}`);
    } catch (localError) {
      console.error('❌ Local MongoDB connection also failed:', localError);
      console.log('📋 Please ensure MongoDB is running locally or check your Atlas credentials');
      process.exit(1);
    }
  }
};

export default connectDB;
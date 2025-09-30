import mongoose from 'mongoose';

async function dropDb(uri) {
  try {
    await mongoose.connect(uri);
    const dbName = mongoose.connection.name;
    console.log(`Connected to ${uri} (db: ${dbName}). Dropping database...`);
    await mongoose.connection.dropDatabase();
    console.log(`Successfully dropped database: ${dbName}`);
  } catch (err) {
    console.error(`Failed to drop database at ${uri}:`, err.message);
  } finally {
    await mongoose.disconnect();
  }
}

(async () => {
  // Common local URIs used previously
  const uris = [
    'mongodb://localhost:27017/student_planner',
    'mongodb://localhost:27017/student-planner'
  ];

  for (const uri of uris) {
    // Attempt to drop each possible local db
    await dropDb(uri);
  }

  console.log('Done.');
  process.exit(0);
})();

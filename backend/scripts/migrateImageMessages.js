import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function to handle existing image messages
const migrateImageMessages = async () => {
  try {
    console.log('🔄 Starting migration of image messages...');

    // Get the messages collection directly to bypass schema validation
    const db = mongoose.connection.db;
    const messagesCollection = db.collection('messages');

    // Find all messages with type 'image' or 'file'
    const imageMessages = await messagesCollection.find({
      type: { $in: ['image', 'file'] }
    }).toArray();

    console.log(`📊 Found ${imageMessages.length} image/file messages to migrate`);

    if (imageMessages.length === 0) {
      console.log('✅ No image messages found. Migration complete.');
      return;
    }

    // Option 1: Convert image messages to text messages with a note
    // Option 2: Delete image messages entirely
    // Option 3: Mark them as deleted but keep the record

    // Let's go with Option 3: Mark as deleted but keep the record
    const result = await messagesCollection.updateMany(
      { type: { $in: ['image', 'file'] } },
      {
        $set: {
          type: 'text',
          content: '[Image/File removed - Image uploading has been disabled]',
          'deleted.isDeleted': true,
          'deleted.deletedAt': new Date(),
          'deleted.deletedBy': null
        },
        $unset: {
          file: 1
        }
      }
    );

    console.log(`✅ Migration complete! Updated ${result.modifiedCount} messages`);
    console.log('📝 Image messages have been converted to deleted text messages');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateImageMessages();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
main();

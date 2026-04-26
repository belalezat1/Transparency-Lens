import 'dotenv/config'
import mongoose from 'mongoose'

const uri = process.env.MONGO_URI
if (!uri) {
  console.error('MONGO_URI is not set in .env')
  process.exit(1)
}

console.log('Connecting to MongoDB...')

mongoose
  .connect(uri)
  .then(() => {
    console.log('[SUCCESS] MongoDB connected!')
    console.log('Host:', mongoose.connection.host)
    console.log('Database:', mongoose.connection.name)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[FAILED] MongoDB connection error:', err.message)
    process.exit(1)
  })

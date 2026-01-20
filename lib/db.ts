import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('请在环境变量中设置 MONGODB_URI')
}

const uri = process.env.MONGODB_URI
// MongoDB Atlas 连接选项
const options: any = {
  // 对于 mongodb+srv:// 连接，自动启用 TLS
  // 开发环境允许更宽松的 SSL 验证（仅用于测试）
  ...(process.env.NODE_ENV === 'development' && {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  }),
  retryWrites: true,
  serverSelectionTimeoutMS: 10000, // 10 秒超时
  socketTimeoutMS: 45000, // 45 秒超时
  connectTimeoutMS: 10000, // 10 秒连接超时
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db('gold_miner')
  } catch (error: any) {
    console.error('MongoDB 连接错误:', error)
    throw new Error(`数据库连接失败: ${error.message || '未知错误'}`)
  }
}

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// 環境変数の読み込み
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })

// デバッグ用に環境変数を出力
console.log('Environment variables:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// シークレットキーの生成
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Supabaseクライアントの初期化
const supabaseUrl = 'https://ruahhhzksdslrdrhvdnt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YWhoaHprc2RzbHJkcmh2ZG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk0NTQwMTcsImV4cCI6MjAyNTAzMDAxN30.Yx-Ky-M-yfBhJGI_bLBXROXqp9mHxl9iG0NJvdera7I'

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 管理者アカウントの登録
  const createAdminUser = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'ikeike55momo@gmail.com',
        password: 'TYu28008888',
        options: {
          data: {
            role: 'admin',
            name: 'Admin User'
          }
        }
      })

      if (error) {
        console.error('Error creating admin user:', error.message)
        return
      }

      console.log('Admin user created successfully:', data)
    } catch (error) {
      console.error('Error in createAdminUser:', error)
    }
  }

  // メイン処理
  const main = async () => {
    const secret = generateSecret()
    console.log('Generated NEXTAUTH_SECRET:', secret)
    console.log('\nAdd this to your .env.local file:')
    console.log(`NEXTAUTH_SECRET=${secret}\n`)

    await createAdminUser()
  }

  main().catch(console.error)
} catch (error) {
  console.error('Error initializing Supabase client:', error)
} 
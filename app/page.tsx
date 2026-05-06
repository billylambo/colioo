import { supabase } from '@/lib/supabase'
import HomePageClient from './_components/HomePageClient'
export const revalidate = 60 // Cache pendant 60 secondes
interface Product {
  id: string
  name: string
  price: number
  original_price?: number
  slug: string
  badge?: string
  category_id?: string
  product_images: { url: string }[]
}

interface Category {
  id: string
  name: string
}

export default async function HomePage() {
  const [{ data: rawSettings }, { data: products }, { data: categories }] = await Promise.all([
    supabase.from('settings').select('key, value'),
    supabase
      .from('products')
      .select('id, name, price, original_price, slug, badge, category_id, product_images(url)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('categories').select('id, name').order('name'),
  ])

  const settings: Record<string, string> = {}
  for (const row of (rawSettings || []) as { key: string; value: unknown }[]) {
    const raw = row.value
    if (typeof raw === 'string') settings[row.key] = raw.replace(/^"|"$/g, '')
    else if (typeof raw === 'object' && raw !== null) settings[row.key] = JSON.stringify(raw)
    else settings[row.key] = String(raw ?? '')
  }

  return (
    <HomePageClient
      initialSettings={settings}
      initialProducts={(products || []) as Product[]}
      initialCategories={(categories || []) as Category[]}
    />
  )
}
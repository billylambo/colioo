import { supabase } from '@/lib/supabase'
import ProductPageClient from './ProductPageClient'
export const revalidate = 30

export async function generateStaticParams() {
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('is_published', true)
  return (data || []).map(p => ({ slug: p.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params

  const [{ data: product }, { data: rawSettings }] = await Promise.all([
    supabase
      .from('products')
      .select('*, is_test_mode, images:product_images(url, position, is_cover), sections:product_sections(*)')
      .eq('slug', slug)
      .single(),
    supabase.from('settings').select('key, value'),
  ])

  const settings: Record<string, string> = {}
  for (const row of (rawSettings || []) as { key: string; value: unknown }[]) {
    const raw = row.value
    if (typeof raw === 'string') settings[row.key] = raw.replace(/^"|"$/g, '')
    else if (typeof raw === 'object' && raw !== null) settings[row.key] = JSON.stringify(raw)
    else settings[row.key] = String(raw ?? '')
  }

  const sortedProduct = product ? {
    ...product,
    images: (product.images || []).sort((a: { position: number }, b: { position: number }) => a.position - b.position),
    sections: product.sections?.[0] || {}
  } : null

  return (
    <ProductPageClient
      initialProduct={sortedProduct}
      initialSettings={settings}
    />
  )
}
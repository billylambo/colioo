import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Suppression en cascade : events → images → sections → produit
  const [eventsRes, imagesRes, sectionsRes, productRes] = await Promise.all([
    supabaseAdmin.from('events').delete().eq('product_id', id),
    supabaseAdmin.from('product_images').delete().eq('product_id', id),
    supabaseAdmin.from('product_sections').delete().eq('product_id', id),
    supabaseAdmin.from('products').delete().eq('id', id)
  ])

  const error = eventsRes.error || imagesRes.error || sectionsRes.error || productRes.error

  console.log('Supabase cascade delete:', { eventsRes, imagesRes, sectionsRes, productRes })

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ success: true, error: null })
}
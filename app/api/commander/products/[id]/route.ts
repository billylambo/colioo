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

  // 1. Supprimer les orders (FK vers products)
  const { error: e1 } = await supabaseAdmin.from('orders').delete().eq('product_id', id)
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  // 2. Supprimer les events (FK vers products)
  const { error: e2 } = await supabaseAdmin.from('events').delete().eq('product_id', id)
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  // 3. Supprimer les images
  const { error: e3 } = await supabaseAdmin.from('product_images').delete().eq('product_id', id)
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 })

  // 4. Supprimer les sections
  const { error: e4 } = await supabaseAdmin.from('product_sections').delete().eq('product_id', id)
  if (e4) return NextResponse.json({ error: e4.message }, { status: 500 })

  // 5. Supprimer le produit
  const { error: e5 } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (e5) return NextResponse.json({ error: e5.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
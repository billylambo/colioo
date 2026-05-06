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

  // Ordre important : supprimer d'abord ce qui référence le produit
  // puis le produit lui-même
  const ordersRes = await supabaseAdmin.from('orders').delete().eq('product_id', id)
  if (ordersRes.error) {
    console.error('Erreur suppression orders:', ordersRes.error)
    return NextResponse.json({ error: ordersRes.error }, { status: 500 })
  }

  const eventsRes = await supabaseAdmin.from('events').delete().eq('product_id', id)
  if (eventsRes.error) {
    console.error('Erreur suppression events:', eventsRes.error)
  }

  const imagesRes = await supabaseAdmin.from('product_images').delete().eq('product_id', id)
  if (imagesRes.error) {
    console.error('Erreur suppression images:', imagesRes.error)
    return NextResponse.json({ error: imagesRes.error }, { status: 500 })
  }

  const sectionsRes = await supabaseAdmin.from('product_sections').delete().eq('product_id', id)
  if (sectionsRes.error) {
    console.error('Erreur suppression sections:', sectionsRes.error)
    return NextResponse.json({ error: sectionsRes.error }, { status: 500 })
  }

  const productRes = await supabaseAdmin.from('products').delete().eq('id', id)
  if (productRes.error) {
    console.error('Erreur suppression produit:', productRes.error)
    return NextResponse.json({ error: productRes.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
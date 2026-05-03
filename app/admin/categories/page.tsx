'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
  position: number
}

const accent = '#FF6B00'

export default function Categories() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('position')
    if (data) setCategories(data)
    setLoading(false)
  }

  const addCategory = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const slug = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('categories').insert({
      name: newName, slug, is_active: true, position: categories.length + 1,
    })
    if (!error) { setNewName(''); loadCategories(); showToast('✅ Catégorie ajoutée !') }
    setSaving(false)
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('categories').update({ is_active: !is_active }).eq('id', id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !is_active } : c))
    showToast(is_active ? '👁️ Catégorie désactivée' : '✅ Catégorie activée')
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== id))
      showToast('🗑️ Catégorie supprimée')
    } else {
      showToast('❌ Erreur lors de la suppression')
    }
  }

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#0D0D0D', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto', background: '#F2F2F7', minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', paddingBottom: 32 }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E5EA', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => router.push('/admin')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F2F2F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Catégories</div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>Gérez les catégories de produits</div>
          </div>
        </div>

        <div style={{ padding: '12px 12px 0' }}>

          {/* Ajouter */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Nouvelle catégorie</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="Nom de la catégorie"
                style={{ flex: 1, height: 46, borderRadius: 12, border: '1.5px solid #E5E5EA', padding: '0 14px', fontSize: 16, fontFamily: 'inherit', outline: 'none', background: '#FAFAFA' }}
              />
              <button onClick={addCategory} disabled={saving} style={{ height: 46, padding: '0 18px', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1, whiteSpace: 'nowrap' }}>
                {saving ? '…' : 'Ajouter'}
              </button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 10px', fontSize: 14, fontWeight: 900, borderBottom: '1px solid #F2F2F7' }}>
              {categories.length} catégorie{categories.length > 1 ? 's' : ''}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>Chargement…</div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#AEAEB2' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🗂️</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Aucune catégorie</div>
              </div>
            ) : categories.map((cat, i) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < categories.length - 1 ? '1px solid #F2F2F7' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0D0D0D' }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>/{cat.slug}</div>
                </div>
                <button onClick={() => toggleActive(cat.id, cat.is_active)} style={{ height: 28, padding: '0 12px', borderRadius: 20, border: 'none', background: cat.is_active ? '#ECFDF5' : '#F2F2F7', color: cat.is_active ? '#059669' : '#AEAEB2', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {cat.is_active ? '✓ Active' : 'Inactive'}
                </button>
                <button onClick={() => deleteCategory(cat.id)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF0F0', border: 'none', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
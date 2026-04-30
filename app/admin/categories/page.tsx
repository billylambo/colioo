'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
  position: number
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('position')
    if (data) setCategories(data)
    setLoading(false)
  }

  const addCategory = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const slug = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('categories').insert({
      name: newName,
      slug,
      is_active: true,
      position: categories.length + 1,
    })
    if (!error) {
      setNewName('')
      loadCategories()
    }
    setSaving(false)
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('categories').update({ is_active: !is_active }).eq('id', id)
    loadCategories()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 mb-5 text-[#FF6B00] font-inter font-semibold text-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        Retour
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal font-poppins">Catégories</h1>
        <p className="text-gray-600 font-inter mt-1">Gérez les catégories de produits</p>
      </div>

      {/* Ajouter */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-charcoal font-poppins mb-4">Nouvelle catégorie</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-inter focus:border-[#FF6B00] focus:outline-none"
            placeholder="Nom de la catégorie"
          />
          <button
            onClick={addCategory}
            disabled={saving}
            className="bg-[#FF6B00] text-white font-inter font-bold px-6 py-3 rounded-full hover:bg-[#e55f00] transition-colors disabled:opacity-50"
          >
            {saving ? '...' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-inter">Aucune catégorie</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 font-inter uppercase">Nom</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 font-inter uppercase">Slug</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 font-inter uppercase">Statut</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 font-inter uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-inter font-medium text-charcoal">{cat.name}</td>
                  <td className="px-6 py-4 font-inter text-gray-500 text-sm">/{cat.slug}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(cat.id, cat.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                        cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-700 font-inter text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
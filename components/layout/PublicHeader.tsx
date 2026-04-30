'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface PublicHeaderProps {
  showSearch?: boolean
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

export default function PublicHeader({ showSearch = false, searchQuery = '', onSearchChange }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  if (typeof window !== 'undefined' && !scrolled) {
    window.addEventListener('scroll', () => {
      setScrolled(window.scrollY > 10)
    })
  }

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/a-propos', label: 'À propos' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
        }`}
        style={{ boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Hamburger */}
          <button 
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 text-charcoal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img 
              src="/logo-colioo.png" 
              alt="COLIOO" 
              className="h-9 mobile:h-[36px] md:h-10"
            />
          </Link>

          {/* Search Icon */}
          {showSearch ? (
            <div className="w-6"></div>
          ) : (
            <Link href="/catalogue" className="p-2 -mr-2 text-charcoal hover:text-orange-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          )}
        </div>

        {/* Inline Search */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                style={{width:'100%', border:'none', outline:'none', fontSize:'16px', fontFamily:'Arial, sans-serif', background:'transparent'}}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </header>

      {/* Drawer Menu */}
      <div 
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Drawer */}
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-orange-primary font-poppins">COLIOO</span>
              <button onClick={() => setMenuOpen(false)} className="p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <nav className="p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-charcoal font-inter hover:text-orange-primary transition-colors border-b border-gray-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className={`h-[${showSearch ? '140' : '60'}]px`}></div>
    </>
  )
}
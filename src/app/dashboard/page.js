'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
  Search,
  Link2,
  FileText,
  Loader2,
  FolderOpen,
  Sparkles,
  Copy,
  Check,
  Grid3X3,
  List
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    const setup = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/')
        return
      }

      setUser(data.user)
      await fetchBookmarks(data.user.id)
      setIsLoading(false)

      const channel = supabase
        .channel('realtime-bookmarks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${data.user.id}`,
          },
          () => {
            fetchBookmarks(data.user.id)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setup()
  }, [router])

  async function fetchBookmarks(userId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) {
      setBookmarks(data)
    }
  }

  async function addBookmark(e) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setIsAdding(true)
    
    const { error } = await supabase.from('bookmarks').insert([
      {
        title: title.trim(),
        url: url.trim(),
        user_id: user.id,
      },
    ])

    if (error) {
      toast.error('Failed to add bookmark')
    } else {
      toast.success('Bookmark added successfully!', {
        icon: '🔖',
        style: {
          borderRadius: '12px',
          background: 'var(--card)',
          color: 'var(--card-foreground)',
          border: '1px solid var(--border)',
        },
      })
      setTitle('')
      setUrl('')
      setShowAddForm(false)
      fetchBookmarks(user.id)
    }
    
    setIsAdding(false)
  }

  async function deleteBookmark(id, bookmarkTitle) {
    setDeletingId(id)
    
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    
    if (error) {
      toast.error('Failed to delete bookmark')
    } else {
      toast.success(`"${bookmarkTitle}" deleted`, {
        icon: '🗑️',
        style: {
          borderRadius: '12px',
          background: 'var(--card)',
          color: 'var(--card-foreground)',
          border: '1px solid var(--border)',
        },
      })
      fetchBookmarks(user.id)
    }
    
    setDeletingId(null)
  }

  async function copyToClipboard(url, id) {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Link copied to clipboard!', {
      icon: '📋',
      style: {
        borderRadius: '12px',
        background: 'var(--card)',
        color: 'var(--card-foreground)',
        border: '1px solid var(--border)',
      },
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function logout() {
    toast.loading('Logging out...', { id: 'logout' })
    await supabase.auth.signOut()
    toast.success('Logged out successfully', { id: 'logout' })
    router.push('/')
  }

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      return null
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    },
    exit: {
      x: -100,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
           <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Loading your bookmarks...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />
      <div className="bg-pattern" />

      <div className="min-h-screen">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 glass border-b border-border"
        >
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Smart BookMark App</h1>
                  <p className="text-xs text-muted-foreground">
                    {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {user && (
                  <div className="hidden sm:flex items-center gap-3">
                    <img
                      src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full ring-2 ring-border"
                    />
                    <span className="text-sm text-muted-foreground hidden md:block">
                      {user.email}
                    </span>
                  </div>
                )}
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Search and Actions Bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary transition-colors"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>

            {/* Add Button */}
            <motion.button
              onClick={() => setShowAddForm(!showAddForm)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" />
              <span>Add Bookmark</span>
            </motion.button>
          </motion.div>

          {/* Add Bookmark Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <motion.form
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  exit={{ y: -20 }}
                  onSubmit={addBookmark}
                  className="p-6 rounded-2xl bg-card border border-border mb-8"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Add New Bookmark
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Awesome Website"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        <Link2 className="w-4 h-4 inline mr-2" />
                        URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      type="submit"
                      disabled={isAdding}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium disabled:opacity-50"
                    >
                      {isAdding ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      {isAdding ? 'Adding...' : 'Add Bookmark'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 rounded-xl bg-secondary hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {filteredBookmarks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start by adding your first bookmark!'}
              </p>
              {!searchQuery && (
                <motion.button
                  onClick={() => setShowAddForm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Bookmark
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Bookmarks List/Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredBookmarks.map((bookmark) => (
                <motion.div
                  key={bookmark.id}
                  variants={itemVariants}
                  layout
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className={`group relative p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
                    viewMode === 'grid' ? 'flex flex-col' : 'flex items-center gap-4'
                  }`}
                >
                  {/* Favicon */}
                  <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                      {getFavicon(bookmark.url) ? (
                        <img
                          src={getFavicon(bookmark.url)}
                          alt=""
                          className="w-6 h-6"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Bookmark className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? '' : ''}`}>
                    <h3 className="font-semibold truncate mb-1">{bookmark.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {bookmark.url}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-2 ${
                    viewMode === 'grid' 
                      ? 'mt-4 pt-4 border-t border-border' 
                      : 'opacity-0 group-hover:opacity-100 transition-opacity'
                  }`}>
                    <motion.button
                      onClick={() => copyToClipboard(bookmark.url, bookmark.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors"
                      title="Copy link"
                    >
                      {copiedId === bookmark.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </motion.button>
                    <motion.a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                    <motion.button
                      onClick={() => deleteBookmark(bookmark.id, bookmark.title)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={deletingId === bookmark.id}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      title="Delete bookmark"
                    >
                      {deletingId === bookmark.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-auto py-8 text-center text-muted-foreground text-sm">

        </footer>
      </div>
    </>
  )
}
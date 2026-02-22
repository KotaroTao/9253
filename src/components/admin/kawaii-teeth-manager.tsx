"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, X, Loader2, Trash2, Pencil, ImageIcon } from "lucide-react"
import { messages } from "@/lib/messages"

interface KawaiiCharacter {
  id: string
  name: string
  description: string
  imageData: string
  createdAt: string
  _count: { collections: number }
}

export function KawaiiTeethManager() {
  const [characters, setCharacters] = useState<KawaiiCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageFileName, setImageFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const m = messages.kawaiiTeeth

  async function loadCharacters() {
    try {
      const res = await fetch("/api/admin/kawaii-teeth")
      if (res.ok) {
        const data = await res.json()
        setCharacters(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCharacters()
  }, [])

  function resetForm() {
    setName("")
    setDescription("")
    setImageData(null)
    setImageFileName("")
    setEditingId(null)
    setError(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(char: KawaiiCharacter) {
    setName(char.name)
    setDescription(char.description)
    setImageData(char.imageData)
    setImageFileName("")
    setEditingId(char.id)
    setError(null)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    resetForm()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError(m.invalidImage)
      return
    }
    if (file.size > 2_000_000) {
      setError(m.imageTooLarge)
      return
    }

    setImageFileName(file.name)
    setError(null)

    const reader = new FileReader()
    reader.onload = () => {
      setImageData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const body: Record<string, string> = { name, description }
      if (imageData) body.imageData = imageData

      const isEdit = !!editingId
      const url = isEdit ? `/api/admin/kawaii-teeth/${editingId}` : "/api/admin/kawaii-teeth"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? m.saveFailed)
        return
      }

      handleClose()
      loadCharacters()
    } catch {
      setError(m.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(m.deleteConfirm)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/kawaii-teeth/${id}`, { method: "DELETE" })
      if (res.ok) {
        loadCharacters()
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{m.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{m.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {m.addCharacter}
        </button>
      </div>

      {/* Character list */}
      {characters.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed py-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">{m.noCharacters}</p>
          <button
            type="button"
            onClick={openCreateDialog}
            className="mt-3 text-sm text-primary hover:underline"
          >
            {m.addFirst}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <div
              key={char.id}
              className="group relative rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
            >
              {/* Image */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={char.imageData}
                    alt={char.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{char.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {char.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {m.acquisitionCount}: {char._count.collections}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => openEditDialog(char)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(char.id)}
                  disabled={deletingId === char.id}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingId === char.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingId ? m.editCharacter : m.addCharacter}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.imageLabel}</label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 transition-colors hover:border-primary/50"
                  >
                    {imageData ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imageData}
                        alt="preview"
                        className="h-full w-full rounded-lg object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-primary hover:underline"
                    >
                      {m.selectImage}
                    </button>
                    {imageFileName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{imageFileName}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.imageHint}</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.nameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={m.namePlaceholder}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.descriptionLabel}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder={m.descriptionPlaceholder}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {messages.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editingId && !imageData)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? m.saveChanges : m.addCharacter}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

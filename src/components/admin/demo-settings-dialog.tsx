"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import { messages } from "@/lib/messages"

interface TeethOption {
  id: string
  name: string
  imageData: string
}

interface CollectionEntry {
  collectionId: string
  teethId: string
  name: string
  imageData: string
}

interface DemoData {
  responsesSinceLastAdvisory: number
  advisoryThreshold: number
  collections: CollectionEntry[]
  allTeeth: TeethOption[]
}

interface DemoSettingsDialogProps {
  clinicId: string
  clinicName: string
  onClose: () => void
}

export function DemoSettingsDialog({ clinicId, clinicName, onClose }: DemoSettingsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState<DemoData | null>(null)

  const [advisoryCount, setAdvisoryCount] = useState(0)
  const [pendingAddIds, setPendingAddIds] = useState<string[]>([])
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[]>([])

  const m = messages.demoSettings

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/demo-settings`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setAdvisoryCount(d.responsesSinceLastAdvisory)
      } else {
        const d = await res.json()
        setError(d.error ?? "読み込みに失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleSave() {
    setError(null)
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/demo-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsesSinceLastAdvisory: advisoryCount,
          addTeethIds: pendingAddIds,
          removeCollectionIds: pendingRemoveIds,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? m.saveFailed)
        return
      }

      setSuccess(true)
      setPendingAddIds([])
      setPendingRemoveIds([])
      // リロードして最新状態を反映
      setLoading(true)
      await loadData()
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError(m.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  function handleAddTeeth(teethId: string) {
    setPendingAddIds((prev) => [...prev, teethId])
  }

  function handleRemoveCollection(collectionId: string) {
    setPendingRemoveIds((prev) => [...prev, collectionId])
  }

  function handleUndoAdd(index: number) {
    setPendingAddIds((prev) => prev.filter((_, i) => i !== index))
  }

  function handleUndoRemove(collectionId: string) {
    setPendingRemoveIds((prev) => prev.filter((id) => id !== collectionId))
  }

  // 表示用: 現在のコレクション（削除予定を除外）+ 追加予定
  const visibleCollections = data
    ? data.collections.filter((c) => !pendingRemoveIds.includes(c.collectionId))
    : []

  const pendingAddTeeth = data
    ? pendingAddIds.map((id) => data.allTeeth.find((t) => t.id === id)).filter(Boolean) as TeethOption[]
    : []

  const hasChanges =
    (data && advisoryCount !== data.responsesSinceLastAdvisory) ||
    pendingAddIds.length > 0 ||
    pendingRemoveIds.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 mx-4 flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{m.title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{clinicName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <>
              {/* AI分析カウンター */}
              <div>
                <h3 className="text-sm font-semibold">{m.advisorySection}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{m.advisoryCountHint}</p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm font-medium">{m.advisoryCountLabel}</label>
                  <input
                    type="number"
                    min={0}
                    max={data.advisoryThreshold}
                    value={advisoryCount}
                    onChange={(e) => setAdvisoryCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-sm text-muted-foreground">
                    / {data.advisoryThreshold}
                  </span>
                </div>
                {/* プレビューバー */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-purple-400 transition-all"
                    style={{ width: `${Math.min(100, (advisoryCount / data.advisoryThreshold) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Kawaii Teeth コレクション */}
              <div>
                <h3 className="text-sm font-semibold">{m.teethSection}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{m.teethDesc}</p>

                {data.allTeeth.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{m.noTeethRegistered}</p>
                ) : (
                  <>
                    {/* 現在のコレクション */}
                    {(visibleCollections.length > 0 || pendingAddTeeth.length > 0) && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          獲得済み（{visibleCollections.length + pendingAddTeeth.length}体）
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {visibleCollections.map((c) => (
                            <div key={c.collectionId} className="group relative">
                              <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-pink-200 bg-white p-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.imageData} alt={c.name} className="h-full w-full object-contain" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCollection(c.collectionId)}
                                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                                title={m.removeFromCollection}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                          {pendingAddTeeth.map((t, i) => (
                            <div key={`add-${i}`} className="group relative">
                              <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={t.imageData} alt={t.name} className="h-full w-full object-contain" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUndoAdd(i)}
                                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-gray-500 text-white group-hover:flex"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 削除取り消しボタン */}
                    {pendingRemoveIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pendingRemoveIds.map((rid) => {
                          const entry = data.collections.find((c) => c.collectionId === rid)
                          if (!entry) return null
                          return (
                            <button
                              key={rid}
                              type="button"
                              onClick={() => handleUndoRemove(rid)}
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                              {entry.name}（削除予定・クリックで取消）
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* 追加可能なキャラ一覧 */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{m.addToCollection}</p>
                      <div className="flex flex-wrap gap-2">
                        {data.allTeeth.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleAddTeeth(t.id)}
                            className="group flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 p-1 transition-colors hover:border-pink-300 hover:bg-pink-50"
                            title={t.name}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={t.imageData} alt={t.name} className="h-full w-full object-contain opacity-60 group-hover:opacity-100" />
                            <Plus className="absolute h-3 w-3 text-pink-500 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}

          {/* Error / Success */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              {m.saved}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {messages.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {messages.common.save}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * ページネーション統一ヘルパー
 *
 * 3種類のページネーションパターンを標準化:
 *   1. offset: ページ番号ベース（page + limit）— 回答一覧など
 *   2. cursor: カーソルベース（cursor + limit）— 通知一覧など
 *   3. loadMore: オフセット+hasMore（offset + pageSize）— 最新回答など
 */

/** offset ページネーションのパラメータ */
export interface OffsetPaginationParams {
  page: number
  limit: number
}

/** offset ページネーションのレスポンス */
export interface OffsetPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** cursor ページネーションのパラメータ */
export interface CursorPaginationParams {
  cursor: string | null
  limit: number
}

/** cursor ページネーションのレスポンス */
export interface CursorPaginationMeta {
  nextCursor: string | null
  hasMore: boolean
}

/** loadMore ページネーションのパラメータ */
export interface LoadMoreParams {
  offset: number
  pageSize: number
}

/** loadMore ページネーションのレスポンス */
export interface LoadMoreMeta {
  hasMore: boolean
}

/**
 * URLSearchParams から offset ページネーションパラメータを安全にパースする。
 * page は 1 以上、limit は 1〜maxLimit の範囲にクランプされる。
 */
export function parseOffsetParams(
  params: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): OffsetPaginationParams {
  const { page: defaultPage = 1, limit: defaultLimit = 20, maxLimit = 100 } = defaults
  const page = Math.max(1, Number(params.get("page")) || defaultPage)
  const limit = Math.min(maxLimit, Math.max(1, Number(params.get("limit")) || defaultLimit))
  return { page, limit }
}

/**
 * URLSearchParams から cursor ページネーションパラメータを安全にパースする。
 */
export function parseCursorParams(
  params: URLSearchParams,
  defaults: { limit?: number; maxLimit?: number } = {},
): CursorPaginationParams {
  const { limit: defaultLimit = 50, maxLimit = 100 } = defaults
  const cursor = params.get("cursor") || null
  const limit = Math.min(maxLimit, Math.max(1, Number(params.get("limit")) || defaultLimit))
  return { cursor, limit }
}

/**
 * URLSearchParams から loadMore ページネーションパラメータを安全にパースする。
 */
export function parseLoadMoreParams(
  params: URLSearchParams,
  defaults: { pageSize?: number } = {},
): LoadMoreParams {
  const { pageSize = 10 } = defaults
  const offset = Math.max(0, Number(params.get("offset") ?? "0"))
  return { offset, pageSize }
}

/**
 * offset ページネーションのメタデータを計算する。
 */
export function calcOffsetMeta(
  total: number,
  params: OffsetPaginationParams,
): OffsetPaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  }
}

/**
 * take+1 パターンで hasMore を判定し、余剰分を除去した配列とメタを返す。
 * Prisma の take: limit + 1 パターンに対応。
 */
export function sliceWithHasMore<T>(
  items: T[],
  limit: number,
): { items: T[]; hasMore: boolean } {
  const hasMore = items.length > limit
  return {
    items: hasMore ? items.slice(0, limit) : items,
    hasMore,
  }
}

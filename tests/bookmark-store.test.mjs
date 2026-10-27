import assert from 'node:assert/strict'
import { test } from 'node:test'

test('북마크 추가·해제, 저장·복원, 삭제 후 초기화', async () => {
  const items = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: (key) => items.delete(key),
    },
  })
  const key = 'umcine-bookmark-store'
  const load = async (name) => (await import(`../src/stores/bookmark-store.ts?${name}`)).useBookmarkStore
  try {
    const store = await load('initial')
    assert.deepEqual(store.getState().bookmarkedIds, [])
    const changes = []
    const unsubscribe = store.subscribe((state) => changes.push(state.bookmarkedIds))
    store.getState().toggleBookmark(1)
    store.getState().toggleBookmark(2)
    store.getState().toggleBookmark(1)
    assert.deepEqual(changes, [[1], [1, 2], [2]])
    unsubscribe()
    assert.deepEqual(JSON.parse(localStorage.getItem(key)), {
      state: { bookmarkedIds: [2] }, version: 0,
    })
    const restored = await load('reopened')
    assert.deepEqual(restored.getState().bookmarkedIds, [2])
    restored.getState().toggleBookmark(2)
    assert.deepEqual(restored.getState().bookmarkedIds, [])
    restored.getState().toggleBookmark(1)
    localStorage.removeItem(key)
    assert.deepEqual((await load('cleared')).getState().bookmarkedIds, [])

    localStorage.setItem(key, JSON.stringify({ state: { bookmarkedIds: [1, 1, '2', -1, null] }, version: 0 }))
    assert.deepEqual((await load('invalid-ids')).getState().bookmarkedIds, [1])
    localStorage.setItem(key, JSON.stringify({ state: { bookmarkedIds: 'invalid' }, version: 0 }))
    assert.deepEqual((await load('invalid-shape')).getState().bookmarkedIds, [])
    localStorage.setItem(key, '{broken json')
    assert.deepEqual((await load('invalid-json')).getState().bookmarkedIds, [])
  } finally {
    delete globalThis.localStorage
  }
})

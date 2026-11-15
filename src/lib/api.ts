import ky, { HTTPError } from 'ky'
import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth-store'

export const api = ky.create({
  prefix: 'http://localhost:8080',
  hooks: {
    // 저장된 토큰이 있으면 모든 요청에 붙여요.
    beforeRequest: [({ request }) => {
      const token = useAuthStore.getState().accessToken
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
    }],
    // 토큰이 만료·위조되면 서버가 401을 줘요. 저장된 로그인 정보를 지워 다시 로그인하게 해요.
    afterResponse: [({ response }) => {
      if (response.status === 401) useAuthStore.getState().logout()
    }],
  },
})

// 서버 공통 응답 형식 { isSuccess, code, message, result }에서 result만 꺼내요.
interface ApiResponse<T> {
  isSuccess: boolean
  code: string
  message: string
  result: T
}
const unwrap = async <T>(request: Promise<ApiResponse<T>>) => (await request).result

export const errorMessage = (error: unknown) =>
  error instanceof HTTPError && typeof (error.data as ApiResponse<unknown> | undefined)?.message === 'string'
    ? (error.data as ApiResponse<unknown>).message
    : '서버와 통신하지 못했어요. 잠시 후 다시 시도해 주세요.'

export interface LoginResult { memberId: number; nickname: string; accessToken: string }
export interface MemberInfo { email: string; nickname: string; createdAt: string }
export interface Favorite { favoriteId: number; movieId: number; createdAt: string }
export interface FavoriteStatus { movieId: number; isFavorite: boolean }
export interface Rating { ratingId: number; movieId: number; score: number; comment: string | null; createdAt: string; updatedAt: string }

// ---------- 조회 (queryOptions) ----------

export const memberQueries = {
  me: () => queryOptions({
    queryKey: ['members', 'me'],
    queryFn: ({ signal }) => unwrap(api.get('members/me', { signal }).json<ApiResponse<MemberInfo>>()),
  }),
  // 이 API만 공통 응답으로 감싸지 않고 배열을 바로 돌려줘요.
  ratings: (memberId: number) => queryOptions({
    queryKey: ['ratings', memberId],
    queryFn: ({ signal }) => api.get(`members/${memberId}/ratings`, { signal }).json<Rating[]>(),
  }),
}

export const favoriteQueries = {
  list: () => queryOptions({
    queryKey: ['favorites', 'list'],
    queryFn: ({ signal }) => unwrap(api.get('favorites', { signal }).json<ApiResponse<Favorite[]>>()),
  }),
  status: (movieId: number) => queryOptions({
    queryKey: ['favorites', 'status', movieId],
    queryFn: ({ signal }) => unwrap(api.get(`favorites/${movieId}`, { signal }).json<ApiResponse<FavoriteStatus>>()),
  }),
}

// ---------- 변경 (mutationOptions) ----------
// 캐시 갱신 방식
// - setQueryData: 응답만으로 화면에 필요한 값을 알 수 있을 때. 추가 요청 없이 캐시를 바로 고쳐요.
// - invalidateQueries: 서버가 정한 값(정렬, 시간, 다른 화면 목록)을 다시 받아야 할 때. stale 처리 후 다시 GET해요.

export const authMutations = {
  login: () => mutationOptions({
    mutationFn: (body: { email: string; password: string }) =>
      unwrap(api.post('auth/login', { json: body }).json<ApiResponse<LoginResult>>()),
    onSuccess: ({ accessToken, memberId }) => useAuthStore.getState().login(accessToken, memberId),
  }),
  signup: () => mutationOptions({
    mutationFn: (body: { email: string; password: string; nickname: string }) =>
      unwrap(api.post('members', { json: body }).json<ApiResponse<{ memberId: number }>>()),
  }),
  updateMe: () => mutationOptions({
    mutationFn: (body: { nickname: string }) =>
      unwrap(api.patch('members/me', { json: body }).json<ApiResponse<MemberInfo>>()),
    // 수정 응답이 곧 새 내 정보라서 다시 GET하지 않고 캐시에 넣어요.
    onSuccess: (me, _body, _result, { client }) => client.setQueryData(memberQueries.me().queryKey, me),
  }),
}

export const favoriteMutations = {
  add: (movieId: number) => mutationOptions({
    mutationFn: () => unwrap(api.post('favorites', { json: { movieId } }).json<ApiResponse<Favorite>>()),
    onSuccess: (_data, _vars, _result, { client }) => {
      client.setQueryData(favoriteQueries.status(movieId).queryKey, { movieId, isFavorite: true })
      return client.invalidateQueries({ queryKey: favoriteQueries.list().queryKey })
    },
  }),
  remove: (movieId: number) => mutationOptions({
    mutationFn: () => unwrap(api.delete(`favorites/${movieId}`).json<ApiResponse<null>>()),
    onSuccess: (_data, _vars, _result, { client }) => {
      client.setQueryData(favoriteQueries.status(movieId).queryKey, { movieId, isFavorite: false })
      return client.invalidateQueries({ queryKey: favoriteQueries.list().queryKey })
    },
  }),
}

// 평점은 등록·수정·삭제 뒤 목록을 invalidateQueries로 다시 받아 서버의 updatedAt·정렬을 그대로 반영해요.
export const ratingMutations = {
  create: (memberId: number) => mutationOptions({
    mutationFn: (body: { movieId: number; score: number; comment: string }) =>
      unwrap(api.post('ratings', { json: body }).json<ApiResponse<Rating>>()),
    onSuccess: (_data, _vars, _result, { client }) => client.invalidateQueries({ queryKey: memberQueries.ratings(memberId).queryKey }),
  }),
  update: (memberId: number) => mutationOptions({
    mutationFn: ({ ratingId, ...body }: { ratingId: number; score: number; comment: string }) =>
      unwrap(api.patch(`ratings/${ratingId}`, { json: body }).json<ApiResponse<Rating>>()),
    onSuccess: (_data, _vars, _result, { client }) => client.invalidateQueries({ queryKey: memberQueries.ratings(memberId).queryKey }),
  }),
  remove: (memberId: number) => mutationOptions({
    mutationFn: (ratingId: number) => unwrap(api.delete(`ratings/${ratingId}`).json<ApiResponse<null>>()),
    onSuccess: (_data, _vars, _result, { client }) => client.invalidateQueries({ queryKey: memberQueries.ratings(memberId).queryKey }),
  }),
}

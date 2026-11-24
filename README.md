# UMCine 영화 페이지 미션 기록

## TanStack Router → Next.js 마이그레이션 미션

<details open>
<summary>필수 미션</summary>

### 1. 프로젝트 설정 (Vite → Next.js 16 App Router)

| 기존 | 변경 |
| --- | --- |
| `vite`, `@vitejs/plugin-react`, `index.html`, `src/main.tsx` | `next`, `src/app/layout.tsx` |
| `@tanstack/react-router`, `@tanstack/router-plugin`, `routeTree.gen.ts` | 폴더 기반 `src/app/**/page.tsx` |
| `@tailwindcss/vite` | `@tailwindcss/postcss` + `postcss.config.mjs` |
| `import.meta.env.VITE_TMDB_TOKEN` | `process.env.NEXT_PUBLIC_TMDB_TOKEN` (브라우저에서 TMDB를 부르므로 `NEXT_PUBLIC_`) |

```text
src/app/
├── layout.tsx            # Server: <html>, 헤더 · 푸터, <Providers>
├── providers.tsx         # Client: QueryClient, Devtools, 스토어 rehydrate
├── page.tsx              # /            Server: searchParams.page 검증
├── search/page.tsx       # /search      Server: searchParams.query 정리
├── movies/[movieId]/page.tsx  # Server: params.movieId
├── login/page.tsx        # /login       Server: redirect 검증(//evil.com 차단)
├── signup/page.tsx       # Client
├── not-found.tsx
└── (auth)/
    ├── layout.tsx        # Client: 로그인 확인 후 children
    └── me/page.tsx · me/edit/page.tsx
```

### 2. TanStack Router API → Next.js API

| TanStack Router | Next.js |
| --- | --- |
| `<Link to="/movies/$movieId" params={...}>` | `<Link href={`/movies/${id}`}>` (`next/link`) |
| `<Link to="/" search={{ page }}>` | `<Link href={`/?page=${page}`}>` |
| `useNavigate()`, `router.history.push()` | `useRouter().push()` (`next/navigation`) |
| `useLocation()` | `usePathname()` |
| `validateSearch` + `Route.useSearch()` | Server `page.tsx`의 `await searchParams` → props |
| `Route.useParams()` | Server `page.tsx`의 `await params` → props |
| `beforeLoad` + `throw redirect()` | `(auth)/layout.tsx`에서 `router.replace('/login?redirect=...')` |
| `notFoundComponent` | `app/not-found.tsx` |
| `createRouter({ scrollRestoration })` | Next 기본 동작 |

`searchParams`는 Server Component에서 읽어 props로 넘겼습니다. Client에서 `useSearchParams()`를 쓰면 Suspense 경계가 필요하고, 검증 로직도 서버 한 곳에 모을 수 있습니다.

### 3. 라이브러리 설정 오류 수정

- **QueryClient**: 모듈 전역에 만들면 서버에서 요청끼리 캐시를 함께 쓰게 됩니다. `providers.tsx`에서 `useState(() => new QueryClient())`로 만듭니다.
- **zustand persist**: 서버에는 `localStorage`가 없어 persist가 `.persist` API를 붙이지 않습니다. 빌드 중 `/me` 프리렌더에서 `Cannot read properties of undefined (reading 'onFinishHydration')`가 났습니다. 브라우저에서만 호출되는 함수 안에서 `useAuthStore.persist`에 접근하도록 고쳤습니다.
- **Hydration mismatch**: 서버 HTML은 로그아웃 상태, 브라우저 첫 렌더는 로그인 상태라 서로 달라집니다. 두 스토어에 `skipHydration: true`를 주고, hydration이 끝난 뒤 `Providers`의 `useEffect`에서 `persist.rehydrate()`를 호출합니다.

```ts
// src/stores/auth-store.ts
export const useAuthHydrated = () => useSyncExternalStore(
  (onChange) => useAuthStore.persist.onFinishHydration(onChange),
  () => useAuthStore.persist.hasHydrated(),
  () => false, // 서버
)
```

- **백엔드 CORS**: 개발 서버 주소가 Vite `localhost:5173`에서 Next `localhost:3000`으로 바뀌어 로그인 요청의 preflight가 403으로 막혔습니다. 백엔드 `WebConfig`의 `allowedOrigins`에 `http://localhost:3000`을 추가했습니다.

### 4. Server / Client 경계

- **Server**: `layout.tsx`, `page.tsx`(목록·검색·상세·로그인), `not-found.tsx`
- **지시어 없음**: `pagination`, `status-message`, `form-field`는 훅이 없어 어느 쪽에서도 쓸 수 있습니다. 지금은 Client 화면에서만 import하므로 Client 번들에 포함됩니다.
- **Client (`'use client'`)**: React Query·zustand·이벤트·`next/navigation` 훅을 쓰는 화면과 `header`, `movie-card`, `movie-grid`, `providers`, `(auth)/layout`
- **경계를 넘는 상수**: 처음에는 `MAX_PAGE`를 `'use client'` 파일에서 export하고 Server `page.tsx`가 import했습니다. 서버에서는 이 값이 500이 아니라 클라이언트 참조라서 `page=NaN`으로 TMDB 400이 났습니다. Server와 Client가 함께 쓰는 값은 지시어 없는 `lib/tmdb.ts`로 옮겼습니다.
- **브라우저 API**: `localStorage`(스토어, 카드 크기)는 `useEffect`/`rehydrate` 이후에만 읽고, `window.scrollTo`는 `useEffect` 안에서만 호출합니다. 토큰이 `localStorage`에만 있으므로 `(auth)` 접근 확인도 브라우저에서 합니다.

확인 결과: `pnpm build`(8개 라우트, 타입 검사 포함), `pnpm lint`, `pnpm test` 통과. `pnpm start`로 `/`, `/?page=3`, `/search?query=…`, `/movies/550`, `/login`, `/me`, `/signup`은 200, 없는 경로는 404를 확인했습니다.

</details>

<details>
<summary>트러블 슈팅</summary>

### ⚡ 이슈 No.1 — 빌드 중 `/me` 프리렌더 실패 (zustand persist)

**`이슈`**

👉 `pnpm build`의 정적 페이지 생성 단계에서 `/me` 프리렌더가 실패했어요.

```
Error occurred prerendering page "/me". Read more: https://nextjs.org/docs/messages/prerender-error
TypeError: Cannot read properties of undefined (reading 'onFinishHydration')
    at <unknown> (src/stores/auth-store.ts:27:45)
    at <unknown> (src/app/(auth)/layout.tsx:10:20)
Export encountered an error on /(auth)/me/page: /me, exiting the build.
⨯ Next.js build worker exited with code: 1 and signal: null
```

**`원인`**

👉 `'use client'` 컴포넌트도 첫 HTML을 만들 때는 서버에서 한 번 렌더링돼요. 서버에는 `localStorage`가 없어서 zustand `persist`가 스토어에 `.persist` API를 붙이지 않아요. 그런데 `useSyncExternalStore(useAuthStore.persist.onFinishHydration, ...)`처럼 렌더 중에 `useAuthStore.persist`를 바로 꺼내서 `undefined`를 읽었어요.

**`해결`**

👉 `.persist` 접근을 브라우저에서만 호출되는 함수 안으로 옮기고, 서버에서는 `getServerSnapshot`이 `false`를 돌려주게 했어요.

```ts
export const useAuthHydrated = () => useSyncExternalStore(
  (onChange) => useAuthStore.persist.onFinishHydration(onChange),
  () => useAuthStore.persist.hasHydrated(),
  () => false, // 서버
)
```

서버 HTML(로그아웃)과 브라우저 첫 렌더(로그인)가 달라지지 않도록 두 스토어에 `skipHydration: true`도 줬어요. 복원은 hydration이 끝난 뒤 `Providers`의 `useEffect`에서 `persist.rehydrate()`로 해요. 다시 `pnpm build`를 실행해 8개 라우트 생성을 확인했어요.

**`배운 점`**

👉 `'use client'`라도 서버에서 한 번 실행돼요. `localStorage`·`window`에 기대는 값은 렌더 본문이 아니라 effect나 브라우저에서만 불리는 콜백에서 읽어야 해요.

**`참고 레퍼런스`**

- Next.js - Prerender Error: https://nextjs.org/docs/messages/prerender-error
- Zustand - Persisting store data (skipHydration): https://zustand.docs.pmnd.rs/integrations/persisting-store-data
- React - useSyncExternalStore (getServerSnapshot): https://react.dev/reference/react/useSyncExternalStore

---

### ⚡ 이슈 No.2 — 영화 목록이 `page=NaN`으로 요청됨

**`이슈`**

👉 빌드는 성공했는데 브라우저에서 `/`를 열면 "영화 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."만 보였어요. 브라우저 네트워크 기록은 다음과 같았어요.

```
GET https://api.themoviedb.org/3/movie/popular?language=ko-KR&page=NaN → 400
Failed to load resource: the server responded with a status of 400 ()
```

**`원인`**

👉 `MAX_PAGE` 상수를 `'use client'` 파일(`movie-list-page.tsx`)에서 export하고, Server Component인 `app/page.tsx`에서 import했어요. Client 모듈의 export는 서버에서 실제 값이 아니라 **클라이언트 참조**로 바뀌어요. 그래서 `Math.min(page, MAX_PAGE)`가 `NaN`이 됐어요.

**`해결`**

👉 Server와 Client가 함께 쓰는 상수를 지시어가 없는 `src/lib/tmdb.ts`로 옮기고 양쪽에서 import했어요. 다시 빌드한 뒤 `/`, `/?page=3`, 검색, 상세 화면이 정상으로 표시되는 것을 확인했어요.

**`배운 점`**

👉 `'use client'` 파일은 서버에서 컴포넌트를 넘겨받는 용도로만 import해요. 상수·함수처럼 양쪽에서 쓰는 값은 지시어 없는 공용 모듈에 둬요. 타입 검사와 빌드를 통과해도 값이 런타임에 바뀌기 때문에 브라우저에서 꼭 확인해요.

**`참고 레퍼런스`**

- React - 'use client': https://react.dev/reference/rsc/use-client
- Next.js - Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components

---

### ⚡ 이슈 No.3 — 로그인 시 "서버와 통신하지 못했어요"

**`이슈`**

👉 Next.js로 옮긴 뒤 올바른 계정으로 로그인해도 "서버와 통신하지 못했어요. 잠시 후 다시 시도해 주세요."가 표시됐어요. curl로 `POST /auth/login`을 보내면 성공했어요.

```
OPTIONS http://localhost:8080/auth/login
Origin: http://localhost:3000
Access-Control-Request-Method: POST
→ 403
```

**`원인`**

👉 개발 서버 주소가 Vite `localhost:5173`에서 Next.js `localhost:3000`으로 바뀌었어요. 백엔드 CORS 설정은 `allowedOrigins("http://localhost:5173")`만 허용해서 브라우저의 preflight 요청이 403으로 막혔어요. ky는 응답을 받지 못해 `HTTPError`가 아닌 네트워크 오류를 냈고, 화면에는 기본 오류 문구가 나왔어요.

**`해결`**

👉 백엔드 `WebConfig`의 `allowedOrigins`에 `http://localhost:3000`을 추가하고 서버를 다시 켰어요. preflight가 200으로 바뀐 것을 확인했어요. `/me` 접속 → `/login?redirect=%2Fme` → 로그인 → `/me` 복귀까지 확인했어요.

**`배운 점`**

👉 프레임워크를 옮기면 개발 서버 포트도 바뀔 수 있어요. curl은 되는데 브라우저만 실패하면 CORS부터 의심하고 `OPTIONS` 응답을 확인해요.

**`참고 레퍼런스`**

- MDN - Preflight request: https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
- Spring Framework - CORS: https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html

---

### ⚡ 이슈 No.4 — `pnpm build` 명령을 찾지 못함

**`이슈`**

👉 터미널에서 `pnpm build`를 실행하자 다음 오류가 났어요.

```
Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL
  × Command "build" not found
```

**`원인`**

👉 터미널 위치가 프로젝트 폴더(`week0/umcine`)가 아니라 상위 폴더(`11기`)였어요. 그 폴더에는 `build` 스크립트가 있는 `package.json`이 없어요.

**`해결`**

👉 `cd week0/umcine`로 이동한 뒤 `pnpm build`를 다시 실행했어요.

**`배운 점`**

👉 여러 프로젝트를 한 작업 공간에 열어 둘 때는 명령 실행 전에 터미널 경로(`pwd`)를 먼저 확인해요.

**`참고 레퍼런스`**

- pnpm - run: https://pnpm.io/cli/run

</details>

---

## 로그인 전용 폴더 · 남은 API 연결 미션

<details open>
<summary>필수 미션</summary>

### 1. 로그인 전용 폴더 (Route Group + Layout Route)

react-router를 TanStack Router 파일 기반 라우팅으로 옮겼습니다. 로그인 후에만 볼 수 있는 화면을 `(auth)` Route Group으로 묶었습니다. 괄호 폴더는 URL에 포함되지 않아 주소는 그대로 `/me`, `/me/edit`입니다.

```text
src/routes/
├── __root.tsx          # 헤더 · 푸터 · <Outlet />
├── index.tsx           # /
├── search.tsx          # /search
├── movies.$movieId.tsx # /movies/:movieId
├── login.tsx · signup.tsx
└── (auth)/
    ├── route.tsx       # 공통 Layout Route: 로그인 확인 후 <Outlet />
    └── me/
        ├── index.tsx   # /me  (마이페이지)
        └── edit.tsx    # /me/edit
```

```tsx
// src/routes/(auth)/route.tsx
export const Route = createFileRoute('/(auth)')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().accessToken) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: () => <Outlet />,
})
```

### 2. 남은 API 연결

| 화면 | API | 캐시 키 | 변경 후 반영 |
| --- | --- | --- | --- |
| 마이페이지 | `GET /favorites` | `['favorites', 'list']` | 즐겨찾기 추가·해제 시 invalidate |
| 영화 상세 | `GET /favorites/{movieId}` | `['favorites', 'status', movieId]` | — |
| 영화 상세 | `POST /favorites`, `DELETE /favorites/{movieId}` | — | 상태는 `setQueryData`, 목록은 `invalidateQueries` |
| 영화 상세 | `GET /members/{memberId}/ratings` | `['ratings', memberId]` | `select`로 현재 영화 평점만 사용 |
| 영화 상세 | `POST /ratings`, `PATCH /ratings/{ratingId}`, `DELETE /ratings/{ratingId}` | — | `invalidateQueries`로 목록 다시 조회 |

- `src/lib/api.ts`의 ky 인스턴스가 저장된 토큰을 `Authorization: Bearer`로 붙이고, 401 응답을 받으면 로그인 정보를 지웁니다.
- 서버 공통 응답 `{ isSuccess, code, message, result }`에서 `result`만 꺼내고, 실패하면 서버의 `message`를 화면에 표시합니다.
- 서버는 즐겨찾기의 `movieId`만 저장합니다. 마이페이지는 `useQueries`로 TMDB 상세를 불러와 포스터와 제목을 표시하며, 상세 화면과 같은 캐시를 함께 씁니다.
- 로그인하지 않은 상태로 상세 화면에 들어가면 즐겨찾기·평점 대신 로그인 링크를 보여 주고, 로그인하면 원래 화면으로 돌아옵니다.
- 로그아웃하면 `members`·`favorites`·`ratings` 캐시를 지워 다른 계정에 이전 데이터가 보이지 않게 합니다.
- 로그인·회원가입·내 정보 조회/수정(`POST /auth/login`, `POST /members`, `GET·PATCH /members/me`)도 함께 연결하고, 더미 프로필 스토어를 삭제했습니다.

백엔드(`11th_UMC_PE_WEB_BACKEND`, `week8-josh` 브랜치)에 즐겨찾기 API가 없어 추가했습니다. 평점 조회에 필요한 `memberId`를 로그인 응답에 포함하도록 했고, 테이블 생성 SQL은 `scripts/favorite.sql`에 있습니다.

확인 결과: `pnpm build`, `pnpm lint`, `pnpm test` 통과, 백엔드 `./gradlew compileJava` 통과.

</details>

<details>
<summary>선택 미션</summary>

**`mutationOptions`**: 로그인, 회원가입, 내 정보 수정, 즐겨찾기, 평점 mutation을 `src/lib/api.ts`의 `authMutations`·`favoriteMutations`·`ratingMutations`에 모았습니다. 화면에서는 `useMutation(favoriteMutations.add(movieId))`처럼 호출만 하고, 화면 이동처럼 그 화면에만 필요한 동작은 `mutate(vars, { onSuccess })`로 넘깁니다.

**`setQueryData` vs `invalidateQueries`**

| | `setQueryData` | `invalidateQueries` |
| --- | --- | --- |
| 적용한 곳 | 즐겨찾기 여부, 내 정보 수정 | 즐겨찾기 목록, 평점 목록 |
| 추가 요청 | 없음 | 활성 쿼리는 즉시 다시 GET, 비활성 쿼리는 다음에 화면을 열 때 GET |
| 화면 갱신 | 응답 직후 캐시 값으로 바로 바뀜 | 다시 받은 서버 값으로 바뀜 |
| 선택 기준 | 응답만으로 새 상태를 정확히 알 때 | 서버가 정하는 값(정렬, `updatedAt`, 다른 화면의 목록)이 바뀔 때 |

즐겨찾기 버튼은 성공 여부만 알면 `isFavorite`를 확정할 수 있어서 `setQueryData`를 썼습니다. 평점은 수정 시각과 목록 정렬을 서버가 정하므로 `invalidateQueries`로 다시 받습니다.

</details>

---

## 로그인 · 내 정보 퍼블리싱 미션

### 필수 미션

- `/login`: 이메일·비밀번호 입력 폼을 만들었습니다. 두 값이 모두 입력돼야 버튼이 활성화되고, 제출하면 입력한 이메일이 안내 문구에 반영됩니다.
- `/me`: 프로필(닉네임, 이메일, 소개)을 조회합니다.
- `/me/edit`: 현재 프로필 값이 채워진 폼에서 수정하고, 저장하면 `/me`로 돌아가 바뀐 값이 바로 보입니다.
- 헤더의 `로그인` 버튼과 `내 정보` 메뉴를 각 화면으로 연결했습니다.
- API 연동 전이라 프로필은 Zustand 스토어(`src/stores/profile-store.ts`)의 더미 값을 메모리에 보관합니다.

### 선택 미션 — 폴더 구조

```text
src/pages/
├── login-page.tsx            # 누구나 접근
└── my/                       # 로그인이 필요한 화면 묶음
    ├── my-info-page.tsx      # /me
    └── my-info-edit-page.tsx # /me/edit
```

라우트도 `/me` 부모 `Route` 아래에 중첩해 두었습니다. 이후 이 부모 `Route`에 로그인 여부를 확인하는 `layout`을 붙이면 하위 화면 전체에 접근 제한을 한 번에 적용할 수 있습니다. 이번 미션에서는 `layout`과 접근 제한은 구현하지 않았습니다.

확인 결과: `pnpm build`, `pnpm lint`를 통과했습니다.

---

## TanStack Query 미션

<details open>
<summary>필수 미션</summary>

직접 만든 `useTmdb`(useEffect + useState)를 지우고 목록·검색·상세 요청을 `useQuery`로 바꿨습니다. `main.tsx`에 `QueryClientProvider`와 `ReactQueryDevtools`를 추가했습니다. `staleTime`은 5분으로 설정해 화면을 다시 열면 요청 없이 캐시를 사용하고, 404는 재시도하지 않습니다.

| 화면 | query key | 요청 |
| --- | --- | --- |
| 목록 | `['movies', 'popular', page]` | `movie/popular?page=` |
| 검색 | `['movies', 'search', query]` | `search/movie?query=` |
| 상세 | `['movies', 'detail', movieId]` | `movie/:movieId` |

상태 표시 (`src/pages/movie-list-page.tsx` 발췌):

```tsx
const { data, isPending, isError, refetch } = useQuery(movieQueries.popular(page))

{isPending && <StatusMessage>영화 목록을 불러오는 중이에요...</StatusMessage>}
{isError && <StatusMessage error onRetry={() => refetch()}>영화 목록을 불러오지 못했어요...</StatusMessage>}
{data && (data.results.length ? <MovieGrid ... /> : <StatusMessage>표시할 영화가 없어요.</StatusMessage>)}
```

확인 결과: `pnpm build`, `pnpm lint`, `pnpm test` 통과. 브라우저에서 1페이지 → 2페이지 → 1페이지로 이동했을 때 Query 개발자 도구에 키 3개가 따로 쌓이고, Network 패널에 1페이지 요청이 다시 나가지 않는지 직접 확인해 캡처해 주세요.

</details>

<details>
<summary>선택 미션</summary>

query key와 queryFn을 `queryOptions`로 한곳(`src/lib/tmdb.ts`)에 모았습니다. 화면에서는 `useQuery(movieQueries.detail(movieId))`처럼 호출만 하고, 응답 타입도 queryFn에서 추론됩니다.

```ts
export const movieQueries = {
  popular: (page: number) => queryOptions({
    queryKey: ['movies', 'popular', page],
    queryFn: ({ signal }) => get<TmdbPage>('movie/popular', { page: String(page) }, signal),
  }),
  search: (query: string) => queryOptions({ queryKey: ['movies', 'search', query], ... }),
  detail: (movieId: string) => queryOptions({ queryKey: ['movies', 'detail', movieId], ... }),
}
```

</details>

## Zustand · Web Storage 미션

<details open>
<summary>필수 미션</summary>

목록·검색·상세 화면이 `useBookmarkStore`의 `bookmarkedIds`와 `toggleBookmark`를 함께 사용하도록 연결했습니다. 검색 결과에 북마크 버튼을 추가하고 영화 데이터의 고정 북마크 값과 `App`의 임시 상태를 제거했습니다. 처음 실행하거나 저장값을 삭제한 뒤 새로고침하면 빈 배열로 시작합니다.

핵심 코드 (`src/stores/bookmark-store.ts` 발췌):

```ts
export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set) => ({
      bookmarkedIds: [],
      toggleBookmark: (id) => set((state) => ({
        bookmarkedIds: state.bookmarkedIds.includes(id)
          ? state.bookmarkedIds.filter((bookmarkId) => bookmarkId !== id)
          : [...state.bookmarkedIds, id],
      })),
    }),
    {
      name: 'umcine-bookmark-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bookmarkedIds: state.bookmarkedIds }),
      // 실제 파일의 merge에서 복원 데이터의 ID 형식과 중복도 검사합니다.
    },
  ),
)
```

화면 연결 (`src/components/movie-card.tsx` 발췌, 검색·상세도 같은 저장소 사용):

```tsx
const isBookmarked = useBookmarkStore((state) => state.bookmarkedIds.includes(movie.id))
const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)

<button aria-pressed={isBookmarked} onClick={() => toggleBookmark(movie.id)}>
  {isBookmarked ? '북마크 해제' : '북마크하기'}
</button>
```

최종 확인 결과 (2026-10-07):

- 자동 테스트 통과: 추가·제거·구독 알림, ID만 JSON 저장, 새 저장소 생성 시 복원, 저장값 삭제 후 빈 상태, 잘못된 저장값 처리. 메모리로 구현한 Storage를 사용했으며 실제 브라우저 검증과는 별개입니다.
- `npm run test`, `npm run lint`, `npm run build` 통과. 빌드 스크립트는 `tsc -b && vite build`입니다.
- `pnpm build` 실행은 패키지 검증 단계의 네트워크 DNS 오류로 중단됐습니다. 일반 터미널에서 재실행하여 성공 화면을 확인해야 합니다.
- 브라우저 연결이 없고 개발 서버 실행도 환경의 포트 권한 제한으로 차단되어, 화면 간 동기화·새로고침·브라우저 완전 종료 후 복원·Application 패널 삭제 검증은 수동 확인 대기입니다.

참고: [Zustand 공식 문서 — persist](https://zustand.docs.pmnd.rs/reference/middlewares/persist)

</details>

<details>
<summary>선택 미션</summary>

`sessionStorage` 실험: 북마크 저장소의 `createJSONStorage(() => localStorage)`를 일시적으로 `createJSONStorage(() => sessionStorage)`로 바꿔 검사했습니다. 같은 탭의 새로고침을 흉내 낸 새 저장소 인스턴스는 북마크 ID `[1]`을 복원했고, 탭 종료를 흉내 내 세션 저장소를 새로 만든 인스턴스는 빈 배열로 시작했습니다. `localStorage`에는 북마크 키가 기록되지 않았습니다. 검사 뒤 실제 앱 코드는 `localStorage`로 복구했습니다. 이 결과는 저장소 모의 객체를 사용한 검사이며, 실제 브라우저 탭 종료 캡처는 남아 있습니다.

카드 크기 설정: 목록에서 `보통`/`크게`를 선택할 수 있습니다. 큰 카드는 넓은 화면의 열 수를 5→3으로 줄여 표시합니다. 선택값은 브라우저의 `localStorage` 키 `umcine-card-size`에 저장하고 화면을 다시 열 때 읽습니다. 북마크 저장 키 `umcine-bookmark-store`와 분리했습니다.

핵심 코드 (`src/components/movie-grid.tsx` 발췌):

```tsx
const [cardSize, setCardSize] = useState(() =>
  typeof window !== 'undefined' && localStorage.getItem('umcine-card-size') === 'large' ? 'large' : 'normal',
)

// 선택 변경 시
setCardSize(size)
localStorage.setItem('umcine-card-size', size)
```

확인 결과: `sessionStorage` 모의 실험 통과. `npm run test`, `npm run lint`, `npm run build` 통과. 실제 브라우저에서 카드 크기 변경·새로고침·Application 패널 저장값은 직접 확인이 필요합니다.

</details>

### ⚡ 이슈 No.1 — 의존성 검증 실패 뒤 빌드 도구까지 사라짐

**`이슈`**

👉 Zustand 추가 중 `pnpm add zustand`가 `ERR_PNPM_PACKAGE_MANAGER_ADD_RESOLVE_LATEST`와 npm 레지스트리 DNS 조회 오류로 실패했다. 이어 `pnpm build`는 `Verifying lockfile against supply-chain policies (112 entries)...`에서 멈췄다. 실패한 설치 시도 뒤에는 `node_modules`가 불완전해져 `npm run build`도 `TS2688: Cannot find type definition file for 'vite/client'`, `npm run lint`도 `oxlint: command not found`를 냈다.

**`원인`**

👉 현재 작업 환경에서 `registry.npmjs.org`의 DNS 조회가 막혀 패키지 메타데이터와 검증용 tarball을 받지 못했다. 의존성 확인 과정에서 기존 `node_modules`도 다시 구성하려다 중단돼 TypeScript 타입과 실행 파일 링크가 빠졌다. 따라서 뒤의 `TS2688`은 TypeScript 소스의 타입 오류가 아니라 설치가 끝나지 않은 결과였다.

**`해결`**

👉 온라인 설치와 `pnpm add --offline`을 확인했지만 이 환경에서는 메타데이터가 없어 실패했다. 로컬 npm 캐시에 남은 Zustand tarball의 SHA-512 무결성을 확인해 패키지를 복원하고, 기존 pnpm 저장소의 패키지 링크로 `node_modules`를 복구했다. 그 뒤 `npm run test`, `npm run lint`, `npm run build`가 모두 통과했다. 최종 앱은 `localStorage`를 사용하는 Zustand 북마크 저장소로 빌드됐다. 네트워크 제한 때문에 **`pnpm build` 성공까지 확인한 것은 아니다.** 일반 네트워크 환경에서 `npm install` 후 `npm run build`로 다시 검증할 수 있다.

**`배운 점`**

👉 `Cannot find type definition file`이나 `command not found`가 한꺼번에 나오면 소스 수정보다 먼저 `node_modules`의 타입 패키지와 `.bin` 링크를 확인한다. 패키지 설치 실패 직후라면 최초의 네트워크 오류와 뒤따른 빌드 오류를 구분해 살핀다. 저장된 tarball을 수동 복구할 때는 lockfile 또는 캐시에 기록된 무결성 해시와 실제 파일을 대조한다.

**`참고 레퍼런스`**

- [pnpm 공식 릴리스 노트 — 스크립트 실행 전 의존성 검사](https://pnpm.io/blog/releases/12.8)
- [npm 공식 문서 — package.json 스크립트 실행](https://docs.npmjs.com/cli/v11/using-npm/scripts/)

---

[Figma 영화 페이지](https://www.figma.com/design/erFuXxEy5svB8Be5gjIqdu/%25EC%2598%2581%25ED%2599%2594-%25ED%258E%2598%25EC%259D%25B4%25EC%25A7%2580?node-id=0-1&p=f)의 공개 영화 화면을 로컬 영화 데이터로 구현했습니다.

## 필수 미션

- `BrowserRouter`와 `Routes`로 목록 `/`, 검색 `/search?query=...`, 상세 `/movies/:movieId`를 연결했습니다. 영화 카드와 검색 결과는 `Link`로 상세 화면에 이동합니다.
- 검색 화면은 `query`를 읽어 영화의 제목과 원제에서 일치하는 항목을 찾고 결과 수, 포스터, 제목, 원제, 개봉일, 줄거리를 표시합니다. 검색어가 비었거나 결과가 없을 때 각각 안내 문구를 표시합니다.
- 상세 화면은 `movieId`로 영화를 찾고 배경 이미지, 포스터, 제목, 메타 정보, 줄거리, 북마크, 평점 영역을 표시합니다. 잘못된 ID에는 `영화를 찾을 수 없어요.`를 표시합니다.
- 기존 화면별 CSS를 Tailwind CSS 클래스로 옮기고, 활성 메뉴와 북마크 등 상태별 클래스는 `cn`으로 조합했습니다.

핵심 코드:

```tsx
const query = (searchParams.get('query') ?? '').trim()
const results = query ? movies.filter((movie) =>
  `${movie.title} ${movie.originalTitle}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
) : []

const { movieId } = useParams()
const movie = movies.find((item) => String(item.id) === movieId)
```

확인 결과: Figma 캡처의 목록, 검색, 상세 데스크톱 구성을 기준으로 배치했습니다. `/`, `/search`, `/search?query=스파이더맨`, 결과 없는 검색, `/movies/1`, `/movies/999`에서 표시 문구와 데이터를 확인했습니다. 네 경로에 직접 HTTP 요청 시 모두 200을 반환했습니다. `pnpm build`와 `pnpm lint`를 통과했습니다. 브라우저 Console은 이 환경에 브라우저가 연결되어 있지 않아 확인하지 못했습니다.

## 선택 미션

- 현재 경로가 `/` 또는 `/movies/:movieId`일 때 영화 메뉴, `/search`일 때 검색 메뉴만 활성 스타일과 `aria-current="page"`를 적용합니다.
- 영화 카드 그리드는 Tailwind 반응형 클래스로 화면 너비에 따라 1열, 2열, 3열, 5열로 배치합니다.


# UMCine 영화 페이지 미션 기록

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

## 트러블슈팅

**`이슈`**

👉 화면 너비가 950px 이상인데도 영화 카드가 5열이 아닌 3열로 표시됐음.

**`원인`**

👉 `md:grid-cols-3`와 `min-[950px]:grid-cols-5`를 함께 사용했음. 빌드된 CSS에서는 950px의 5열 규칙보다 `md`(48rem)의 3열 규칙이 뒤에 생성됐음. 두 미디어 쿼리가 모두 적용되는 너비에서 뒤에 나온 3열 규칙이 5열을 덮어썼음.

**`해결`**

👉 `src/components/movie-grid.tsx`의 반응형 조건을 모두 `min-[...]` 형태로 통일했음.

```tsx
// 수정 전
className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 min-[950px]:grid-cols-5"

// 수정 후
className="grid grid-cols-1 min-[400px]:grid-cols-2 min-[768px]:grid-cols-3 min-[950px]:grid-cols-5"
```

빌드된 CSS에서 400px → 768px → 950px 순서로 규칙이 생성되는 것을 확인했음. `pnpm build`와 `pnpm lint`도 통과했음.

**`배운 점`**

👉 JSX에서 클래스명을 적은 순서가 CSS 우선순위를 정하지 않는다는 점을 배웠음. 반응형 스타일이 예상과 다를 때는 실제 생성된 CSS의 미디어 쿼리 순서와 단위를 확인해야 함.

**`참고 레퍼런스`**

👉 [Tailwind CSS 공식 문서: Responsive design](https://tailwindcss.com/docs/responsive-design) — 브레이크포인트 단위에 따라 생성 규칙의 순서가 달라질 수 있음을 참고했음.

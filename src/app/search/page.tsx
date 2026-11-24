import { SearchContent } from './search-content'

export default async function Page({ searchParams }: PageProps<'/search'>) {
  const { query } = await searchParams
  const trimmed = typeof query === 'string' ? query.trim() : ''
  return <SearchContent key={trimmed} query={trimmed} />
}

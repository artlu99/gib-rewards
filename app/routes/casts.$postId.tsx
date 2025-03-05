import { Link, createFileRoute } from '@tanstack/react-router'
import { fetchPost } from '../utils/posts'
import { NotFound } from '~/components/NotFound'
import { PostErrorComponent } from '~/components/PostError'
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client'

export const Route = createFileRoute('/casts/$postId')({
  loader: ({ params: { postId } }) => fetchPost({ data: postId }),
  errorComponent: PostErrorComponent,
  component: PostComponent,
  notFoundComponent: () => {
    return <NotFound>Cast not found</NotFound>
  },
})

function PostComponent() {
  const cast = Route.useLoaderData()

  if (!cast) {
    return <NotFound>Cast not found</NotFound>
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{cast.username}</h4>
      <div className="text-sm">{cast.count}</div> 
      <FarcasterEmbed
        username={cast.username}
        hash={cast.castHash}
      />
      <Link
        to="/casts/$postId/decoded"
        params={{
          postId: cast?.castHash,
        }}
        activeProps={{ className: 'text-black font-bold' }}
        className="block py-1 text-blue-800 hover:text-blue-600"
      >
        Decoded View
      </Link>
    </div>
  )
}

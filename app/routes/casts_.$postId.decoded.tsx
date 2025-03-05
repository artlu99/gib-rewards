import { Link, createFileRoute } from '@tanstack/react-router'
import { fetchPost } from '../utils/posts'
import { PostErrorComponent } from '~/components/PostError'
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client'

export const Route = createFileRoute('/casts_/$postId/decoded')({
  loader: async ({ params: { postId } }) =>
    fetchPost({
      data: postId,
    }),
  errorComponent: PostErrorComponent,
  component: PostDeepComponent,
})

function PostDeepComponent() {
  const cast = Route.useLoaderData()

  if (!cast) {
    return <NotFound>Cast not found</NotFound>
  }

  return (
    <div className="p-2 space-y-2">
      <Link
        to="/casts"
        className="block py-1 text-blue-800 hover:text-blue-600"
      >
        ← back to Leaderboard
      </Link>
      <h4 className="text-xl font-bold underline">{cast.username}</h4>
      <div className="text-sm">{cast.count}</div>
      <div className="text-sm">{cast.decodedText}</div>
      <FarcasterEmbed
        username={cast.username}
        hash={cast.castHash}
      />
    </div>
  )
}

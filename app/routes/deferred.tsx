import { Await, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense, useState } from "react";
import { useSignIn } from "~/hooks/use-sign-in";

const personServerFn = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(({ data: name }) => {
    return { name, randomNumber: Math.floor(Math.random() * 100) };
  });

const slowServerFn = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: name }) => {
    await new Promise((r) => setTimeout(r, 1000));
    return { name, randomNumber: Math.floor(Math.random() * 100) };
  });

export const Route = createFileRoute("/deferred")({
  loader: async () => {
    return {
      deferredStuff: new Promise<string>((r) =>
        setTimeout(() => r("Hello deferred!"), 2000)
      ),
      deferredPerson: slowServerFn({ data: "Tanner Linsley" }),
      person: await personServerFn({ data: "John Doe" }),
    };
  },
  component: Deferred,
});

function Deferred() {
  const [count, setCount] = useState(0);
  const { deferredStuff, deferredPerson, person } = Route.useLoaderData();

  const { signIn, isSignedIn, isLoading, logout, error } = useSignIn();

  return (
    <div className="p-2">
      {!isSignedIn ? (
        <button
          type="button"
          onClick={() => signIn()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {isLoading ? "Signing in..." : "Sign in with Farcaster"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => logout()}
            className="mt-8 px-4 py-2 bg-red-500 w-full text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
      {error && <div>{error}</div>}
      <div data-testid="regular-person">
        {person.name} - {person.randomNumber}
      </div>
      <Suspense fallback={<div>Loading person...</div>}>
        <Await
          promise={deferredPerson}
          children={(data) => (
            <div data-testid="deferred-person">
              {data.name} - {data.randomNumber}
            </div>
          )}
        />
      </Suspense>
      <Suspense fallback={<div>Loading stuff...</div>}>
        <Await
          promise={deferredStuff}
          children={(data) => <h3 data-testid="deferred-stuff">{data}</h3>}
        />
      </Suspense>
      <div>Count: {count}</div>
      <div>
        <button type="button" onClick={() => setCount(count + 1)}>
          Increment
        </button>
      </div>
    </div>
  );
}

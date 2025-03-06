import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type * as React from "react";
import embedsCss from "react-farcaster-embed/dist/styles.css?url";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Contest | SassyHash 💅",
        description: "💅🏆 a weekly rewards program to discover the best",
      }),
      {
        name: "fc:frame",
        content: JSON.stringify({
          version: "next",
          imageUrl: "https://sassyhash.artlu.xyz/sassyhash-og.png",
          button: {
            title: "Contest | SassyHash 💅",
            action: {
              type: "launch_frame",
              name: "SassyHash 💅",
              url: "https://gib-rewards.artlu.xyz",
              splashImageUrl: "https://sassyhash.artlu.xyz/splash-square.png",
              splashBackgroundColor: "#0E081F",
            },
          },
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: embedsCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js" />
      </head>
      <body>
        <div className="p-2 flex w-full justify-evenly items-center text-lg">
          <div className="flex-1 text-center">
            <Link
              to="/"
              activeProps={{
                className: "font-bold",
              }}
            >
              🏆
              <br /> Top N
            </Link>
          </div>
          <div className="flex-1 text-center">
            <Link
              to="/winner"
              activeProps={{
                className: "font-bold",
              }}
            >
              💰
              <br />
              Munnies
            </Link>
          </div>
          <div className="flex-1 text-center">
            <Link
              to="/rules-en"
              activeProps={{
                className: "font-bold",
              }}
            >
              🕵️‍♀️
              <br />
              Rules
            </Link>
          </div>
          <div className="flex-1 text-center">
            <Link
              to="/whut"
              activeProps={{
                className: "font-bold",
              }}
              activeOptions={{ exact: true }}
            >
              💅
              <br />
              Wat dis
            </Link>
          </div>
        </div>
        <hr />
        {children}
        <script>frame.sdk.actions.ready();</script>
        <Scripts />
      </body>
    </html>
  );
}

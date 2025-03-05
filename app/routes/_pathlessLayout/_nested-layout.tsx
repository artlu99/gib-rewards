import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export interface RulesConfig {
  topN: number;
  totalPool: number;
  minPayout: number;
  minMods: number;
  vector: {
    views: number;
    likes: number;
    replies: number;
  };
}

const defaultRulesConfig: RulesConfig = {
  topN: 10,
  totalPool: 100,
  minPayout: 5,
  minMods: 0,
  vector: {
    views: 1,
    likes: 0,
    replies: 0,
  },
};

export const Caret = () => {
  return (
    <svg
      className="h-6 w-6 sm:h-5 sm:w-5 transition-transform group-open:rotate-180"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-label="Caret"
    >
      <title>Caret</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
};

export const Route = createFileRoute("/_pathlessLayout/_nested-layout")({
  loader: () => ({
    rulesConfig: defaultRulesConfig,
  }),
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div>
      <div className="flex gap-2 border-b">
        <Link
          to="/rules-en"
          activeProps={{
            className: "font-bold",
          }}
        >
          [Eng]
        </Link>
        <Link
          to="/rules-es"
          activeProps={{
            className: "font-bold",
          }}
        >
          [Esp]
        </Link>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}

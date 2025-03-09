import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pathlessLayout/_nested-layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div>
      <div className="flex gap-2">
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

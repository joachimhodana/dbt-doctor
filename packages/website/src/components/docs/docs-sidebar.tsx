import Link from "next/link";
import type { DocsNode } from "@/utils/docs";

interface DocsSidebarProps {
  items: DocsNode[];
  currentHref: string;
}

const SidebarItem = ({ item, currentHref }: { item: DocsNode; currentHref: string }) => {
  const isActive = currentHref === item.href;

  return (
    <li>
      <Link
        href={item.href}
        className={`block rounded-md py-1.5 text-sm transition-colors ${
          item.depth >= 2 ? "font-mono text-xs" : ""
        } ${
          isActive
            ? "bg-[#1b1412] text-orange-200"
            : "text-neutral-400 hover:bg-[#141414] hover:text-neutral-200"
        }`}
        style={{ paddingLeft: `${item.depth * 12 + 12}px`, paddingRight: "12px" }}
      >
        {item.title}
      </Link>
      {item.children.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <SidebarItem key={child.id} item={child} currentHref={currentHref} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const DocsSidebar = ({ items, currentHref }: DocsSidebarProps) => (
  <div className="w-full shrink-0 border-b border-orange-200/10 md:w-72 md:border-b-0 md:border-r lg:w-80">
    <div className="md:sticky md:top-16 md:z-10 md:flex md:max-h-[calc(100dvh-4rem)] md:flex-col">
      <aside className="flex max-h-[min(70dvh,28rem)] flex-col overflow-hidden bg-[#0b0b0b]/95 p-2.5 md:max-h-none md:flex-1 md:bg-transparent">
        <p className="shrink-0 px-3 pb-2 text-xs uppercase tracking-wide text-neutral-500">
          Documentation
        </p>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <SidebarItem key={item.id} item={item} currentHref={currentHref} />
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  </div>
);

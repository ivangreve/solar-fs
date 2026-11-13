import { Brand } from "./Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { SettingsLink } from "@/components/SettingsLink";
import { SyncButton } from "@/components/SyncButton";

/**
 * Barra superior global: marca a la izquierda, acciones a la derecha.
 * Sticky con blur; se usa en home, planta y config (antes cada página armaba la suya).
 */
export function AppHeader({ sync = false, settings = true }: { sync?: boolean; settings?: boolean }) {
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-2">
          {sync && <SyncButton />}
          {settings && <SettingsLink />}
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

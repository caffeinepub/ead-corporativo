import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { navigate } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

interface AppHeaderProps {
  userName?: string;
}

export default function AppHeader({ userName }: AppHeaderProps) {
  const { clear } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  const handleLogout = () => {
    clear();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm"
      style={{
        background: "oklch(0.12 0.05 295 / 0.92)",
        borderBottom: "1px solid oklch(0.24 0.07 295)",
      }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "oklch(0.62 0.22 295)" }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span
            className="font-display font-semibold tracking-tight text-sm"
            style={{ color: "oklch(0.93 0.02 295)" }}
          >
            EAD Corporativo
          </span>
        </button>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {isAdmin ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="gap-1.5"
              style={{ color: "oklch(0.72 0.18 295)" }}
            >
              <ShieldCheck className="h-4 w-4" />
              Painel Admin
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1.5"
              style={{ color: "oklch(0.65 0.06 295)" }}
            >
              <LayoutDashboard className="h-4 w-4" />
              Meus Cursos
            </Button>
          )}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.18 0.06 295)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ background: "oklch(0.62 0.22 295)" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className="hidden md:block text-sm font-medium max-w-[140px] truncate"
                style={{ color: "oklch(0.82 0.06 295)" }}
              >
                {userName ?? "Usuário"}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5"
                style={{ color: "oklch(0.58 0.06 295)" }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{
              background: "oklch(0.16 0.06 295)",
              border: "1px solid oklch(0.26 0.08 295)",
            }}
          >
            {isAdmin && (
              <>
                <DropdownMenuItem
                  onClick={() => navigate("/admin")}
                  style={{ color: "oklch(0.82 0.06 295)" }}
                  className="focus:bg-primary/10 focus:text-foreground"
                >
                  <ShieldCheck
                    className="h-4 w-4 mr-2"
                    style={{ color: "oklch(0.72 0.18 295)" }}
                  />
                  Painel Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  style={{ background: "oklch(0.24 0.07 295)" }}
                />
              </>
            )}
            {!isAdmin && (
              <DropdownMenuItem
                onClick={() => navigate("/dashboard")}
                style={{ color: "oklch(0.82 0.06 295)" }}
                className="focus:bg-primary/10 focus:text-foreground"
              >
                <LayoutDashboard
                  className="h-4 w-4 mr-2"
                  style={{ color: "oklch(0.72 0.18 295)" }}
                />
                Meus Cursos
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator
              style={{ background: "oklch(0.24 0.07 295)" }}
            />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

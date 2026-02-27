import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";
import { navigate } from "../App";
import { GraduationCap, LayoutDashboard, ShieldCheck, LogOut, ChevronDown } from "lucide-react";

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
      className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur"
      style={{ boxShadow: "0 1px 0 0 oklch(0.88 0.018 255)" }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "oklch(var(--navy-deep))" }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span
            className="font-semibold tracking-tight text-sm"
            style={{ color: "oklch(var(--navy-deep))" }}
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
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              Painel Admin
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              Meus Cursos
            </Button>
          )}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ background: "oklch(var(--navy-deep))" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium max-w-[140px] truncate">
                {userName ?? "Usuário"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Painel Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Meus Cursos
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
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

"use client";

import * as React from "react";
import { Moon, Sun, Zap, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Theme = "light" | "dark" | "neon" | "cinematic";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("media-fusion-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "neon", "cinematic");
    root.classList.add(theme);
    localStorage.setItem("media-fusion-theme", theme);
  }, [theme]);

  const themes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "neon", icon: Zap, label: "Neon" },
    { name: "cinematic", icon: Clapperboard, label: "Cinematic" },
  ];

  const ActiveIcon = themes.find((t) => t.name === theme)?.icon || Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 hover:bg-white/5 transition-all">
          <ActiveIcon size={18} className="text-primary" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-white/10 p-1">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.name}
            onClick={() => setTheme(t.name as Theme)}
            className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-white/5"
          >
            <t.icon size={16} className={theme === t.name ? "text-primary" : "text-muted-foreground"} />
            <span className={theme === t.name ? "font-bold" : ""}>{t.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
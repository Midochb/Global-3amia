import { Link, useLocation } from "wouter";
import { Search, Plus, Home, Menu, X, Mail, Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const dialects = [
    { code: "all", label: "Tous les dialectes" },
    { code: "ma", label: "Marocain (Darija)" },
    { code: "dz", label: "Algérien" },
    { code: "tn", label: "Tunisien" },
    { code: "eg", label: "Égyptien" },
    { code: "lb", label: "Libanais" },
  ];

  const [activeDialect, setActiveDialect] = useState(dialects[0]);

  const navItems = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Rechercher", href: "/search", icon: Search },
    { label: "Contribuer", href: "/contribute", icon: Plus },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/assets/logo_icon.png" alt="Zeedna Logo" className="h-8 w-8 object-contain" />
              <span className="font-heading font-bold text-xl tracking-tight text-foreground hidden sm:inline-block">Zeedna 3amia</span>
            </Link>

            {/* Dialect Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground hidden md:flex">
                  <Languages className="h-4 w-4" />
                  <span>{activeDialect.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {dialects.map((d) => (
                  <DropdownMenuItem 
                    key={d.code}
                    onClick={() => setActiveDialect(d)}
                    className={activeDialect.code === d.code ? "bg-primary/10 text-primary" : ""}
                  >
                    {d.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 mr-4">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Link href="/contribute" className="hidden sm:block">
              <Button size="sm" className="gap-2 cursor-pointer rounded-full px-4">
                <Plus className="h-4 w-4" />
                Ajoute ton mot
              </Button>
            </Link>

            {/* Mobile Nav */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wider">Dialecte</p>
                    {dialects.map((d) => (
                      <button
                        key={d.code}
                        onClick={() => {
                          setActiveDialect(d);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-colors ${
                          activeDialect.code === d.code ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-border my-2" />
                  {navItems.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 text-lg font-medium p-2 rounded-md transition-colors hover:bg-muted ${
                        location === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/assets/logo_icon.png" alt="Zeedna Logo" className="h-6 w-6 grayscale opacity-50" />
            <span className="text-sm text-muted-foreground">© 2026 Zeedna 3amia. Tous droits réservés.</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground justify-center md:justify-end">
            <a href="mailto:zeednaarabe@gmail.com" className="hover:text-primary transition-colors flex items-center gap-1">
              <Mail className="h-3 w-3" />
              zeednaarabe@gmail.com
            </a>
            <a href="#" className="hover:text-primary transition-colors">À propos</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

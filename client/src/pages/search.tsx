import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, ThumbsUp, MessageSquare, Share2 } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Parse query param
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [location]);

  const performSearch = (q: string) => {
    setIsLoading(true);
    // Mock search results
    setTimeout(() => {
      setResults([
        {
          id: 1,
          word: "Wa5a",
          dialect: "Marocain",
          definition: "D'accord, ok, ça marche.",
          example: "Wa5a, ntla9aw men be3d. (Ok, on se voit plus tard.)",
          likes: 42,
          author: "Karim"
        },
        {
          id: 2,
          word: "Barcha",
          dialect: "Tunisien",
          definition: "Beaucoup.",
          example: "Nhebek barcha. (Je t'aime beaucoup.)",
          likes: 128,
          author: "Sarra"
        },
        {
          id: 3,
          word: "Awe",
          dialect: "Algérien",
          definition: "Expression de surprise ou d'incrédulité.",
          example: "Awe! T'es sérieux là ?",
          likes: 15,
          author: "Mehdi"
        }
      ].filter(item => 
        item.word.toLowerCase().includes(q.toLowerCase()) || 
        item.definition.toLowerCase().includes(q.toLowerCase())
      ));
      setIsLoading(false);
    }, 800);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    window.history.pushState({}, "", url);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-6">Recherche</h1>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un mot..." 
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8">Rechercher</Button>
        </form>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Recherche en cours...</div>
        ) : results.length > 0 ? (
          results.map((result) => (
            <Card key={result.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary mb-2">{result.word}</CardTitle>
                    <Badge variant="secondary" className="font-normal">{result.dialect}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Définition</h4>
                  <p className="text-lg">{result.definition}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Exemple</h4>
                  <p className="italic text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary/20">
                    "{result.example}"
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 py-3 flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{result.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    <span>Commenter</span>
                  </button>
                </div>
                <div>
                  Proposé par <span className="font-medium text-foreground">{result.author}</span>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : query ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun résultat trouvé</h3>
            <p className="text-muted-foreground mb-6">
              Nous n'avons pas trouvé de définition pour "{query}".
            </p>
            <Button onClick={() => window.location.href='/contribute'} variant="outline">
              Ajouter ce mot au dictionnaire
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Entrez un mot pour commencer la recherche.
          </div>
        )}
      </div>
    </div>
  );
}

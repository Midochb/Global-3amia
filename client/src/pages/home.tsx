import { useState } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, ArrowRight, BookOpen, Users, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-5 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-8">
              Nouveau: Dictionnaire V2.0 🚀
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-foreground mb-6">
              Zeedna <span className="text-primary">3amia</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Le premier dictionnaire communautaire dédié aux dialectes arabes. 
              Recherchez, découvrez et partagez vos expressions locales.
            </p>

            <div className="max-w-xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex shadow-lg rounded-full bg-background border p-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    className="border-0 focus-visible:ring-0 shadow-none bg-transparent pl-12 h-12 text-lg rounded-full"
                    placeholder="Rechercher un mot (ex: wa5a, زادا...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="lg" className="rounded-full px-8 h-12">
                    Rechercher
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: SearchIcon,
                title: "Recherchez",
                desc: "Trouvez des définitions précises pour des milliers de mots en dialecte."
              },
              {
                icon: BookOpen,
                title: "Apprenez",
                desc: "Découvrez les nuances et les origines des expressions populaires."
              },
              {
                icon: Users,
                title: "Contribuez",
                desc: "Participez à la communauté en ajoutant vos propres mots et corrections."
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={item}>
                <Card className="border-none shadow-md bg-background/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à enrichir le dictionnaire ?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
            Rejoignez des centaines de contributeurs et aidez-nous à préserver la richesse de nos dialectes.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="rounded-full px-8 h-12 text-primary font-bold hover:bg-secondary/90"
            onClick={() => setLocation('/contribute')}
          >
            Ajouter un mot <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

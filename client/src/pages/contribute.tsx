import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  word: z.string().min(2, {
    message: "Le mot doit contenir au moins 2 caractères.",
  }),
  dialect: z.string({
    required_error: "Veuillez sélectionner un dialecte.",
  }),
  definition: z.string().min(10, {
    message: "La définition doit être assez descriptive.",
  }),
  example: z.string().optional(),
});

export default function ContributePage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      definition: "",
      example: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Contribution envoyée !",
      description: "Merci d'avoir ajouté ce mot. Il sera examiné par la communauté.",
    });
    form.reset();
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-primary">Ajouter un mot</CardTitle>
          <CardDescription>
            Aidez-nous à enrichir le dictionnaire en ajoutant une nouvelle expression.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="word"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot ou Expression</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Wa5a" {...field} />
                    </FormControl>
                    <FormDescription>
                      Le mot en lettres latines ou arabes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dialect"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dialecte</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un dialecte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="marocain">Marocain (Darija)</SelectItem>
                        <SelectItem value="algerien">Algérien</SelectItem>
                        <SelectItem value="tunisien">Tunisien</SelectItem>
                        <SelectItem value="egyptien">Égyptien</SelectItem>
                        <SelectItem value="libanais">Libanais</SelectItem>
                        <SelectItem value="syrien">Syrien</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="definition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Définition</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Que signifie ce mot ?" 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="example"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exemple d'utilisation (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Une phrase contenant le mot" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full text-lg h-12">
                Envoyer la contribution
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

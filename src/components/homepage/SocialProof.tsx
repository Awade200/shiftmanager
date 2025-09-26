import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export const SocialProof = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Support Worker",
      avatar: "/api/placeholder/48/48",
      quote: "It saves me ~2 hours every week. Overlaps? Gone. I can actually track my earnings properly now.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Care Coordinator",
      avatar: "/api/placeholder/48/48", 
      quote: "Our agency uses this for 15+ workers. The CSV exports make payroll so much easier. Game changer.",
      rating: 5
    },
    {
      name: "Emma Williams",
      role: "Night Shift Worker",
      avatar: "/api/placeholder/48/48",
      quote: "Finally something built for us. Pasting my rota from WhatsApp and having it just work? Magic.",
      rating: 5
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Loved by support workers
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-warning text-warning" />
              ))}
            </div>
            <Badge variant="outline" className="ml-2">
              4.7/5 from early users
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="hover:shadow-2 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                
                <blockquote className="text-foreground leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center space-x-3 pt-4 border-t border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Join hundreds of support workers already saving time and stress
          </p>
        </div>
      </div>
    </section>
  );
};
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Download, ArrowRight } from "lucide-react";

export const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Row-Level Security",
      description: "Bank-grade security ensures your data is isolated and protected. Only you can see your shifts."
    },
    {
      icon: Lock,
      title: "Hashed PIN Authentication", 
      description: "Secure PIN-based login with encryption. Your credentials are never stored in plain text."
    },
    {
      icon: Download,
      title: "Export Anytime",
      description: "Your data belongs to you. Export everything to CSV anytime. No vendor lock-in."
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Security & Privacy First
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built for care work means built for privacy. Your sensitive work data deserves enterprise-grade protection.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-2 transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <button className="inline-flex items-center text-primary hover:text-primary-glow transition-colors font-medium group">
            Read our detailed security documentation
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
import { Shield, Moon, Download, Heart, Code, Calendar } from "lucide-react";

export const TrustStrip = () => {
  const features = [
    { icon: Heart, text: "Built for Care Work" },
    { icon: Shield, text: "Bank-level Security (RLS)" },
    { icon: Moon, text: "Dark Mode" },
    { icon: Download, text: "CSV Export" },
    { icon: Code, text: "No Code Parsing" },
    { icon: Calendar, text: "UK Pay Periods Ready" }
  ];

  return (
    <section className="py-12 border-b border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="flex flex-col items-center space-y-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {feature.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, DollarSign, BarChart3, ArrowRight } from "lucide-react";

export const ValuePillars = () => {
  const pillars = [
    {
      icon: Calendar,
      title: "Timeline & Calendar",
      description: "Drag to adjust shifts, spot overlaps instantly. Visual timeline shows your week at a glance.",
      link: "See how it works"
    },
    {
      icon: FileText,
      title: "Paste & Parse",
      description: "Turn messy text or PDF timesheets into clean shift records. Smart deduplication handles overlaps.",
      link: "Try parsing"
    },
    {
      icon: DollarSign,
      title: "Get Paid Faster",
      description: "Bulk mark shifts as paid, smart filters for unpaid shifts over 14 days. Never lose track again.",
      link: "View filters"
    },
    {
      icon: BarChart3,
      title: "Analytics that Pay",
      description: "Track your best clients, average hourly rate, and risk flags. Make data-driven decisions.",
      link: "See analytics"
    }
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Everything you need to manage shifts
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From chaotic timesheets to organized earnings. Built specifically for support workers and care agencies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-2 transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                  
                  <button className="flex items-center text-primary hover:text-primary-glow transition-colors text-sm font-medium group">
                    {pillar.link}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
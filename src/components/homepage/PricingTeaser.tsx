import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export const PricingTeaser = () => {
  const features = {
    free: [
      "Unlimited shifts",
      "Paste & Parse from text/PDF",
      "Timeline view", 
      "CSV export",
      "Basic analytics",
      "7-day history"
    ],
    pro: [
      "Everything in Free",
      "Client analytics & insights",
      "Custom pay rules",
      "Bulk operations",
      "Priority support",
      "Unlimited history"
    ]
  };

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Start free. Keep all core features.
          </h2>
          <p className="text-xl text-muted-foreground">
            No hidden costs. No credit card required for free tier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="border-2 border-border hover:shadow-2 transition-all duration-300">
            <CardHeader className="text-center pb-6">
              <Badge variant="outline" className="w-fit mx-auto mb-2">
                Most Popular
              </Badge>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="text-3xl font-bold text-foreground">
                £0
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">Perfect for individual support workers</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-success shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" size="lg">
                Start Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="border-2 border-primary hover:shadow-2 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary"></div>
            <CardHeader className="text-center pb-6">
              <Badge className="w-fit mx-auto mb-2">
                Best Value
              </Badge>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-3xl font-bold text-foreground">
                £9
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">For agencies and power users</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.pro.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-success shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" size="lg">
                7-Day Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" className="group">
            Compare all features
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
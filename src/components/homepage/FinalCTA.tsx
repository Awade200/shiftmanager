import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

export const FinalCTA = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would hit an API
    setIsSubmitted(true);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          
          <CardContent className="relative p-12 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Ready to get paid faster?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of support workers who've already simplified their shift tracking. 
                Start free, upgrade when you're ready.
              </p>
            </div>

            {!isSubmitted ? (
              <div className="space-y-6">
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" size="lg" className="sm:w-auto">
                    Start Free
                  </Button>
                </form>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>7-day trial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>No card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>2 min setup</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link to="/auth">
                    <Button variant="ghost" className="group">
                      Or sign up directly →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  You're all set!
                </h3>
                <p className="text-muted-foreground">
                  Check your email for next steps. Welcome to easier shift management!
                </p>
                <Link to="/auth">
                  <Button className="mt-4">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
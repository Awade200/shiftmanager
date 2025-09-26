import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Play, Clock, DollarSign, Calendar, CheckCircle2 } from "lucide-react";

export const HeroSection = () => {
  const [earnings, setEarnings] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Earnings counter animation
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setEarnings(prev => {
          if (prev >= 1247.50) {
            clearInterval(interval);
            return 1247.50;
          }
          return prev + 25.55;
        });
      }, 100);
    }, 1000);

    // Mark paid animation
    const paidTimer = setTimeout(() => {
      setIsPaid(true);
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(paidTimer);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 flex justify-center">
        <div className="w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60 animate-float"></div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Hero Content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Track, verify, and get paid—
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                without headaches
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Paste agency timesheets, resolve overlaps, and mark paid in seconds. 
              Built specifically for support workers and care agencies.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="text-center lg:text-left">
            <button className="text-primary hover:underline font-medium">
              Try pasting a sample timesheet →
            </button>
          </div>
        </div>

        {/* Product Mockup */}
        <div className="relative lg:pl-8">
          <Card className="bg-card border shadow-2 overflow-hidden">
            {/* Mock Header */}
            <div className="bg-muted/30 px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Today's Shifts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm font-bold text-success">
                    £{earnings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mock Shift Entry */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Russell House - Day Shift</p>
                    <p className="text-sm text-muted-foreground">09:00 - 17:00 • 8 hours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">£156.00</span>
                  <div className="relative">
                    <Badge 
                      variant={isPaid ? "success" : "outline"}
                      className={`transition-all duration-300 ${
                        isPaid 
                          ? "bg-success text-success-foreground shadow-1" 
                          : "animate-pulse"
                      }`}
                    >
                      {isPaid ? (
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </div>
                      ) : (
                        "Pending"
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg opacity-60">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sutton House - Night</p>
                    <p className="text-sm text-muted-foreground">22:00 - 07:00 • 9 hours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">£195.75</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Floating Elements */}
          <div className="absolute -top-4 -right-4 animate-float" style={{ animationDelay: "2s" }}>
            <Badge variant="success" className="shadow-lg">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Auto-resolved overlap
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};
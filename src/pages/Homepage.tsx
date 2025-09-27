import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Shield, Users, TrendingUp, LogIn, UserPlus, Mail } from "lucide-react";

const Homepage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SimpleNav />
      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
        <ContactSection />
      </main>
      <SimpleFooter />
    </div>
  );
};

function SimpleNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Shift Manager" className="w-9 h-9 rounded-lg object-contain" />
          <span className="font-semibold text-foreground">Shift Manager</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a className="text-muted-foreground hover:text-foreground transition-colors" href="#features">
            Features
          </a>
          <a className="text-muted-foreground hover:text-foreground transition-colors" href="#about">
            About
          </a>
          <a className="text-muted-foreground hover:text-foreground transition-colors" href="#contact">
            Support
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="gap-2">
            <a href="/auth">
              <LogIn className="h-4 w-4" />
              Sign in
            </a>
          </Button>
          <Button asChild variant="default" className="gap-2">
            <a href="/auth">
              <UserPlus className="h-4 w-4" />
              Get Started
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6">
            Shift Management Made Simple
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl mb-6">
            Take Control of Your{" "}
            <span className="text-primary">Work Schedule</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Track your shifts, manage your time, and stay organized with our intuitive shift management platform. 
            Perfect for healthcare workers, retail staff, and anyone with rotating schedules.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8">
              <a href="/auth">Start Managing Shifts</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Easily track and organize your work shifts with our intuitive calendar interface."
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Monitor your work hours, overtime, and break times to ensure accurate pay calculations."
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "View detailed insights about your work patterns, earnings, and schedule optimization."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security and privacy measures."
    },
    {
      icon: Users,
      title: "Team Coordination",
      description: "Coordinate with colleagues and managers for shift swaps and coverage requests."
    },
    {
      icon: Mail,
      title: "Smart Notifications",
      description: "Get timely reminders about upcoming shifts, schedule changes, and important updates."
    }
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            Everything You Need to Manage Shifts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools you need to stay organized and in control of your work schedule.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:shadow-2 transition-all duration-200">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-6">
              Built for Modern Workers
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Shift Manager was created to solve the real challenges faced by shift workers across various industries. 
              Whether you're a nurse managing complex hospital rotations, a retail worker juggling multiple part-time jobs, 
              or a freelancer tracking project hours, we've got you covered.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Intuitive Design</h3>
                  <p className="text-muted-foreground">Clean, user-friendly interface that makes shift management effortless.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Flexible Integration</h3>
                  <p className="text-muted-foreground">Works with your existing workflow and adapts to your unique schedule needs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Reliable Support</h3>
                  <p className="text-muted-foreground">Our dedicated support team is here to help you succeed.</p>
                </div>
              </div>
            </div>
          </div>
          <Card className="shadow-2">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">15,000+</div>
                  <div className="text-muted-foreground">Active Users</div>
                </div>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold mb-1">98%</div>
                    <div className="text-sm text-muted-foreground">User Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold mb-1">24/7</div>
                    <div className="text-sm text-muted-foreground">Support Available</div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    "This app has completely transformed how I manage my nursing shifts. Highly recommended!"
                  </p>
                  <p className="text-sm font-medium mt-2">- Sarah M., Healthcare Worker</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-32 bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of workers who have already simplified their shift management.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button asChild size="lg" className="text-lg px-8">
            <a href="/auth">Create Free Account</a>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <a href="mailto:lawalsulaiman247@gmail.com?subject=Contact%20from%20Shift%20Manager%20User&body=Hello%2C%0A%0AI%20am%20reaching%20out%20from%20Shift%20Manager%20and%20would%20like%20to%3A%0A%0A-%20Get%20support%20with%3A%20%5BDescribe%20your%20issue%5D%0A-%20Ask%20about%3A%20%5BYour%20question%5D%0A%0AThank%20you%20for%20your%20time%21%0A%0ABest%20regards">Contact Support</a>
          </Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Need Help Getting Started?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is available 24/7 to help you set up your account and answer any questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a href="mailto:lawalsulaiman247@gmail.com?subject=Contacting you from Shift Manager&body=Hello,%0A%0AI am contacting you from Shift Manager and would like to:%0A%0A- Get support with: [Please describe your issue here]%0A- Ask about: [Your question here]%0A%0AThank you for your time!%0A%0ABest regards">Email Support</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:+447778561600">Call: +44 777 856 1600</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SimpleFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Shift Manager" className="w-8 h-8 object-contain" />
              <span className="font-semibold">Shift Manager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Making shift management simple and efficient for modern workers.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <div className="space-y-2 text-sm">
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#about" className="block text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <div className="space-y-2 text-sm">
              <a href="mailto:lawalsulaiman247@gmail.com?subject=Support%20Request%20from%20Shift%20Manager&body=Hello%2C%0A%0AI%20need%20assistance%20with%20Shift%20Manager%3A%0A%0A%5BDescribe%20your%20issue%20here%5D%0A%0AThank%20you%21" className="block text-muted-foreground hover:text-foreground transition-colors">
                Email Support
              </a>
              <a href="tel:+447778561600" className="block text-muted-foreground hover:text-foreground transition-colors">
                Phone Support
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Shift Manager. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Homepage;
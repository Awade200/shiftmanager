import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useToast } from '@/hooks/use-toast';
import { Phone, User, Lock, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [signUpData, setSignUpData] = useState({
    mobileNumber: '',
    displayName: '',
    pin: ''
  });
  const [signInData, setSignInData] = useState({
    mobileNumber: '',
    pin: ''
  });

  const { user, loading, signUp, signIn } = useMobileAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const formatMobileNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as UK mobile number
    if (digits.startsWith('44')) {
      return '+' + digits;
    } else if (digits.startsWith('0')) {
      return '+44' + digits.slice(1);
    } else if (digits.length === 10) {
      return '+44' + digits;
    } else {
      return '+44' + digits;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const formattedMobile = formatMobileNumber(signUpData.mobileNumber);
    
    const result = await signUp(formattedMobile, signUpData.pin, signUpData.displayName);
    
    if (result.success) {
      toast({
        title: "Account created successfully",
        description: "Welcome to Shift Manager!",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Sign up failed",
        description: result.error || "An error occurred during sign up",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signInData.pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const formattedMobile = formatMobileNumber(signInData.mobileNumber);
    
    const result = await signIn(formattedMobile, signInData.pin);
    
    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Sign in failed",
        description: result.error || "Invalid mobile number or PIN",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Shift Manager</h1>
            <p className="text-muted-foreground">Track your shifts, calculate pay & taxes</p>
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-center">Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-mobile" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile Number
                    </Label>
                    <Input
                      id="signin-mobile"
                      type="tel"
                      placeholder="07123456789"
                      value={signInData.mobileNumber}
                      onChange={(e) => setSignInData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      required
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-pin" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      4-Digit PIN
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={4}
                        value={signInData.pin}
                        onChange={(value) => setSignInData(prev => ({ ...prev, pin: value }))}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Display Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={signUpData.displayName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile Number
                    </Label>
                    <Input
                      id="signup-mobile"
                      type="tel"
                      placeholder="07123456789"
                      value={signUpData.mobileNumber}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-pin" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Create 4-Digit PIN
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={4}
                        value={signUpData.pin}
                        onChange={(value) => setSignUpData(prev => ({ ...prev, pin: value }))}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
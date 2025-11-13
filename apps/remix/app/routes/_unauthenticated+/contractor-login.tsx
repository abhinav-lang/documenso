import { useState } from 'react';

import { Trans, msg } from '@lingui/react/macro';
import { useLingui } from '@lingui/react';
import { Phone, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Contractor Login');
}

type LoginStep = 'phone' | 'otp';

export default function ContractorLoginPage() {
  const { _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [contractorId, setContractorId] = useState<string | null>(null);

  const { mutateAsync: requestOtp, isLoading: isRequestingOtp } =
    trpc.workOrder.requestContractorOtp.useMutation();

  const { mutateAsync: verifyOtp, isLoading: isVerifyingOtp } =
    trpc.workOrder.verifyContractorOtp.useMutation();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    try {
      await requestOtp({ phone });
      toast({
        title: 'Success',
        description: 'OTP sent to your phone number',
      });
      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await verifyOtp({ phone, otp });

      if (result.verified) {
        setContractorId(result.contractorId);
        toast({
          title: 'Success',
          description: 'Login successful! Redirecting to your work orders...',
        });

        // TODO: Set contractor session/auth
        // For now, redirect to work orders page
        // In a real implementation, you'd create a session and redirect
        setTimeout(() => {
          navigate('/contractor/work-orders');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleResendOtp = async () => {
    try {
      await requestOtp({ phone });
      toast({
        title: 'Success',
        description: 'OTP resent to your phone number',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <Trans>Contractor Login</Trans>
          </h1>
          <p className="text-muted-foreground mt-2">
            <Trans>Sign in to view and sign your work orders</Trans>
          </p>
        </div>

        {step === 'phone' ? (
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Enter Phone Number</Trans>
              </CardTitle>
              <CardDescription>
                <Trans>
                  We'll send you an OTP (One-Time Password) to verify your identity
                </Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Trans>Phone Number</Trans> *
                  </Label>
                  <div className="relative">
                    <Phone className="text-muted-foreground absolute left-3 top-3 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <Trans>Include country code (e.g., +91 for India)</Trans>
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isRequestingOtp}>
                  {isRequestingOtp ? (
                    <Trans>Sending OTP...</Trans>
                  ) : (
                    <Trans>Send OTP</Trans>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Enter OTP</Trans>
              </CardTitle>
              <CardDescription>
                <Trans>Enter the 6-digit code sent to {phone}</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">
                    <Trans>OTP Code</Trans> *
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest"
                    required
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
                  {isVerifyingOtp ? (
                    <Trans>Verifying...</Trans>
                  ) : (
                    <>
                      <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                      <Trans>Verify & Login</Trans>
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep('phone')}
                    className="p-0"
                  >
                    <Trans>Change Phone Number</Trans>
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOtp}
                    disabled={isRequestingOtp}
                    className="p-0"
                  >
                    <Trans>Resend OTP</Trans>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-muted-foreground mt-6 text-center text-sm">
          <p>
            <Trans>Having trouble? Contact your contracts team for support.</Trans>
          </p>
        </div>
      </div>
    </div>
  );
}

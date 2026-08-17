'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Footer from '@/components/Footer';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const error = searchParams?.get('error');

  const handleSignIn = () => {
    signIn('okta', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="flex-1 flex items-center justify-center bg-cover bg-center px-4 py-12"
        style={{ backgroundImage: "url('/tec360-bg-azul.png')" }}
      >
        <div className="relative z-10 bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              <Image
                src="/tec360-header-logo.png"
                alt="TEC360"
                width={140}
                height={96}
                className="h-20 w-auto"
                priority
              />
            </div>
            <h1 className="text-3xl font-display font-bold text-primary mb-2">
              AI PRO SALES
            </h1>
            <p className="text-gray-500 font-display font-medium text-base">
              AI Powered Sales Equipment
            </p>
          </div>

          {/* Security Badge */}
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 font-bold">Enterprise Secured</span>
              <div className="w-2 h-2 bg-success-green rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-2xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-error-red mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-error-red font-medium">
                  {error === 'OAuthCallback'
                    ? 'Authentication failed. Please try again.'
                    : 'An error occurred. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            className="w-full bg-accent hover:bg-primary text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl shadow-lg flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="text-lg">Sign in with Okta</span>
          </button>

          {/* Features */}
          <div className="mt-8 p-5 bg-gray-50 rounded-2xl">
            <h3 className="font-display font-semibold text-sm text-primary mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-accent" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2c-3 4-3 16 0 20M12 2c3 4 3 16 0 20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Security Features
            </h3>
            <ul className="text-xs text-gray-700 space-y-3">
              <li className="flex items-start">
                <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span><strong className="text-primary">Secure Token Exchange:</strong> Identity delegation for AI assistant</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span><strong className="text-primary">Secure Data Access:</strong> Protected inventory & sales data</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-okta-blue/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-okta-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span><strong className="text-primary">Verified Authentication:</strong> SSO with enterprise identity</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-baby-blue/40 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span><strong className="text-primary">Activity Logging:</strong> Token exchange audit trail</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <div className="flex flex-col items-center space-y-4">
          <Image src="/tec360-header-logo.png" alt="TEC360" width={100} height={68} className="h-14 w-auto animate-pulse" />
          <div className="text-primary text-xl font-display font-medium">Loading AI PRO SALES...</div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

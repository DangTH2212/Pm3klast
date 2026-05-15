import Head from 'next/head';
import Link from 'next/link';
import { Video, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service - PM3K</title>
      </Head>
      
      <div className="min-h-screen bg-dark-400">
        <header className="bg-dark-300 border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-pink-500 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400">Last updated: May 15, 2026</p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using PM3K ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-4">
              PM3K is a web application that allows users to authenticate with TikTok using OAuth, 
              upload videos, and test content posting functionality using TikTok's sandbox APIs. 
              This is a testing platform intended for developers to integrate with TikTok APIs.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. TikTok Sandbox Environment</h2>
            <p className="text-gray-300 mb-4">
              PM3K operates exclusively in TikTok's sandbox environment. Videos uploaded through this 
              service are test content and will not appear on the public TikTok platform. Sandbox 
              accounts are provided by TikTok for development and testing purposes.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. User Responsibilities</h2>
            <p className="text-gray-300 mb-4">
              You agree to use the Service only for legitimate testing and development purposes 
              with TikTok APIs. You are responsible for maintaining the confidentiality of your 
              account and for all activities that occur under your account.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              PM3K is provided "as is" without warranty of any kind. We are not responsible for 
              any damages or losses arising from the use of this Service or TikTok's APIs.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Contact</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms, please contact us through our website.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

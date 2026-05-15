import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Video, Eye, Lock, Database, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - PM3K</title>
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
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400">Last updated: May 15, 2026</p>

            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-400" />
              Information We Collect
            </h2>
            <p className="text-gray-300 mb-4">
              PM3K collects the following information:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>TikTok profile information (display name, avatar, bio) obtained through OAuth</li>
              <li>TikTok API access tokens (stored securely encrypted)</li>
              <li>Video upload history and metadata</li>
              <li>Basic usage analytics</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-400" />
              How We Use Your Information
            </h2>
            <p className="text-gray-300 mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Authenticate you with TikTok's OAuth system</li>
              <li>Facilitate video uploads to TikTok sandbox environment</li>
              <li>Display your profile information on the dashboard</li>
              <li>Track upload history and status</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-400" />
              Data Storage
            </h2>
            <p className="text-gray-300 mb-4">
              Your data is stored in MongoDB Atlas database. TikTok access tokens are encrypted 
              and stored securely. We do not share your personal information with third parties 
              except as necessary to provide our service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              Data Security
            </h2>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Encrypted storage of sensitive credentials</li>
              <li>JWT-based authentication</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">Your Rights</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Request deletion of your account and data</li>
              <li>Access your stored information</li>
              <li>Revoke TikTok API access at any time</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">TikTok API Data</h2>
            <p className="text-gray-300 mb-4">
              By using PM3K, you also agree to TikTok's Developer Terms of Service and Privacy Policy. 
              Any data you share with TikTok through their OAuth system is governed by TikTok's privacy practices.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">Contact</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about this Privacy Policy, please contact us through our website.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

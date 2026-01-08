import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy.',
}

/**
 * Privacy policy page
 * GDPR-compliant privacy policy for GW1 Builds
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-block mb-8">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            noLift
          >
            Back to home
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-text-primary mb-6">
          Privacy Policy
        </h1>

        <div className="prose text-text-secondary space-y-4">
          <p>
            <strong className="text-text-primary">Last updated:</strong> January
            6, 2026
          </p>

          <p>
            GW1 Builds (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
            operates the gw1builds.com website. This page informs you of our
            policies regarding the collection, use, and disclosure of personal
            data when you use our service.
          </p>

          {/* Data Collection */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            1. Data We Collect
          </h2>
          <p>
            <strong className="text-text-primary">Account Data:</strong> When
            you sign in with Google, we collect and store:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your Google account ID (to identify your account)</li>
            <li>Your profile picture URL (to display your avatar)</li>
            <li>Your chosen username (set by you after sign-up)</li>
          </ul>
          <p className="mt-3">
            <strong className="text-text-primary">
              We do NOT collect or store:
            </strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your email address</li>
            <li>Your real name</li>
            <li>Your Google password</li>
            <li>Any other Google account data</li>
          </ul>

          <p className="mt-3">
            <strong className="text-text-primary">User Content:</strong> We
            store the builds you create, including skill configurations, notes,
            and tags.
          </p>

          {/* How We Use Data */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            2. How We Use Your Data
          </h2>
          <p>We use the data we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and maintain our service</li>
            <li>Associate builds with your account</li>
            <li>Display your username and avatar on builds you create</li>
            <li>Improve our service based on usage patterns</li>
          </ul>

          {/* Analytics */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            3. Analytics
          </h2>
          <p>
            We use Vercel Analytics, a privacy-focused analytics service, to
            understand how people use our site. This helps us improve the
            experience.
          </p>
          <p className="mt-3">
            <strong className="text-text-primary">What we track:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Page views (which pages are visited)</li>
            <li>Aggregate actions (builds created, copied, shared)</li>
            <li>Build metadata (profession types, game modes)</li>
          </ul>
          <p className="mt-3">
            <strong className="text-text-primary">What we do NOT track:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your identity or user ID</li>
            <li>Your IP address</li>
            <li>Your precise location</li>
            <li>Any personally identifiable information</li>
          </ul>
          <p className="mt-3">
            Vercel Analytics does not use cookies and is compliant with GDPR,
            CCPA, and other privacy regulations.
          </p>

          {/* Cookies */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            4. Cookies
          </h2>
          <p>
            We only use <strong className="text-text-primary">essential</strong>{' '}
            cookies required to keep you signed in. These are necessary for the
            service to function and cannot be disabled.
          </p>
          <p className="mt-3">
            We do NOT use tracking cookies, advertising cookies, or any
            third-party cookies.
          </p>

          {/* Data Sharing */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            5. Data Sharing
          </h2>
          <p>We do NOT:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sell your personal data to anyone</li>
            <li>Share your data with advertisers</li>
            <li>Send marketing emails</li>
            <li>Track you across other websites</li>
          </ul>
          <p className="mt-3">
            Your builds are public by default and visible to all visitors.
          </p>

          {/* Data Storage */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            6. Data Storage and Security
          </h2>
          <p>
            Your data is stored securely using Supabase, hosted on AWS
            infrastructure. We use industry-standard security measures including
            encryption in transit (HTTPS) and at rest.
          </p>

          {/* Your Rights */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            7. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-text-primary">Access</strong> - View the
              data we hold about you
            </li>
            <li>
              <strong className="text-text-primary">Rectification</strong> -
              Update your username or profile
            </li>
            <li>
              <strong className="text-text-primary">Erasure</strong> - Delete
              your builds at any time
            </li>
            <li>
              <strong className="text-text-primary">Account Deletion</strong> -
              Request complete removal of your account and all associated data
            </li>
          </ul>
          <p className="mt-3">
            To delete your account entirely, contact us and we will remove all
            your data within 30 days.
          </p>

          {/* Third-Party Links */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            8. Third-Party Links
          </h2>
          <p>
            Our site may contain links to external sites (e.g., Guild Wars Wiki,
            PvX Wiki). We are not responsible for the privacy practices of these
            external sites.
          </p>

          {/* Children's Privacy */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            9. Children&apos;s Privacy
          </h2>
          <p>
            Our service is not directed to children under 13. We do not
            knowingly collect personal data from children under 13. If you
            believe we have collected data from a child, please contact us.
          </p>

          {/* Changes */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new policy on this page and
            updating the &quot;Last updated&quot; date.
          </p>

          {/* Contact */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            11. Contact Us
          </h2>
          <p>
            If you have any questions about this privacy policy or wish to
            exercise your data rights, please contact us through our GitHub
            repository or community channels.
          </p>
        </div>
      </div>
    </div>
  )
}

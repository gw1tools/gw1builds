import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service.',
}

/**
 * Terms of Service page
 */
export default function TermsPage() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] py-12 px-4">
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
          Terms of Service
        </h1>

        <div className="prose text-text-secondary space-y-4">
          <p>
            <strong className="text-text-primary">Last updated:</strong> January
            6, 2026
          </p>

          <p>
            Welcome to GW1 Builds. By using our service, you agree to these
            terms. Please read them carefully.
          </p>

          {/* Service Description */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            1. What We Provide
          </h2>
          <p>
            GW1 Builds is a free, community-driven platform for sharing Guild
            Wars 1 character builds. We provide tools to create, share, and
            discover builds.
          </p>

          {/* User Accounts */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            2. User Accounts
          </h2>
          <p>
            To create builds, you need to sign in with a Google account. You are
            responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keeping your account secure</li>
            <li>All activity that occurs under your account</li>
            <li>Choosing an appropriate username</li>
          </ul>
          <p className="mt-3">
            We may suspend or terminate accounts that violate these terms.
          </p>

          {/* User Content */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            3. User Content
          </h2>
          <p>
            You retain ownership of builds you create. By posting content, you
            grant us a license to display it on our platform.
          </p>
          <p className="mt-3">You agree NOT to post content that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Is illegal, harmful, or offensive</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains spam or malicious links</li>
            <li>Impersonates others</li>
            <li>Harasses or threatens other users</li>
          </ul>
          <p className="mt-3">
            We may remove content that violates these guidelines without notice.
          </p>

          {/* Intellectual Property */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            4. Intellectual Property
          </h2>
          <p>
            Guild Wars, Guild Wars 2, and all related content are trademarks of
            NCSOFT Corporation and ArenaNet, LLC. GW1 Builds is a fan project
            and is not affiliated with or endorsed by NCSOFT or ArenaNet.
          </p>
          <p className="mt-3">
            Skill icons and game data are used under fair use for the purpose of
            community build sharing.
          </p>

          {/* Acceptable Use */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            5. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use automated tools to scrape or overload our service</li>
            <li>Interfere with other users&apos; use of the service</li>
            <li>Use the service for any illegal purpose</li>
          </ul>

          {/* Disclaimers */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            6. Disclaimers
          </h2>
          <p>
            GW1 Builds is provided &quot;as is&quot; without warranties of any
            kind. We do not guarantee that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The service will be uninterrupted or error-free</li>
            <li>Builds will be accurate or effective in-game</li>
            <li>User-submitted content is accurate or appropriate</li>
          </ul>

          {/* Limitation of Liability */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, GW1 Builds and its operators
            shall not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of the service.
          </p>

          {/* Modifications */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            8. Changes to Service
          </h2>
          <p>
            We may modify, suspend, or discontinue any part of the service at
            any time. We may also update these terms, and continued use
            constitutes acceptance of the updated terms.
          </p>

          {/* Termination */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            9. Termination
          </h2>
          <p>
            You may stop using the service at any time. We may terminate or
            suspend your access for violations of these terms or for any reason
            at our discretion.
          </p>

          {/* Governing Law */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            10. Governing Law
          </h2>
          <p>
            These terms are governed by applicable law. Any disputes shall be
            resolved through good-faith negotiation.
          </p>

          {/* Contact */}
          <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3">
            11. Contact
          </h2>
          <p>
            For questions about these terms, please contact us through our
            GitHub repository or community channels.
          </p>
        </div>
      </div>
    </div>
  )
}

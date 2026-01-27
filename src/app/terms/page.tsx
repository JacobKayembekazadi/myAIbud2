import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#02040a] text-white">
            {/* Navigation */}
            <nav className="border-b border-gray-800/50 bg-[#02040a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">MyChatFlow</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                <p className="text-gray-400 mb-12">Last updated: January 2026</p>

                <div className="prose prose-invert prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            By accessing or using MyChatFlow ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use the Service. We reserve the right to modify
                            these terms at any time, and your continued use of the Service constitutes acceptance of any changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                        <p className="text-gray-300 leading-relaxed">
                            MyChatFlow provides AI-powered WhatsApp automation services for business communication. The Service
                            allows users to connect their WhatsApp accounts, automate responses using artificial intelligence,
                            manage contacts, and send bulk messages in compliance with WhatsApp's terms of service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">You agree to:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Provide accurate and complete registration information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Use the Service in compliance with all applicable laws and regulations</li>
                            <li>Not use the Service for spam, harassment, or any illegal activities</li>
                            <li>Comply with WhatsApp's terms of service and acceptable use policies</li>
                            <li>Not attempt to reverse engineer or compromise the Service's security</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. WhatsApp Compliance</h2>
                        <p className="text-gray-300 leading-relaxed">
                            MyChatFlow is designed to work with WhatsApp's web interface. Users are responsible for ensuring
                            their use of the Service complies with WhatsApp's terms of service. We implement rate limiting and
                            other safeguards to protect your account, but cannot guarantee that WhatsApp will not take action
                            against accounts that violate their policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Subscription and Billing</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Some features of the Service require a paid subscription. By subscribing, you agree to pay all
                            applicable fees. Subscriptions are billed monthly and will automatically renew unless cancelled.
                            You may cancel your subscription at any time, and cancellation will take effect at the end of
                            the current billing period.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. AI-Generated Content</h2>
                        <p className="text-gray-300 leading-relaxed">
                            The Service uses artificial intelligence to generate responses. While we strive for accuracy and
                            appropriateness, AI-generated content may occasionally be incorrect, inappropriate, or not aligned
                            with your intentions. You are responsible for reviewing and monitoring AI responses sent on your behalf.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To the maximum extent permitted by law, MyChatFlow shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages, including but not limited to loss of profits, data,
                            or business opportunities, arising from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
                        <p className="text-gray-300 leading-relaxed">
                            All content, features, and functionality of the Service are owned by MyChatFlow and are protected
                            by international copyright, trademark, and other intellectual property laws. You retain ownership
                            of any content you submit through the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may terminate or suspend your access to the Service immediately, without prior notice, for any
                            reason, including breach of these Terms. Upon termination, your right to use the Service will
                            immediately cease.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about these Terms of Service, please contact us at{" "}
                            <a href="mailto:legal@mychatflow.com" className="text-emerald-400 hover:text-emerald-300">
                                legal@mychatflow.com
                            </a>.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800/50 py-8 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} MyChatFlow. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms</Link>
                        <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

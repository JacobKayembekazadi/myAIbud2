import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-gray-400 mb-12">Last updated: January 2026</p>

                <div className="prose prose-invert prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p className="text-gray-300 leading-relaxed">
                            MyChatFlow ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                            explains how we collect, use, disclose, and safeguard your information when you use our
                            AI-powered WhatsApp automation service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

                        <h3 className="text-xl font-medium text-white mb-3 mt-6">2.1 Account Information</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            When you create an account, we collect:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Email address</li>
                            <li>Name (optional)</li>
                            <li>Authentication data via Clerk (our authentication provider)</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mb-3 mt-6">2.2 WhatsApp Data</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            When you connect your WhatsApp account, we process:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Contact information (phone numbers, names)</li>
                            <li>Message content for AI processing</li>
                            <li>Conversation history for context</li>
                            <li>Media files you choose to analyze</li>
                        </ul>

                        <h3 className="text-xl font-medium text-white mb-3 mt-6">2.3 Usage Data</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We automatically collect:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Feature usage and interactions</li>
                            <li>Performance metrics</li>
                            <li>Error logs for troubleshooting</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">We use collected information to:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Provide and maintain the Service</li>
                            <li>Generate AI-powered responses to your WhatsApp messages</li>
                            <li>Process and manage your contacts and campaigns</li>
                            <li>Improve our AI models and service quality</li>
                            <li>Send service-related communications</li>
                            <li>Detect and prevent fraud or abuse</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">We may share your information with:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li><strong>Service Providers:</strong> Third-party services that help us operate (Clerk for authentication, Convex for database, Google for AI)</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We implement industry-standard security measures to protect your data, including:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                            <li>Encryption in transit (TLS/SSL)</li>
                            <li>Secure authentication via Clerk</li>
                            <li>Multi-tenant data isolation</li>
                            <li>Regular security assessments</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            However, no method of transmission over the Internet is 100% secure, and we cannot guarantee
                            absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We retain your data for as long as your account is active or as needed to provide services.
                            You can request deletion of your account and associated data at any time. Some data may be
                            retained for legal compliance purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Delete your data</li>
                            <li>Export your data</li>
                            <li>Opt out of certain processing</li>
                            <li>Withdraw consent</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            To exercise these rights, please contact us at{" "}
                            <a href="mailto:privacy@mychatflow.com" className="text-emerald-400 hover:text-emerald-300">
                                privacy@mychatflow.com
                            </a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Services</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Our Service integrates with third-party services that have their own privacy policies:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
                            <li><strong>Clerk:</strong> Authentication and user management</li>
                            <li><strong>Convex:</strong> Database and real-time data</li>
                            <li><strong>Google AI:</strong> AI response generation</li>
                            <li><strong>WhatsApp:</strong> Messaging platform</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            We encourage you to review the privacy policies of these services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Our Service is not intended for users under 18 years of age. We do not knowingly collect
                            personal information from children. If you believe we have collected information from a
                            child, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Your information may be transferred to and processed in countries other than your own.
                            We ensure appropriate safeguards are in place for such transfers in compliance with
                            applicable data protection laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by
                            posting the new policy on this page and updating the "Last updated" date. Your continued
                            use of the Service after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have questions about this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                            <p className="text-gray-300">
                                <strong className="text-white">Email:</strong>{" "}
                                <a href="mailto:privacy@mychatflow.com" className="text-emerald-400 hover:text-emerald-300">
                                    privacy@mychatflow.com
                                </a>
                            </p>
                        </div>
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

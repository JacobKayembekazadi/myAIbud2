import { SignIn } from "@clerk/nextjs";
import { Bot, CheckCircle2, Zap, MessageSquare, ShieldCheck } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen bg-[#02040a] text-white">
            {/* Left Side: Branding & Features (Visible on md and up) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black p-12 flex-col justify-between border-r border-gray-800/40">
                {/* Background Glows */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-500/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />

                {/* Logo Section */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Aibud</h1>
                        <p className="text-xs text-green-400 font-bold uppercase tracking-widest leading-none mt-1">AI WhatsApp OS</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="relative z-10 space-y-8 max-w-md">
                    <h2 className="text-4xl font-extrabold leading-tight">
                        Power your business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Autonomous AI</span>
                    </h2>

                    <div className="space-y-4">
                        {[
                            { icon: Zap, label: "Real-time AI Responses", desc: "No more waiting. Your leads get instant, intelligent replies 24/7." },
                            { icon: MessageSquare, label: "Multi-Instance Campaigns", desc: "Scale your reach with unlimited WhatsApp instances and smart campaigns." },
                            { icon: ShieldCheck, label: "Enterprise Security", desc: "Your data is encrypted and secure with multi-tenant isolation." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="mt-1 flex-shrink-0">
                                    <item.icon className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-200">{item.label}</h3>
                                    <p className="text-sm text-gray-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="relative z-10">
                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 backdrop-blur-sm">
                        <p className="text-sm text-gray-400 italic">
                            "The most professional WhatsApp automation platform I've ever used. The AI responses are scarily human."
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-700" />
                            <span className="text-xs font-bold text-gray-300">Jacob Kazadi, Founder</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Component */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative">
                {/* Mobile Logo (Visible only on mobile) */}
                <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">My Aibud</h1>
                </div>

                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SignIn appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-transparent border-none shadow-none w-full",
                            headerTitle: "text-2xl font-bold text-white text-left",
                            headerSubtitle: "text-gray-400 text-left",
                            socialButtonsBlockButton: "bg-gray-900 border border-gray-800 text-white hover:bg-gray-800 transition-all h-12 rounded-xl",
                            socialButtonsBlockButtonText: "font-semibold",
                            dividerLine: "bg-gray-800",
                            dividerText: "text-gray-500 text-xs uppercase tracking-widest font-bold",
                            formFieldLabel: "text-gray-400 text-sm font-semibold mb-1",
                            formFieldInput: "bg-gray-900 border-gray-800 text-white rounded-xl h-12 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all",
                            formButtonPrimary: "bg-green-600 hover:bg-green-500 text-white font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all",
                            footerActionText: "text-gray-500",
                            footerActionLink: "text-green-500 hover:text-green-400 font-bold",
                            identityPreviewText: "text-white",
                            identityPreviewEditButtonIcon: "text-green-500",
                            formResendCodeLink: "text-green-500",
                            otpCodeFieldInput: "bg-gray-900 border-gray-800 text-white",
                        }
                    }} />
                </div>

                {/* Bottom Links */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our <a href="#" className="hover:text-gray-300 underline">Terms</a> and <a href="#" className="hover:text-gray-300 underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-950">
            <SignUp appearance={{
                elements: {
                    rootBox: "mx-auto",
                    card: "bg-gray-900 border border-gray-800",
                    headerTitle: "text-white",
                    headerSubtitle: "text-gray-400",
                    socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                    dividerLine: "bg-gray-700",
                    dividerText: "text-gray-400",
                    formFieldLabel: "text-gray-400",
                    formFieldInput: "bg-gray-800 border-gray-700 text-white",
                    footerActionText: "text-gray-400",
                    footerActionLink: "text-green-500 hover:text-green-400"
                }
            }} />
        </div>
    );
}

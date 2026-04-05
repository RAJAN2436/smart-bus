import { Link } from "react-router-dom"

function Landing() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">

            <div className="space-y-6 max-w-3xl animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 text-glow">
                    Smart Bus Tracking
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                    System
                </h2>

                <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Experience real-time transit tracking with cutting-edge accuracy.
                    Never miss your ride again with live location updates.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                    <Link to="/register" className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg">
                        Get Started
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>

                    <Link to="/login" className="btn-outline flex items-center justify-center px-8 py-4 text-lg">
                        Sign In to Dashboard
                    </Link>
                </div>
            </div>

        </div>
    )
}

export default Landing
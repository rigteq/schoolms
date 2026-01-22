export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-8">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    S
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">School<span className="text-primary">MS</span></span>
            </div>

            <nav className="ml-auto hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                <a href="#" className="hover:text-primary transition-colors">Features</a>
                <a href="#" className="hover:text-primary transition-colors">Pricing</a>
                <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </nav>
        </header>
    );
}

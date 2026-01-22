export default function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 flex items-center px-8 justify-between">
            <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} SchoolMS. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 font-medium">
                Powered by <span className="text-gray-900">Rigteq</span>
            </p>
        </footer>
    );
}

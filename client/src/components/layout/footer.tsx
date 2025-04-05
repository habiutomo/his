export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm text-gray-500 mb-2 sm:mb-0">
          &copy; {currentYear} MediTrack Hospital Information System. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">HIPAA Compliance</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Support</a>
        </div>
      </div>
    </footer>
  );
}

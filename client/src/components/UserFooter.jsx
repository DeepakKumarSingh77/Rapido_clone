import React from "react";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react"; // icons

const UserFooter = () => {
  return (
    <footer className="bg-[#274C77] text-gray-300 py-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">QuickGo</h2>
          <p className="text-sm">
            Go anywhere, anytime with QuickGo. Fast, safe, and reliable rides at your fingertips.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li className="hover:text-amber-500 cursor-pointer">Ride</li>
            <li className="hover:text-amber-500 cursor-pointer">Earn</li>
            <li className="hover:text-amber-500 cursor-pointer">About</li>
            <li className="hover:text-amber-500 cursor-pointer">Help</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Contact</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Mail size={18} /> support@quickgo.com
            </li>
            <li className="flex items-center gap-2">
              <Phone size={18} /> +1 (234) 567-890
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-amber-500">
              <Facebook size={22} />
            </a>
            <a href="#" className="hover:text-amber-500">
              <Twitter size={22} />
            </a>
            <a href="#" className="hover:text-amber-500">
              <Instagram size={22} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} QuickGo. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default UserFooter;

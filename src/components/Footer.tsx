import React from 'react';
import { Share2, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Share2 className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold">ShareHub</span>
            </div>
            <p className="text-gray-300">
              Connecting campus communities through sharing. Reduce waste, help peers, build connections.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/listings" className="text-gray-300 hover:text-green-400 transition-colors">Browse Items</a></li>
              <li><a href="/create-listing" className="text-gray-300 hover:text-green-400 transition-colors">Share Item</a></li>
              <li><a href="/dashboard" className="text-gray-300 hover:text-green-400 transition-colors">Dashboard</a></li>
              <li><a href="/claims" className="text-gray-300 hover:text-green-400 transition-colors">My Claims</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-300">Food & Beverages</span></li>
              <li><span className="text-gray-300">Books & Study Materials</span></li>
              <li><span className="text-gray-300">Electronics</span></li>
              <li><span className="text-gray-300">Furniture</span></li>
              <li><span className="text-gray-300">Clothing</span></li>
              <li><span className="text-gray-300">Other Items</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">support@sharehub.edu</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">University Campus</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 ShareHub - Campus Sharing Network. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Built for students, by students. Promoting sustainability and community.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
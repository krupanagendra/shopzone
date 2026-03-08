const Footer = () => (
  <footer className="bg-amazon text-white mt-auto">
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { title: 'Get to Know Us', links: ['About Us', 'Careers', 'Press Releases'] },
        { title: 'Connect with Us', links: ['Facebook', 'Twitter', 'Instagram'] },
        { title: 'Make Money with Us', links: ['Sell on ShopZone', 'Affiliate Program'] },
        { title: 'Let Us Help You', links: ['Your Account', 'Returns', 'Help'] },
      ].map((col) => (
        <div key={col.title}>
          <h3 className="font-semibold mb-3 text-amazon-yellow">{col.title}</h3>
          <ul className="space-y-1">
            {col.links.map((link) => <li key={link}><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{link}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-gray-700 text-center py-4 text-gray-400 text-sm">
      © 2024 ShopZone. All rights reserved.
    </div>
  </footer>
);
export default Footer;
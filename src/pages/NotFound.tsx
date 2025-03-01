
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-6xl font-bold mb-4">404</h1>
      <p className="text-xl md:text-2xl mb-8 text-center">
        The highlight you're looking for doesn't exist
      </p>
      <Link
        to="/"
        className="bg-white text-black px-6 py-3 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors"
      >
        <Home className="w-5 h-5 mr-2" />
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;

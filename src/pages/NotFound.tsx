
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <img 
        src="/public/lovable-uploads/ad8537e3-9985-44d3-92e6-658e19b5dd89.png" 
        alt="Match not found" 
        className="w-64 mb-6 opacity-70"
      />
      <h1 className="text-4xl md:text-6xl font-bold mb-4">404</h1>
      <p className="text-xl md:text-2xl mb-8 text-center">
        The highlight you're looking for doesn't exist
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={goBack}
          className="bg-highlight-800 text-white px-6 py-3 rounded-full font-semibold flex items-center hover:bg-highlight-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back
        </button>
        <Link
          to="/"
          className="bg-white text-black px-6 py-3 rounded-full font-semibold flex items-center hover:bg-white/90 transition-colors"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

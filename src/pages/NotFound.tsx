import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="text-center bg-card/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-elevated">
        <h1 className="text-4xl font-bold mb-4 text-card-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-accent underline transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

import { motion } from "framer-motion";

interface MonthCardProps {
  month: string;
  index: number;
}

export const MonthCard = ({ month, index }: MonthCardProps) => {
  const illustrations = [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // January - winter scene
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // February - nature
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // March - dog
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // April - mountains
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // May - ocean
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // June - summer
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // July - bright
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // August - warm
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // September - autumn
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // October - fall
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // November - cozy
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=entropy&auto=format&q=90", // December - winter
  ];

  return (
    <motion.div
      className="flex-shrink-0 w-40 h-40 md:w-48 md:h-48 rounded-xl bg-white shadow-lg overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background illustration */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${illustrations[index]})`,
        }}
      />
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      
      {/* Month name */}
      <div className="relative h-full flex items-start justify-center pt-4">
        <span className="text-white font-bold text-lg md:text-xl lowercase drop-shadow-lg">
          {month}
        </span>
      </div>
    </motion.div>
  );
};
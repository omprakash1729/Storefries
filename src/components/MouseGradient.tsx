import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const MouseGradient = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY + window.scrollY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    >
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-20 dark:opacity-30 bg-gradient-to-r from-brand-blue to-brand-green"
        animate={{
          x: mousePosition.x - 300,
          y: mousePosition.y - 300,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
      />
    </motion.div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const ScrollAnimation = ({ frames }) => {
  const ref = useRef(null);
  const safeFrames = Array.isArray(frames) && frames.length ? frames : [];
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const imageIndex = useTransform(scrollYProgress, [0, 1], [0, Math.max(safeFrames.length - 1, 0)]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Preload frames so scroll scrubbing doesn't flicker.
    safeFrames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const unsubscribe = imageIndex.onChange((latest) => {
      const maxIndex = Math.max(safeFrames.length - 1, 0);
      const nextIndex = Math.min(Math.max(Math.round(latest), 0), maxIndex);
      setCurrentIndex(nextIndex);
    });
    return () => unsubscribe();
  }, [imageIndex, safeFrames.length]);

  if (!safeFrames.length) {
    return null;
  }

  return (
    <section ref={ref} className="relative h-[260vh] -mx-8 -mt-8">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          className="relative h-full w-full"
        >
          <img
            src={safeFrames[currentIndex]}
            alt="BHU 3D campus animation"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default ScrollAnimation;

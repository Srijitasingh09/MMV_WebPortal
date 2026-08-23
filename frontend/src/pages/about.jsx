import React, { useState, useEffect, useRef } from 'react';    

const slides = [
  {
    image: '/officegate.png',
    fit: 'cover',
    position: 'center center',
    alt: 'mmv campus',
    title: 'Knowledge. Grace. Purpose.',
    subtitle: 'A Tradition of Excellence'
  },
  {
    image: '/innerbuild.png',
    fit: 'cover',
    position: 'center center',
    alt: 'inner building',
    title: 'Shaping Women. Shaping India.',
    subtitle: 'Est. under Banaras Hindu University'
  },
  {
    image: '/inner2.png',
    fit: 'cover',
    position: 'center center',
    alt: 'inner building view from library',
    title: 'A Legacy of Learning',
    subtitle: 'Inspiring Future Leaders'
  },
  {
    image: '/officegateLeft.png',
    fit: 'cover',
    position: 'center 90%',
    alt: 'inner building view from library',
    title: 'More Than a Campus',
    subtitle: 'IA Journey of Knowledge, Courage, and Dreams'
  },
];

const Slideshow = () => {
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const currentRef = useRef(0);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const goTo = (nextIndex) => {
    if (prefersReducedMotion.current) {
      currentRef.current = nextIndex;
      setDisplayedIndex(nextIndex);
      return;
    }
    setTextVisible(false);
    setTimeout(() => {
      currentRef.current = nextIndex;
      setDisplayedIndex(nextIndex); // triggers re-render with new text + image
      setTextVisible(true);
    }, 500);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (currentRef.current + 1) % slides.length;
      goTo(next);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="MMV campus photo slideshow"
      className="relative w-full overflow-hidden"
      style={{
        // fluid height that stays sane from small phones up to large desktops
        height: 'clamp(300px, 55vw, 600px)',
      }}
    >
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
        }}
      />

      <div
        className="absolute z-[2] px-4 sm:px-0"
        style={{
          top: '50%',
          left: '5%',
          right: '5%',
          transform: 'translateY(-50%)',
          color: '#fff',
          maxWidth: 'min(520px, 90vw)',
          opacity: textVisible ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        <h1
          style={{
            fontFamily: "'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(1.8rem, 6vw, 3.6rem)',
            fontWeight: 300,
            letterSpacing: '0.03em',
            marginBottom: '8px',
            lineHeight: 1.2,
          }}
        >
          {slides[displayedIndex].title}
        </h1>

        <div
          className="w-9 h-px mb-2 sm:mb-3"
          style={{ background: 'rgba(200,160,74,0.85)' }}
        />

        <p
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: 'clamp(0.7rem, 2vw, 1rem)',
            fontWeight: 300,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontStyle: 'italic',
            opacity: 0.85,
            margin: 0,
          }}
        >
          {slides[displayedIndex].subtitle}
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Slide {displayedIndex + 1} of {slides.length}: {slides[displayedIndex].alt}
      </div>

      {slides.map((slide, index) => (
        <img
          key={index}
          src={slide.image}
          alt={slide.alt}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            objectFit: slide.fit,
            objectPosition: slide.position,
            opacity: index === displayedIndex ? 1 : 0,
            transition: 'opacity 2s ease-in-out',
          }}
        />
      ))}

      <div
        role="tablist"
        aria-label="Slideshow navigation"
        className="absolute z-[3] flex gap-2"
        style={{ bottom: 14, left: '50%', transform: 'translateX(-50%)' }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === displayedIndex}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className="rounded-full p-0 cursor-pointer"
            style={{
              width: 7,
              height: 7,
              background: i === displayedIndex ? '#fff' : 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.6)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </section>
  );
};

const IntroSection = () => {
  return (
    <section aria-labelledby="about-heading" className="bg-white pt-8 sm:pt-12 lg:pt-16 pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-10 lg:gap-14 items-center">

        {/* LEFT — Photo */}
        <div className="w-full md:w-1/2 lg:w-5/12">
          <img
            src="/mmvimage2.jpeg"
            alt="MMV gate"
            className="w-full max-w-[420px] sm:max-w-[480px] md:max-w-none mx-auto md:mx-0 aspect-square object-cover"
            style={{ objectPosition: 'top center' }}
          />
        </div>

        {/* RIGHT — Text */}
        <div className="w-full md:w-1/2 lg:w-7/12">
          <h2
            id="about-heading"
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#174873] mb-3 sm:mb-4"
          >
            About MMV
          </h2>
          <p className="text-black text-md sm:text-md leading-relaxed text-justify">
            Mahila Mahavidyalaya (MMV), the Women’s College of Banaras Hindu University (BHU), is a premier, multi-faculty constituent
            college located within the main residential campus of BHU in Varanasi, Uttar Pradesh. Established as a dedicated space for women's higher
            education, MMV brings together ancient Indian values and modern scientific academic rigor. Spanning a lush 45-acre sub-campus inside the
            university, MMV stands out as an inclusive community providing undergraduate, postgraduate, and research-level education exclusively to
            female students.
          </p>
          <p className="text-black text-md sm:text-md leading-relaxed text-justify mt-3">
            The institution caters to thousands of young women, striking a balance between vibrant academic curriculums and holistic personal growth.
            MMV offers comprehensive programs across multiple disciplines including the Sciences, Humanities, Social Sciences,
            Education, and Performing & Visual Arts (such as specialized courses in Indian classical dance formats like Kathak and classical music).
            The campus features extensive, secure residential infrastructure across several well-maintained hostels, laboratories for advanced research
            in the sciences, and a well-stocked specialized library carrying over 54,000 text volumes and hundreds of
            educational journals.
          </p>
          <p className="text-black text-md sm:text-md leading-relaxed text-justify mt-3">
            Mahila Mahavidyalaya, its steady
            growth and the development stands testimony to the
            spontaneous social revolution that has been brought
            about the vision of Mahamana. In the times that
            reverberated with women's silence it offered a
            precious niché where all the social constructs could
            be unmade and re-made. The college is well equipped
            to make its contribution to knowledge and to address
            the present day connotations of service to the nation.
            With its glorious tradition of commitment to
            education and nation building. Mahila
            Mahavidyalaya successfully continues to take on the
            challenges posed by the fast changing national and
            global scenario.
          </p>
        </div>

      </div>
    </section>
  );
};

const MalviyaQuote = () => (
  <div className="px-2.5 sm:px-4 bg-white">
    <section
      aria-labelledby="malviya-quote-heading"
      className="text-center rounded"
      style={{
        background: '#f5f0e8',
        padding: 'clamp(18px, 5vw, 28px) clamp(14px, 5vw, 40px)',
        borderTop: '3px solid #c8a04a',
        borderBottom: '3px solid #c8a04a',
      }}
    >
      <h2 id="malviya-quote-heading" className="sr-only">Message from the Founder</h2>

      <p
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(13px, 2.6vw, 16px)',
          lineHeight: '1.8',
          color: '#2c2a1e',
          maxWidth: '780px',
          margin: '0 auto 18px',
        }}
      >
        "The education of our women is a matter of even greater importance than the education of our men. They are the mothers of the future generations of India. They will be the first and the most influential educator of the future statesmen, scholars philosophers, captain of Commerce and Industry and other leaders of men. Their education will profoundly affect the education of the future citizen of India."
      </p>

      <div aria-hidden="true" className="mx-auto mb-4" style={{ width: 50, height: 1.5, background: '#c8a04a' }} />

      <p
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(10px, 2.2vw, 12px)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#5a5240',
        }}
      >
        Mahamana Pandit Madan Mohan Malviya
        <span
          className="block mt-1"
          style={{ fontSize: '11px', letterSpacing: '0.07em', color: '#8a7c60' }}
        >
          Founder, Banaras Hindu University &nbsp;·&nbsp; Convocation Address, 14th December 1929
        </span>
      </p>
    </section>
  </div>
);

const History = () => {
  return (
    <section aria-labelledby="history-heading" className="bg-white pt-4 sm:pt-6 lg:pt-8 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse gap-6 sm:gap-8 md:gap-10 lg:gap-14 items-center">

        <div className="w-full md:w-1/2 lg:w-5/12">
          <img
            src="/malviyaold2.jpeg"
            alt="Malviya ji"
            className="w-full max-w-[420px] sm:max-w-[480px] md:max-w-none mx-auto md:ml-auto md:mr-0 aspect-square object-cover"
            style={{ objectPosition: 'center 15%' }}
          />
        </div>

        <div className="w-full md:w-1/2 lg:w-7/12">
          <h2
            id="history-heading"
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#174873] mb-3 sm:mb-4"
          >
            Founding History
          </h2>
          <p className="text-black text-md sm:text-md leading-relaxed text-justify">
            Vision on Women Education
            Right from its inception in 1916, the BHU has been
            striving towards women's education. Its visionary
            founder Mahamana Pandit Madan Mohan Malviya
            foresaw immense significance of women's education
            and the critical role women would have to play in the
            development of the country.
            Mahamana decided to remedy this by opening a college
            exclusively for women wherein an amalgamation of
            the vedic ideal and modern scholarship would work
            towards shaping the Indian women to take on their
            role as capable citizens.
          </p>
          <p className="text-black text-md sm:text-md leading-relaxed text-justify mt-3">
            In his convocation address
            delivered on 14th December, 1929 Mahamana
            announced the establishment of the Women's College
            of the BHU and he clearly said that the cause of women's education is
            even more important than that of men. The cause of women education was
            particularly dear to Mahamana's heart. He felt that their education would have a far reaching impact on
            the future generations of India. Malaviyaji's ideal of
            womanhood was a perfect synthesis of tradition and
            modernity. <i>She would be an equal partner in nation
            building.</i> It has produced students who went on to
            distinguish themselves in various fields.
          </p>
        </div>

      </div>
    </section>
  );
};

const About = () => {
  return (
    <main className="min-h-screen bg-slate-50">
      <Slideshow />
      <MalviyaQuote />
      <IntroSection />
      <History />
    </main>
  );
};

export default About;
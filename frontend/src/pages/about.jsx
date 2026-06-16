import React, { useState, useEffect ,useRef} from 'react';

const slides = [
   {
    image: '/officegate.jpeg',
    fit:'cover',
    position: '50% 40%',
    alt: 'mmv campus',
    title:'Knowledge. Grace. Purpose.',
    subtitle:'A Tradition of Excellence'
  },
  {
    image: '/innerbuild.jpeg',
    fit:'cover',
    position:'center center',
    alt:'inner building',
    title:'Shaping Women. Shaping India.',
    subtitle:'Est. under Banaras Hindu University'
  },
  {
    image: '/inner2.jpeg',
    fit:'cover',
    position: 'center center',
    alt:'inner building view from library',
     title:'A Legacy of Learning',
    subtitle:'Inspiring Future Leaders'
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
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(400px, 65vw, 600px)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        zIndex: 1,
      }} />

      <div
        style={{
          position: 'absolute',
          top: '50%', left: '7%',
          transform: 'translateY(-50%)',
          color: '#fff',
          zIndex: 2,
          maxWidth: '520px',
          opacity: textVisible ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(2.6rem, 4.5vw, 3.6rem)',
          fontWeight: 300,
          letterSpacing: '0.04em',
          marginBottom: '10px',
          lineHeight: 1.2,
        }}>
          {slides[displayedIndex].title}
        </h1>

        <div style={{ width: 36, height: 1, background: 'rgba(200,160,74,0.85)', marginBottom: 10 }} />

        <p style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
          fontWeight: 300,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          opacity: 0.82,
          margin: 0,
        }}>
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
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
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
        style={{
          position: 'absolute',
          bottom: 16, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 8, zIndex: 3,
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === displayedIndex}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: i === displayedIndex ? '#fff' : 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.6)',
              cursor: 'pointer', padding: 0,
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
     <section aria-labelledby="about-heading" className="bg-white py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center">

        {/* LEFT — Photo */}
        <div className="md:w-1/2">
          <img
            src="/mmvimage2.jpeg"
            alt="MMV gate"
            className="w-full object-cover md:w-[520px] md:h-[520px]"
            style={{ height: 'clamp(380px, 55vw, 580px)',
                     objectPosition:'top center'
             }}
          />
        </div>

        {/* RIGHT — Text */}
        <div className="md:w-1/2">
          <h2 id="about-heading" className="text-3xl font-semibold text-[#174873] mb-4">
            About MMV
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed text-justify">
           Mahila Mahavidyalaya (MMV), the Women’s College of Banaras Hindu University (BHU), is a premier, multi-faculty constituent
            college located within the main residential campus of BHU in Varanasi, Uttar Pradesh. Established as a dedicated space for women's higher 
            education, MMV brings together ancient Indian values and modern scientific academic rigor.  Spanning a lush 45-acre sub-campus inside the
             university, MMV stands out as an inclusive community providing undergraduate, postgraduate, and research-level education exclusively to 
             female students.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed text-justify mt-3">
           The institution caters to thousands of young women, striking a balance between vibrant academic curriculums and holistic personal growth.
           MMV offers comprehensive programs across multiple disciplines including the Sciences, Humanities, Social Sciences,
          Education, and Performing & Visual Arts (such as specialized courses in Indian classical dance formats like Kathak and classical music). 
           The campus features extensive, secure residential infrastructure across several well-maintained hostels, laboratories for advanced research    
           in the sciences, and a well-stocked specialized library carrying over 54,000 text volumes and hundreds of 
            educational journals. 
  
          </p>
          <p className="text-gray-600 text-sm leading-relaxed text-justify mt-3">

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
  <div style={{ padding: '10px 10px', background: '#fff' }}>  {/* ← white wrapper gives clean space */}
    <section
      aria-labelledby="malviya-quote-heading"
      style={{
        background: '#f5f0e8',
        padding: '28px 40px',
        textAlign: 'center',
        borderTop: '3px solid #c8a04a',
        borderBottom: '3px solid #c8a04a',
        borderRadius: '4px',
        // ← marginBottom removed, wrapper handles spacing
      }}
    >
      <h2 id="malviya-quote-heading" className="sr-only">Message from the Founder</h2>

      <p style={{
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: '16px',
        lineHeight: '1.85',
        color: '#2c2a1e',
        maxWidth: '780px',
        margin: '0px auto 20px',
      }}>
       "The education of our women is a matter of even greater importance than the education of our men. They are the mothers of the future generations of India. They will be the first and the most influential educator of the future statesmen, scholars philosophers, captain of Commerce and Industry and other leaders of men. Their education will profoundly affect the education of the future citizen of India."
      </p>

      <div aria-hidden="true" style={{ width: 50, height: 1.5, background: '#c8a04a', margin: '0 auto 16px' }} />

      <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#5a5240' }}>
        Mahamana Pandit Madan Mohan Malviya
        <span style={{ display: 'block', fontSize: '11px', letterSpacing: '0.08em',
                       color: '#8a7c60', marginTop: '3px' }}>
          Founder, Banaras Hindu University &nbsp;·&nbsp; Convocation Address, 14th December 1929
        </span>
      </p>
    </section>
  </div>
);
const History = () => {
  return (
    <section aria-labelledby="history-heading" className="bg-white py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-start">

        <div className="md:w-1/2">
          <h2 id="history-heading" className="text-3xl font-semibold text-[#174873] mb-4">
            Founding History
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed text-justify">
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
          <p className="text-gray-600 text-sm leading-relaxed text-justify mt-3">
           In his convocation address
          delivered on 14th December, 1929 Mahamana
          announced the establishment of the Women's College
          of the BHU and he clearly said that the cause of women's education is
          even more important than that of men. The cause of women education was
          particularly dear to Mahamana's heart. He felt that their education would have a far reaching impact on
          the future generations of India. Malaviyaji's ideal of
          womanhood was a perfect synthesis of tradition and
          modernity.<i> She would be an equal partner in nation
          building.</i> It has produced students who went on to
          distinguish themselves in various fields.
          </p>
           
        </div>
        <div className="md:w-1/2 flex justify-end">
         
         <img
           src="/malviyaold2.jpeg"
           alt="Malviya ji"
           className="w-full md:w-[480px] md:h-[480px] object-cover"
           style={{
             height: 'clamp(280px, 40vw, 480px)',
              objectPosition: 'center 15%',
      
    }}
           
         />

        </div>

      </div>
    </section>
  );
};
const About = () => {
  return (
    <main>
      <Slideshow />
       <MalviyaQuote/>
      <IntroSection />
      
      <History />
      
    </main>
  );
};
export default About;
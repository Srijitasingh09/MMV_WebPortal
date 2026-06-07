import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AcademicsHub = () => {
  const navigate = useNavigate();
  const sections = [
    {
      title: 'National Education Policy (NEP)',
      path: '/academics/nep',
    },
    {
      title: 'Syllabus',
      path: '/academics/syllabus',
    },
    {
      title: 'Electives',
      path: '/academics/electives',
    },
    {
      title: 'Section In-Charge',
      path: '/academics/section-incharge',
    },
    {
      title: 'Swayam Courses',
      path: '/academics/swayam',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Academics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, idx) => (
          <Link
            key={idx}
            to={section.path}
            className="group flex flex-col bg-blue-50 rounded-2xl p-6 border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all h-[120px] justify-center"
          >
            <h2 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">
              {section.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AcademicsHub;

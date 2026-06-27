import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'nep': { 
    title: 'National Education Policy (NEP)', 
    pageType: 'description' 
  },

  'syllabus/ug/science': { 
    title: 'Syllabus — UG Science',           
    pageType: 'table',
    tableColumns: ['Course', 'Syllabus PDF'] 
  },

  'syllabus/ug/socialscience': { 
    title: 'Syllabus — UG Social Science',    
    pageType: 'table',
    tableColumns: ['Course', 'Syllabus PDF']
  },

  'syllabus/ug/arts': { 
    title: 'Syllabus — UG Arts', 
    pageType: 'table',
    tableColumns: ['Course', 'Syllabus PDF'] 
  },

  'syllabus/pg/bioinformatics': { 
    title: 'Syllabus — Bioinformatics',                   
    pageType: 'pdf-list' 
  },

  'syllabus/pg/homescience': { 
    title: 'Syllabus — Home Science',                   
    pageType: 'pdf-list' 
  },

  'syllabus/pg/education': { 
    title: 'Syllabus — Education',                   
    pageType: 'pdf-list' 
  },

  'electives': { 
    title: 'Electives',                       
    pageType: 'table-description' 
  },

  'swayam': { 
    title: 'SWAYAM Courses',                  
    pageType: 'description' 
  },

  'section-incharge/science': { 
    title: 'Science Section Incharge/Coordinator',               
    pageType: 'table',
    tableColumns: ['Department', 'Section Incharge', 'Contact', 'Email'] 
  },

  'section-incharge/socialscience': { 
    title: 'Social Science Section Incharge/Coordinator',               
    pageType: 'table',
    tableColumns: ['Department', 'Section Incharge', 'Contact', 'Email'] 
  },

  'section-incharge/arts': { 
    title: 'Arts Section Incharge/Coordinator',               
    pageType: 'table',
    tableColumns: ['Department', 'Section Incharge', 'Contact', 'Email'] 
  },

  'calendar': { 
    title: 'Academic Calendar',               
    pageType: 'pdf-list' 
  },

  'holidays': { 
    title: 'Holiday List',                    
    pageType: 'pdf-list' 
  },
};


const AcademicsRouted = () => {
  const { sub, subsub, subsubsub } = useParams();
  const key = [sub, subsub, subsubsub].filter(Boolean).join('/');
  const page = pages[key];

  if (!page) return <Navigate to="/" replace />;

  return (
    <GenericContentPage
      section="academics"
      subsection={key}
      title={page.title}
      backPath="/"
      backLabel="Home"
      pageType={page.pageType}
      tableColumns={page.tableColumns || []}
      photoAlign={page.photoAlign || 'left'}
      photoCols={1}          
      photoHeight={400} 
    />
  );
};

export default AcademicsRouted;
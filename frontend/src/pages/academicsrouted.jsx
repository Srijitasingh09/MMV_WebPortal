import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'nep':                       { title: 'National Education Policy (NEP)', pageType: 'description' },
  'syllabus/ug/science':       { title: 'Syllabus — UG Science',           pageType: 'table',
    tableColumns:['sunbject','syllabus PDF']
   },
  'syllabus/ug/socialscience': { title: 'Syllabus — UG Social Science',    pageType: 'pdf-list' },
  'syllabus/ug/arts':          { title: 'Syllabus — UG Arts',              pageType: 'pdf-list' },
  'syllabus/pg':               { title: 'Syllabus — PG',                   pageType: 'pdf-list' },
  'electives':                 { title: 'Electives',                       pageType: 'pdf-list' },
  'swayam':                    { title: 'SWAYAM Courses',                  pageType: 'description' },
  'section-incharge':          { title: 'Section In-Charge',               pageType: 'description-table',
    tableColumns: ['Name', 'Section', 'Department', 'Contact'] },
  'calendar':                  { title: 'Academic Calendar',               pageType: 'pdf-list' },
  'holidays':                  { title: 'Holiday List',                    pageType: 'pdf-list' },
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
      backPath="/academics"
      backLabel="Academics"
      pageType={page.pageType}
      tableColumns={page.tableColumns || []}
      photoAlign={page.photoAlign || 'left'}
      photoCols={1}          
      photoHeight={400} 
    />
  );
};

export default AcademicsRouted;
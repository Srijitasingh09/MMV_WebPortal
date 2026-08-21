import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'overview': {
    title: 'Academics',
    pageType: 'description'
  },
  // ── NEP ───────────────────────────────────────────────────────────────────
  'nep': {
    title: 'National Education Policy (NEP)',
    pageType: 'description'
  },

  // ── Syllabus ────────────────────────────────────────────────────────────────
   'syllabus/ug/science': {
    title: 'Syllabus — UG Science',
    pageType: 'pdf-list-table',
    tableColumns: ['Subject', 'Syllabus']
  },
  'syllabus/ug/socialscience': {
    title: 'Syllabus — UG Social Science',
    pageType: 'pdf-list-table'
  },
  'syllabus/ug/arts': {
    title: 'Syllabus — UG Arts',
    pageType: 'pdf-list-table'
  },

  // ── Syllabus — PG (three separate pages, not one combined key) ────────────
  // Navbar links to /academics/syllabus/pg/bioinformatics etc. individually.
  // A single 'syllabus/pg' key would never match those URLs.
  
  'syllabus/pg/bioinformatics': {
    title: 'Syllabus — PG Bioinformatics',
    pageType: 'pdf-list'
  },
  'syllabus/pg/homescience': {
    title: 'Syllabus — PG Home Science',
    pageType: 'pdf-list'
  },
  'syllabus/pg/education': {
    title: 'Syllabus — PG Education',
    pageType: 'pdf-list'
  },

  // ── Electives ─────────────────────────────────────────────────────────────
  // DB has description + table data — pageType must include both.
  // 'pdf-list' was wrong and hid the actual content.
  'electives': {
    title: 'Electives',
    pageType: 'table-description'
  },

  // ── SWAYAM ────────────────────────────────────────────────────────────────
  'swayam': {
    title: 'SWAYAM Courses',
    pageType: 'description'
  },

  // ── Section In-Charge ───────────────────────────────────────────────────
 
  'section-incharge/science': {
    title: 'Incharge — Science',
    pageType: 'table',
    tableColumns: ['Name', 'Designation', 'Department', 'Contact']
  },
  'section-incharge/socialscience': {
    title: 'Incharge — Social Science',
    pageType: 'table',
    tableColumns: ['Name', 'Designation', 'Department', 'Contact']
  },
  'section-incharge/arts': {
    title: 'Incharge — Arts',
    pageType: 'table',
    tableColumns: ['Name', 'Designation', 'Department', 'Contact']
  },
 
  

  // ── Calendar & Holidays ───────────────────────────────────────────────────
  'calendar': {
    title: 'Academic Calendar',
    pageType: 'description-pdf-list'
  },
  'holidays': {
    title: 'Holiday List',
    pageType: 'description-pdf-list'
  },
};


const AcademicsRouted = () => {
  const { sub, subsub, subsubsub } = useParams();
  const rawKey = [sub, subsub, subsubsub].filter(Boolean).join('/');
  const key = rawKey || 'overview';
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
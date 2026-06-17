import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'vc':                         { title: 'Vice Chancellor',                       pageType: 'slideshow-description' , slideshowHeight : 300,     
  slideshowMaxWidth : '100%', },
  'principal':                  { title: 'MMV Principal',                         pageType: 'photo-description' },
  'dean':                       { title: 'Dean of Students',                      pageType: 'photo-description' },
  'advisor':                    { title: 'Student Advisor',                       pageType: 'photo-description' },
  'staff':                      { title: 'MMV Office Staff',                      pageType: 'description-table',
    tableColumns: ['Name', 'Designation', 'Department', 'Contact PDF'] },
  'proctorial/chief':           { title: 'Chief Proctor',                         pageType: 'photo-description' },
  'proctorial/uniboard':        { title: 'University Proctorial Board',           pageType: 'table',
    tableColumns: ['Name', 'Designation', 'Contact'] },
  'examination/universityexam': { title: 'Controller of Examination — University', pageType: 'photo-description' },
  'examination/mmvexam':        { title: 'Controller of Examination — MMV',       pageType: 'photo-description' },
};

const AdministrationRouted = () => {
  const { sub, subsub } = useParams();
  const key = subsub ? `${sub}/${subsub}` : sub;
  const page = pages[key];

  if (!page) return <Navigate to="/" replace />;

  return (
    <GenericContentPage
      section="administration"
      subsection={key}
      title={page.title}
      backPath="/"
      backLabel="Home"
      pageType={page.pageType}
      tableColumns={page.tableColumns || []}
      photoAlign={page.photoAlign || 'center'}
      photoCols={1}         
      photoHeight={500}   
    />
  );
};

export default AdministrationRouted;
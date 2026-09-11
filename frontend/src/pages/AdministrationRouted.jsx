import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'overview': { 
    title: 'Administration', 
    pageType: 'description' 
  },

  'advisor': { 
    title: 'Student Advisor',                               
    pageType: 'profile-description' 
  },
  
  'examination/mmvexam': { 
    title: 'Controller of Examination - MMV',       
    pageType: 'table',
  },

  'staff': { 
    title: 'MMV Office Staff',                              
    pageType: 'table'
  },

  'committee': { 
    title: 'MMV Committee', 
    pageType: 'description' 
  },
};

const AdministrationRouted = () => {
  const { sub, subsub } = useParams();
  const rawKey = [sub, subsub].filter(Boolean).join('/');
  const key = rawKey || 'overview';
  const page = pages[key];

  if (!page) return <Navigate to="/home" replace />;

  return (
    <GenericContentPage
      section="administration"
      subsection={key}
      title={page.title}
      backPath="/home"
      backLabel="Home"
      pageType={page.pageType}
      tableColumns={page.tableColumns || []}
    />
  );
};

export default AdministrationRouted;
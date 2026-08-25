import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'overview': { 
    title: 'Administration', 
    pageType: 'description' 
  },
  // 'vc': { 
  //   title: 'Vice Chancellor', 
  //   pageType: 'profile-description' 
  // },  

  // 'principal': { 
  //   title: 'MMV Principal',                                 
  //   pageType: 'profile-description'
  // },

  // 'dean': { 
  //   title: 'Dean of Students',                              
  //   pageType: 'profile-description' 
  // },

  'advisor': { 
    title: 'Student Advisor',                               
    pageType: 'profile-description' 
  },

  'staff': { 
    title: 'MMV Office Staff',                              
    pageType: 'table',
    tableColumns: ['Name', 'Designation', 'Contact', 'Email Id', 'Nature Of Work'] 
  },

  

  // 'proctorial/chief': { 
  //   title: 'Chief Proctor', 
  //   pageType: 'profile-description'
  // },

  // 'proctorial/uniboard': { 
  //   title: 'University Proctorial Board',           
  //   pageType: 'table-description',
  //   tableColumns: ['Name', 'Department', 'Position in Board', 'Contact'] 
  // },



  // 'examination/universityexam': {  
  //   title: 'Controller of Examination -University', 
  //   pageType: 'description' 
    
  // },
  
  'examination/mmvexam': { 
    title: 'Controller of Examination -MMV',       
    pageType: 'table',
    tableColumns: ['Name', 'Department', 'Contact', 'Email Id']
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
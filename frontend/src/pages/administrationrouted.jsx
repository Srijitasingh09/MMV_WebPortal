import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'vc': { title: 'Vice Chancellor', 
          pageType: 'photo-description', 
          profileName: 'Prof. Ajit Kumar Chaturvedi',
          profileDesignation: 'Vice Chancellor',
          profilePhone: '+91(542)2368938 (Off); 2368339 (Res)',
          profileEmail: 'vc@bhu.ac.in',
          profileUniversity: 'Banaras Hindu University',
          profileAddress: 'Varanasi - 221005, U.P., India'
        },  

  'principal':{ title: 'MMV Principal',                         
                pageType: 'photo-description',
                profileName: 'Prof. Rita Singh',
                profileDesignation: 'Principal',
                profilePhone: '+91 8004930511',
                profileEmail: 'principalmmv@bhu.ac.in',
                profileUniversity: 'Mahila Mahavidyalaya, BHU',
                profileAddress: 'Varanasi - 221005, U.P., India' },

  'dean': { title: 'Dean of Students',                      
            pageType: 'photo',
            profileName: 'Prof. Ranjan Kumar Singh',
            profileDesignation: 'Dean of Students & Professor, Department of Physics, Institute Of Sciences',
            profilePhone: '+91 9453040923',
            profileEmail: 'dean_students@bhu.ac.in',
            profileUniversity: 'Banaras Hindu University',
            profileAddress: 'Varanasi - 221005, U.P., India' },

  'advisor':{ title: 'Student Advisor',                       
              pageType: 'photo',
              profileName: 'Dr. Rukmini Jaiswal',
              profileDesignation: 'Student Advisor & Assistant Professor, Deptt. of Kathak Section, MMV',
              profilePhone: '+91 8511504765',
              profileEmail: 'rukminimmv@bhu.ac.in',
              profileUniversity: 'Banaras Hindu University',
              profileAddress: 'Varanasi - 221005, U.P., India' 
            },

  'staff':{ title: 'MMV Office Staff',                      
            pageType: 'table',
            tableColumns: ['Name', 'Designation', 'Contact', 'Email Id', 'Nature Of Work'] 
          },

  'proctorial/chief': { title: 'Chief Proctor', 
                        pageType: 'photo-description',
                        profileName: 'Dr. Sandeep Pokharia',
                        profileDesignation: 'Deptt. of Chemistry Section, MMV',
                        profilePhone: '+91 9151027051, Control Room: 0542-2369242, 2369134, 8887255334 (whatsapp)',
                        profileOfficeContact : '0542-2369242, 2369134, 8887255334 (whatsapp)',
                        profileEmail: 'chiefproctor@bhu.ac.in, responsedesk@bhu.ac.in',
                        profileUniversity: 'Banaras Hindu University',
                        profileAddress: 'Varanasi - 221005, U.P., India' 
                      },

  'proctorial/uniboard':{ title: 'University Proctorial Board',           
                          pageType: 'table',
                          tableColumns: ['Name', 'Department', 'Position in Board', 'Contact'] 
                        },

  'examination/universityexam': {  title: 'Controller of Examination — University', 
                                  pageType: 'table', 
                                  table: ['Name', 'Department', 'Contact', 'Email Id']
                                },
  'examination/mmvexam':{ title: 'Controller of Examination — MMV',       
                          pageType: 'table',
                          table: ['Name', 'Department', 'Contact', 'Email Id']
                        },
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
      photoCols={page.photoCols || 1}         
      photoHeight={page.photoHeight || 450}  
      profileName={page.profileName}
      profileDesignation={page.profileDesignation}
      profileEmail={page.profileEmail}
      profilePhone={page.profilePhone}
      profileUniversity={page.profileUniversity}
      profileAddress={page.profileAddress} 
    />
  );
};

export default AdministrationRouted;
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'hostels/chiefwarden': { 
    title: 'Chief Warden',                    
    pageType: 'profile' 
  },

  'hostels/coordinator': { 
    title: 'Hostel Coordinator',              
    pageType: 'profile'
  },

  'hostels/swastikunj': { 
    title: 'Swasti Kunj Hostel',              
    pageType: 'photo-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/kirtikunj': { 
    title: 'Kirti Kunj Hostel',               
    pageType: 'photo-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/kundandevi': { 
    title: 'Kundan Devi Malviya Girls Hostel',              
    pageType: 'photo-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/pragyakunj': { 
    title: 'Pragya Kunj Hostel',              
    pageType: 'photo-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/jyotikunj': { 
    title: 'Jyoti Kunj Hostel',               
    pageType: 'photo-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'library/central': { 
    title: 'Central Library',                 
    pageType: 'slideshow-pdf-list-description',
    photoAlign: 'center'
  },

  'library/cyber': { 
    title: 'Cyber Library',                   
    pageType: 'slideshow-pdf-list-description' ,
    photoAlign: 'center'
  },

  'library/mmvlibrary': { 
    title: 'MMV Library',                     
    pageType: 'slideshow-pdf-list-description',
    photoAlign: 'center'
  },

  'sports/universitysports': { 
    title: 'University Sports Board',               
    pageType: 'slideshow-description',
    photoAlign: 'center',
  },

  'sports/mmvsports': { 
    title: 'MMV Sports Board',                      
    pageType: 'slideshow-description',
    photoAlign: 'center',
  },

  'sports/gym': { 
    title: 'Open-Gym',                       
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'wellbeing/wbsc': { 
    title: 'Well Being Service Cell, BHU',           
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'wellbeing/mmvwell': { 
    title: 'MMV PAHAL',                  
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'trainingplacement/universitytraining': { 
    title: 'University Training & Placement Cell', 
    pageType: 'description-pdf-list',
  },

  'trainingplacement/mmvtraining': { 
    title: 'Training & Placement Cell, MMV',        
    pageType: 'description',
  },

  'cdc': { 
    title: 'Central Discovery Centre, BHU',                             
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'medical/ssh': { 
    title: 'Sir Sundarlal Hospital',          
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'medical/tc': { 
    title: 'Trauma Centre',                   
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'medical/health': { 
    title: 'Student Health Center',                   
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'extracurricular/ncc': { 
    title: 'National Cadet Corps (NCC)',                             
    pageType: 'description'
  },

  'extracurricular/nss': { 
    title: 'National Service Scheme (NSS)',                             
    pageType: 'description',
  },

  'extracurricular/nlsc': { title: 'Nurturing Life Skills Cell (NLSC)',                           
    pageType: 'description'
  },

  'extracurricular/diplomacourses': { 
    title: 'Diploma & Certificate Courses',                 
    pageType: 'pdf-list-description'
  },

  'samarth': { 
    title: 'Samarth Portal',                  
    pageType: 'description',
    photoAlign: 'center' 
  },

  'namaste': { 
    title: 'Namaste BHU App',                     
    pageType: 'photo-description',
    photoAlign: 'center',
    photoWidth : '100%',
    photoHeight : 'full'
  },

  'canteen/universitycanteen': { 
    title: 'University Canteen',              
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'canteen/mmvcanteen': { 
    title: 'MMV Canteen',                     
    pageType: 'slideshow-description',
    photoAlign: 'center' 
  },

  'citydelegacy': { 
    title: 'City Delegacy',                   
    pageType: 'photo-description',
    photoAlign: 'center' 
  },

  'other/vt': { 
    title: 'Vishwanath Temple',               
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/bkb': { 
    title: 'Bharat Kala Bhawan',              
    pageType: 'slideshow-description',
    pageAlign: 'center'
  },

  'other/transportation': { 
    title: 'Transportation',                  
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/banks': { 
    title: 'Banks & Post Offices',                           
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/guesthouses': { 
    title: 'Guest Houses',                    
    pageType: 'photo-description-pdf-list',
    photoAlign: 'center'
  },

  'other/auditorium': { 
    title: 'Auditorium',                      
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
};

const FacilitiesRouted = () => {
  const { sub, subsub } = useParams();
  const key = [sub, subsub].filter(Boolean).join('/');
  const page = pages[key];

  if (!page) return <Navigate to="/" replace />;

  return (
    <GenericContentPage
      section="facilities"
      subsection={key}
      title={page.title}
      backPath="/"
      backLabel="Home"
      pageType={page.pageType}
      tableColumns={page.tableColumns || []}
       photoAlign={page.photoAlign || 'left'}
    />
  );
};

export default FacilitiesRouted;
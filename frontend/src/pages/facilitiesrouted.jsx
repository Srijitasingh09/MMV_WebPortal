import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'hostels/chiefwarden': { 
    title: 'Chief Warden',                    
    pageType: 'profile-description' 
  },

  'hostels/coordinator': { 
    title: 'Hostel Coordinator',              
    pageType: 'profile-description'
  },

  'hostels/swastikunj': { 
    title: 'Swasti Kunj Hostel',              
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/kirtikunj': { 
    title: 'Kirti Kunj Hostel',               
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/kundandevi': { 
    title: 'Kundan Devi Malviya Girls Hostel',              
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/pragyakunj': { 
    title: 'Pragya Kunj Hostel',              
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/jyotikunj': { 
    title: 'Jyoti Kunj Hostel',               
    pageType: 'slideshow-description-table',
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
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['Sport', 'Venue', 'Timing', 'Coach'] 
  },

  'sports/mmvsports': { 
    title: 'MMV Sports Board',                      
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['Sport', 'Venue', 'Timing', 'Coach'] 
  },

  'sports/gym': { 
    title: 'Open-Gym & Indoor Gym',                       
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'wellbeing/wbsc': { 
    title: 'Well Being Service Cell, BHU',           
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'wellbeing/mmvwell': { 
    title: 'MMV PAHAL',                  
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'trainingplacement/universitytraining': { 
    title: 'University Training & Placement', 
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['Name', 'Department', 'Designation', 'Contact', 'Email Id'] 
  },

  'trainingplacement/mmvtraining': { 
    title: 'MMV Training & Placement',        
    pageType: 'slideshow-description-table',
    photoAlign: 'center',
    tableColumns: ['Name', 'Department', 'Designation', 'Contact', 'Email Id'] 
  },

  'cdc': { 
    title: 'CDC',                             
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'medical/ssh': { 
    title: 'Sir Sundarlal Hospital',          
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'medical/tc': { 
    title: 'Trauma Centre',                   
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'medical/health': { 
    title: 'Student Health Center',                   
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'extracurricular/ncc': { 
    title: 'NCC',                             
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'extracurricular/nss': { 
    title: 'NSS',                             
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'extracurricular/clubs': { title: 'Clubs',                           
    pageType: 'slideshow-description-table',
    photoAlign: 'center'
  },

  'extracurricular/diplomacourses': { 
    title: 'Diploma & Certificate Courses',                 
    pageType: 'description-table',
    tableColumns: ['Course', 'Duration', 'Eligibility'] 
  },

  'samarth': { 
    title: 'Samarth Portal',                  
    pageType: 'description',
    photoAlign: 'center' 
  },

  'namaste': { 
    title: 'Namaste BHU App',                     
    pageType: 'slideshow-description',
    photoAlign: 'center' 
  },

  'canteen/universitycanteen': { 
    title: 'University Canteen',              
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'canteen/mmvcanteen': { 
    title: 'MMV Canteen',                     
    pageType: 'slideshow-description',
    photoAlign: 'center' 
  },

  'citydelegacy': { 
    title: 'City Delegacy',                   
    pageType: 'slideshow-description',
    photoAlign: 'center' 
  },

  'other/vt': { 
    title: 'Vishwanath Temple',               
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/bkb': { 
    title: 'Bharat Kala Bhawan',              
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/transportation': { 
    title: 'Transportation',                  
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  'other/banks': { 
    title: 'Banks & Post Offices',                           
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/guesthouses': { 
    title: 'Guest Houses',                    
    pageType: 'photo-description',
    photoAlign: 'center'
  },

  'other/auditorium': { 
    title: 'Auditorium',                      
    pageType: 'photo-description',
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
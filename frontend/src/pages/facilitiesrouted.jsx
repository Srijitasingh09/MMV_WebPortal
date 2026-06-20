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
    pageType: 'photo-description-table',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/kirtikunj': { 
    title: 'Kirti Kunj Hostel',               
    pageType: 'photo-description-table',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/kundandevi': { 
    title: 'Kundan Devi Malviya Hostel',              
    pageType: 'photo-description-table',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/pragyakunj': { 
    title: 'Pragya Kunj Hostel',              
    pageType: 'photo-description-table',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'hostels/jyotikunj': { 
    title: 'Jyoti Kunj Hostel',               
    pageType: 'photo-description-table',
    tableColumns: ['S.No.', 'Name', 'Designation', 'Contact'] 
  },

  'library/central': { 
    title: 'Central Library',                 
    pageType: 'photo-description',
  },

  'library/cyber': { 
    title: 'Cyber Library',                   
    pageType: 'photo-description' 
  },

  'library/mmvlibrary': { 
    title: 'MMV Library',                     
    pageType: 'photo-description',
  },

  'sports/universitysports': { 
    title: 'University Sports Board',               
    pageType: 'photo-description-table',
    tableColumns: ['Sport', 'Venue', 'Timing', 'Coach'] 
  },

  'sports/mmvsports': { 
    title: 'MMV Sports Board',                      
    pageType: 'photo-description-table',
    tableColumns: ['Sport', 'Venue', 'Timing', 'Coach'] 
  },

  'sports/gym': { 
    title: 'Open-Gym & Indoor Gym',                       
    pageType: 'photo-description' 
  },

  'wellbeing/universitywell': { 
    title: 'Well Being Service Cell, BHU',           
    pageType: 'photo-description' 
  },

  'wellbeing/mmvwell': { 
    title: 'MMV PAHAL',                  
    pageType: 'photo-description' 
  },

  'trainingplacement/universitytraining': { 
    title: 'University Training & Placement', 
    pageType: 'photo-description-table',
    tableColumns: ['Name', 'Department', 'Designation', 'Contact', 'Email Id'] 
  },

  'trainingplacement/mmvtraining': { 
    title: 'MMV Training & Placement',        
    pageType: 'photo-description-table',
    tableColumns: ['Name', 'Department', 'Designation', 'Contact', 'Email Id'] 
  },

  'cdc': { 
    title: 'CDC',                             
    pageType: 'photo-description' 
  },

  'medical/ssr': { 
    title: 'Sir Sundarlal Hospital',          
    pageType: 'photo-description',
  },

  'medical/tc': { 
    title: 'Trauma Center',                   
    pageType: 'photo-description' 
  },

  'medical/health': { 
    title: 'Student Health Center',                   
    pageType: 'photo-description',
  },

  'extracurricular/ncc': { 
    title: 'NCC',                             
    pageType: 'photo-description' 
  },

  'extracurricular/nss': { 
    title: 'NSS',                             
    pageType: 'photo-description' 
  },

  'extracurricular/clubs': { title: 'Clubs',                           
    pageType: 'photo-description-table',
  },

  'extracurricular/diplomacourses': { 
    title: 'Diploma & Certificate Courses',                 
    pageType: 'description-table',
    tableColumns: ['Course', 'Duration', 'Eligibility'] 
  },

  'samarth': { 
    title: 'Samarth Portal',                  
    pageType: 'photo-description' 
  },

  'namaste': { 
    title: 'Namaste BHU App',                     
    pageType: 'photo-description' 
  },

  'canteen/universitycanteen': { 
    title: 'University Canteen',              
    pageType: 'photo-description' 
  },

  'canteen/mmvcanteen': { 
    title: 'MMV Canteen',                     
    pageType: 'photo-description' 
  },

  'citydelegacy': { 
    title: 'City Delegacy',                   
    pageType: 'photo-description' 
  },

  'other/vt': { 
    title: 'Vishwanath Temple',               
    pageType: 'photo-description' 
  },

  'other/bkb': { 
    title: 'Bharat Kala Bhawan',              
    pageType: 'photo-description' 
  },

  'other/transportation': { 
    title: 'Transportation',                  
    pageType: 'photo-description'
  },

  'other/banks': { 
    title: 'Banks & Post Offices',                           
    pageType: 'photo-description',
  },

  'other/guesthouses': { 
    title: 'Guest Houses',                    
    pageType: 'photo-description',
  },

  'other/auditorium': { 
    title: 'Auditorium',                      
    pageType: 'photo-description' 
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
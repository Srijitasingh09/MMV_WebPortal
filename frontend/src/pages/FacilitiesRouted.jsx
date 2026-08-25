import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'overview': {
    title: 'Facilities',
    pageType: 'description'
  },
  // ── Hostels ──────────────────────────────────────────────────────────────
  'hostels': {
    title: 'Hostels',
    pageType: 'description',
    
  },
  'hostels/chiefwarden': {
    title: 'Chief Warden',
    pageType: 'profile'          // data stored as profile object in details JSON
  },
  'hostels/coordinator': {
    title: 'Hostel Coordinator',
    pageType: 'profile'          // data stored as profile object in details JSON
  },
  'hostels/swastikunj': {
    title: 'Swasti Kunj Hostel',
    pageType: 'slideshow-description',
    photoAlign: 'center'
   
  },
  'hostels/kirtikunj': {
    title: 'Kirti Kunj Hostel',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
  'hostels/kundandevi': {
    title: 'Kundan Devi Malviya Hostel',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
  'hostels/pragyakunj': {
    title: 'Pragya Kunj Hostel',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
  'hostels/jyotikunj': {
    title: 'Jyoti Kunj Hostel',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  // ── Library ───────────────────────────────────────────────────────────────
  
   'library': {
    title: 'Libraries',
    pageType: 'slideshow-description',
    
  },

  // 'library/central': {
  //   title: 'Central Library',
  //   pageType: 'slideshow-pdf-list-description',
  //   photoAlign: 'center'
  // },
  // 'library/cyber': {
  //   title: 'Cyber Library',
  //   pageType: 'slideshow-pdf-list-description',
  //   photoAlign: 'center'
  // },
  // 'library/mmvlibrary': {
  //   title: 'MMV Library',
  //   pageType: 'slideshow-pdf-list-description',
  //   photoAlign: 'center'
  // },

  // ── Sports ────────────────────────────────────────────────────────────────
  
  // 'sports/universitysports': {
  //   title: 'University Sports Board',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  'sports/mmvsports': {
    title: 'MMV Sports Board',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
  'sports/gym': {
    title: 'Gym',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  // ── Well-being ────────────────────────────────────────────────────────────
  
  // 'wellbeing/wbsc': {            
  //   title: 'Well Being Service Cell, BHU',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  'wellbeing/mmvwell': {
    title: 'MMV PAHAL',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },

  // ── Training & Placement ──────────────────────────────────────────────────
 
  // 'trainingplacement/universitytraining': {
  //   title: 'University Training & Placement Cell',
  //   pageType: 'description-pdf-list'
  // },
  'trainingplacement/mmvtraining': {
    title: 'Training & Placement Cell, MMV',
    pageType: 'description'
  },

  // ── CDC / Samarth / Namaste ───────────────────────────────────────────────
  // 'cdc': {
  //   title: 'Central Discovery Centre',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  'samarth': {
    title: 'Samarth Portal',
    pageType: 'description',
    photoAlign: 'center'
  },
  'namaste': {
    title: 'Namaste BHU App',
    pageType: 'photo-description',
    photoAlign: 'center',
    photoWidth: '100%',
    photoHeight: 'full'
  },

  // ── Medical ───────────────────────────────────────────────────────────────
  
'medical': {
    title: 'Medical',
    pageType: 'slideshow-description',
    
  },
  // 'medical/ssh': {                
  //   title: 'Sir Sundarlal Hospital',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  // 'medical/tc': {
  //   title: 'Trauma Centre',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  // 'medical/health': {
  //   title: 'Student Health Center',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },

  // ── Extracurricular ───────────────────────────────────────────────────────
 
  'extracurricular': {
    title: 'Extra-curricular',
    pageType: 'description',
    
  },
  // 'extracurricular/ncc': {
  //   title: 'National Cadet Corps (NCC)',
  //   pageType: 'description'
  // },
  // 'extracurricular/nss': {
  //   title: 'National Service Scheme (NSS)',
  //   pageType: 'description'
  // },
  'extracurricular/nlsc': {
    title: 'Nurturing Life Skills Cell (NLSC)',
    pageType: 'description'
  },
  'extracurricular/diplomacourses': {
    title: 'Diploma & Certificate Courses',
    pageType: 'pdf-list-description'
  },
  // 'extracurricular/clubs': {
  //   title: 'Clubs',
  //   pageType: 'description-table',
  //   tableColumns: ['Club Name', 'Type', 'Contact Person', 'Meeting Day']
  // },

  // ── Canteen ───────────────────────────────────────────────────────────────
  
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

  // ── City & Other ──────────────────────────────────────────────────────────
  // 'citydelegacy': {
  //   title: 'City Delegacy',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
 
  'other': {
    title: 'Other Amenties',
    pageType: 'slideshow-description',
    
  },
  // 'other/vt': {
  //   title: 'Vishwanath Temple',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  // 'other/bkb': {
  //   title: 'Bharat Kala Bhawan',
  //   pageType: 'slideshow-description',
  //   photoAlign: 'center'
  // },
  'other/transportation': {
    title: 'Transportation',
    pageType: 'photo-description',
    photoAlign: 'center'
  },
  'other/banks': {
    title: 'Banks & Post Offices',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
  // 'other/guesthouses': {
  //   title: 'Guest Houses',
  //   pageType: 'slideshow-description-pdf-list',
  //   photoAlign: 'center'
  // },
  'other/auditorium': {
    title: 'Auditorium',
    pageType: 'slideshow-description',
    photoAlign: 'center'
  },
};

const FacilitiesRouted = () => {
  const { sub, subsub } = useParams();
  const rawKey = [sub, subsub].filter(Boolean).join('/');
  const key = rawKey || 'overview';
  const page = pages[key];

  if (!page) return <Navigate to="/home" replace />;

  return (
    <GenericContentPage
      section="facilities"
      subsection={key}
      title={page.title}
      backPath="/home"
      backLabel="Home"
      pageType={page.pageType}
      tableColumns={page.tableColumns || []}
      photoAlign={page.photoAlign || 'left'}
      photoWidth={page.photoWidth}
      photoHeight={page.photoHeight}
    />
  );
};

export default FacilitiesRouted;
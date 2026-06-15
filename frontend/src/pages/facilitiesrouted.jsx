import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GenericContentPage from './generic';

const pages = {
  'hostels/chiefwarden':                  { title: 'Chief Warden',                    pageType: 'photo-description' },
  'hostels/coordinator':                  { title: 'Hostel Coordinator',              pageType: 'photo',photoAlign: "center" },
  'hostels/kirtikunj':                    { title: 'Kirti Kunj Hostel',               pageType: 'description-table',
    tableColumns: ['Room Type', 'Capacity', 'Warden', 'Contact'] },
  'hostels/swastikunj':                   { title: 'Swasti Kunj Hostel',              pageType: 'description-table',
    tableColumns: ['Room Type', 'Capacity', 'Warden', 'Contact'] },
  'hostels/pragyakunj':                   { title: 'Pragya Kunj Hostel',              pageType: 'description-table',
    tableColumns: ['Room Type', 'Capacity', 'Warden', 'Contact'] },
  'hostels/jyotikunj':                    { title: 'Jyoti Kunj Hostel',               pageType: 'description-table',
    tableColumns: ['Room Type', 'Capacity', 'Warden', 'Contact'] },
  'hostels/kundandevi':                   { title: 'Kundan Devi Hostel',              pageType: 'description-table',
    tableColumns: ['Room Type', 'Capacity', 'Warden', 'Contact'] },
  'library/central':                      { title: 'Central Library',                 pageType: 'description-table',
    tableColumns: ['Service', 'Timings', 'Contact'] },
  'library/cyber':                        { title: 'Cyber Library',                   pageType: 'description' },
  'library/mmvlibrary':                   { title: 'MMV Library',                     pageType: 'description-table',
    tableColumns: ['Service', 'Timings', 'Contact'] },
  'sports/universitysports':              { title: 'University Sports',               pageType: 'description-table',
    tableColumns: ['Sport', 'Venue', 'Timing', 'Coach'] },
  'sports/mmvsports':                     { title: 'MMV Sports',                      pageType: 'description-table',
    tableColumns: ['Sport', 'Venue', 'Timing', 'Coach'] },
  'sports/gym':                           { title: 'Gymnasium',                       pageType: 'description' },
  'wellbeing/universitywell':             { title: 'University Well-being',           pageType: 'description' },
  'wellbeing/mmvwell':                    { title: 'MMV Well-being',                  pageType: 'description' },
  'trainingplacement/universitytraining': { title: 'University Training & Placement', pageType: 'description-table',
    tableColumns: ['Company', 'Role', 'Year', 'Package'] },
  'trainingplacement/mmvtraining':        { title: 'MMV Training & Placement',        pageType: 'description-table',
    tableColumns: ['Company', 'Role', 'Year', 'Package'] },
  'cdc':                                  { title: 'CDC',                             pageType: 'description' },
  'medical/ssr':                          { title: 'Sir Sundarlal Hospital',          pageType: 'description-table',
    tableColumns: ['Department', 'Timings', 'Contact'] },
  'medical/tc':                           { title: 'Trauma Center',                   pageType: 'description' },
  'medical/health':                       { title: 'Health Center',                   pageType: 'description-table',
    tableColumns: ['Service', 'Timings', 'Contact'] },
  'extracurricular/ncc':                  { title: 'NCC',                             pageType: 'description' },
  'extracurricular/nss':                  { title: 'NSS',                             pageType: 'description' },
  'extracurricular/clubs':                { title: 'Clubs',                           pageType: 'description-table',
    tableColumns: ['Club Name', 'Type', 'Contact Person', 'Meeting Day'] },
  'extracurricular/diplomacourses':       { title: 'Diploma Courses',                 pageType: 'description-table',
    tableColumns: ['Course', 'Duration', 'Eligibility', 'Contact'] },
  'samarth':                              { title: 'Samarth Portal',                  pageType: 'description' },
  'namaste':                              { title: 'Namaste App',                     pageType: 'description' },
  'canteen/universitycanteen':            { title: 'University Canteen',              pageType: 'description' },
  'canteen/mmvcanteen':                   { title: 'MMV Canteen',                     pageType: 'description' },
  'citydelegacy':                         { title: 'City Delegacy',                   pageType: 'description' },
  'other/vt':                             { title: 'Vishwanath Temple',               pageType: 'description' },
  'other/bkb':                            { title: 'Bharat Kala Bhawan',              pageType: 'description' },
  'other/transportation':                 { title: 'Transportation',                  pageType: 'description-table',
    tableColumns: ['Route', 'Timing', 'Fare', 'Contact'] },
  'other/banks':                          { title: 'Banks',                           pageType: 'description-table',
    tableColumns: ['Bank', 'Branch', 'Timings', 'Contact'] },
  'other/po':                             { title: 'Post Offices',                    pageType: 'description' },
  'other/guesthouses':                    { title: 'Guest Houses',                    pageType: 'description-table',
    tableColumns: ['Name', 'Capacity', 'Contact', 'Booking'] },
  'other/auditorium':                     { title: 'Auditorium',                      pageType: 'description' },
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
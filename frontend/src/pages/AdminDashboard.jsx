import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Calendar, Plus, Send, CheckCircle, BookOpen, Users, Paperclip, Trash2, Landmark, ArrowUp, ArrowDown, ImagePlus, Building2, MessageSquare } from 'lucide-react';
import AdminAcademics from '../components/AdminAcademics';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('notice');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [timetableRows, setTimetableRows] = useState([]);
  const [timetablePdfFile, setTimetablePdfFile] = useState(null);
  const [clubItems, setClubItems] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState([]);
  const [mmvKnowledge, setMmvKnowledge] = useState([]);
  const [hostelDocs, setHostelDocs] = useState([]);
  const [noticeAttachment, setNoticeAttachment] = useState(null);
  const [collegeImage, setCollegeImage] = useState(null);
  const [calendarDocs, setCalendarDocs] = useState([]);
  const [calendarPdfFile, setCalendarPdfFile] = useState(null);
  const [calendarForm, setCalendarForm] = useState({ type: 'academic' });
  const [collegeImagePreview, setCollegeImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [collegeInfoFilter, setCollegeInfoFilter] = useState('All');

  const [notice, setNotice] = useState({ title: '', content: '', category: 'General' });
  const [courseForm, setCourseForm] = useState({
    degree: 'B.Sc.',
    course: 'Computer Science',
    semester: 1,
    subject_code: '',
    subject_name: '',
    credits: 4,
    professor_name: ''
  });
  const [professorForm, setProfessorForm] = useState({
    name: '',
    department: 'Computer Science',
    designation: 'Professor',
    email: '',
    phone: '',
    office_location: 'CS Department'
  });
  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday',
    degree: 'B.Sc.',
    branch: 'Computer Science',
    subject: '',
    time_start: '09:00',
    time_end: '10:00',
    teacher_name: '',
    room_number: 'CS-101',
    department: 'Computer Science',
    course: 'Computer Science',
    year: 1
  });
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    type: 'Club',
    tags: '',
    contact_person: '',
    event_date: '',
    event_time: '',
    venue: ''
  });
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    description: '',
    category: 'Library',
    contact_details: '',
    email: '',
    operating_hours: '',
    location: ''
  });
  const [editingClub, setEditingClub] = useState(null);
  const [clubEditForm, setClubEditForm] = useState({
    name: '',
    description: '',
    type: 'Club',
    tags: '',
    contact_person: '',
    event_date: '',
    event_time: '',
    venue: ''
  });
  const [editingFacility, setEditingFacility] = useState(null);
  const [facilityEditForm, setFacilityEditForm] = useState({
    name: '',
    description: '',
    category: 'Library',
    contact_details: '',
    email: '',
    operating_hours: '',
    location: ''
  });
  const [collegeInfoForm, setCollegeInfoForm] = useState({
    title: '',
    category: 'General',
    description: ''
  });
  const [knowledgeForm, setKnowledgeForm] = useState({
    type: 'Notice',
    title: '',
    description: '',
    contact: '',
    tags: ''
  });
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [knowledgeEditForm, setKnowledgeEditForm] = useState({
    type: 'Notice',
    title: '',
    description: '',
    contact: '',
    tags: ''
  });
  const [hostelPdfFile, setHostelPdfFile] = useState(null);
  const [hostelForm, setHostelForm] = useState({
    hostel_name: 'Kirti Kunj Hostel'
  });

  const HOSTEL_OPTIONS = [
    'Kirti Kunj Hostel',
    'Kundan Devi Hostel',
    'Jyoti Kunj Hostel',
    'Swasti Kunj Hostel',
    'Pragya Kunj Hostel',
  ];

  const BUILT_IN_DEGREES = ['B.A.', 'B.Sc.', 'M.A.', 'M.Sc.', 'PHD'];
  const degreeOptions = Array.from(new Set([
    ...BUILT_IN_DEGREES,
    ...catalog.map((item) => item.degree).filter(Boolean),
  ])).sort();
  const branchOptions = Array.from(new Set(catalog.map((item) => item.course).filter(Boolean)));
  const collegeInfoCategories = ['All', 'General', 'Labs', 'Achievements', 'Facilities', 'Research', 'Events', 'Placements'];
  const filteredCollegeInfo = collegeInfoFilter === 'All'
    ? collegeInfo
    : collegeInfo.filter((entry) => entry.category === collegeInfoFilter);

  const getToken = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchAdminData = async () => {
    const [catalogRes, professorRes, timetableRes, facilityRes, clubRes, collegeInfoRes, knowledgeRes, hostelsRes, calendarRes] = await Promise.all([
      axios.get('/course-catalog', { headers: authHeader() }),
      axios.get('/professors', { headers: authHeader() }),
      axios.get('/admin/timetable/pdf/all', { headers: authHeader() }),
      axios.get('/facilities', { headers: authHeader() }),
      axios.get('/clubs', { headers: authHeader() }),
      axios.get('/college-info', { headers: authHeader() }),
      axios.get('/admin/mmv-knowledge', { headers: authHeader() }),
      axios.get('/admin/hostels', { headers: authHeader() }),
      axios.get('/calendar', { headers: authHeader() })
    ]);
    setCatalog(catalogRes.data);
    setProfessors(professorRes.data);
    setTimetableRows(timetableRes.data);
    setFacilities(facilityRes.data);
    setClubItems(clubRes.data);
    setCollegeInfo(collegeInfoRes.data);
    setMmvKnowledge(knowledgeRes.data || []);
    setHostelDocs(hostelsRes.data || []);
    setCalendarDocs(calendarRes.data || []);
  };

  useEffect(() => {
    fetchAdminData().catch(() => {
      setSuccess('');
      alert('Unable to load admin data.');
    });
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', notice.title);
      payload.append('content', notice.content);
      payload.append('category', notice.category);
      if (noticeAttachment) {
        payload.append('attachment', noticeAttachment);
      }

      await axios.post('/admin/notice', payload, {
        headers: authHeader()
      });
      showSuccess('Notice posted successfully!');
      setNotice({ title: '', content: '', category: 'General' });
      setNoticeAttachment(null);
    } catch (err) {
      alert('Error posting notice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/admin/course-catalog', {
        ...courseForm,
        semester: Number(courseForm.semester),
        credits: Number(courseForm.credits)
      }, {
        headers: authHeader()
      });
      showSuccess('Course subject added successfully!');
      setCourseForm({ ...courseForm, subject_code: '', subject_name: '', professor_name: '' });
      await fetchAdminData();
    } catch (err) {
      alert('Error adding course subject');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfessor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/admin/professor', professorForm, {
        headers: authHeader()
      });
      showSuccess('Professor added successfully!');
      setProfessorForm({ ...professorForm, name: '', email: '', phone: '' });
      await fetchAdminData();
    } catch (err) {
      alert('Error adding professor');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTimetablePdf = async (e) => {
    e.preventDefault();
    if (!timetablePdfFile) {
      alert('Please choose a timetable PDF file first.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('degree', timetableForm.degree);
      payload.append('branch', timetableForm.branch);
      payload.append('year', String(Number(timetableForm.year)));
      payload.append('pdf', timetablePdfFile);

      await axios.post('/admin/timetable/pdf', payload, {
        headers: authHeader()
      });

      showSuccess('Timetable PDF uploaded successfully!');
      setTimetablePdfFile(null);
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error uploading timetable PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadHostelPdf = async (e) => {
    e.preventDefault();
    if (!hostelPdfFile) {
      alert('Please choose a hostel PDF first.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('hostel_name', hostelForm.hostel_name);
      payload.append('pdf', hostelPdfFile);

      await axios.post('/admin/hostels/upload', payload, {
        headers: authHeader()
      });

      showSuccess('Hostel PDF uploaded successfully!');
      setHostelPdfFile(null);
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error uploading hostel PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/admin/club-event', {
        ...clubForm,
        tags: clubForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }, {
        headers: authHeader()
      });
      showSuccess('Club/Event added successfully!');
      setClubForm({ name: '', description: '', type: 'Club', tags: '', contact_person: '', event_date: '', event_time: '', venue: '' });
      await fetchAdminData();
    } catch (err) {
      alert('Error adding club/event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFacility = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/admin/facility', facilityForm, {
        headers: authHeader()
      });
      showSuccess('Facility added successfully!');
      setFacilityForm({ name: '', description: '', category: 'Library', contact_details: '', email: '', operating_hours: '', location: '' });
      await fetchAdminData();
    } catch (err) {
      alert('Error adding facility');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFacility = async (item) => {
    setEditingFacility(item);
    setFacilityEditForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'Library',
      contact_details: item.contact_details || '',
      email: item.email || '',
      operating_hours: item.operating_hours || '',
      location: item.location || ''
    });
  };

  const submitFacilityEdit = async (e) => {
    e.preventDefault();
    if (!editingFacility) {
      return;
    }
    try {
      await axios.put(`/admin/facility/${editingFacility.id}`, facilityEditForm, { headers: authHeader() });
      showSuccess('Facility updated successfully!');
      setEditingFacility(null);
      await fetchAdminData();
    } catch (err) {
      alert('Error updating facility');
    }
  };

  const handleDeleteFacility = async (itemId) => {
    if (!window.confirm('Delete this facility?')) {
      return;
    }
    try {
      await axios.delete(`/admin/facility/${itemId}`, { headers: authHeader() });
      showSuccess('Facility removed successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error deleting facility');
    }
  };

  const handleUpdateClub = async (item) => {
    setEditingClub(item);
    setClubEditForm({
      name: item.name || '',
      description: item.description || '',
      type: item.type || 'Club',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      contact_person: item.contact_person || '',
      event_date: item.event_date || '',
      event_time: item.event_time || '',
      venue: item.venue || ''
    });
  };

  const submitClubEdit = async (e) => {
    e.preventDefault();
    if (!editingClub) {
      return;
    }
    try {
      await axios.put(`/admin/club-event/${editingClub.id}`, {
        ...clubEditForm,
        tags: clubEditForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }, { headers: authHeader() });
      showSuccess('Club/Event updated successfully!');
      setEditingClub(null);
      await fetchAdminData();
    } catch (err) {
      alert('Error updating club/event');
    }
  };

  const handleDeleteClub = async (itemId) => {
    if (!window.confirm('Delete this club/event entry?')) {
      return;
    }
    try {
      await axios.delete(`/admin/club-event/${itemId}`, {
        headers: authHeader()
      });
      showSuccess('Club/Event removed successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error deleting club/event');
    }
  };

  const handleSubmitKnowledge = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/admin/mmv-knowledge', {
        ...knowledgeForm,
        tags: knowledgeForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }, {
        headers: authHeader()
      });
      showSuccess('Knowledge entry added successfully!');
      setKnowledgeForm({ type: 'Notice', title: '', description: '', contact: '', tags: '' });
      await fetchAdminData();
    } catch (err) {
      alert('Error adding knowledge entry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKnowledge = async (item) => {
    setEditingKnowledge(item);
    setKnowledgeEditForm({
      type: item.type || 'Notice',
      title: item.title || '',
      description: item.description || '',
      contact: item.contact || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
    });
  };

  const submitKnowledgeEdit = async (e) => {
    e.preventDefault();
    if (!editingKnowledge) {
      return;
    }
    try {
      await axios.put(`/admin/mmv-knowledge/${editingKnowledge.id}`, {
        ...knowledgeEditForm,
        tags: knowledgeEditForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }, { headers: authHeader() });
      showSuccess('Knowledge entry updated successfully!');
      setEditingKnowledge(null);
      await fetchAdminData();
    } catch (err) {
      alert('Error updating knowledge entry');
    }
  };

  const handleDeleteKnowledge = async (entryId) => {
    if (!window.confirm('Delete this MMV knowledge entry?')) {
      return;
    }
    try {
      await axios.delete(`/admin/mmv-knowledge/${entryId}`, {
        headers: authHeader()
      });
      showSuccess('Knowledge entry removed successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error deleting knowledge entry');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Remove this subject from course catalog?')) {
      return;
    }
    try {
      await axios.delete(`/admin/course-catalog/${courseId}`, {
        headers: authHeader()
      });
      showSuccess('Course subject removed successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error removing course subject');
    }
  };

  const handleSubmitCollegeInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', collegeInfoForm.title);
      payload.append('category', collegeInfoForm.category);
      payload.append('description', collegeInfoForm.description);
      if (collegeImage) {
        payload.append('image', collegeImage);
      }

      await axios.post('/admin/college-info', payload, {
        headers: authHeader()
      });

      showSuccess('College info entry added successfully!');
      setCollegeInfoForm({ title: '', category: 'General', description: '' });
      setCollegeImage(null);
      await fetchAdminData();
    } catch (err) {
      alert('Error adding college info entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeImageSelect = (file) => {
    if (!file) {
      return;
    }
    setCollegeImage(file);
  };

  const handleDropCollegeImage = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleCollegeImageSelect(file);
  };

  const handleEditCollegeInfo = async (entry) => {
    const newTitle = window.prompt('Update title', entry.title || '');
    const newCategory = window.prompt('Update category', entry.category || 'General');
    const newDescription = window.prompt('Update description', entry.description || '');
    if (newTitle === null || newCategory === null || newDescription === null) {
      return;
    }
    try {
      await axios.put(`/admin/college-info/${entry.id}`, {
        title: newTitle,
        category: newCategory,
        description: newDescription
      }, { headers: authHeader() });
      showSuccess('College info updated successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error updating college info');
    }
  };

  const handleDeleteCollegeInfo = async (entryId) => {
    if (!window.confirm('Delete this college info card?')) {
      return;
    }
    try {
      await axios.delete(`/admin/college-info/${entryId}`, {
        headers: authHeader()
      });
      showSuccess('College info removed successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error deleting college info');
    }
  };

  const moveCollegeInfo = async (entryId, direction) => {
    const currentIndex = collegeInfo.findIndex((entry) => entry.id === entryId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= collegeInfo.length) {
      return;
    }

    const reordered = [...collegeInfo];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setCollegeInfo(reordered);

    try {
      await axios.put('/admin/college-info/reorder-items', {
        ordered_ids: reordered.map((entry) => entry.id)
      }, { headers: authHeader() });
      showSuccess('College info order updated!');
    } catch (err) {
      await fetchAdminData();
      alert('Unable to reorder college info');
    }
  };

  useEffect(() => {
    if (!collegeImage) {
      setCollegeImagePreview('');
      return;
    }
    const objectUrl = URL.createObjectURL(collegeImage);
    setCollegeImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [collegeImage]);

  const updateRow = async (url, payload) => {
    try {
      await axios.put(url, payload, { headers: authHeader() });
      showSuccess('Updated successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleUpdateCourse = (item) => {
    const newCredits = window.prompt('Update credits', String(item.credits ?? 0));
    const newProfessor = window.prompt('Update professor name', item.professor_name || '');
    if (newCredits === null || newProfessor === null) {
      return;
    }
    updateRow(`/admin/course-catalog/${item.id}`, {
      credits: Number(newCredits),
      professor_name: newProfessor
    });
  };

  const handleUpdateProfessor = (item) => {
    const newDesignation = window.prompt('Update designation', item.designation || 'Professor');
    const newOffice = window.prompt('Update office location', item.office_location || 'CS Department');
    if (newDesignation === null || newOffice === null) {
      return;
    }
    updateRow(`/admin/professor/${item.id}`, {
      designation: newDesignation,
      office_location: newOffice
    });
  };

  const handleUpdateTimetable = (row) => {
    const newRoom = window.prompt('Update room number', row.room_number || 'CS-101');
    const newStart = window.prompt('Update start time (HH:MM)', row.time_start || '09:00');
    const newEnd = window.prompt('Update end time (HH:MM)', row.time_end || '10:00');
    if (newRoom === null || newStart === null || newEnd === null) {
      return;
    }
    updateRow(`/admin/timetable/${row.id}`, {
      room_number: newRoom,
      time_start: newStart,
      time_end: newEnd
    });
  };

  const handleUploadCalendarPdf = async (e) => {
    e.preventDefault();
    if (!calendarPdfFile) {
      alert('Please choose a calendar PDF first.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('type', calendarForm.type);
      payload.append('pdf', calendarPdfFile);

      await axios.post('/admin/calendar/upload', payload, {
        headers: authHeader()
      });

      showSuccess('Calendar document uploaded successfully!');
      setCalendarPdfFile(null);
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error uploading calendar document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCalendarDoc = async (docId) => {
    if (!window.confirm('Delete this calendar document?')) {
      return;
    }
    try {
      await axios.delete(`/admin/calendar/${docId}`, { headers: authHeader() });
      showSuccess('Calendar document removed successfully!');
      await fetchAdminData();
    } catch (err) {
      alert('Error deleting calendar document');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Control Panel</h1>
          <p className="text-muted mt-1">Manage university announcements and campus life.</p>
        </div>
        {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl animate-bounce">
                <CheckCircle size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">{success}</span>
            </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        <button 
          onClick={() => setActiveTab('notice')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'notice' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Bell size={18} className="mr-2" /> CREATE NOTICE
        </button>
        <button 
          onClick={() => setActiveTab('event')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'event' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <BookOpen size={18} className="mr-2" /> COURSES & SUBJECTS
        </button>
        <button
          onClick={() => setActiveTab('professor')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'professor' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Users size={18} className="mr-2" /> PROFESSORS
        </button>
        <button
          onClick={() => setActiveTab('facilities-admin')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'facilities-admin' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Building2 size={18} className="mr-2" /> FACILITIES
        </button>
        <button
          onClick={() => setActiveTab('college-info')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'college-info' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Landmark size={18} className="mr-2" /> COLLEGE INFO
        </button>
        <button
          onClick={() => setActiveTab('mmv-knowledge')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'mmv-knowledge' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <MessageSquare size={18} className="mr-2" /> MMV KNOWLEDGE
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'calendar' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Calendar size={18} className="mr-2" /> CALENDAR
        </button>
        <button
          onClick={() => setActiveTab('academics')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'academics' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <BookOpen size={18} className="mr-2" /> ACADEMICS
        </button>
      </div>

      {activeTab === 'academics' && <AdminAcademics />}

      {activeTab === 'notice' && (
        <form onSubmit={handleSubmitNotice} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notice Title</label>
            <input 
              required
              value={notice.title}
              onChange={(e) => setNotice({...notice, title: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., End Semester Exam Schedule"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                <select 
                    value={notice.category}
                    onChange={(e) => setNotice({...notice, category: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                >
                    <option>General</option>
                    <option>Exam</option>
                    <option>Holiday</option>
                    <option>Admission</option>
                    <option>Event</option>
                </select>
              </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Content</label>
            <textarea 
              required
              rows={5}
              value={notice.content}
              onChange={(e) => setNotice({...notice, content: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Write detailed information here..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <Paperclip size={14} className="mr-2" /> Attachment (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setNoticeAttachment(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
            />
            {noticeAttachment && (
              <p className="text-xs text-muted">Selected: {noticeAttachment.name}</p>
            )}
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center"
          >
            <Send size={18} className="mr-3" />
            {loading ? 'POSTING...' : 'PUBLISH NOTICE'}
          </button>
        </form>
      )}

      {activeTab === 'event' && (
        <form onSubmit={handleSubmitCourse} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subject Name</label>
            <input 
              required
              value={courseForm.subject_name}
              onChange={(e) => setCourseForm({...courseForm, subject_name: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Artificial Intelligence"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Degree</label>
                <select
                    value={courseForm.degree}
                    onChange={(e) => setCourseForm({...courseForm, degree: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                >
                    {degreeOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subject Code</label>
                <input 
                    value={courseForm.subject_code}
                    onChange={(e) => setCourseForm({...courseForm, subject_code: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                    placeholder="CS208"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Semester</label>
                <input type="number" min="1" max="8" value={courseForm.semester} onChange={(e) => setCourseForm({...courseForm, semester: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Course</label>
              <input value={courseForm.course} onChange={(e) => setCourseForm({...courseForm, course: e.target.value})} placeholder="Course" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Credits</label>
              <input type="number" value={courseForm.credits} onChange={(e) => setCourseForm({...courseForm, credits: e.target.value})} placeholder="Credits" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Professor</label>
              <input value={courseForm.professor_name} onChange={(e) => setCourseForm({...courseForm, professor_name: e.target.value})} placeholder="Professor" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-secondary text-white rounded-2xl font-bold tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center"
          >
            <Plus size={18} className="mr-3" />
            {loading ? 'ADDING...' : 'ADD SUBJECT'}
          </button>

          <div className="space-y-3 pt-4">
            <h4 className="font-bold text-sm">Existing Subjects (Edit or Remove)</h4>
            {catalog.slice(0, 20).map((item) => (
              <div key={item.id} className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm flex items-center justify-between gap-3">
                <button type="button" onClick={() => handleUpdateCourse(item)} className="text-left flex-1">
                  {item.degree} • Sem {item.semester} • {item.subject_code} - {item.subject_name} ({item.credits} credits)
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(item.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove Subject"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </form>
      )}

      {activeTab === 'professor' && (
        <form onSubmit={handleSubmitProfessor} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={professorForm.name} onChange={(e) => setProfessorForm({...professorForm, name: e.target.value})} placeholder="Professor Name" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input required value={professorForm.email} onChange={(e) => setProfessorForm({...professorForm, email: e.target.value})} placeholder="Email" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={professorForm.phone} onChange={(e) => setProfessorForm({...professorForm, phone: e.target.value})} placeholder="Phone" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={professorForm.office_location} onChange={(e) => setProfessorForm({...professorForm, office_location: e.target.value})} placeholder="Office" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
          </div>
          <button disabled={loading} className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center">
            <Plus size={18} className="mr-3" />
            {loading ? 'ADDING...' : 'ADD PROFESSOR'}
          </button>
          <div className="space-y-2">
            {professors.slice(0, 12).map((item) => (
              <button type="button" key={item.id} onClick={() => handleUpdateProfessor(item)} className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl text-sm">
                {item.name} • {item.email} • {item.designation}
              </button>
            ))}
          </div>
        </form>
      )}

      {activeTab === 'clubs' && (
        <form onSubmit={handleSubmitClub} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} placeholder="Club/Event Name" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <select value={clubForm.type} onChange={(e) => setClubForm({ ...clubForm, type: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none">
              <option>Club</option>
              <option>Event</option>
            </select>
            <input value={clubForm.contact_person} onChange={(e) => setClubForm({ ...clubForm, contact_person: e.target.value })} placeholder="Contact person (phone/email)" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={clubForm.tags} onChange={(e) => setClubForm({ ...clubForm, tags: e.target.value })} placeholder="Tags (comma separated): dance, music, performance" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={clubForm.event_date} onChange={(e) => setClubForm({ ...clubForm, event_date: e.target.value })} placeholder="Event date (YYYY-MM-DD)" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={clubForm.event_time} onChange={(e) => setClubForm({ ...clubForm, event_time: e.target.value })} placeholder="Event time (e.g. 6:00 PM)" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={clubForm.venue} onChange={(e) => setClubForm({ ...clubForm, venue: e.target.value })} placeholder="Venue" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
          </div>
          <textarea required rows={4} value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} placeholder="Description" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />

          <button disabled={loading} className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center">
            <Plus size={18} className="mr-3" />
            {loading ? 'ADDING...' : 'ADD CLUB / EVENT'}
          </button>

          <div className="space-y-2">
            {clubItems.slice(0, 20).map((item) => (
              <div key={item.id} className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl text-sm flex justify-between items-start gap-3">
                <button type="button" onClick={() => handleUpdateClub(item)} className="text-left flex-1">
                  <p className="font-bold">{item.type} • {item.name}</p>
                  <p className="text-muted text-xs mt-1">{item.description}</p>
                  <p className="text-muted text-xs mt-1">Contact: {item.contact_person || 'N/A'}</p>
                  {(item.type || '').toLowerCase() === 'event' && (
                    <p className="text-muted text-xs mt-1">Date: {item.event_date || 'TBA'} • Time: {item.event_time || 'TBA'} • Venue: {item.venue || 'TBA'}</p>
                  )}
                </button>
                <button type="button" onClick={() => handleDeleteClub(item.id)} className="text-red-600 hover:text-red-700 p-1" title="Delete Club/Event">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </form>
      )}

      {activeTab === 'facilities-admin' && (
        <form onSubmit={handleSubmitFacility} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} placeholder="Facility Name" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <select value={facilityForm.category} onChange={(e) => setFacilityForm({ ...facilityForm, category: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none">
              <option>Library</option>
              <option>Healthcare</option>
              <option>Sports</option>
              <option>Amenity</option>
              <option>Restaurant</option>
            </select>
            <input value={facilityForm.contact_details} onChange={(e) => setFacilityForm({ ...facilityForm, contact_details: e.target.value })} placeholder="Phone / Contact Details" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={facilityForm.email} onChange={(e) => setFacilityForm({ ...facilityForm, email: e.target.value })} placeholder="Facility Email" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={facilityForm.operating_hours} onChange={(e) => setFacilityForm({ ...facilityForm, operating_hours: e.target.value })} placeholder="Operating Hours" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            <input value={facilityForm.location} onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })} placeholder="Location" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
          </div>
          <textarea required rows={4} value={facilityForm.description} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} placeholder="Description" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />

          <button disabled={loading} className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center">
            <Plus size={18} className="mr-3" />
            {loading ? 'ADDING...' : 'ADD FACILITY'}
          </button>

          <div className="space-y-2">
            {facilities.slice(0, 20).map((item) => (
              <div key={item.id} className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl text-sm flex justify-between items-start gap-3">
                <button type="button" onClick={() => handleUpdateFacility(item)} className="text-left flex-1">
                  <p className="font-bold">{item.category} • {item.name}</p>
                  <p className="text-muted text-xs mt-1">{item.description}</p>
                  <p className="text-muted text-xs mt-1">Phone: {item.contact_details || 'N/A'} • Email: {item.email || 'N/A'}</p>
                </button>
                <button type="button" onClick={() => handleDeleteFacility(item.id)} className="text-red-600 hover:text-red-700 p-1" title="Delete Facility">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </form>
      )}

      {activeTab === 'hostels-admin' && (
        <div className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hostel Name</label>
              <select
                value={hostelForm.hostel_name}
                onChange={(e) => setHostelForm({ hostel_name: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              >
                {HOSTEL_OPTIONS.map((hostel) => (
                  <option key={hostel} value={hostel}>{hostel}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <Paperclip size={14} className="mr-2" /> Hostel PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setHostelPdfFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              />
            </div>
          </div>

          {hostelPdfFile && <p className="text-xs text-muted">Selected: {hostelPdfFile.name}</p>}

          <button
            type="button"
            onClick={handleUploadHostelPdf}
            disabled={loading || !hostelPdfFile}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'UPLOADING...' : 'UPLOAD HOSTEL PDF'}
          </button>

          <div className="space-y-2">
            {HOSTEL_OPTIONS.map((hostel) => {
              const doc = hostelDocs.find((row) => (row.hostel_name || '').toLowerCase() === hostel.toLowerCase());
              return (
                <div key={hostel} className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm">
                  <p className="font-bold text-gray-900">{hostel}</p>
                  <p className="text-xs text-muted mt-1">{doc?.pdf_name ? `PDF: ${doc.pdf_name}` : 'No PDF uploaded yet'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Degree</label>
              <select value={timetableForm.degree} onChange={(e) => setTimetableForm({...timetableForm, degree: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none">
                {degreeOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Branch</label>
              <select
                value={timetableForm.branch}
                onChange={(e) => setTimetableForm({...timetableForm, branch: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              >
                {branchOptions.length === 0 ? (
                  <option>Computer Science</option>
                ) : (
                  branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year</label>
              <input type="number" min="1" max="6" value={timetableForm.year} onChange={(e) => setTimetableForm({...timetableForm, year: e.target.value})} placeholder="Year" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
            </div>
          </div>

          <div className="space-y-2 border border-gray-100 rounded-2xl p-4 bg-white">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <Paperclip size={14} className="mr-2" /> Upload Timetable PDF (Degree/Branch/Year)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setTimetablePdfFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
            />
            {timetablePdfFile && <p className="text-xs text-muted">Selected: {timetablePdfFile.name}</p>}
            <button
              type="button"
              onClick={handleUploadTimetablePdf}
              disabled={loading || !timetablePdfFile}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold tracking-widest hover:bg-red-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'UPLOADING...' : 'UPLOAD TIMETABLE PDF'}
            </button>
          </div>

          <div className="space-y-2">
            {timetableRows.slice(0, 14).map((row) => (
              <div key={row.id} className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl text-sm">
                {(row.degree || 'Any Degree')} • {(row.branch || 'Any Branch')} • Year {row.year}
                {row.pdf_name && (
                  <span className="block text-xs text-secondary mt-1">PDF: {row.pdf_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editingClub && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitClubEdit} className="w-full max-w-2xl bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-primary">Edit Club / Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required value={clubEditForm.name} onChange={(e) => setClubEditForm({ ...clubEditForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Name" />
              <select value={clubEditForm.type} onChange={(e) => setClubEditForm({ ...clubEditForm, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                <option>Club</option>
                <option>Event</option>
              </select>
              <input value={clubEditForm.contact_person} onChange={(e) => setClubEditForm({ ...clubEditForm, contact_person: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Contact person" />
              <input value={clubEditForm.tags} onChange={(e) => setClubEditForm({ ...clubEditForm, tags: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Tags (comma separated)" />
              <input value={clubEditForm.event_date} onChange={(e) => setClubEditForm({ ...clubEditForm, event_date: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Event date" />
              <input value={clubEditForm.event_time} onChange={(e) => setClubEditForm({ ...clubEditForm, event_time: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Event time" />
              <input value={clubEditForm.venue} onChange={(e) => setClubEditForm({ ...clubEditForm, venue: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none md:col-span-2" placeholder="Venue" />
            </div>
            <textarea required rows={4} value={clubEditForm.description} onChange={(e) => setClubEditForm({ ...clubEditForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Description" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingClub(null)} className="px-4 py-2 rounded-xl border border-gray-200">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {editingFacility && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitFacilityEdit} className="w-full max-w-2xl bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-primary">Edit Facility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required value={facilityEditForm.name} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Name" />
              <select value={facilityEditForm.category} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                <option>Library</option>
                <option>Healthcare</option>
                <option>Sports</option>
                <option>Amenity</option>
                <option>Restaurant</option>
              </select>
              <input value={facilityEditForm.contact_details} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, contact_details: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Phone / Contact details" />
              <input value={facilityEditForm.email} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Email" />
              <input value={facilityEditForm.operating_hours} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, operating_hours: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Operating hours" />
              <input value={facilityEditForm.location} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, location: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Location" />
            </div>
            <textarea required rows={4} value={facilityEditForm.description} onChange={(e) => setFacilityEditForm({ ...facilityEditForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Description" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingFacility(null)} className="px-4 py-2 rounded-xl border border-gray-200">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {editingKnowledge && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitKnowledgeEdit} className="w-full max-w-2xl bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-primary">Edit MMV Knowledge</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={knowledgeEditForm.type} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none">
                <option>Notice</option>
                <option>Emergency</option>
                <option>Administration</option>
                <option>Healthcare</option>
                <option>Digital Services</option>
                <option>Maintenance</option>
                <option>Operations</option>
              </select>
              <input value={knowledgeEditForm.contact} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, contact: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Contact" />
              <input required value={knowledgeEditForm.title} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none md:col-span-2" placeholder="Title" />
              <input value={knowledgeEditForm.tags} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, tags: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none md:col-span-2" placeholder="Tags (comma separated)" />
            </div>
            <textarea required rows={4} value={knowledgeEditForm.description} onChange={(e) => setKnowledgeEditForm({ ...knowledgeEditForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Description" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingKnowledge(null)} className="px-4 py-2 rounded-xl border border-gray-200">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'college-info' && (
        <form onSubmit={handleSubmitCollegeInfo} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title</label>
              <input
                required
                value={collegeInfoForm.title}
                onChange={(e) => setCollegeInfoForm({ ...collegeInfoForm, title: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                placeholder="e.g., New Robotics Lab"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
              <select
                value={collegeInfoForm.category}
                onChange={(e) => setCollegeInfoForm({ ...collegeInfoForm, category: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              >
                <option>General</option>
                <option>Labs</option>
                <option>Achievements</option>
                <option>Facilities</option>
                <option>Research</option>
                <option>Events</option>
                <option>Placements</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
            <textarea
              required
              rows={5}
              value={collegeInfoForm.description}
              onChange={(e) => setCollegeInfoForm({ ...collegeInfoForm, description: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              placeholder="Add details about labs, achievements, campus updates, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <Paperclip size={14} className="mr-2" /> Image (Optional)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDropCollegeImage}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${dragActive ? 'border-primary bg-red-50/40' : 'border-gray-200 bg-gray-50'}`}
            >
              <ImagePlus size={20} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">Drag and drop image here, or choose file below</p>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => handleCollegeImageSelect(e.target.files?.[0] || null)}
                className="w-full mt-3 px-4 py-3 bg-white border border-gray-100 rounded-xl outline-none"
              />
            </div>
            {collegeImage && <p className="text-xs text-muted">Selected: {collegeImage.name}</p>}
            {collegeImagePreview && (
              <img src={collegeImagePreview} alt="Preview" className="w-full h-44 object-cover rounded-xl border border-gray-100" />
            )}
          </div>

          <button
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center"
          >
            <Plus size={18} className="mr-3" />
            {loading ? 'ADDING...' : 'ADD COLLEGE INFO CARD'}
          </button>

          <div className="space-y-3 pt-4">
            <h4 className="font-bold text-sm">Existing College Info Cards (Edit or Remove)</h4>
            <div className="flex flex-wrap gap-2">
              {collegeInfoCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCollegeInfoFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${collegeInfoFilter === cat ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {filteredCollegeInfo.map((entry) => (
              <div key={entry.id} className="w-full p-4 bg-white border border-gray-100 rounded-xl text-sm space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => handleEditCollegeInfo(entry)} className="text-left flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold">{entry.category}</p>
                    <p className="font-bold text-gray-900 mt-1">{entry.title}</p>
                    <p className="text-muted mt-1 line-clamp-2">{entry.description}</p>
                    {entry.image_name && <p className="text-xs text-secondary mt-1">Image: {entry.image_name}</p>}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveCollegeInfo(entry.id, -1)}
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="Move Up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCollegeInfo(entry.id, 1)}
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="Move Down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollegeInfo(entry.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete College Info"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>
      )}

      {activeTab === 'mmv-knowledge' && (
        <form onSubmit={handleSubmitKnowledge} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={knowledgeForm.type}
              onChange={(e) => setKnowledgeForm({ ...knowledgeForm, type: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
            >
              <option>Notice</option>
              <option>Emergency</option>
              <option>Administration</option>
              <option>Healthcare</option>
              <option>Digital Services</option>
              <option>Maintenance</option>
              <option>Operations</option>
            </select>
            <input
              value={knowledgeForm.contact}
              onChange={(e) => setKnowledgeForm({ ...knowledgeForm, contact: e.target.value })}
              placeholder="Contact / Office"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
            />
            <input
              required
              value={knowledgeForm.title}
              onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
              placeholder="Title"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none md:col-span-2"
            />
            <input
              value={knowledgeForm.tags}
              onChange={(e) => setKnowledgeForm({ ...knowledgeForm, tags: e.target.value })}
              placeholder="Tags (comma separated)"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none md:col-span-2"
            />
          </div>

          <textarea
            required
            rows={5}
            value={knowledgeForm.description}
            onChange={(e) => setKnowledgeForm({ ...knowledgeForm, description: e.target.value })}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
            placeholder="Detailed MMV information that chatbot should use"
          />

          <button
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center"
          >
            <Plus size={18} className="mr-3" />
            {loading ? 'ADDING...' : 'ADD MMV KNOWLEDGE'}
          </button>

          <div className="space-y-2 pt-4">
            <h4 className="font-bold text-sm">Knowledge Entries Used By Chatbot</h4>
            {mmvKnowledge.map((entry) => (
              <div key={entry.id} className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl text-sm flex justify-between items-start gap-3">
                <button type="button" onClick={() => handleUpdateKnowledge(entry)} className="text-left flex-1">
                  <p className="font-bold">{entry.type} • {entry.title}</p>
                  <p className="text-muted text-xs mt-1">{entry.description}</p>
                  <p className="text-muted text-xs mt-1">Contact: {entry.contact || 'N/A'}</p>
                  <p className="text-muted text-xs mt-1">Tags: {(entry.tags || []).join(', ') || 'N/A'}</p>
                </button>
                <button type="button" onClick={() => handleDeleteKnowledge(entry.id)} className="text-red-600 hover:text-red-700 p-1" title="Delete Knowledge Entry">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </form>
      )}

      {activeTab === 'calendar' && (
        <form onSubmit={handleUploadCalendarPdf} className="glass-card p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document Type</label>
              <select 
                value={calendarForm.type}
                onChange={(e) => setCalendarForm({ ...calendarForm, type: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="academic">Academic Calendar</option>
                <option value="holiday">Holiday List</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <Paperclip size={14} className="mr-2" /> Select PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                required
                onChange={(e) => setCalendarPdfFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              />
              {calendarPdfFile && (
                <p className="text-xs text-muted mt-2">Selected: {calendarPdfFile.name}</p>
              )}
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center"
          >
            <ArrowUp size={18} className="mr-3" />
            {loading ? 'UPLOADING...' : 'UPLOAD CALENDAR DOCUMENT'}
          </button>

          <div className="space-y-3 pt-6 border-t border-gray-100">
            <h4 className="font-bold text-sm">Existing Calendar Documents</h4>
            {calendarDocs.length === 0 ? (
              <p className="text-muted text-xs italic">No calendar documents uploaded yet.</p>
            ) : (
              calendarDocs.map((doc) => (
                <div key={doc.id} className="w-full text-left p-4 bg-white border border-gray-100 rounded-xl text-sm flex justify-between items-center gap-3 hover:shadow-sm transition-shadow">
                  <div>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full mr-3 uppercase tracking-wider ${doc.type === 'academic' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {doc.type}
                    </span>
                    <a href={doc.pdf_url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                      {doc.pdf_name}
                    </a>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteCalendarDoc(doc.id)} 
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;

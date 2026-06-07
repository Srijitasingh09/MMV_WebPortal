import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_OPTIONS = {
  degrees: ['B.A.', 'B.Sc.', 'M.A.', 'M.Sc.', 'PHD'],
  courses: ['General', 'Computer Science', 'Mathematics', 'Commerce'],
  departments: ['MMV'],
  faculties: ['Faculty of Arts', 'Faculty of Science'],
  programs: ['Undergraduate', 'Postgraduate', 'Doctoral'],
};

const Profile = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    department: '',
    faculty: '',
    program: '',
    degree: '',
    enrollment_number: '',
    exam_roll_number: '',
    course: '',
    admission_year: 2024,
    academic_year: '2026-27',
    current_year: 1,
  });
  
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [userRes, optionsRes] = await Promise.all([
          axios.get('/user/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/course-options')
        ]);
        
        const userData = userRes.data;
        setFormData({
          full_name: userData.full_name || '',
          phone_number: userData.phone_number || '',
          department: userData.department || '',
          faculty: userData.faculty || '',
          program: userData.program || '',
          degree: userData.degree || '',
          enrollment_number: userData.enrollment_number || '',
          exam_roll_number: userData.exam_roll_number || '',
          course: userData.course || '',
          admission_year: userData.admission_year || 2024,
          academic_year: userData.academic_year || '2026-27',
          current_year: userData.current_year || 1,
        });

        const remote = optionsRes.data || {};
        setOptions({
          degrees: (remote.degrees && remote.degrees.length > 0) ? remote.degrees : DEFAULT_OPTIONS.degrees,
          courses: (remote.courses && remote.courses.length > 0) ? remote.courses : DEFAULT_OPTIONS.courses,
          departments: (remote.departments && remote.departments.length > 0) ? remote.departments : DEFAULT_OPTIONS.departments,
          faculties: (remote.faculties && remote.faculties.length > 0) ? remote.faculties : DEFAULT_OPTIONS.faculties,
          programs: (remote.programs && remote.programs.length > 0) ? remote.programs : DEFAULT_OPTIONS.programs,
        });
      } catch (err) {
        console.error("Failed to load profile data", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    try {
      const payload = {
        ...formData,
        admission_year: Number(formData.admission_year),
        current_year: Number(formData.current_year),
      };
      await axios.put('/user/me', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Profile updated successfully!');
      
      // Update local storage items if needed (like course, degree, year) that might be cached
      localStorage.setItem('course', formData.course);
      localStorage.setItem('degree', formData.degree);
      localStorage.setItem('current_year', formData.current_year);
      
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to update profile. Please check your data.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => window.history.back()}
        className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-primary">Update Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-secondary space-y-8">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">FULL NAME</label>
              <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted flex items-center">📱 PHONE NUMBER</label>
              <input name="phone_number" required value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10" />
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">FACULTY</label>
              <select name="faculty" required value={formData.faculty} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                {options.faculties.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">DEGREE</label>
              <select name="degree" required value={formData.degree} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                {options.degrees.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">PROGRAM</label>
              <select name="program" required value={formData.program} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                {options.programs.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">DEPARTMENT</label>
              <select name="department" required value={formData.department} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                {options.departments.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">COURSE / STREAM</label>
              <select name="course" required value={formData.course} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                {options.courses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">ENROLLMENT NUMBER</label>
              <input name="enrollment_number" required value={formData.enrollment_number} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">EXAM ROLL NUMBER</label>
              <input name="exam_roll_number" value={formData.exam_roll_number || ''} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">ADMISSION YEAR</label>
              <input name="admission_year" type="number" required value={formData.admission_year} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">ACADEMIC SESSION</label>
              <input name="academic_year" required value={formData.academic_year} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted">CURRENT YEAR (1-4)</label>
              <input name="current_year" type="number" min="1" max="4" required value={formData.current_year} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-lg">{error}</p>}
        {message && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl">
            <CheckCircle size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">{message}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={saving}
          className="w-full py-4 bg-secondary text-white rounded-2xl font-bold tracking-widest hover:bg-primary transition-colors"
        >
          {saving ? 'SAVING...' : 'UPDATE PROFILE'}
        </button>

      </form>
    </div>
  );
};

export default Profile;

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Mail, Lock, BookOpen, School, Hash, Calendar, ArrowRight, CheckCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const DEFAULT_OPTIONS = {
  degrees: ['B.A.', 'B.Sc.', 'M.A.', 'M.Sc.', 'PHD'],
  courses: ['General', 'Computer Science', 'Mathematics', 'Commerce'],
  departments: ['MMV'],
  faculties: ['Faculty of Arts', 'Faculty of Science'],
  programs: ['Undergraduate', 'Postgraduate', 'Doctoral'],
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
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
    interests: []
  });
  const [options, setOptions] = useState({
    degrees: DEFAULT_OPTIONS.degrees,
    courses: DEFAULT_OPTIONS.courses,
    departments: DEFAULT_OPTIONS.departments,
    faculties: DEFAULT_OPTIONS.faculties,
    programs: DEFAULT_OPTIONS.programs,
  });

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/course-options`);
        const remote = res.data || {};
        const mergedOptions = {
          degrees: (remote.degrees && remote.degrees.length > 0) ? remote.degrees : DEFAULT_OPTIONS.degrees,
          courses: (remote.courses && remote.courses.length > 0) ? remote.courses : DEFAULT_OPTIONS.courses,
          departments: (remote.departments && remote.departments.length > 0) ? remote.departments : DEFAULT_OPTIONS.departments,
          faculties: (remote.faculties && remote.faculties.length > 0) ? remote.faculties : DEFAULT_OPTIONS.faculties,
          programs: (remote.programs && remote.programs.length > 0) ? remote.programs : DEFAULT_OPTIONS.programs,
        };

        setOptions(mergedOptions);
        setFormData((prev) => ({
          ...prev,
          degree: mergedOptions.degrees?.[0] || prev.degree,
          course: mergedOptions.courses?.[0] || prev.course,
          department: mergedOptions.departments?.[0] || prev.department,
          faculty: mergedOptions.faculties?.[0] || prev.faculty,
          program: mergedOptions.programs?.[0] || prev.program,
        }));
      } catch (err) {
        setOptions(DEFAULT_OPTIONS);
        setFormData((prev) => ({
          ...prev,
          degree: DEFAULT_OPTIONS.degrees?.[0] || prev.degree,
          course: DEFAULT_OPTIONS.courses?.[0] || prev.course,
          department: DEFAULT_OPTIONS.departments?.[0] || prev.department,
          faculty: DEFAULT_OPTIONS.faculties?.[0] || prev.faculty,
          program: DEFAULT_OPTIONS.programs?.[0] || prev.program,
        }));
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        admission_year: Number(formData.admission_year),
        current_year: Number(formData.current_year),
      };
      await axios.post(`${API_BASE_URL}/signup`, payload);
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      if (!err.response) {
        setError(`Cannot reach server at ${API_BASE_URL}. Please ensure backend is running and accessible.`);
        return;
      }
      setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center p-8">
      <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5 border border-gray-100">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-2 bhu-gradient p-12 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                <UserPlus className="text-white" size={24} />
            </div>
          <h1 className="text-4xl font-bold mb-4">College Information</h1>
          <p className="text-white/80 leading-relaxed">
            Banaras Hindu University (BHU), Varanasi is one of India&apos;s leading central universities,
            known for strong academics, research culture, and a vibrant student community.
          </p>
          </div>
          
          <div className="space-y-6">
              <div className="flex items-start space-x-4">
                  <div className="bg-secondary p-2 rounded-lg"><CheckCircle size={16} /></div>
                  <div>
                <h4 className="font-bold text-sm">Academic Excellence</h4>
                <p className="text-xs text-white/60">Structured UG and PG programs with syllabus-aligned learning resources.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-secondary p-2 rounded-lg"><CheckCircle size={16} /></div>
              <div>
                <h4 className="font-bold text-sm">Campus Facilities</h4>
                <p className="text-xs text-white/60">Library, labs, healthcare, hostels, and student support services in one portal.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-secondary p-2 rounded-lg"><CheckCircle size={16} /></div>
              <div>
                <h4 className="font-bold text-sm">Student Life</h4>
                <p className="text-xs text-white/60">Clubs, events, and co-curricular opportunities for all-round development.</p>
                  </div>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest pt-8">Security Powered by JWT & SHA-256</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-3 p-10 md:p-16 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
              <Link to="/login" className="text-sm font-bold text-primary hover:underline">Already have one? Login</Link>
          </div>

          <form onSubmit={handleSignup} className="space-y-8">
            {/* Personal Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center"><User size={10} className="mr-1"/> FULL NAME</label>
                        <input name="full_name" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10" placeholder="Paridhi Singh" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center"><Mail size={10} className="mr-1"/> GMAIL / EMAIL</label>
                        <input name="email" type="email" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10" placeholder="paridhi@student.bhu.ac.in" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center"><Lock size={10} className="mr-1"/> SECURE PASSWORD</label>
                        <input name="password" type="password" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center">📱 PHONE NUMBER</label>
                      <input name="phone_number" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10" placeholder="+91 0000000000" />
                    </div>
                </div>
            </div>

            {/* Academic Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center"><School size={10} className="mr-1"/> FACULTY</label>
                      <select name="faculty" required value={formData.faculty} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                        {options.faculties.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center"><BookOpen size={10} className="mr-1"/> DEGREE</label>
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
                        <label className="text-[10px] font-bold text-muted flex items-center"><Hash size={10} className="mr-1"/> ENROLLMENT NUMBER</label>
                        <input name="enrollment_number" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="BHU2024CS001" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted">EXAM ROLL NUMBER</label>
                      <input name="exam_roll_number" onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Roll if already allotted" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted flex items-center"><Calendar size={10} className="mr-1"/> ADMISSION YEAR</label>
                      <input name="admission_year" type="number" required onChange={handleChange} value={formData.admission_year} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted">ACADEMIC SESSION</label>
                      <input name="academic_year" required onChange={handleChange} value={formData.academic_year} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="2026-27" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted">CURRENT YEAR (1-4)</label>
                      <input name="current_year" type="number" min="1" max="4" required onChange={handleChange} value={formData.current_year} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" />
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-lg animate-pulse">{error}</p>}

                {loadingOptions && <p className="text-xs text-muted font-bold">Loading syllabus-based course options...</p>}

            <button 
                  disabled={loading || loadingOptions}
              className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-bold text-sm tracking-widest flex items-center justify-center hover:bg-black transition-all shadow-xl shadow-gray-200"
            >
                {loading ? 'CREATING ACCOUNT...' : 'REGISTER AS STUDENT'}
                {!loading && <ArrowRight size={18} className="ml-2" />}
            </button>

            <p className="text-center text-sm text-muted font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Bell, Plus, Send, Paperclip, Trash2, Landmark, ArrowUp, ArrowDown, ImagePlus, MessageSquare, Phone } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('notice');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [collegeInfo, setCollegeInfo] = useState([]);
  const [mmvKnowledge, setMmvKnowledge] = useState([]);
  const [noticeAttachment, setNoticeAttachment] = useState(null);
  const [collegeImage, setCollegeImage] = useState(null);
  const [collegeImagePreview, setCollegeImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [collegeInfoFilter, setCollegeInfoFilter] = useState('All');

  const [notice, setNotice] = useState({ title: '', content: '', category: 'General' });
  const navigate = useNavigate();

  const noticeAttachmentInputRef = useRef(null);
  const collegeImageInputRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

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
  const [contactInfoForm, setContactInfoForm] = useState({
    address: '',
    phone: '',
    email: '',
    office_hours: '',
    map_embed_url: ''
  });
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [knowledgeEditForm, setKnowledgeEditForm] = useState({
    type: 'Notice',
    title: '',
    description: '',
    contact: '',
    tags: ''
  });

  const collegeInfoCategories = ['All', 'General', 'Labs', 'Achievements', 'Facilities', 'Research', 'Events', 'Placements'];
  const filteredCollegeInfo = collegeInfoFilter === 'All'
    ? collegeInfo
    : collegeInfo.filter((entry) => entry.category === collegeInfoFilter);

  const getToken = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchAdminData = async () => {
    const [collegeInfoRes, knowledgeRes, contactInfoRes] = await Promise.all([
      axios.get('/college-info', { headers: authHeader() }),
      axios.get('/admin/mmv-knowledge', { headers: authHeader() }),
      axios.get('/contact-info').catch(() => ({ data: null }))
    ]);
    setCollegeInfo(collegeInfoRes.data);
    setMmvKnowledge(knowledgeRes.data || []);
    if (contactInfoRes.data) {
      setContactInfoForm({
        address: contactInfoRes.data.address || '',
        phone: contactInfoRes.data.phone || '',
        email: contactInfoRes.data.email || '',
        office_hours: contactInfoRes.data.office_hours || '',
        map_embed_url: contactInfoRes.data.map_embed_url || ''
      });
    }
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
      if (noticeAttachmentInputRef.current) {
        noticeAttachmentInputRef.current.value = '';
      }
    } catch (err) {
      alert('Error posting notice');
    } finally {
      setLoading(false);
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
      if (collegeImageInputRef.current) {
        collegeImageInputRef.current.value = '';
      }
      await fetchAdminData();
    } catch (err) {
      alert('Error adding college info entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContactInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/admin/contact-info', contactInfoForm, {
        headers: authHeader()
      });
      showSuccess('Contact information updated successfully!');
    } catch (err) {
      alert('Error updating contact information');
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
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchAdminData().catch(() => {
      alert("Unable to load admin data.");
    });
    const objectUrl = URL.createObjectURL(collegeImage);
    setCollegeImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [collegeImage]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Admin Control Panel
          </h1>
          <p className="text-muted mt-1 text-sm sm:text-base">
            Manage university announcements and campus life.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base"
        >
          Logout
        </button>

      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('notice')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'notice' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Bell size={18} className="mr-2" /> CREATE NOTICE
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
          onClick={() => setActiveTab('contact-info')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'contact-info' ? 'border-primary text-primary bg-red-50/40' : 'border-gray-200 text-muted bg-white'}`}
        >
          <Phone size={18} className="mr-2" /> CONTACT INFO
        </button>
      </div>

      {activeTab === 'notice' && (
        <form onSubmit={handleSubmitNotice} className="glass-card p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
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
              ref={noticeAttachmentInputRef}
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

      {editingKnowledge && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitKnowledgeEdit} className="w-full max-w-2xl bg-white rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
        <form onSubmit={handleSubmitCollegeInfo} className="glass-card p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
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
                ref={collegeImageInputRef}
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
        <form onSubmit={handleSubmitKnowledge} className="glass-card p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
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

      {activeTab === 'contact-info' && (
        <form onSubmit={handleSubmitContactInfo} className="glass-card p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Contact Page Details</h3>
            <p className="text-muted text-sm mt-1">
              This information appears on the public Contact Us page, along with a map.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</label>
            <textarea
              rows={3}
              value={contactInfoForm.address}
              onChange={(e) => setContactInfoForm({ ...contactInfoForm, address: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Mahila Mahavidyalaya, Banaras Hindu University, Varanasi, Uttar Pradesh 221005"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</label>
              <input
                value={contactInfoForm.phone}
                onChange={(e) => setContactInfoForm({ ...contactInfoForm, phone: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., +91 542 123 4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={contactInfoForm.email}
                onChange={(e) => setContactInfoForm({ ...contactInfoForm, email: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., office@mmv.ac.in"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Office Hours</label>
            <input
              value={contactInfoForm.office_hours}
              onChange={(e) => setContactInfoForm({ ...contactInfoForm, office_hours: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Mon–Sat, 10:00 AM – 5:00 PM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Google Maps Embed URL (optional)
            </label>
            <input
              value={contactInfoForm.map_embed_url}
              onChange={(e) => setContactInfoForm({ ...contactInfoForm, map_embed_url: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Paste the 'src' link from Google Maps > Share > Embed a map"
            />
            <p className="text-xs text-muted">
              Leave blank to auto-generate a map from the address above.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-red-800 transition-colors flex items-center justify-center"
          >
            <Send size={18} className="mr-3" />
            {loading ? 'SAVING...' : 'SAVE CONTACT INFO'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AdminDashboard;
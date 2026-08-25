import React, { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Clock, ShieldAlert, Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import { getToken, isAdmin as isAdminSession } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const GROUP_CONFIG = {
  phone:   { color: 'red',  icon: Phone  },
  email:   { color: 'teal', icon: Mail   },
  address: { color: 'blue', icon: MapPin },
};

const COLOR_MAP = {
  red:  { bg: 'bg-red-50',    border: 'border-red-200',   iconBg: 'bg-red-100 text-red-600',        title: 'text-red-700'   },
  blue: { bg: 'bg-[#eef6ff]', border: 'border-blue-200',  iconBg: 'bg-[#174873]/10 text-[#174873]', title: 'text-[#0f3358]' },
  teal: { bg: 'bg-teal-50',   border: 'border-teal-200',  iconBg: 'bg-teal-100 text-teal-600',      title: 'text-teal-700'  },
};

// ============================================
// SMALL DETAIL ROW (phone / email / hours)
// ============================================
const InfoRow = ({ icon: Icon, label, value, href }) => {
  if (!value) return null;
  const content = (
    <>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#174873]/10 flex items-center justify-center">
        <Icon size={18} className="text-[#174873]" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-gray-800 font-medium mt-0.5">{value}</p>
      </div>
    </>
  );
  if (href) {
    return (
      <a href={href} className="flex items-start gap-4 group hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }
  return <div className="flex items-start gap-4">{content}</div>;
};

// ============================================
// EMERGENCY GROUP CARD
// ============================================
const EmergencyGroupCard = ({ groupName, entries, type, isAdmin, onDelete, onEdit }) => {
  const cfg  = GROUP_CONFIG[type] || GROUP_CONFIG.phone;
  const c    = COLOR_MAP[cfg.color];
  const Icon = cfg.icon;

  const makeHref = (entry) => {
    if (entry.type === 'phone') return `tel:${entry.value.replace(/\s+/g, '')}`;
    if (entry.type === 'email') return `mailto:${entry.value}`;
    return null;
  };

  return (
    <div className={`flex flex-col items-center text-center gap-4 p-6 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${c.iconBg}`}>
        <Icon size={24} />
      </div>
      <div className="w-full">
        <p className={`text-sm font-bold uppercase tracking-wide mb-3 ${c.title}`}>{groupName}</p>
        <div className="space-y-0">
          {entries.map((entry) => {
            const href = makeHref(entry);
            return (
              <div key={entry.id} className="flex flex-col items-center justify-center gap-0.5 group/entry">
                {entry.label && (
                  <span className="text-base sm:text-lg font-midbold text-gray-700 text-center">{entry.label}</span>
                )}
                {href ? (
                  <a href={href} className="text-lg sm:text-xl font-midbold text-gray-900 text-center hover:text-[#174873] transition-colors">
                    {entry.value}
                  </a>
                ) : (
                  <span className="text-lg sm:text-xl font-midbold text-gray-900 text-center">{entry.value}</span>
                )}
                {isAdmin && (
                  <div className="flex gap-1 mt-0.5 opacity-0 group-hover/entry:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(entry)} className="p-1 text-blue-500 hover:text-blue-700" title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => onDelete(entry.id)} className="p-1 text-red-500 hover:text-red-700" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADMIN FORM -Add multiple entries to a group / Edit one entry
// ============================================
// `initial` (set) -> editing a single existing entry: label/value/type/group_name + Save/Cancel.
// `initial` (unset) -> batch-add mode: lock in group_name + type once, then keep adding
//                      label/value rows (e.g. Fire / Police / Ambulance) before saving them all.
const EmergencyForm = ({ initial, onSaveBatch, onSaveSingle, onCancel, saving }) => {
  const isEditing = Boolean(initial);

  // Shared group-level fields
  const [groupName, setGroupName] = useState(initial?.group_name || '');
  const [type, setType]           = useState(initial?.type || 'phone');

  // Single-entry edit fields
  const [editLabel, setEditLabel] = useState(initial?.label || '');
  const [editValue, setEditValue] = useState(initial?.value || '');

  // Batch-add fields
  const [rows, setRows] = useState([{ label: '', value: '' }]);
  const [groupLocked, setGroupLocked] = useState(false);

  const setRow = (idx, field, val) => {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };
  const addRow = () => setRows(rs => [...rs, { label: '', value: '' }]);
  const removeRow = (idx) => setRows(rs => rs.length === 1 ? rs : rs.filter((_, i) => i !== idx));

  const valuePlaceholder =
    type === 'phone' ? '0542-000-0000' :
    type === 'email' ? 'security@mmv.bhu.ac.in' :
    'Main Gate, MMV Campus, BHU';

  const validRows = rows.filter(r => r.value.trim());

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm mb-4">
        <p className="text-sm font-semibold text-[#0f3358]">Edit Entry</p>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group / Card Title</label>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder='e.g. "Helpline Numbers"'
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="address">Address</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Label (optional)</label>
          <input
            value={editLabel}
            onChange={e => setEditLabel(e.target.value)}
            placeholder='e.g. "Fire", "Police", "Ambulance"'
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {type === 'phone' ? 'Phone Number' : type === 'email' ? 'Email Address' : 'Address'}
          </label>
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            placeholder={valuePlaceholder}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onSaveSingle({ group_name: groupName, type, label: editLabel, value: editValue })}
            disabled={saving || !editValue.trim() || !groupName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Check size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---- Batch-add mode ----
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm mb-4">
      <p className="text-sm font-semibold text-[#0f3358]">Add Emergency Contacts</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group / Card Title</label>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            disabled={groupLocked}
            placeholder='e.g. "Helpline Numbers"'
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={groupLocked}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="address">Address</option>
          </select>
        </div>
      </div>
      {!groupLocked && (groupName.trim() ? (
        <button
          onClick={() => setGroupLocked(true)}
          className="text-xs font-medium text-[#174873] underline"
        >
          Lock group &amp; start adding entries below
        </button>
      ) : (
        <p className="text-xs text-gray-400 italic">Enter a group title above, then add entries like Fire, Police, Ambulance.</p>
      ))}

      {groupLocked && (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-3">
            Entries for "{groupName}"
          </p>
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Label</label>
                <input
                  value={row.label}
                  onChange={e => setRow(idx, 'label', e.target.value)}
                  placeholder="e.g. Fire"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {type === 'phone' ? 'Number' : type === 'email' ? 'Email' : 'Address'}
                </label>
                <input
                  value={row.value}
                  onChange={e => setRow(idx, 'value', e.target.value)}
                  placeholder={valuePlaceholder}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                />
              </div>
              <button
                onClick={() => removeRow(idx)}
                disabled={rows.length === 1}
                className="p-2 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remove row"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium text-[#174873]"
          >
            <Plus size={14} /> Add another entry (e.g. Police, Ambulance)
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSaveBatch(
            validRows.map(r => ({ group_name: groupName, type, label: r.label, value: r.value }))
          )}
          disabled={saving || !groupLocked || validRows.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Check size={14} />
          {saving ? 'Saving...' : `Save All${validRows.length ? ` (${validRows.length})` : ''}`}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const Contact = () => {
  const [info,             setInfo]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [emergency,        setEmergency]        = useState([]);
  const [emergencyLoading, setEmergencyLoading] = useState(true);
  const [showForm,         setShowForm]         = useState(false);
  const [editingEntry,     setEditingEntry]     = useState(null);
  const [saving,           setSaving]           = useState(false);

  const isAdmin    = isAdminSession();
  const token      = getToken();
  const authHeader = { Authorization: `Bearer ${token}` };

  // fetch contact info
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/contact-info`);
        if (!res.ok) throw new Error();
        setInfo(await res.json());
        setError(null);
      } catch {
        setError('Could not load contact information right now. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch emergency contacts
  const fetchEmergency = async () => {
    try {
      setEmergencyLoading(true);
      const res = await fetch(`${API_BASE}/emergency-contacts`);
      if (!res.ok) throw new Error();
      setEmergency(await res.json());
    } catch {
      // non-critical
    } finally {
      setEmergencyLoading(false);
    }
  };
  useEffect(() => { fetchEmergency(); }, []);

  // group entries by group_name → [{ groupName, type, entries[] }]
  const groupedEmergency = (() => {
    const map = {};
    emergency.forEach(e => {
      if (!map[e.group_name]) map[e.group_name] = { groupName: e.group_name, type: e.type, entries: [] };
      map[e.group_name].entries.push(e);
    });
    return Object.values(map);
  })();

  // Save one entry (used by the single-entry edit form)
  const postOneEntry = async (form) => {
    const res = await fetch(`${API_BASE}/admin/emergency-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error();
  };

  // Batch add: save every row, one after another, then refresh once
  const handleAddBatch = async (entries) => {
    if (!entries.length) return;
    setSaving(true);
    try {
      for (const entry of entries) {
        await postOneEntry(entry);
      }
      setShowForm(false);
      await fetchEmergency();
    } catch {
      alert('Some entries may not have saved. Please check the list below and retry any missing ones.');
      await fetchEmergency();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/emergency-contacts/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setEditingEntry(null);
      await fetchEmergency();
    } catch { alert('Failed to update entry.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this emergency contact?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/emergency-contacts/${id}`, {
        method: 'DELETE', headers: authHeader,
      });
      if (!res.ok) throw new Error();
      await fetchEmergency();
    } catch { alert('Failed to delete.'); }
  };

  const getMapEmbedUrl = () => {
    if (!info) return null;
    if (info.map_embed_url) return info.map_embed_url;
    if (info.address) return `https://maps.google.com/maps?q=${encodeURIComponent(info.address)}&output=embed`;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#EAEFF5]">

      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8">
        {/* ── BHU OFFICIAL PORTAL PAGE HEADING ── */}
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-row items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          {/* Left Side: Page Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-[#7d311f] rounded-full shrink-0" />
            <h1 className="text-[#0f3358] font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              Contact Us
            </h1>
          </div>
          {/* Right Side: Breadcrumb */}
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <span className="text-slate-400">Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#7d311f] font-semibold">Contact</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-6 sm:pb-8 space-y-12">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#174873] rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading contact details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {/* MAIN CONTACT + MAP */}
        {!loading && !error && info && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 h-full">
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#0f3358] mb-6"
                  style={{ fontFamily: "'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', sans-serif" }}
                >
                  Connect with us
                </h2>
                <div className="space-y-6">
                  <InfoRow icon={MapPin} label="Address" value={info.address} />
                  <InfoRow icon={Phone} label="Phone" value={info.phone}
                    href={info.phone ? `tel:${info.phone.replace(/\s+/g, '')}` : undefined} />
                  <InfoRow icon={Mail} label="Email" value={info.email}
                    href={info.email ? `mailto:${info.email}` : undefined} />
                  <InfoRow icon={Clock} label="Office Hours" value={info.office_hours} />
                </div>
                {!info.address && !info.phone && !info.email && !info.office_hours && (
                  <p className="text-gray-400 text-sm italic">Contact information has not been added yet.</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[#FAF7F2] border border-gray-200 rounded-xl overflow-hidden h-72 sm:h-full sm:min-h-[420px]">
                {getMapEmbedUrl() ? (
                  <iframe
                    title="MMV Location Map" src={getMapEmbedUrl()}
                    width="100%" height="100%"
                    style={{ border: 0, minHeight: '320px' }}
                    loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                    <MapPin size={32} className="mb-2" />
                    <p className="text-sm">Map will appear here once an address is added.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCY CONTACT SECTION */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <ShieldAlert size={20} className="text-red-500" />
              <h2
                className="text-2xl sm:text-3xl font-bold text-[#0f3358]"
                style={{ fontFamily: "'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', sans-serif" }}
              >
                Emergency Contact
              </h2>
              <ShieldAlert size={20} className="text-red-500" />
            </div>
            <div className="mx-auto mt-2 w-12 h-1 rounded-full bg-red-500" />
          </div>

          {/* Admin panel */}
          {isAdmin && (
            <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs font-bold text-yellow-700 mb-3">ADMIN -EMERGENCY CONTACTS</p>
              {showForm && !editingEntry && (
                <EmergencyForm onSaveBatch={handleAddBatch} onCancel={() => setShowForm(false)} saving={saving} />
              )}
              {editingEntry && (
                <EmergencyForm initial={editingEntry} onSaveSingle={handleEdit} onCancel={() => setEditingEntry(null)} saving={saving} />
              )}
              {!showForm && !editingEntry && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium"
                >
                  <Plus size={15} /> Add Emergency Contact
                </button>
              )}
            </div>
          )}

          {/* Cards */}
          {emergencyLoading ? (
            <div className="flex justify-center py-10 text-gray-400">
              <div className="w-6 h-6 border-[3px] border-gray-200 border-t-[#174873] rounded-full animate-spin" />
            </div>
          ) : groupedEmergency.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm italic">
              {isAdmin
                ? 'No emergency contacts yet. Use the form above to add one.'
                : 'Emergency contact information coming soon.'}
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
              groupedEmergency.length === 1 ? 'sm:grid-cols-1 max-w-sm mx-auto' :
              groupedEmergency.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
            }`}>
              {groupedEmergency.map(({ groupName, type, entries }) => (
                <EmergencyGroupCard
                  key={groupName}
                  groupName={groupName}
                  type={type}
                  entries={entries}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  onEdit={setEditingEntry}
                />
              ))}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            For life-threatening emergencies, always call{' '}
            <span className="font-semibold text-red-500">112</span> first.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
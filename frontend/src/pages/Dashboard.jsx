import React, { useState, useEffect } from 'react';
import axios from 'axios';
const sliderImages = [
  '/backimages/dash1.png',
  '/backimages/dash2.png',
  '/backimages/dash3.png'
];

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(res.data);
            
            const noticeRes = await axios.get('/notices');
            setNotices(noticeRes.data.slice(0, 3));

            const timetableRes = await axios.get('/timetable', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            setTodayClasses(timetableRes.data.filter((item) => item.day === today));

            const recRes = await axios.get('/recommendations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecommendations(recRes.data.slice(0, 2));
        } catch (err) {
            console.error(err);
        }
    };
    fetchData();
  }, []);

  return (
    <div>

      <div className="space-y-8 mt-8">
        {/* Image Slider */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-xl border-2 border-secondary"
          style={{ aspectRatio: '16 / 9' }}
        >
          {sliderImages.map((img, idx) => (
            <img 
              key={img} 
              src={img} 
              alt={`Slide ${idx + 1}`} 
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {sliderImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-3 h-3 rounded-full ${idx === currentSlide ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
          <button onClick={prevSlide} className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full">
            &#10094;
          </button>
          <button onClick={nextSlide} className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full">
            &#10095;
          </button>
        </div>

        {/* Hero Welcome */}
      <div className="bhu-gradient p-10 rounded-2xl text-white shadow-xl relative overflow-hidden border-2 border-secondary">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold">Welcome back, {userData?.full_name}!</h1>
          <p className="mt-2 text-white/80 text-lg">{userData?.degree} • {userData?.course} • Year {userData?.current_year}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Timetable */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-primary">Today's Schedule</h3>
          
          <div className="space-y-4">
            {todayClasses.length === 0 && (
              <div className="p-6 rounded-2xl border-2 border-secondary bg-white text-sm text-muted">
                No classes scheduled today for your profile.
              </div>
            )}
            {todayClasses.map((item, i) => (
              <div key={item.id} className="p-6 rounded-2xl bg-white border-2 border-secondary flex items-center justify-between hover:translate-x-1 transition-transform cursor-pointer">
                <div className="flex items-center space-x-6">
                  <div className="text-center w-20">
                    <p className="text-xs font-bold text-muted uppercase">{item.time_start}</p>
                    <div className="h-4 w-[1px] bg-secondary mx-auto my-1"></div>
                    <p className="text-xs font-bold text-muted uppercase">{item.time_end}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-primary">{item.subject}</h4>
                    <p className="text-sm text-muted">Room {item.room_number} • {item.teacher_name}</p>
                  </div>
                </div>
                {i === 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                    Ongoing
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notices & Recommendations */}
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold text-primary mb-4">Recent Notices</h3>
            <div className="space-y-3">
              {notices.map(notice => (
                <div key={notice.id} className="p-4 bg-white border-2 border-secondary rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-primary rounded uppercase tracking-tighter">
                      {notice.category}
                    </span>
                    <span className="text-[10px] font-medium text-muted">{new Date(notice.created_at).toLocaleDateString()}</span>
                  </div>
                  <h5 className="font-bold text-sm mt-1 text-primary">{notice.title}</h5>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-primary mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-4 bg-white border-2 border-secondary rounded-2xl">
                  <h5 className="font-bold text-sm text-primary">{rec.name}</h5>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;

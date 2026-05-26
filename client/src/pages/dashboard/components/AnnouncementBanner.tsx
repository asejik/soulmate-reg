import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';
import { getAuthSession } from '../../../lib/api';

interface Announcement {
  id: string;
  title: string;
  image_url: string;
}

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const session = await getAuthSession();
        const activeProg = localStorage.getItem('tai_active_program') || '';
        
        // We will fetch announcements from the backend
        const res = await fetch(`${API_BASE_URL}/lms/announcements?program=${activeProg}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      }
    };
    fetchAnnouncements();
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-4">
      {announcements.map(ann => (
        <div key={ann.id} className="w-full bg-[#111827] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src={ann.image_url} 
            alt={ann.title} 
            className="w-full h-auto object-cover"
          />
        </div>
      ))}
    </div>
  );
};

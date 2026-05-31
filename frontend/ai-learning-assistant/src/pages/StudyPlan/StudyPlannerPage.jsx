import { useState } from 'react';
import { useNavigate } from 'react-router-dom';        // ← Thêm dòng này
import studyPlanService from '../../services/studyPlanService';
import toast from 'react-hot-toast';                    // ← Nên dùng toast thay alert

const StudyPlannerPage = () => {
  const navigate = useNavigate();                       // ← Thêm dòng này

  const [form, setForm] = useState({
    title: '',
    goal: '',
    durationMonths: 3,
    dailyHours: 2
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.goal) {
      toast.error('Vui lòng nhập đầy đủ tên kế hoạch và mục tiêu!');
      return;
    }

    setLoading(true);

    try {
      const data = await studyPlanService.create(form);
      
      toast.success('🎉 Đã tạo kế hoạch học tập thành công!');
      console.log('Study Plan created:', data);

      // Chuyển sang trang chi tiết kế hoạch
      navigate(`/study-plans/${data._id}`);

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Tạo Kế Hoạch Học Tập</h1>

      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">Tên kế hoạch</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Ví dụ: IELTS 7.0 trong 6 tháng"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Mục tiêu cụ thể</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            rows={5}
            placeholder="Học IELTS đạt 7.0, tập trung Speaking và Writing..."
            value={form.goal}
            onChange={e => setForm({...form, goal: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium">Thời gian (tháng)</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={form.durationMonths}
              onChange={e => setForm({...form, durationMonths: +e.target.value})}
              min="1"
              max="12"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Giờ học mỗi ngày</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={form.dailyHours}
              onChange={e => setForm({...form, dailyHours: +e.target.value})}
              min="1"
              max="10"
              required
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang tạo kế hoạch bằng AI..." : "Tạo Kế Hoạch Học Tập"}
        </button>
      </div>
    </div>
  );
};

export default StudyPlannerPage;
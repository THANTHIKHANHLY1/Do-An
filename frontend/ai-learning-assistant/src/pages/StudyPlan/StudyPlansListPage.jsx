import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studyPlanService from '../../services/studyPlanService';
import toast from 'react-hot-toast';
import { Calendar, Plus, Trash2, Eye } from 'lucide-react';

const StudyPlansListPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await studyPlanService.getAll();
      setPlans(data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;
    
    try {
      await studyPlanService.delete(id);
      toast.success('Đã xóa kế hoạch');
      fetchPlans(); // Refresh list
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  if (loading) return <div className="text-center py-20">Đang tải danh sách...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kế Hoạch Học Tập Của Tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý tất cả kế hoạch học tập</p>
        </div>
        <button
          onClick={() => navigate('/study-planner')}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Tạo kế hoạch mới
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">Bạn chưa có kế hoạch nào</p>
          <button
            onClick={() => navigate('/study-planner')}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700"
          >
            Tạo kế hoạch đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className="bg-white rounded-3xl shadow hover:shadow-xl transition p-6 border border-gray-100">
              <div className="flex justify-between">
                <h3 className="font-semibold text-lg line-clamp-2">{plan.title}</h3>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-gray-600 text-sm mt-3 line-clamp-2">{plan.goal}</p>

              <div className="mt-6 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{plan.durationMonths} tháng</span>
                </div>
                <div className="font-semibold text-purple-600">
                  {plan.progress}%
                </div>
              </div>

              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all"
                  style={{ width: `${plan.progress}%` }}
                />
              </div>

              <button
                onClick={() => navigate(`/study-plans/${plan._id}`)}
                className="mt-6 w-full bg-gray-900 text-white py-3.5 rounded-2xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                Xem chi tiết kế hoạch
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlansListPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studyPlanService from '../../services/studyPlanService';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle, Clock, Trash2, ArrowLeft } from 'lucide-react';

const StudyPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      const data = await studyPlanService.getById(id);
      setPlan(data);
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy kế hoạch hoặc đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (taskIndex, currentCompleted) => {
    setUpdating(true);
    try {
      const newCompleted = !currentCompleted;
      await studyPlanService.updateTask(id, taskIndex, { 
        completed: newCompleted 
      });
      
      toast.success(newCompleted ? 'Đã hoàn thành!' : 'Chưa hoàn thành');
      fetchPlan(); // Refresh data
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;
    
    try {
      await studyPlanService.delete(id);
      toast.success('Đã xóa kế hoạch thành công');
      navigate('/study-planner');
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  if (loading) return <div className="text-center py-20">Đang tải kế hoạch...</div>;
  if (!plan) return <div className="text-center py-20 text-red-500">Không tìm thấy kế hoạch</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button 
        onClick={() => navigate('/study-planner')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} /> Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
            <p className="text-lg text-gray-600 mt-2">{plan.goal}</p>
          </div>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 p-2"
          >
            <Trash2 size={24} />
          </button>
        </div>

        <div className="flex gap-8 mt-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Thời gian</p>
              <p className="font-semibold">{plan.durationMonths} tháng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-2xl">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mỗi ngày</p>
              <p className="font-semibold">{plan.dailyHours} giờ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiến độ</p>
              <p className="font-semibold text-2xl text-purple-600">{plan.progress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 bg-white rounded-2xl p-6 shadow">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${plan.progress}%` }}
          />
        </div>
      </div>

      {/* Weeks & Tasks */}
      <div className="space-y-8">
        {plan.plan?.map((week, weekIndex) => (
          <div key={weekIndex} className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
              📅 Tuần {week.week}
            </h3>
            
            <div className="space-y-4">
              {week.tasks.map((task, taskIndex) => {
                const globalTaskIndex = plan.plan
                  .slice(0, weekIndex)
                  .reduce((sum, w) => sum + w.tasks.length, 0) + taskIndex;

                return (
                  <div 
                    key={taskIndex}
                    className={`p-5 rounded-xl border transition-all ${
                      task.completed 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskComplete(globalTaskIndex, task.completed)}
                        disabled={updating}
                        className="mt-1 w-5 h-5 accent-green-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          ⏱ {task.hours} giờ
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyPlanDetail;
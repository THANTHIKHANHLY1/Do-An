import express from 'express';
import StudyPlan from '../models/StudyPlan.js';
import { generateStudyPlan } from '../utils/geminiService.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

// TẠO KẾ HOẠCH HỌC TẬP (AI sinh)
router.post('/', async (req, res) => {
  try {
    const { title, goal, durationMonths, dailyHours } = req.body;
    
    const aiPlan = await generateStudyPlan({ goal, durationMonths, dailyHours });
    
    const studyPlan = new StudyPlan({
      user: req.user.id,
      title,
      goal,
      durationMonths,
      dailyHours,
      plan: aiPlan.weeks,
      totalTasks: aiPlan.totalTasks
    });

    await studyPlan.save();
    res.status(201).json(studyPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// LẤY TẤT CẢ KẾ HOẠCH CỦA USER
router.get('/', async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user.id });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LẤY CHI TIẾT 1 KẾ HOẠCH
router.get('/:id', async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CẬP NHẬT TIẾN ĐỘ TASK
router.put('/:id/task/:taskIndex', async (req, res) => {
  try {
    const { completed, note } = req.body;
    const plan = await StudyPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
    }

    // Lấy tất cả tasks theo thứ tự
    const allTasks = plan.plan.flatMap(w => w.tasks);
    const taskIndex = parseInt(req.params.taskIndex);
    
    if (taskIndex >= 0 && taskIndex < allTasks.length) {
      const task = allTasks[taskIndex];
      task.completed = completed;
      
      if (note !== undefined) task.note = note;
      if (completed) task.completedAt = new Date();

      // Tính lại tiến độ
      plan.completedTasks = allTasks.filter(t => t.completed).length;
      plan.progress = Math.round((plan.completedTasks / plan.totalTasks) * 100);
      
      await plan.save();
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// XÓA KẾ HOẠCH
router.delete('/:id', async (req, res) => {
  try {
    await StudyPlan.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    res.json({ message: 'Đã xóa kế hoạch thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
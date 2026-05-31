const StudyPlan = require("../models/StudyPlan");

const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

// GEMINI CONFIG
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// TẠO KẾ HOẠCH HỌC TẬP AI
const createStudyPlan = async (req, res) => {

  try {

    const {
      title,
      goal,
      durationMonths,
      dailyHours,
    } = req.body;

    // PROMPT AI
    const prompt = `
    Hãy tạo kế hoạch học tập chi tiết.

    Mục tiêu: ${goal}
    Thời gian: ${durationMonths} tháng
    Số giờ học mỗi ngày: ${dailyHours} giờ

    Trả về JSON duy nhất theo format:

    {
      "weeks": [
        {
          "weekNumber": 1,
          "tasks": [
            {
              "title": "",
              "description": "",
              "estimatedHours": 2
            }
          ]
        }
      ]
    }

    Không giải thích.
    Không markdown.
    Chỉ trả JSON.
    `;

    // GỌI GEMINI
    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    // LÀM SẠCH JSON
    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // LẤY JSON
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Không tìm thấy JSON");
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // LƯU MONGODB
    const studyPlan = await StudyPlan.create({

      user: req.user.id,

      title,

      goal,

      durationMonths,

      dailyHours,

      weeks: aiResult.weeks,
    });

    res.status(201).json(studyPlan);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Lỗi tạo kế hoạch học tập",
    });
  }
};

// LẤY DANH SÁCH KẾ HOẠCH
const getStudyPlans = async (req, res) => {

  try {

    const plans = await StudyPlan.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.json(plans);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// LẤY CHI TIẾT KẾ HOẠCH
const getStudyPlanById = async (req, res) => {

  try {

    const plan = await StudyPlan.findById(
      req.params.id
    );

    if (!plan) {

      return res.status(404).json({
        message: "Không tìm thấy kế hoạch",
      });
    }

    res.json(plan);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// CẬP NHẬT TIẾN ĐỘ TASK
const updateTaskProgress = async (req, res) => {

  try {

    const { weekId, taskId } = req.params;

    const { completed, note } = req.body;

    const plan = await StudyPlan.findById(
      req.params.planId
    );

    if (!plan) {

      return res.status(404).json({
        message: "Không tìm thấy kế hoạch",
      });
    }

    // TÌM WEEK VÀ TASK
    const week = plan.weeks.id(weekId);

    const task = week.tasks.id(taskId);

    if (!task) {

      return res.status(404).json({
        message: "Không tìm thấy task",
      });
    }

    // CẬP NHẬT
    task.completed = completed;

    task.note = note;

    if (completed) {

      task.completedAt = new Date();

    } else {

      task.completedAt = null;
    }

    // TÍNH PROGRESS
    let totalTasks = 0;

    let completedTasks = 0;

    plan.weeks.forEach((week) => {

      week.tasks.forEach((task) => {

        totalTasks++;

        if (task.completed) {
          completedTasks++;
        }
      });
    });

    plan.progress = Math.round(
      (completedTasks / totalTasks) * 100
    );

    await plan.save();

    res.json(plan);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Lỗi cập nhật tiến độ",
    });
  }
};

// XÓA KẾ HOẠCH
const deleteStudyPlan = async (req, res) => {

  try {

    const plan = await StudyPlan.findById(
      req.params.id
    );

    if (!plan) {

      return res.status(404).json({
        message: "Không tìm thấy kế hoạch",
      });
    }

    await plan.deleteOne();

    res.json({
      message: "Đã xóa kế hoạch",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// EXPORT
module.exports = {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanById,
  updateTaskProgress,
  deleteStudyPlan,
};
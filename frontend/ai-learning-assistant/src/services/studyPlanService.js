import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const createStudyPlan = async (planData) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.STUDY_PLANS.CREATE(), 
      planData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create study plan' };
  }
};

const getAllStudyPlans = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.STUDY_PLANS.GET_ALL());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch study plans' };
  }
};

const getStudyPlanById = async (id) => {
  try {
    const response = await axiosInstance.get(API_PATHS.STUDY_PLANS.GET_BY_ID(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch study plan' };
  }
};

const updateStudyPlanTask = async (planId, taskIndex, updateData) => {
  try {
    const response = await axiosInstance.put(
      API_PATHS.STUDY_PLANS.UPDATE_TASK(planId, taskIndex), 
      updateData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update task' };
  }
};

const deleteStudyPlan = async (id) => {
  try {
    const response = await axiosInstance.delete(API_PATHS.STUDY_PLANS.DELETE(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete study plan' };
  }
};

const studyPlanService = {
  create: createStudyPlan,
  getAll: getAllStudyPlans,
  getById: getStudyPlanById,
  updateTask: updateStudyPlanTask,
  delete: deleteStudyPlan,
};

export default studyPlanService;
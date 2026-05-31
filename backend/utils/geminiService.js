import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
  console.error('LỖI NGHIÊM TRỌNG: GEMINI_API_KEY chưa được thiết lập trong biến môi trường.');
  process.exit(1);
}


/**
 * Tạo bộ thẻ ghi nhớ từ văn bản
 * @param {string} text - Nội dung tài liệu
 * @param {number} count - Số lượng flashcard cần tạo
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Hãy tạo chính xác ${count} thẻ ghi nhớ (flashcard) từ nội dung dưới đây.

Định dạng mỗi flashcard như sau:
Q: [Câu hỏi rõ ràng, cụ thể bằng tiếng Việt]
A: [Câu trả lời ngắn gọn, chính xác bằng tiếng Việt]
D: [Mức độ khó: easy, medium hoặc hard]

Phân tách mỗi flashcard bằng "---".

Yêu cầu:
- Toàn bộ câu hỏi và câu trả lời phải bằng tiếng Việt.
- Nội dung chính xác, dễ hiểu và bám sát vào nội dung tài liệu.
- Tập trung vào các kiến thức quan trọng nhất.
- Không thêm bất kỳ giải thích nào ngoài định dạng yêu cầu.

Văn bản:
${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;

    // Phân tích phản hồi từ Gemini
    const flashcards = [];
    const cards = generatedText.split('---').filter(c => c.trim());

    for (const card of cards) {
      const lines = card.trim().split('\n');
      let question = '';
      let answer = '';
      let difficulty = 'medium';

      for (const line of lines) {
        if (line.startsWith('Q:')) {
          question = line.substring(2).trim();
        } else if (line.startsWith('A:')) {
          answer = line.substring(2).trim();
        } else if (line.startsWith('D:')) {
          const diff = line.substring(2).trim().toLowerCase();

          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && answer) {
        flashcards.push({
          question,
          answer,
          difficulty
        });
      }
    }

    return flashcards.slice(0, count);
  } catch (error) {
    console.error('Lỗi Gemini API:', error);
    throw new Error('Không thể tạo flashcard');
  }
};

/**
 * Tạo bộ câu hỏi trắc nghiệm
 * @param {string} text - Nội dung tài liệu
 * @param {number} numQuestions - Số lượng câu hỏi
 * @returns {Promise<Array<{question: string, options: Array, correctAnswer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Hãy tạo chính xác ${numQuestions} câu hỏi trắc nghiệm từ nội dung dưới đây.

Định dạng mỗi câu hỏi như sau:
Q: [Câu hỏi bằng tiếng Việt]
O1: [Phương án 1]
O2: [Phương án 2]
O3: [Phương án 3]
O4: [Phương án 4]
C: [Đáp án đúng - ghi chính xác như một trong các phương án ở trên]
E: [Giải thích ngắn gọn bằng tiếng Việt]
D: [Mức độ khó: easy, medium hoặc hard]

Phân tách các câu hỏi bằng "---".

Yêu cầu:
- Toàn bộ câu hỏi, phương án và giải thích phải bằng tiếng Việt.
- Chỉ có một đáp án đúng.
- Các phương án nhiễu phải hợp lý.
- Nội dung bám sát tài liệu được cung cấp.
- Không thêm bất kỳ văn bản nào ngoài định dạng yêu cầu.

Văn bản:
${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;

    const questions = [];
    const questionBlocks = generatedText.split('---').filter(q => q.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n');

      let question = '';
      let options = [];
      let correctAnswer = '';
      let explanation = '';
      let difficulty = 'medium';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('Q:')) {
          question = trimmed.substring(2).trim();
        } else if (trimmed.match(/^O\d:/)) {
          options.push(trimmed.substring(3).trim());
        } else if (trimmed.startsWith('C:')) {
          correctAnswer = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('E:')) {
          explanation = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('D:')) {
          const diff = trimmed.substring(2).trim().toLowerCase();

          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && options.length === 4 && correctAnswer) {
        questions.push({
          question,
          options,
          correctAnswer,
          explanation,
          difficulty
        });
      }
    }

    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error('Lỗi Gemini API:', error);
    throw new Error('Không thể tạo câu hỏi trắc nghiệm');
  }
};

/**
 * Tạo bản tóm tắt tài liệu
 * @param {string} text - Nội dung tài liệu
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
  const prompt = `Hãy tóm tắt nội dung dưới đây bằng tiếng Việt.

Yêu cầu:
- Trình bày ngắn gọn, rõ ràng và dễ hiểu.
- Nêu bật các khái niệm chính, ý tưởng trọng tâm và những điểm quan trọng.
- Có thể chia thành các gạch đầu dòng nếu phù hợp.
- Đưa ra bản tóm tắt khoa học, dễ hiểu, đưa ra các ví dụ nếu cần thiết

Nội dung:
${text.substring(0, 20000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;
    return generatedText;
  } catch (error) {
    console.error('Lỗi Gemini API:', error);
    throw new Error('Không thể tạo bản tóm tắt');
  }
};

/**
 * Trò chuyện dựa trên ngữ cảnh tài liệu
 * @param {string} question - Câu hỏi của người dùng
 * @param {Array<Object>} chunks - Các đoạn nội dung liên quan của tài liệu
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
  const context = chunks
    .map((c, i) => `[Đoạn ${i + 1}]\n${c.content}`)
    .join('\n\n');

  const prompt = `Dựa trên ngữ cảnh được trích xuất từ tài liệu dưới đây, hãy phân tích nội dung và trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn và dễ hiểu bằng tiếng Việt.

Yêu cầu:
- Sử dụng thông tin có trong ngữ cảnh được cung cấp.
- Trả lời rõ ràng, đúng trọng tâm.
- Nếu câu trả lời không có trong tài liệu, hãy trả lời: "Không tìm thấy thông tin này trong tài liệu."
- Không tự suy diễn hoặc bổ sung thông tin ngoài ngữ cảnh.

Ngữ cảnh:
${context}

Câu hỏi:
${question}

Trả lời:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;
    return generatedText;
  } catch (error) {
    console.error('Lỗi Gemini API:', error);
    throw new Error('Không thể xử lý yêu cầu trò chuyện');
  }
};

/**
 * Giải thích một khái niệm cụ thể
 * @param {string} concept - Khái niệm cần giải thích
 * @param {string} context - Ngữ cảnh liên quan
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
  const prompt = `Dựa trên ngữ cảnh dưới đây, hãy giải thích khái niệm "${concept}" bằng tiếng Việt.

Yêu cầu:
- Giải thích rõ ràng, dễ hiểu và mang tính giáo dục.
- Sử dụng ngôn ngữ đơn giản, phù hợp cho người học.
- Tập trung vào nội dung có trong tài liệu.
- Đưa ra ví dụ minh họa nếu phù hợp.
- Có thể trình bày theo các mục hoặc gạch đầu dòng để dễ đọc.
- Nếu tài liệu không chứa thông tin về khái niệm này, hãy trả lời: "Không tìm thấy thông tin về khái niệm này trong tài liệu."

Ngữ cảnh:
${context.substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;
    return generatedText;
  } catch (error) {
    console.error('Lỗi Gemini API:', error);
    throw new Error('Không thể giải thích khái niệm');
  }
};

/**
 * Tạo kế hoạch học tập chi tiết bằng AI
 * @param {Object} params - Các tham số kế hoạch học tập
 * @param {string} params.goal - Mục tiêu học tập
 * @param {number} params.durationMonths - Số tháng học
 * @param {number} params.dailyHours - Số giờ học mỗi ngày
 * @returns {Promise<Object>} - Trả về đối tượng chứa các tuần học và nhiệm vụ
 */
export const generateStudyPlan = async ({ goal, durationMonths, dailyHours }) => {
  const prompt = `
Bạn là một chuyên gia giáo dục AI. Hãy tạo một kế hoạch học tập CHI TIẾT, thực tế và có tính khả thi cao.

**Thông tin đầu vào:**
- Mục tiêu: "${goal}"
- Thời gian: ${durationMonths} tháng
- Học ${dailyHours} giờ mỗi ngày

**Yêu cầu output:**
Trả về **chỉ một JSON object** hợp lệ, không có bất kỳ text nào khác, theo đúng cấu trúc sau:

{
  "weeks": [
    {
      "week": 1,
      "topics": ["Chủ đề 1", "Chủ đề 2"],
      "tasks": [
        {
          "title": "Tên nhiệm vụ cụ thể",
          "description": "Mô tả chi tiết những gì cần làm",
          "hours": 2.5
        }
      ]
    }
  ],
  "totalTasks": 45
}

**Hướng dẫn tạo kế hoạch:**
- Phân bổ đều theo ${durationMonths} tháng (${Math.round(durationMonths * 4.3)} tuần)
- Mỗi tuần nên có 5-8 tasks
- Tổng số tasks hợp lý với thời gian học ${dailyHours} giờ/ngày
- Tasks phải cụ thể, dễ theo dõi và có thể đánh dấu hoàn thành
- Bao gồm cả ôn tập, thực hành và kiểm tra tiến độ
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text.trim();

    // Xử lý chuỗi JSON (đôi khi Gemini trả về kèm định dạng markdown)
    let jsonStr = generatedText;
    if (generatedText.includes('```json')) {
      jsonStr = generatedText.split('```json')[1].split('```')[0].trim();
    } else if (generatedText.includes('```')) {
      jsonStr = generatedText.split('```')[1].split('```')[0].trim();
    }

    const studyPlan = JSON.parse(jsonStr);
    return studyPlan;

  } catch (error) {
    console.error('Lỗi Gemini API trong generateStudyPlan:', error);
    throw new Error('Không thể tạo kế hoạch học tập. Vui lòng thử lại.');
  }
};
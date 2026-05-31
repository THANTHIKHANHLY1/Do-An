import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

/**
 * Trích xuất văn bản từ tệp PDF
 * @param {string} filePath - Đường dẫn tới tệp PDF
 * @returns {Promise<{text: string, numPages: number}>}
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);

    // pdf-parse yêu cầu Uint8Array thay vì Buffer
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getText();

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("Lỗi phân tích PDF:", error);
    throw new Error("Không thể trích xuất văn bản từ tệp PDF");
  }
};
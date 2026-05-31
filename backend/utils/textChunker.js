/**
 * Chia văn bản thành các đoạn nhỏ để AI xử lý hiệu quả hơn
 * @param {string} text - Toàn bộ văn bản cần chia
 * @param {number} chunkSize - Kích thước mục tiêu của mỗi đoạn (tính theo số từ)
 * @param {number} overlap - Số từ được lặp lại giữa các đoạn
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}>}
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Làm sạch văn bản nhưng vẫn giữ cấu trúc đoạn văn
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim();

  // Thử chia theo các đoạn văn (một hoặc nhiều dòng trống)
  const paragraphs = cleanedText.split(/\n+/).filter(p => p.trim().length > 0);
  
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.trim().split(/\s+/);
    const paragraphWordCount = paragraphWords.length;
    
    // Nếu một đoạn văn vượt quá kích thước cho phép thì chia theo từ
    if (paragraphWordCount > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.join('\n\n'),
          chunkIndex: chunkIndex++,
          pageNumber: 0
        });
        currentChunk = [];
        currentWordCount = 0;
      }
      
      // Chia đoạn văn lớn thành các đoạn nhỏ dựa trên số từ
      for (let i = 0; i < paragraphWords.length; i += (chunkSize - overlap)) {
        const chunkWords = paragraphWords.slice(i, i + chunkSize);
        chunks.push({
          content: chunkWords.join(' '),
          chunkIndex: chunkIndex++,
          pageNumber: 0
        });
        
        if (i + chunkSize >= paragraphWords.length) break;
      }
      continue;
    }
    
    // Nếu thêm đoạn văn này làm vượt kích thước cho phép thì lưu đoạn hiện tại
    if (currentWordCount + paragraphWordCount > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join('\n\n'),
        chunkIndex: chunkIndex++,
        pageNumber: 0
      });
      
      // Tạo phần chồng lặp từ đoạn trước
      const prevChunkText = currentChunk.join(' ');
      const prevWords = prevChunkText.split(/\s+/);
      const overlapText = prevWords.slice(-Math.min(overlap, prevWords.length)).join(' ');
      
      currentChunk = [overlapText, paragraph.trim()];
      currentWordCount = overlapText.split(/\s+/).length + paragraphWordCount;
    } else {
      // Thêm đoạn văn vào đoạn hiện tại
      currentChunk.push(paragraph.trim());
      currentWordCount += paragraphWordCount;
    }
  }

  // Thêm đoạn cuối cùng
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join('\n\n'),
      chunkIndex: chunkIndex,
      pageNumber: 0
    });
  }

  // Phương án dự phòng: nếu chưa tạo được đoạn nào thì chia theo từ
  if (chunks.length === 0 && cleanedText.length > 0) {
    const allWords = cleanedText.split(/\s+/);

    for (let i = 0; i < allWords.length; i += (chunkSize - overlap)) {
      const chunkWords = allWords.slice(i, i + chunkSize);

      chunks.push({
        content: chunkWords.join(' '),
        chunkIndex: chunkIndex++,
        pageNumber: 0
      });
      
      if (i + chunkSize >= allWords.length) break;
    }
  }

  return chunks;
};


/**
 * Tìm các đoạn nội dung liên quan dựa trên việc khớp từ khóa
 * @param {Array<Object>} chunks - Danh sách các đoạn nội dung
 * @param {string} query - Từ khóa tìm kiếm
 * @param {number} maxChunks - Số lượng đoạn tối đa trả về
 * @returns {Array<Object>}
 */
export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
  if (!chunks || chunks.length === 0 || !query) {
    return [];
  }

  // Các từ phổ biến sẽ bị loại bỏ khỏi quá trình tìm kiếm
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it'
  ]);

  // Trích xuất và làm sạch các từ khóa tìm kiếm
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  if (queryWords.length === 0) {
    // Trả về các đối tượng sạch, không chứa metadata của Mongoose
    return chunks.slice(0, maxChunks).map(chunk => ({
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      _id: chunk._id
    }));
  }

  const scoredChunks = chunks.map((chunk, index) => {
    const content = chunk.content.toLowerCase();
    const contentWords = content.split(/\s+/).length;
    let score = 0;

    // Tính điểm cho từng từ khóa
    for (const word of queryWords) {
      // Khớp chính xác (điểm cao hơn)
      const exactMatches = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      score += exactMatches * 3;

      // Khớp một phần (điểm thấp hơn)
      const partialMatches = (content.match(new RegExp(word, 'g')) || []).length;
      score += Math.max(0, partialMatches - exactMatches) * 1.5;
    }

    // Điểm thưởng nếu tìm thấy nhiều từ khóa
    const uniqueWordsFound = queryWords.filter(word =>
      content.includes(word)
    ).length;

    if (uniqueWordsFound > 1) {
      score += uniqueWordsFound * 2;
    }

    // Chuẩn hóa điểm theo độ dài nội dung
    const normalizedScore = score / Math.sqrt(contentWords);

    // Thưởng nhẹ cho các đoạn xuất hiện sớm hơn
    const positionBonus = 1 - (index / chunks.length) * 0.1;

    // Trả về đối tượng sạch, không chứa metadata của Mongoose
    return {
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      _id: chunk._id,
      score: normalizedScore * positionBonus,
      rawScore: score,
      matchedWords: uniqueWordsFound
    };
  });

  return scoredChunks
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.matchedWords !== a.matchedWords) {
        return b.matchedWords - a.matchedWords;
      }
      return a.chunkIndex - b.chunkIndex;
    })
    .slice(0, maxChunks);
};
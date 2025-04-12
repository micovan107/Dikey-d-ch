// Thêm thư viện Tesseract.js
const script = document.createElement('script');
script.src = 'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js';
document.head.appendChild(script);

// Xử lý chuyển đổi chế độ dịch
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        document.getElementById('textTranslation').style.display = mode === 'text' ? 'flex' : 'none';
        document.getElementById('imageTranslation').style.display = mode === 'image' ? 'flex' : 'none';
    });
});

// Xử lý kéo thả ảnh
const imageUploadArea = document.querySelector('.image-upload-area');
imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = '#DD2476';
    imageUploadArea.style.background = 'rgba(255,255,255,0.95)';
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.style.borderColor = 'rgba(221,36,118,0.3)';
    imageUploadArea.style.background = 'rgba(255,255,255,0.9)';
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

// Xử lý tải ảnh lên
document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

// Hàm xử lý ảnh được tải lên
async function handleImageUpload(file) {
    const uploadedImage = document.getElementById('uploadedImage');
    const imageText = document.getElementById('imageText');
    const translatedImageText = document.getElementById('translatedImageText');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    
    // Hiển thị ảnh và nút xóa
    uploadedImage.src = URL.createObjectURL(file);
    uploadedImage.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
    
    // Thêm nút xóa ảnh
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.style.position = 'absolute';
    deleteButton.style.top = '10px';
    deleteButton.style.right = '10px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.background = 'none';
    deleteButton.style.border = 'none';
    deleteButton.style.fontSize = '16px';
    deleteButton.style.color = '#000';
    deleteButton.onclick = function() {
        uploadedImage.src = '';
        uploadedImage.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
        imageText.value = '';
        translatedImageText.value = '';
        deleteButton.remove();
    };
    const imageContainer = uploadedImage.parentElement;
    imageContainer.style.position = 'relative';
    imageContainer.appendChild(deleteButton);
    
    // Trích xuất văn bản từ ảnh
    imageText.value = 'Đang trích xuất văn bản từ ảnh...';
    translatedImageText.value = '';
    
    try {
        const result = await Tesseract.recognize(file);
        const extractedText = result.data.text.trim();
        imageText.value = extractedText;
        
        // Tự động dịch văn bản đã trích xuất
        if (extractedText) {
            await translateImageText(extractedText);
        }
    } catch (error) {
        console.error('Lỗi khi trích xuất văn bản:', error);
        imageText.value = 'Có lỗi xảy ra khi trích xuất văn bản từ ảnh.';
        showNotification('Có lỗi xảy ra khi trích xuất văn bản từ ảnh.', 'error');
    }
}

// Hàm dịch văn bản từ ảnh
async function translateImageText(text) {
    const targetLanguage = document.getElementById('imageTargetLanguage').value;
    const translatedImageText = document.getElementById('translatedImageText');
    
    translatedImageText.value = 'Đang dịch.không phải vộị...';
    
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        const translatedText = data[0].map(item => item[0]).join('');
        translatedImageText.value = translatedText;
        showNotification('Dịch thành công!', 'success');
    } catch (error) {
        console.error('Lỗi khi dịch:', error);
        translatedImageText.value = 'Có lỗi xảy ra khi dịch văn bản.';
        showNotification('Có lỗi xảy ra khi dịch văn bản.', 'error');
    }
}

// Tự động dịch khi thay đổi ngôn ngữ đích cho ảnh
document.getElementById('imageTargetLanguage').addEventListener('change', () => {
    const imageText = document.getElementById('imageText').value;
    if (imageText.trim()) {
        translateImageText(imageText);
    }
});

// Khởi tạo mảng lưu trữ lịch sử dịch
let translationHistory = [];

// Hàm lưu lịch sử dịch
function saveToHistory(sourceText, translatedText, sourceLang, targetLang) {
    const historyItem = {
        sourceText,
        translatedText,
        sourceLang,
        targetLang,
        timestamp: new Date().toLocaleString()
    };
    translationHistory.unshift(historyItem);
    if (translationHistory.length > 10) {
        translationHistory.pop();
    }
    updateHistoryUI();
}

// Hàm cập nhật giao diện lịch sử
function updateHistoryUI() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) {
        // Tạo container cho lịch sử dịch
        const container = document.createElement('div');
        container.id = 'historyContainer';
        container.style.marginTop = '20px';
        container.style.padding = '15px';
        container.style.background = 'rgba(255, 255, 255, 0.95)';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

        // Thêm tiêu đề
        const title = document.createElement('h3');
        title.textContent = 'Lịch sử dịch';
        title.style.marginBottom = '15px';
        title.style.color = '#333';
        container.appendChild(title);

        // Thêm danh sách lịch sử
        const historyList = document.createElement('div');
        historyList.id = 'historyList';
        container.appendChild(historyList);

        // Thêm container vào trang
        document.querySelector('.container').appendChild(container);
    }

    // Cập nhật danh sách lịch sử
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    translationHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.style.padding = '10px';
        historyItem.style.marginBottom = '10px';
        historyItem.style.borderBottom = '1px solid #eee';
        historyItem.style.cursor = 'pointer';

        historyItem.innerHTML = `
            <div style="color: #666; font-size: 0.9em; margin-bottom: 5px">${item.timestamp}</div>
            <div style="margin-bottom: 5px"><strong>Văn bản gốc:</strong> ${item.sourceText.substring(0, 50)}${item.sourceText.length > 50 ? '...' : ''}</div>
            <div><strong>Bản dịch:</strong> ${item.translatedText.substring(0, 50)}${item.translatedText.length > 50 ? '...' : ''}</div>
        `;

        // Thêm sự kiện click để tải lại bản dịch
        historyItem.onclick = () => {
            document.getElementById('sourceText').value = item.sourceText;
            document.getElementById('sourceLanguage').value = item.sourceLang;
            document.getElementById('targetLanguage').value = item.targetLang;
            translateText();
        };

        historyList.appendChild(historyItem);
    });
}

// Cập nhật hàm translateText để lưu lịch sử
async function translateText() {
    const sourceText = document.getElementById('sourceText').value;
    const sourceLanguage = document.getElementById('sourceLanguage').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    const targetTextArea = document.getElementById('translatedText');
    const translateButton = document.querySelector('button');

    if (!sourceText) {
        showNotification('Vui lòng nhập văn bản cần dịch!', 'error');
        return;
    }

    translateButton.classList.add('loading');
    translateButton.disabled = true;
    targetTextArea.value = 'Đang dịch.không phải vội...';
    targetTextArea.classList.add('translating');

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(sourceText)}`;
        const response = await fetch(url);
        const data = await response.json();
        const translatedText = data[0].map(item => item[0]).join('');

        setTimeout(() => {
            targetTextArea.value = translatedText;
            targetTextArea.classList.remove('translating');
            translateButton.classList.remove('loading');
            translateButton.disabled = false;

            // Lưu vào lịch sử
            saveToHistory(sourceText, translatedText, sourceLanguage, targetLanguage);

            showNotification('Dịch thành công!', 'success');
        }, 500);
    } catch (error) {
        console.error('Lỗi khi dịch:', error);
        showNotification('Có lỗi xảy ra khi dịch văn bản. Vui lòng thử lại sau.', 'error');
        targetTextArea.classList.remove('translating');
        translateButton.classList.remove('loading');
        translateButton.disabled = false;
    }
}

// Hàm debounce để trì hoãn việc gọi hàm
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tạo phiên bản debounced của hàm dịch
const debouncedTranslate = debounce(() => {
    const sourceText = document.getElementById('sourceText').value.trim();
    if (sourceText) {
        translateText();
    }
}, 1000);

// Thêm sự kiện cho việc nhập text và phím Enter
const sourceTextArea = document.getElementById('sourceText');
sourceTextArea.addEventListener('input', function() {
    if (!this.value.trim()) {
        document.getElementById('translatedText').value = '';
    }
    debouncedTranslate();
});

// Thêm sự kiện cho việc thay đổi ngôn ngữ nguồn và đích
document.getElementById('sourceLanguage').addEventListener('change', debouncedTranslate);
document.getElementById('targetLanguage').addEventListener('change', debouncedTranslate);
sourceTextArea.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        translateText();
    }
});

// Hàm hiển thị thông báo
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animation hiển thị
    setTimeout(() => notification.classList.add('show'), 100);

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Đảm bảo ngôn ngữ nguồn và đích không trùng nhau
document.getElementById('sourceLanguage').addEventListener('change', function() {
    const targetSelect = document.getElementById('targetLanguage');
    if (this.value === targetSelect.value) {
        // Chọn ngôn ngữ đích khác
        const options = targetSelect.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value !== this.value) {
                targetSelect.value = options[i].value;
                break;
            }
        }
    }
});

// Hàm hiển thị thông báo
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animation hiển thị
    setTimeout(() => notification.classList.add('show'), 100);

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.getElementById('targetLanguage').addEventListener('change', function() {
    const sourceSelect = document.getElementById('sourceLanguage');
    if (this.value === sourceSelect.value) {
        // Chọn ngôn ngữ nguồn khác
        const options = sourceSelect.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value !== this.value) {
                sourceSelect.value = options[i].value;
                break;
            }
        }
    }
});

// Hàm hiển thị thông báo
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animation hiển thị
    setTimeout(() => notification.classList.add('show'), 100);

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Thêm nút sao chép và phát âm cho kết quả dịch văn bản từ ảnh
const translatedImageTextArea = document.getElementById('translatedImageText');
const imageButtonContainer = translatedImageTextArea.parentElement;

// Tạo nút sao chép cho kết quả dịch ảnh
const imageCopyButton = document.createElement('button');
imageCopyButton.innerHTML = '<i class="fas fa-copy"></i>';
imageCopyButton.className = 'action-button';
imageCopyButton.title = 'Sao chép';
imageCopyButton.style.position = 'absolute';
imageCopyButton.style.right = '10px';
imageCopyButton.style.top = '10px';
imageCopyButton.style.padding = '5px';
imageCopyButton.style.background = 'none';
imageCopyButton.style.border = 'none';
imageCopyButton.style.cursor = 'pointer';
imageCopyButton.style.color = '#666';
imageCopyButton.onclick = async () => {
    try {
        await navigator.clipboard.writeText(translatedImageTextArea.value);
        showNotification('Đã sao chép vào clipboard!', 'success');
    } catch (err) {
        showNotification('Không thể sao chép văn bản!', 'error');
    }
};

// Tạo nút phát âm cho kết quả dịch ảnh
const imageSpeakButton = document.createElement('button');
imageSpeakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
imageSpeakButton.className = 'action-button';
imageSpeakButton.title = 'Phát âm';
imageSpeakButton.style.position = 'absolute';
imageSpeakButton.style.right = '40px';
imageSpeakButton.style.top = '10px';
imageSpeakButton.style.padding = '5px';
imageSpeakButton.style.background = 'none';
imageSpeakButton.style.border = 'none';
imageSpeakButton.style.cursor = 'pointer';
imageSpeakButton.style.color = '#666';
imageSpeakButton.onclick = () => {
    const text = translatedImageTextArea.value;
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = document.getElementById('imageTargetLanguage').value;
        window.speechSynthesis.speak(utterance);
    }
};

// Thêm các nút vào container
imageButtonContainer.appendChild(imageCopyButton);
imageButtonContainer.appendChild(imageSpeakButton);

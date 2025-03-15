document.addEventListener('DOMContentLoaded', () => {
    // 初始化按钮波纹效果
    const initButtons = () => {
        document.querySelectorAll('.mdc-button').forEach(button => {
            new mdc.ripple.MDCRipple(button);
        });
    };
    initButtons();

    // 组件引用
    const generateBtn = document.getElementById('generateBtn');
    const imageContainer = document.getElementById('imageContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // 请求控制
    let controller = new AbortController();
    let currentImage = null;

    // 图片生成函数
    async function fetchImage() {
        try {
            loadingOverlay.classList.add('active');
            imageContainer.innerHTML = '';

            // 取消之前的请求
            controller.abort();
            if (currentImage) {
                currentImage.onload = null;
                currentImage.onerror = null;
                currentImage.src = '';
            }

            // 创建新控制器
            controller = new AbortController();

            // 发起请求
            const response = await fetch('https://xiaobapi.top/api/xb/api/pixiv_r18.php', {
                method: 'POST',
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`HTTP错误 ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // 加载图片
            currentImage = new Image();
            currentImage.className = 'generated-image';
            currentImage.alt = data.data[0].title;
            currentImage.src = data.data[0].urls.original;

            await new Promise((resolve, reject) => {
                currentImage.onload = () => {
                    currentImage.style.opacity = '1';
                    resolve();
                };
                currentImage.onerror = () => reject(new Error('图片加载失败'));
            });

            // 构建信息
            const infoHtml = `
                <div class="mdc-typography--body1" style="margin-top: 15px;">
                    <p>标题：${data.data[0].title}</p>
                    <p>作者：${data.data[0].author}</p>
                    <p>标签：${data.data[0].tags.join(', ')}</p>
                </div>
            `;

            // 创建下载按钮
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'mdc-button mdc-button--outlined';
            downloadBtn.innerHTML = `
                <i class="material-icons mdc-button__icon">download</i>
                <span class="mdc-button__label">下载图片</span>
            `;
            downloadBtn.style.marginTop = '15px';
            new mdc.ripple.MDCRipple(downloadBtn);

            downloadBtn.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = currentImage.src;
                a.download = currentImage.src.split('/').pop() || 'image.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

            // 插入内容
            imageContainer.appendChild(currentImage);
            imageContainer.insertAdjacentHTML('beforeend', infoHtml);
            imageContainer.appendChild(downloadBtn);

        } catch (error) {
            if (error.name !== 'AbortError') {
                const errorDetails = `
                    <div class="mdc-typography--body1" style="color: #b00020;">
                        <p>${error.message}</p>
                        <div class="error-details" id="errorDetails">
                            <div class="error-details-header" onclick="toggleErrorDetails()">
                                <span class="arrow-icon">▶</span>
                                <span class="error-details-title">详细信息</span>
                            </div>
                            <div class="error-details-content">
                                ${JSON.stringify({
                                    name: error.name,
                                    message: error.message,
                                    stack: error.stack
                                }, null, 2)}
                            </div>
                        </div>
                    </div>
                `;
                imageContainer.innerHTML = errorDetails;
            }
        } finally {
            loadingOverlay.classList.remove('active');
        }
    }

    // 绑定事件
    generateBtn.addEventListener('click', fetchImage);
    
    // 全局函数
    window.toggleErrorDetails = function() {
        const details = document.getElementById('errorDetails');
        const content = details.querySelector('.error-details-content');
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
        details.setAttribute('open', !isOpen);
    }
});
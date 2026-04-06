/* ============================================
   THƯ MỜI TỰ ĐỘNG - Template Editor Module
   ============================================ */

const TemplateEditor = {
  currentData: null,
  themes: [
    { id: 'forest-green', name: 'Xanh Lá', color: '#2D5F3E', accent: '#D4A843' },
    { id: 'ocean-blue', name: 'Đại Dương', color: '#0C2D48', accent: '#2E8BC0' },
    { id: 'sunset-coral', name: 'Hoàng Hôn', color: '#6B2D5B', accent: '#F8B500' },
    { id: 'royal-purple', name: 'Tím Hoàng Gia', color: '#3C1768', accent: '#9D4EDD' },
    { id: 'elegant-dark', name: 'Đen Sang Trọng', color: '#1A1A2E', accent: '#C9A84C' },
    { id: 'cherry-blossom', name: 'Hoa Anh Đào', color: '#F8BBD0', accent: '#E91E63' },
    { id: 'golden-luxury', name: 'Vàng Kim', color: '#3E2409', accent: '#D4A843' },
    { id: 'classic-red', name: 'Đỏ Cổ Điển', color: '#B22222', accent: '#FFD700' }
  ],

  init() {
    // Đảm bảo lấy dữ liệu từ Storage, nếu null sẽ lấy mặc định
    this.currentData = Storage.getCurrentTemplate(); 
    
    // Kiểm tra an toàn: nếu vẫn null thì gán thủ công
    if (!this.currentData) {
      this.currentData = Storage.getDefaultTemplate();
    }

    this.renderTemplateSelector();
    this.renderEditorForm();
    this.renderPreview();
    this.bindEvents();
  },

  renderTemplateSelector() {
    const grid = document.getElementById('templateGrid');
    if (!grid) return;

    grid.innerHTML = this.themes.map(theme => `
      <div class="template-option ${this.currentData.theme === theme.id ? 'selected' : ''}" 
           data-theme="${theme.id}" onclick="TemplateEditor.selectTheme('${theme.id}')">
        <div class="template-thumb template-${theme.id}">
          <div class="thumb-title">${theme.name}</div>
          <div class="thumb-line" style="background: ${theme.accent}"></div>
          <div class="thumb-line" style="background: ${theme.accent}; width: 40%"></div>
          <div class="thumb-circle" style="border-color: ${theme.accent}; background: ${theme.color}"></div>
        </div>
        <span class="template-name">${theme.name}</span>
      </div>
    `).join('');
  },

  renderEditorForm() {
    const form = document.getElementById('editorForm');
    if (!form) return;

    const d = this.currentData;
    form.innerHTML = `
      <div class="tab-group">
        <button class="tab active" onclick="TemplateEditor.switchTab('basic')">
          <i class="fas fa-info-circle"></i> Cơ bản
        </button>
        <button class="tab" onclick="TemplateEditor.switchTab('event')">
          <i class="fas fa-calendar-alt"></i> Sự kiện
        </button>
        <button class="tab" onclick="TemplateEditor.switchTab('speaker')">
          <i class="fas fa-user"></i> Diễn giả
        </button>
      </div>

      <!-- Tab: Cơ bản -->
      <div class="tab-content active" id="tabBasic">
        <div class="form-group">
          <label class="form-label">Tên đơn vị / tổ chức</label>
          <input type="text" class="form-control" id="inputOrgName" value="${this.escapeHtml(d.orgName)}" 
                 placeholder="VD: Công ty ABC" oninput="TemplateEditor.updateField('orgName', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Logo đơn vị</label>
          <div class="file-upload" id="logoUpload">
            <i class="fas fa-cloud-upload-alt"></i>
            <span class="file-upload-text">Kéo thả hoặc click để chọn logo</span>
            <input type="file" accept="image/*" onchange="TemplateEditor.uploadImage('orgLogo', event)">
          </div>
          ${d.orgLogo ? `
            <div class="mt-sm text-center">
              <img src="${d.orgLogo}" style="max-width:60px;max-height:60px;border-radius:8px;">
              <button class="btn btn-ghost btn-sm" onclick="TemplateEditor.removeImage('orgLogo')">
                <i class="fas fa-times"></i> Xóa
              </button>
            </div>
          ` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Tiêu đề sự kiện <span class="required">*</span></label>
          <input type="text" class="form-control" id="inputEventTitle" value="${this.escapeHtml(d.eventTitle)}"
                 placeholder="VD: AI Automation Bootcamp" oninput="TemplateEditor.updateField('eventTitle', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Mô tả ngắn</label>
          <input type="text" class="form-control" id="inputEventSubtitle" value="${this.escapeHtml(d.eventSubtitle)}"
                 placeholder="VD: Luyện thói quen ứng dụng AI hiệu quả" oninput="TemplateEditor.updateField('eventSubtitle', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Dòng kính mời</label>
          <input type="text" class="form-control" id="inputInviteText" value="${this.escapeHtml(d.inviteText)}"
                 placeholder="TRÂN TRỌNG KÍNH MỜI" oninput="TemplateEditor.updateField('inviteText', this.value)">
        </div>
      </div>

      <!-- Tab: Sự kiện -->
      <div class="tab-content" id="tabEvent">
        <div class="form-group">
          <label class="form-label">Giới thiệu sự kiện</label>
          <input type="text" class="form-control" id="inputEventName" value="${this.escapeHtml(d.eventName)}"
                 placeholder="VD: Tham dự buổi workshop số 10:" oninput="TemplateEditor.updateField('eventName', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Chủ đề chính <span class="required">*</span></label>
          <input type="text" class="form-control" id="inputEventTopic" value="${this.escapeHtml(d.eventTopic)}"
                 placeholder="VD: TẠO THIỆP MỜI TỰ ĐỘNG" oninput="TemplateEditor.updateField('eventTopic', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung nổi bật</label>
          <input type="text" class="form-control" id="inputTopicHighlight" value="${this.escapeHtml(d.topicHighlight)}"
                 placeholder="VD: GOOGLE SHEETS & EGA TEMPLATE" oninput="TemplateEditor.updateField('topicHighlight', this.value)">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Thời gian</label>
            <input type="time" class="form-control" id="inputEventTime" value="${d.eventTime}"
                   oninput="TemplateEditor.updateField('eventTime', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Ngày tổ chức</label>
            <input type="date" class="form-control" id="inputEventDate" value="${d.eventDate}"
                   oninput="TemplateEditor.updateField('eventDate', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Địa điểm</label>
          <input type="text" class="form-control" id="inputEventLocation" value="${this.escapeHtml(d.eventLocation)}"
                 placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM" oninput="TemplateEditor.updateField('eventLocation', this.value)">
        </div>
      </div>

      <!-- Tab: Diễn giả -->
      <div class="tab-content" id="tabSpeaker">
        <div class="form-group">
          <label class="form-label">Ảnh diễn giả / người mời</label>
          <div class="file-upload" id="speakerUpload">
            <i class="fas fa-camera"></i>
            <span class="file-upload-text">Tải ảnh diễn giả (khuyên dùng ảnh vuông)</span>
            <input type="file" accept="image/*" onchange="TemplateEditor.uploadImage('speakerPhoto', event)">
          </div>
          ${d.speakerPhoto ? `
            <div class="mt-md">
              <div class="image-preview">
                <img src="${d.speakerPhoto}" alt="Speaker">
                <button class="remove-img" onclick="TemplateEditor.removeImage('speakerPhoto')">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          ` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Tên diễn giả / người mời</label>
          <input type="text" class="form-control" id="inputSpeakerName" value="${this.escapeHtml(d.speakerName)}"
                 placeholder="VD: Nguyễn Văn A" oninput="TemplateEditor.updateField('speakerName', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Tên thư mời (để lưu lại)</label>
          <input type="text" class="form-control" id="inputTemplateName" value="${this.escapeHtml(d.name || 'Thư mời mới')}"
                 placeholder="VD: Thư mời Workshop AI" oninput="TemplateEditor.updateField('name', this.value)">
        </div>
      </div>

      <div class="mt-lg btn-group" style="justify-content:center">
        <button class="btn btn-primary" onclick="TemplateEditor.saveTemplate()">
          <i class="fas fa-save"></i> Lưu mẫu
        </button>
        <button class="btn btn-outline" onclick="TemplateEditor.resetTemplate()">
          <i class="fas fa-redo"></i> Đặt lại
        </button>
      </div>
    `;
  },

  switchTab(tab) {
    const tabs = { basic: 'tabBasic', event: 'tabEvent', speaker: 'tabSpeaker' };
    
    document.querySelectorAll('#editorForm .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#editorForm .tab-content').forEach(c => c.classList.remove('active'));
    
    const tabNames = Object.keys(tabs);
    const idx = tabNames.indexOf(tab);
    document.querySelectorAll('#editorForm .tab')[idx]?.classList.add('active');
    document.getElementById(tabs[tab])?.classList.add('active');
  },

  selectTheme(themeId) {
    this.currentData.theme = themeId;
    this.renderTemplateSelector();
    this.renderPreview();
    this.autoSave();
  },

  updateField(field, value) {
    this.currentData[field] = value;
    this.renderPreview();
    this.autoSave();
  },

  uploadImage(field, event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      App.toast('Ảnh quá lớn! Tối đa 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentData[field] = e.target.result;
      this.renderEditorForm();
      this.renderPreview();
      this.autoSave();
    };
    reader.readAsDataURL(file);
  },

  removeImage(field) {
    this.currentData[field] = '';
    this.renderEditorForm();
    this.renderPreview();
    this.autoSave();
  },

 renderPreview(guestName) {
    const container = document.getElementById('invitationPreview');
    if (!container || !this.currentData) return;

    const d = this.currentData;
    const guestDisplayName = guestName || d.guestNamePlaceholder || '';
    const speakerDisplayName = d.speakerName || 'Diễn giả';
    const themeClass = `template-${d.theme}`;
    
    // Format thời gian/ngày tháng (giữ nguyên logic gốc)
    let dateStr = '', dayStr = '';
    if (d.eventDate) {
      const date = new Date(d.eventDate);
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      dayStr = days[date.getDay()];
      dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    let timeStr = d.eventTime ? d.eventTime.replace(':', 'H') : '';

    const defaultSpeakerSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#374151"/><circle cx="100" cy="80" r="40" fill="#6B7280"/><ellipse cx="100" cy="170" rx="60" ry="40" fill="#6B7280"/></svg>')}`;
    const defaultLogoSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#6C63FF"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-weight="bold">✉</text></svg>')}`;

    container.innerHTML = `
      <div class="invitation-card ${themeClass}" id="invitationCard">
        <div class="card-decor-circle-1"></div>
        <div class="card-decor-circle-2"></div>
        <div class="card-decor-circle-3"></div>
        <div class="card-decor-line"></div>

        <div class="card-left">
          <div>
            <div class="card-org">
              <img src="${d.orgLogo || defaultLogoSvg}" alt="Logo" class="card-org-logo">
              <span class="card-org-name">${this.escapeHtml(d.orgName)}</span>
            </div>
            <div class="card-event-title">${this.escapeHtml(d.eventTitle)}</div>
            <div class="card-event-subtitle">${this.escapeHtml(d.eventSubtitle)}</div>
          </div>

          <div>
            <div class="card-invite-text">${this.escapeHtml(d.inviteText)}</div>
            
            ${guestDisplayName ? `<div class="card-guest-name-new">${this.escapeHtml(guestDisplayName)}</div>` : ''}

            <div class="card-event-detail">
              <div class="card-event-name">${this.escapeHtml(d.eventName)}</div>
              <div class="card-topic">
                ${this.escapeHtml(d.eventTopic)}
                <span class="card-topic-highlight">${this.escapeHtml(d.topicHighlight)}</span>
              </div>
            </div>
          </div>

          <div>
            <div class="card-footer">
              ${timeStr ? `<div class="card-footer-item"><div class="card-footer-icon"><i class="far fa-clock"></i></div><div><div class="card-footer-label">Thời gian</div><div class="card-footer-value">${timeStr}</div></div></div>` : ''}
              ${dateStr ? `<div class="card-footer-item"><div class="card-footer-icon"><i class="far fa-calendar"></i></div><div><div class="card-footer-label">${dayStr}</div><div class="card-footer-value">${dateStr}</div></div></div>` : ''}
            </div>
            ${d.eventLocation ? `<div class="card-location"><i class="fas fa-map-marker-alt"></i><span>${this.escapeHtml(d.eventLocation)}</span></div>` : ''}
          </div>
        </div>

        <div class="card-right">
          <img src="${d.speakerPhoto || defaultSpeakerSvg}" alt="Speaker" class="card-speaker-photo">
          <div class="card-speaker-name-box">${this.escapeHtml(speakerDisplayName)}</div>
          </div>
      </div>
    `;
    this.scaleCard();
  },

  scaleCard() {
    const wrapper = document.querySelector('.invitation-card-wrapper');
    const card = document.getElementById('invitationCard');
    if (!wrapper || !card) return;

    requestAnimationFrame(() => {
      const wrapperWidth = wrapper.clientWidth;
      const cardWidth = 800; // fixed design width
      const scale = Math.min(wrapperWidth / cardWidth, 1);
      card.style.width = cardWidth + 'px';
      card.style.transform = `scale(${scale})`;
      card.style.transformOrigin = 'top left';
      wrapper.style.height = (card.offsetHeight * scale) + 'px';
    });
  },

  saveTemplate() {
    Storage.saveCurrentTemplate(this.currentData);
    Storage.saveTemplate({ ...this.currentData });
    App.toast('Đã lưu mẫu thư mời thành công!', 'success');
  },

  resetTemplate() {
    App.confirm('Bạn có chắc muốn đặt lại mẫu về mặc định?', () => {
      this.currentData = Storage.getDefaultTemplate();
      Storage.saveCurrentTemplate(this.currentData);
      this.renderTemplateSelector();
      this.renderEditorForm();
      this.renderPreview();
      App.toast('Đã đặt lại mẫu mặc định.', 'info');
    });
  },

  autoSave() {
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      Storage.saveCurrentTemplate(this.currentData);
    }, 500);
  },

  loadSavedTemplate(id) {
    const templates = Storage.getTemplates();
    const template = templates.find(t => t.id === id);
    if (template) {
      this.currentData = { ...template };
      Storage.saveCurrentTemplate(this.currentData);
      this.renderTemplateSelector();
      this.renderEditorForm();
      this.renderPreview();
      App.toast('Đã tải mẫu: ' + template.name, 'success');
    }
  },

  bindEvents() {
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => this.scaleCard(), 100);
    });
  },

  // Get invitation card HTML for a specific guest
 getCardHtml(guestName) {
    const d = this.currentData;
    const themeClass = `template-${d.theme}`;
    const guestDisplayName = guestName || d.guestNamePlaceholder || '';
    const speakerDisplayName = d.speakerName || 'Diễn giả';
    
    // Xử lý định dạng ngày tháng
    let dateStr = '', dayStr = '';
    if (d.eventDate) {
      const date = new Date(d.eventDate);
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      dayStr = days[date.getDay()];
      dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    // Xử lý định dạng thời gian
    let timeStr = d.eventTime ? d.eventTime.replace(':', 'H') : '';

    // Các SVG mặc định nếu người dùng không upload ảnh
    const defaultSpeakerSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#374151"/><circle cx="100" cy="80" r="40" fill="#6B7280"/><ellipse cx="100" cy="170" rx="60" ry="40" fill="#6B7280"/></svg>')}`;
    const defaultLogoSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#6C63FF"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-weight="bold">✉</text></svg>')}`;

    // Trả về cấu trúc HTML chuẩn của template kèm theo tên khách mời
    return `
      <div class="invitation-card ${themeClass}" style="width:800px;">
        <div class="card-decor-circle-1"></div>
        <div class="card-decor-circle-2"></div>
        <div class="card-decor-circle-3"></div>
        <div class="card-decor-line"></div>

        <div class="card-left">
          <div>
            <div class="card-org">
              <img src="${d.orgLogo || defaultLogoSvg}" alt="Logo" class="card-org-logo">
              <span class="card-org-name">${this.escapeHtml(d.orgName)}</span>
            </div>
            <div class="card-event-title">${this.escapeHtml(d.eventTitle)}</div>
            <div class="card-event-subtitle">${this.escapeHtml(d.eventSubtitle)}</div>
          </div>

          <div>
            <div class="card-invite-text">${this.escapeHtml(d.inviteText)}</div>
            
            ${guestDisplayName ? `<div class="card-guest-name-new">${this.escapeHtml(guestDisplayName)}</div>` : ''}
            
            <div class="card-event-detail">
              <div class="card-event-name">${this.escapeHtml(d.eventName)}</div>
              <div class="card-topic">
                ${this.escapeHtml(d.eventTopic)}
                <span class="card-topic-highlight">${this.escapeHtml(d.topicHighlight)}</span>
              </div>
            </div>
          </div>

          <div>
            <div class="card-footer">
              ${timeStr ? `
              <div class="card-footer-item">
                <div class="card-footer-icon"><i class="far fa-clock"></i></div>
                <div>
                  <div class="card-footer-label">Thời gian</div>
                  <div class="card-footer-value">${timeStr}</div>
                </div>
              </div>` : ''}
              ${dateStr ? `
              <div class="card-footer-item">
                <div class="card-footer-icon"><i class="far fa-calendar"></i></div>
                <div>
                  <div class="card-footer-label">${dayStr}</div>
                  <div class="card-footer-value">${dateStr}</div>
                </div>
              </div>` : ''}
            </div>
            ${d.eventLocation ? `
            <div class="card-location">
              <i class="fas fa-map-marker-alt"></i>
              <span>${this.escapeHtml(d.eventLocation)}</span>
            </div>` : ''}
          </div>
        </div>

        <div class="card-right">
          <img src="${d.speakerPhoto || defaultSpeakerSvg}" alt="Speaker" class="card-speaker-photo">
          <div class="card-speaker-name-box">${this.escapeHtml(speakerDisplayName)}</div>
          </div>
      </div>
    `;
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

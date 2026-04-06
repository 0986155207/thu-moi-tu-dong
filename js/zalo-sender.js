/* ============================================
   THƯ MỜI TỰ ĐỘNG - Zalo Sender Module
   ============================================ */

const ZaloSender = {
  batchQueue: [],
  batchIndex: 0,
  isSending: false,

  init() {
    this.renderSenderPage();
  },

  activeTab: 'send', // 'send' | 'remind'

  renderSenderPage() {
    const container = document.getElementById('zaloContent');
    if (!container) return;

    const settings = Storage.getSettings();
    const guests = Storage.getGuests();
    const pendingGuests = guests.filter(g => g.status === 'pending' || g.status === 'sent');

    container.innerHTML = `
      <!-- Top Tab: Gửi / Nhắc nhở -->
      <div class="tab-group mb-lg" style="background:var(--bg-card);border-radius:var(--radius-lg);padding:4px;display:inline-flex;gap:4px">
        <button class="tab ${this.activeTab === 'send' ? 'active' : ''}" onclick="ZaloSender.switchTab('send')">
          <i class="fas fa-paper-plane"></i> Gửi thư mời
        </button>
        <button class="tab ${this.activeTab === 'remind' ? 'active' : ''}" onclick="ZaloSender.switchTab('remind')" style="position:relative">
          <i class="fas fa-bell"></i> Nhắc nhở
          ${guests.filter(g => g.status === 'sent').length > 0 ? `<span style="position:absolute;top:-4px;right:-4px;background:var(--warning);color:#000;font-size:0.65rem;font-weight:700;border-radius:10px;padding:1px 5px">${guests.filter(g => g.status === 'sent').length}</span>` : ''}
        </button>
      </div>

      <!-- Panel: Gửi thư mời -->
      <div id="tabSend" style="${this.activeTab !== 'send' ? 'display:none' : ''}">

      <!-- Mode Selection -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-cog"></i> Chế độ gửi</div>
        </div>
        <div class="tab-group">
          <button class="tab active" onclick="ZaloSender.switchMode('personal')">
            <i class="fas fa-user"></i> Zalo cá nhân
          </button>
          <button class="tab" onclick="ZaloSender.switchMode('oa')">
            <i class="fas fa-building"></i> Zalo OA
          </button>
        </div>

        <!-- Personal Mode -->
        <div id="modePersonal">
          <div class="form-group">
            <label class="form-label">Nội dung tin nhắn kèm thư mời</label>
            <textarea class="form-control" id="zaloMessage" rows="4" 
                      placeholder="VD: Kính gửi {ten_khach}, trân trọng kính mời bạn tham dự..."
            >Kính gửi {ten_khach},\n\nTrân trọng kính mời bạn tham dự sự kiện của chúng tôi. Xem thư mời chi tiết tại đây.</textarea>
            <div class="form-hint">Dùng <code>{ten_khach}</code> để chèn tên khách mời tự động</div>
          </div>
          <div class="form-group" style="background: var(--info-bg); padding: 12px; border-radius: var(--radius-md);">
            <p style="font-size: 0.85rem; color: var(--info); margin: 0;">
              <i class="fas fa-info-circle"></i>
              <strong>Cách hoạt động:</strong> Ứng dụng sẽ mở Zalo chat với từng khách qua số điện thoại. 
              Bạn chỉ cần dán nội dung (đã copy sẵn) và gửi đi.
            </p>
          </div>
        </div>

        <!-- OA Mode -->
        <div id="modeOA" class="hidden">
          <div style="background: var(--warning-bg); padding: 16px; border-radius: var(--radius-md); margin-bottom: var(--space-md);">
            <p style="font-size: 0.85rem; color: var(--warning); margin: 0;">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Zalo OA đang chờ cấp phép.</strong> Tính năng này sẽ hoạt động khi bạn có Zalo OA và Access Token.
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">OA ID</label>
            <input type="text" class="form-control" id="zaloOaId" value="${settings.zaloOA?.oaId || ''}" 
                   placeholder="Nhập OA ID" disabled>
          </div>
          <div class="form-group">
            <label class="form-label">Access Token</label>
            <input type="password" class="form-control" id="zaloOaToken" value="${settings.zaloOA?.accessToken || ''}" 
                   placeholder="Nhập Access Token" disabled>
          </div>
          <button class="btn btn-outline" disabled>
            <i class="fas fa-save"></i> Lưu cấu hình OA
          </button>
        </div>
      </div>

      <!-- Guest Selection -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-users"></i> Chọn khách mời để gửi</div>
          <span class="text-muted" style="font-size:0.8rem">${pendingGuests.length} khách chờ gửi</span>
        </div>

        ${guests.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-xl);">
            <i class="fas fa-user-plus"></i>
            <h3>Chưa có khách mời</h3>
            <p>Vui lòng thêm khách mời trong tab "Danh sách khách"</p>
          </div>
        ` : `
          <div class="mb-md">
            <div class="search-bar" style="max-width:100%">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Tìm kiếm khách mời..." oninput="ZaloSender.filterGuests(this.value)">
            </div>
          </div>

          <div id="zaloGuestList" style="max-height:400px; overflow-y:auto;">
            ${this.renderGuestCheckList(guests)}
          </div>

          <div class="mt-md d-flex gap-sm" style="justify-content:space-between; flex-wrap:wrap">
            <div class="d-flex gap-sm">
              <button class="btn btn-outline btn-sm" onclick="ZaloSender.selectAll()">
                <i class="fas fa-check-double"></i> Chọn tất cả
              </button>
              <button class="btn btn-outline btn-sm" onclick="ZaloSender.selectPending()">
                <i class="fas fa-clock"></i> Chọn chưa gửi
              </button>
              <button class="btn btn-outline btn-sm" onclick="ZaloSender.deselectAll()">
                <i class="fas fa-times"></i> Bỏ chọn
              </button>
            </div>
            <div id="zaloSelectedCount" class="text-muted" style="font-size:0.85rem; align-self:center;">
              Đã chọn: 0 khách
            </div>
          </div>
        `}
      </div>

      <!-- Send Actions -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-paper-plane"></i> Gửi thư mời</div>
        </div>
        
        <div class="btn-group" style="justify-content:center">
          <button class="btn btn-success btn-lg" onclick="ZaloSender.startSending()" id="btnStartSend">
            <i class="fas fa-paper-plane"></i> Bắt đầu gửi qua Zalo
          </button>
        </div>

        <div id="sendProgress" class="hidden mt-lg">
          <div class="d-flex justify-between mb-sm">
            <span id="sendProgressText">Đang gửi...</span>
            <span id="sendProgressCount">0/0</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" id="sendProgressBar" style="width:0%"></div>
          </div>
          <div id="sendLog" class="mt-md" style="max-height:300px;overflow-y:auto;font-size:0.8rem;"></div>
        </div>
      </div>
      </div> <!-- end tabSend -->

      <!-- Panel: Nhắc nhở -->
      <div id="tabRemind" style="${this.activeTab !== 'remind' ? 'display:none' : ''}">
        ${this.renderRemindTab(guests)}
      </div>
    `;

    this.zaloSelectedGuests = new Set();
  },

  renderGuestCheckList(guests, filter = '') {
    const filtered = filter 
      ? guests.filter(g => g.name.toLowerCase().includes(filter.toLowerCase()) || (g.phone && g.phone.includes(filter)))
      : guests;

    const statusIcons = {
      pending: '🕐',
      sent: '📨',
      confirmed: '✅',
      declined: '❌'
    };

    return filtered.map(g => `
      <div class="d-flex align-center gap-sm" style="padding:8px 0; border-bottom:1px solid var(--border-color);">
        <input type="checkbox" class="checkbox zalo-guest-check" data-id="${g.id}" 
               onchange="ZaloSender.updateSelectedCount()" ${!g.phone ? 'disabled' : ''}>
        <div style="flex:1; min-width:0;">
          <div class="fw-600" style="font-size:0.875rem;">${this.escapeHtml(g.name)}</div>
          <div class="text-muted" style="font-size:0.75rem;">
            ${g.phone || '<span style="color:var(--danger)">Chưa có SĐT</span>'} 
            ${statusIcons[g.status] || ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  filterGuests(query) {
    const guests = Storage.getGuests();
    const listEl = document.getElementById('zaloGuestList');
    if (listEl) {
      listEl.innerHTML = this.renderGuestCheckList(guests, query);
    }
  },

  selectAll() {
    document.querySelectorAll('.zalo-guest-check:not([disabled])').forEach(cb => cb.checked = true);
    this.updateSelectedCount();
  },

  selectPending() {
    const guests = Storage.getGuests();
    const pendingIds = guests.filter(g => g.status === 'pending' && g.phone).map(g => g.id);
    document.querySelectorAll('.zalo-guest-check').forEach(cb => {
      cb.checked = pendingIds.includes(cb.dataset.id);
    });
    this.updateSelectedCount();
  },

  deselectAll() {
    document.querySelectorAll('.zalo-guest-check').forEach(cb => cb.checked = false);
    this.updateSelectedCount();
  },

  updateSelectedCount() {
    const count = document.querySelectorAll('.zalo-guest-check:checked').length;
    const el = document.getElementById('zaloSelectedCount');
    if (el) el.textContent = `Đã chọn: ${count} khách`;
  },

  switchMode(mode) {
    const tabs = document.querySelectorAll('#zaloContent .tab-group .tab');
    tabs.forEach((t, i) => t.classList.toggle('active', (mode === 'personal' && i === 0) || (mode === 'oa' && i === 1)));
    
    document.getElementById('modePersonal')?.classList.toggle('hidden', mode !== 'personal');
    document.getElementById('modeOA')?.classList.toggle('hidden', mode !== 'oa');
  },

  // ---- Sending ----
  getSelectedGuestIds() {
    const ids = [];
    document.querySelectorAll('.zalo-guest-check:checked').forEach(cb => {
      ids.push(cb.dataset.id);
    });
    return ids;
  },

  startSending() {
    const ids = this.getSelectedGuestIds();
    if (ids.length === 0) {
      App.toast('Vui lòng chọn ít nhất 1 khách mời!', 'warning');
      return;
    }

    this.batchQueue = ids;
    this.batchIndex = 0;
    this.isSending = true;

    document.getElementById('sendProgress')?.classList.remove('hidden');
    document.getElementById('sendLog').innerHTML = '';

    this.processNext();
  },

  startBatchSend(ids) {
    // Called from Guest Manager batch action
    this.renderSenderPage();
    setTimeout(() => {
      // Check the relevant checkboxes
      ids.forEach(id => {
        const cb = document.querySelector(`.zalo-guest-check[data-id="${id}"]`);
        if (cb) cb.checked = true;
      });
      this.updateSelectedCount();
    }, 100);
  },

  processNext() {
    if (this.batchIndex >= this.batchQueue.length) {
      this.isSending = false;
      this.updateProgress('Hoàn tất!', this.batchQueue.length, this.batchQueue.length);
      App.toast(`Đã xử lý ${this.batchQueue.length} thư mời!`, 'success');
      GuestManager.render();
      return;
    }

    const id = this.batchQueue[this.batchIndex];
    const guest = Storage.getGuests().find(g => g.id === id);
    
    if (!guest || !guest.phone) {
      this.addLog(`⚠️ ${guest?.name || 'N/A'}: Không có số điện thoại`, 'warning');
      this.batchIndex++;
      this.processNext();
      return;
    }

    this.updateProgress(
      `Đang xử lý: ${guest.name}`,
      this.batchIndex,
      this.batchQueue.length
    );

    this.sendSingle(id, true);
  },

  sendSingle(id, isBatch = false) {
    const guest = Storage.getGuests().find(g => g.id === id);
    if (!guest) return;

    if (!guest.phone) {
      App.toast(`${guest.name}: Chưa có số điện thoại!`, 'error');
      return;
    }

    // Build message
    const messageTemplate = document.getElementById('zaloMessage')?.value || 
      'Kính gửi {ten_khach}, trân trọng kính mời bạn tham dự sự kiện của chúng tôi.';
    const message = messageTemplate.replace(/\{ten_khach\}/g, guest.name);

    // Copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      App.toast(`Đã copy tin nhắn cho ${guest.name}`, 'info');
    }).catch(() => {});

    // Open Zalo deep link
    const phone = guest.phone.replace(/^0/, '84').replace(/[^0-9]/g, '');
    const zaloUrl = `https://zalo.me/${phone}`;
    
    window.open(zaloUrl, '_blank');

    // Update status
    Storage.updateGuestStatus(id, 'sent');

    if (isBatch) {
      this.addLog(`✅ ${guest.name} (${guest.phone}): Đã mở Zalo`, 'success');
      this.batchIndex++;
      
      // Delay between sends to prevent overwhelming
      setTimeout(() => this.processNext(), 2000);
    } else {
      App.toast(`Đã mở Zalo cho ${guest.name}. Nội dung đã copy!`, 'success');
    }
  },

  updateProgress(text, current, total) {
    const textEl = document.getElementById('sendProgressText');
    const countEl = document.getElementById('sendProgressCount');
    const barEl = document.getElementById('sendProgressBar');
    
    if (textEl) textEl.textContent = text;
    if (countEl) countEl.textContent = `${current}/${total}`;
    if (barEl) barEl.style.width = `${(current / total) * 100}%`;
  },

  addLog(message, type = 'info') {
    const logEl = document.getElementById('sendLog');
    if (!logEl) return;
    
    const colors = { success: 'var(--success)', warning: 'var(--warning)', error: 'var(--danger)', info: 'var(--info)' };
    logEl.innerHTML += `<div style="color:${colors[type] || colors.info}; padding:4px 0; border-bottom:1px solid var(--border-color);">${message}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  },

  // ---- Share Link ----
  generateShareLink(guestId) {
    const guest = Storage.getGuests().find(g => g.id === guestId);
    if (!guest) return '';
    
    // Create a self-contained HTML invitation page as a data URL
    const template = TemplateEditor.currentData;
    const cardHtml = TemplateEditor.getCardHtml(guest.name);
    
    // For now, copy the invitation info as text
    const info = `
🎉 THƯ MỜI - ${template.eventTitle}
━━━━━━━━━━━━━━━━

${template.inviteText}

${template.eventName}
${template.eventTopic}
${template.topicHighlight}

👤 Kính gửi: ${guest.name}
🕐 Thời gian: ${template.eventTime ? template.eventTime.replace(':', 'H') : ''}
📅 Ngày: ${template.eventDate ? new Date(template.eventDate).toLocaleDateString('vi-VN') : ''}
📍 Địa điểm: ${template.eventLocation || ''}

━━━━━━━━━━━━━━━━
${template.orgName}
    `.trim();

    return info;
  },

  copyShareText(guestId) {
    const text = this.generateShareLink(guestId);
    navigator.clipboard.writeText(text).then(() => {
      App.toast('Đã copy nội dung thư mời!', 'success');
    });
  },

  // ---- Tab switch ----
  switchTab(tab) {
    this.activeTab = tab;
    this.renderSenderPage();
  },

  // ---- Remind Tab ----
  renderRemindTab(guests) {
    const sentGuests = guests.filter(g => g.status === 'sent' && g.phone);
    const template = Storage.getCurrentTemplate ? Storage.getCurrentTemplate() : {};
    const eventDate = template.eventDate ? new Date(template.eventDate + 'T00:00:00').toLocaleDateString('vi-VN') : '';

    if (sentGuests.length === 0) {
      return `
        <div class="card">
          <div class="empty-state" style="padding:var(--space-xl)">
            <i class="fas fa-bell-slash"></i>
            <h3>Không có khách cần nhắc</h3>
            <p>Khách có trạng thái "Đã gửi" mà chưa xác nhận sẽ hiển thị ở đây.</p>
          </div>
        </div>`;
    }

    return `
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-bell"></i> Tin nhắn nhắc nhở</div>
        </div>
        <div class="form-group">
          <label class="form-label">Nội dung nhắc nhở</label>
          <textarea class="form-control" id="remindMessage" rows="5">Kính gửi {ten_khach},\n\nĐây là thư nhắc về sự kiện sắp tới vào ngày ${eventDate}.\n\nVui lòng xác nhận tham dự tại:\n{rsvp_link}\n\nTrân trọng cảm ơn!</textarea>
          <div class="form-hint">Biến: <code>{ten_khach}</code> — tên khách, <code>{rsvp_link}</code> — link xác nhận RSVP</div>
        </div>
      </div>

      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-users"></i> Khách chưa xác nhận (${sentGuests.length})</div>
        </div>
        <div style="max-height:350px;overflow-y:auto">
          ${sentGuests.map(g => `
            <div class="d-flex align-center gap-sm" style="padding:8px 0;border-bottom:1px solid var(--border)">
              <input type="checkbox" class="checkbox remind-check" data-id="${g.id}" checked>
              <div style="flex:1;min-width:0">
                <div class="fw-600" style="font-size:0.875rem">${this.escapeHtml(g.name)}</div>
                <div class="text-muted" style="font-size:0.75rem">${g.phone}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="ZaloSender.sendRemindSingle('${g.id}')" title="Nhắc riêng">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="mt-md d-flex gap-sm justify-between" style="flex-wrap:wrap">
          <div class="d-flex gap-sm">
            <button class="btn btn-outline btn-sm" onclick="ZaloSender.remindSelectAll(true)"><i class="fas fa-check-double"></i> Chọn tất cả</button>
            <button class="btn btn-outline btn-sm" onclick="ZaloSender.remindSelectAll(false)"><i class="fas fa-times"></i> Bỏ chọn</button>
          </div>
          <button class="btn btn-warning btn-sm" onclick="ZaloSender.startRemindBatch()">
            <i class="fas fa-bell"></i> Gửi nhắc tất cả đã chọn
          </button>
        </div>
      </div>`;
  },

  remindSelectAll(checked) {
    document.querySelectorAll('.remind-check').forEach(cb => cb.checked = checked);
  },

  startRemindBatch() {
    const ids = [...document.querySelectorAll('.remind-check:checked')].map(cb => cb.dataset.id);
    if (ids.length === 0) { App.toast('Chọn ít nhất 1 khách!', 'warning'); return; }
    ids.forEach((id, i) => setTimeout(() => this.sendRemindSingle(id), i * 2200));
    App.toast(`Đang gửi nhắc ${ids.length} khách...`, 'info');
  },

  sendRemindSingle(id) {
    const guest = Storage.getGuests().find(g => g.id === id);
    if (!guest || !guest.phone) return;

    const rsvpLink = GuestManager.getRsvpLink(id);
    const template = document.getElementById('remindMessage')?.value ||
      'Kính gửi {ten_khach}, vui lòng xác nhận tham dự: {rsvp_link}';

    const message = template
      .replace(/\{ten_khach\}/g, guest.name)
      .replace(/\{rsvp_link\}/g, rsvpLink);

    navigator.clipboard?.writeText(message).catch(() => {});

    const phone = guest.phone.replace(/^0/, '84').replace(/[^0-9]/g, '');
    window.open(`https://zalo.me/${phone}`, '_blank');
    App.toast(`Đã mở Zalo nhắc ${guest.name}`, 'success');
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

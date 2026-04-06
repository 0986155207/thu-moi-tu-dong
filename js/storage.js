/* ============================================
   THƯ MỜI TỰ ĐỘNG - Storage Layer
   LocalStorage data management
   ============================================ */

const Storage = {
  _suppressSync: false, // Ngăn sync vòng lặp khi nhận dữ liệu từ cloud

  KEYS: {
    TEMPLATES: 'invitationApp_templates',
    GUESTS: 'invitationApp_guests',
    SETTINGS: 'invitationApp_settings',
    CURRENT_TEMPLATE: 'invitationApp_currentTemplate'
  },

  // ---- Generic CRUD ----
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage.get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Đồng bộ lên cloud sau mỗi thay đổi (trừ khi đang nhận dữ liệu từ cloud)
      if (!this._suppressSync && typeof FirebaseSync !== 'undefined' && FirebaseSync.db) {
        FirebaseSync.scheduleSync();
      }
      return true;
    } catch (e) {
      console.error('Storage.set error:', e);
      if (e.name === 'QuotaExceededError') {
        App.toast('Bộ nhớ đầy! Vui lòng xóa bớt dữ liệu.', 'error');
      }
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // ---- Templates ----
  getTemplates() {
    return this.get(this.KEYS.TEMPLATES) || [];
  },

  saveTemplate(template) {
    const templates = this.getTemplates();
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...template, updatedAt: new Date().toISOString() };
    } else {
      template.id = template.id || this.generateId();
      template.createdAt = new Date().toISOString();
      template.updatedAt = new Date().toISOString();
      templates.push(template);
    }
    this.set(this.KEYS.TEMPLATES, templates);
    return template;
  },

  deleteTemplate(id) {
    const templates = this.getTemplates().filter(t => t.id !== id);
    this.set(this.KEYS.TEMPLATES, templates);
  },

  getCurrentTemplate() {
    return this.get(this.KEYS.CURRENT_TEMPLATE) || this.getDefaultTemplate();
  },

  saveCurrentTemplate(data) {
    this.set(this.KEYS.CURRENT_TEMPLATE, data);
  },

  getDefaultTemplate() {
    return {
      id: this.generateId(),
      name: 'Thư mời mới',
      theme: 'forest-green',
      orgName: 'Tên Tổ Chức',
      orgLogo: '',
      eventTitle: 'Tên Sự Kiện',
      eventSubtitle: 'Mô tả ngắn về sự kiện của bạn',
      inviteText: 'TRÂN TRỌNG KÍNH MỜI',
      eventName: 'Tham dự chương trình:',
      eventTopic: 'CHỦ ĐỀ SỰ KIỆN',
      topicHighlight: 'NỘI DUNG NỔI BẬT',
      speakerPhoto: '',
      speakerName: 'Họ và Tên',
      eventTime: '20:00',
      eventDate: new Date().toISOString().split('T')[0],
      eventDay: '',
      eventLocation: 'Địa điểm tổ chức sự kiện',
      guestNamePlaceholder: ''
    };
  },

  // ---- Guests ----
  getGuests() {
    return this.get(this.KEYS.GUESTS) || [];
  },

  saveGuest(guest) {
    const guests = this.getGuests();
    const idx = guests.findIndex(g => g.id === guest.id);
    if (idx >= 0) {
      guests[idx] = { ...guests[idx], ...guest, updatedAt: new Date().toISOString() };
    } else {
      guest.id = guest.id || this.generateId();
      guest.status = guest.status || 'pending';
      guest.createdAt = new Date().toISOString();
      guest.updatedAt = new Date().toISOString();
      guests.push(guest);
    }
    this.set(this.KEYS.GUESTS, guests);
    return guest;
  },

  saveGuests(guestList) {
    this.set(this.KEYS.GUESTS, guestList);
  },

  deleteGuest(id) {
    const guests = this.getGuests().filter(g => g.id !== id);
    this.set(this.KEYS.GUESTS, guests);
  },

  deleteMultipleGuests(ids) {
    const guests = this.getGuests().filter(g => !ids.includes(g.id));
    this.set(this.KEYS.GUESTS, guests);
  },

  updateGuestStatus(id, status) {
    const guests = this.getGuests();
    const guest = guests.find(g => g.id === id);
    if (guest) {
      guest.status = status;
      guest.updatedAt = new Date().toISOString();
      this.set(this.KEYS.GUESTS, guests);
    }
  },

  // ---- Settings ----
  getSettings() {
    return this.get(this.KEYS.SETTINGS) || {
      zaloOA: {
        enabled: false,
        oaId: '',
        accessToken: ''
      },
      exportQuality: 2,
      paperSize: 'A4'
    };
  },

  saveSettings(settings) {
    this.set(this.KEYS.SETTINGS, settings);
  },

  // ---- Utilities ----
  generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  },

  // Export all data
  exportAllData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates: this.getTemplates(),
      currentTemplate: this.getCurrentTemplate(),
      guests: this.getGuests(),
      settings: this.getSettings()
    };
  },

  // Import data
  importAllData(data) {
    if (data.templates) this.set(this.KEYS.TEMPLATES, data.templates);
    if (data.currentTemplate) this.set(this.KEYS.CURRENT_TEMPLATE, data.currentTemplate);
    if (data.guests) this.set(this.KEYS.GUESTS, data.guests);
    if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
  },

  // Clear all
  clearAll() {
    Object.values(this.KEYS).forEach(key => this.remove(key));
  },

  // Get storage usage
  getUsage() {
    let total = 0;
    Object.values(this.KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) total += data.length * 2; // UTF-16
    });
    return {
      used: total,
      usedMB: (total / 1024 / 1024).toFixed(2),
      limit: 5 * 1024 * 1024, // ~5MB
      percentage: ((total / (5 * 1024 * 1024)) * 100).toFixed(1)
    };
  }
};

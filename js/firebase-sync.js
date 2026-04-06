/* ============================================
   THƯ MỜI TỰ ĐỘNG - Firebase Cloud Sync
   Đồng bộ dữ liệu đa thiết bị qua Firestore
   ============================================ */

const FirebaseSync = {
  db: null,
  syncCode: null,
  unsubscribe: null,
  isSyncing: false,
  pendingSyncTimer: null,

  init() {
    const firebaseConfig = {
      apiKey: "AIzaSyAoZsNvThRCAhg3AR0Mbx_TbRuH0vmYYQc",
      authDomain: "thu-moi-tu-dong.firebaseapp.com",
      projectId: "thu-moi-tu-dong",
      storageBucket: "thu-moi-tu-dong.firebasestorage.app",
      messagingSenderId: "556410345587",
      appId: "1:556410345587:web:9b76c74a1c5a29b0b8f206"
    };

    try {
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      // App already initialized
    }

    this.db = firebase.firestore();

    // Lấy hoặc tạo mã đồng bộ
    this.syncCode = localStorage.getItem('tmtd_syncCode') || this.generateCode();
    localStorage.setItem('tmtd_syncCode', this.syncCode);

    this.injectStyles();
    this.renderSyncWidget();
    this.startListener();
  },

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  getDocRef() {
    return this.db.collection('syncData').doc(this.syncCode);
  },

  // Đẩy dữ liệu local lên cloud
  async pushToCloud() {
    if (!this.db) return;
    this.isSyncing = true;
    this.setStatus('syncing');
    try {
      const data = Storage.exportAllData();
      await this.getDocRef().set(data);
      this.setStatus('synced');
    } catch (e) {
      console.error('FirebaseSync push error:', e);
      this.setStatus('error');
    }
    this.isSyncing = false;
  },

  // Debounce: gom nhiều thay đổi thành 1 lần ghi
  scheduleSync() {
    if (this.pendingSyncTimer) clearTimeout(this.pendingSyncTimer);
    this.pendingSyncTimer = setTimeout(() => this.pushToCloud(), 1500);
  },

  // Lắng nghe thay đổi từ cloud (real-time)
  startListener() {
    if (this.unsubscribe) this.unsubscribe();
    this.setStatus('syncing');

    this.unsubscribe = this.getDocRef().onSnapshot(doc => {
      if (doc.exists) {
        // Có dữ liệu trên cloud → cập nhật local
        if (!this.isSyncing) {
          const data = doc.data();
          Storage._suppressSync = true;
          Storage.importAllData(data);
          Storage._suppressSync = false;
          this.refreshUI();
        }
      } else {
        // Chưa có dữ liệu cloud → đẩy local lên
        this.pushToCloud();
      }
      this.setStatus('synced');
    }, err => {
      console.error('FirebaseSync listener error:', err);
      this.setStatus('error');
    });
  },

  // Làm mới giao diện sau khi nhận dữ liệu mới
  refreshUI() {
    try {
      if (typeof GuestManager !== 'undefined') GuestManager.render();
      if (typeof TemplateEditor !== 'undefined') TemplateEditor.renderPreview();
      // Cập nhật badge số khách
      const badge = document.getElementById('guestBadge');
      if (badge) {
        const count = Storage.getGuests().length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    } catch (e) {
      // Module chưa khởi tạo xong, bỏ qua
    }
  },

  // Đổi mã đồng bộ → kết nối với thiết bị khác
  changeSyncCode(code) {
    if (this.unsubscribe) this.unsubscribe();
    this.syncCode = code.toUpperCase().trim();
    localStorage.setItem('tmtd_syncCode', this.syncCode);
    const badge = document.querySelector('.sync-code-badge');
    if (badge) badge.textContent = this.syncCode;
    this.startListener();
  },

  setStatus(status) {
    const el = document.getElementById('syncStatusIcon');
    if (!el) return;
    const map = {
      syncing: { cls: 'fa-sync fa-spin', color: 'var(--warning)' },
      synced:  { cls: 'fa-cloud',        color: '#4CAF50'         },
      error:   { cls: 'fa-exclamation-triangle', color: 'var(--danger)' }
    };
    const s = map[status] || map.synced;
    el.className = `fas ${s.cls}`;
    el.style.color = s.color;
  },

  renderSyncWidget() {
    const headerInner = document.querySelector('.header-inner');
    if (!headerInner) return;

    const widget = document.createElement('div');
    widget.className = 'sync-widget';
    widget.innerHTML = `
      <button class="sync-btn" onclick="FirebaseSync.showModal()" title="Đồng bộ đa thiết bị">
        <i id="syncStatusIcon" class="fas fa-cloud" style="color:#4CAF50"></i>
        <span class="sync-code-badge">${this.syncCode}</span>
      </button>
    `;
    headerInner.appendChild(widget);
  },

  showModal() {
    App.showModal('Đồng bộ đa thiết bị', `
      <div style="text-align:center">
        <p style="color:var(--text-secondary);margin-bottom:0.75rem;font-size:0.88rem">
          <i class="fas fa-mobile-alt"></i> Mã đồng bộ của bạn
        </p>
        <div style="
          font-size:1.75rem;font-weight:900;letter-spacing:10px;
          color:var(--primary);background:var(--bg-secondary);
          padding:0.9rem 1.5rem;border-radius:12px;
          border:2px dashed var(--border);display:inline-block;
          margin-bottom:0.75rem;font-family:monospace
        ">${this.syncCode}</div>
        <br>
        <button class="btn btn-outline btn-sm" onclick="FirebaseSync.copyCode()" style="margin-bottom:1.25rem">
          <i class="fas fa-copy"></i> Sao chép mã
        </button>
        <div style="
          background:var(--bg-secondary);border-radius:8px;
          padding:0.65rem 0.9rem;margin-bottom:1.25rem;
          font-size:0.82rem;color:var(--text-secondary);text-align:left;
          border-left:3px solid var(--primary)
        ">
          <i class="fas fa-info-circle" style="color:var(--primary)"></i>
          Nhập mã này trên iPhone/máy tính khác để đồng bộ chung 1 dữ liệu.
        </div>
        <div style="border-top:1px solid var(--border);padding-top:1.1rem">
          <p style="color:var(--text-secondary);margin-bottom:0.5rem;font-size:0.88rem">
            Kết nối với thiết bị khác:
          </p>
          <div style="display:flex;gap:0.5rem">
            <input type="text" id="newSyncInput"
              placeholder="Nhập mã 6 ký tự..."
              maxlength="6"
              oninput="this.value=this.value.toUpperCase()"
              style="flex:1;text-transform:uppercase;letter-spacing:4px;text-align:center;font-weight:700;font-family:monospace"
              class="form-input">
            <button class="btn btn-primary" onclick="FirebaseSync.applyCode()">
              Kết nối
            </button>
          </div>
        </div>
      </div>
    `, null, true);
  },

  copyCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.syncCode).then(() => {
        App.toast('Đã sao chép mã: ' + this.syncCode, 'success');
      });
    } else {
      App.toast('Mã của bạn: ' + this.syncCode, 'info');
    }
  },

  applyCode() {
    const input = document.getElementById('newSyncInput');
    const code = input?.value?.toUpperCase().trim();
    if (!code || code.length < 4) {
      App.toast('Vui lòng nhập mã hợp lệ (ít nhất 4 ký tự)', 'error');
      return;
    }
    App.confirm(
      `Kết nối với mã "<strong>${code}</strong>"?<br>
       <small style="color:var(--text-secondary)">Dữ liệu sẽ đồng bộ với thiết bị dùng mã này.</small>`,
      () => {
        this.changeSyncCode(code);
        App.closeModal();
        App.toast('Đã kết nối! Đang tải dữ liệu...', 'success');
      }
    );
  },

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .sync-widget {
        display: flex;
        align-items: center;
        margin-left: auto;
        padding-left: 0.75rem;
      }
      .sync-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 20px;
        cursor: pointer;
        transition: border-color 0.2s;
        color: inherit;
      }
      .sync-btn:hover {
        border-color: var(--primary);
      }
      .sync-code-badge {
        font-family: monospace;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 2px;
        color: var(--text-secondary);
      }
      @media (max-width: 480px) {
        .sync-code-badge { display: none; }
        .sync-widget { padding-left: 0.25rem; }
      }
    `;
    document.head.appendChild(style);
  }
};

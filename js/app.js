/* ============================================
   THƯ MỜI TỰ ĐỘNG - App Core / SPA Router
   ============================================ */

const App = {
  currentPage: 'editor',

  init() {
    // Route from hash
    const hash = location.hash.replace('#', '') || 'editor';
    this.navigate(hash, false);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const page = location.hash.replace('#', '') || 'editor';
      this.navigate(page, false);
    });

    // Init modules
    TemplateEditor.init();
    GuestManager.init();
    ZaloSender.init();
    ExportPrint.init();

    // Global click handler for dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
      }
    });

    console.log('✉️ Ứng dụng Tạo Thư Mời Tự Động đã khởi động!');
  },

  navigate(page, updateHash = true) {
    this.currentPage = page;
    
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === page);
    });

    // Show/hide pages
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.toggle('active', view.id === `page-${page}`);
    });

    if (updateHash) {
      location.hash = page;
    }

    // Refresh module content when switching
    switch(page) {
      case 'editor':
        TemplateEditor.renderPreview();
        break;
      case 'guests':
        GuestManager.render();
        break;
      case 'send':
        ZaloSender.renderSenderPage();
        break;
      case 'export':
        ExportPrint.renderExportPage();
        break;
    }
  },

  // ---- Toast Notifications ----
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
      toast.remove();
    }, 3500);
  },

  // ---- Modal ----
  showModal(title, bodyHtml, onConfirm = null, noFooter = false) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close" onclick="App.closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${!noFooter && onConfirm ? `
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="App.closeModal()">Hủy</button>
          <button class="btn btn-primary" id="modalConfirmBtn" onclick="App._handleModalConfirm()">Xác nhận</button>
        </div>
        ` : ''}
      </div>
    `;

    this._modalConfirmFn = onConfirm;
    overlay.classList.add('active');

    // Focus first input
    setTimeout(() => {
      overlay.querySelector('input, textarea, select')?.focus();
    }, 200);
  },

  _handleModalConfirm() {
    if (this._modalConfirmFn) {
      const result = this._modalConfirmFn();
      if (result !== false) {
        this.closeModal();
      }
    }
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    this._modalConfirmFn = null;
  },

  // ---- Confirm Dialog ----
  confirm(message, onConfirm) {
    this.showModal('Xác nhận', `
      <div class="text-center">
        <div class="confirm-icon danger" style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-md);background:var(--warning-bg);">
          <i class="fas fa-question-circle" style="font-size:1.5rem;color:var(--warning)"></i>
        </div>
        <p style="font-size:0.95rem;">${message}</p>
      </div>
    `, () => {
      onConfirm();
      return true;
    });
  },

  // ---- Dropdown Toggle ----
  toggleDropdown(el) {
    el.closest('.dropdown')?.classList.toggle('active');
  }
};

// ---- Initialize on DOM ready ----
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

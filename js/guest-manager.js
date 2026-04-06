/* ============================================
   THƯ MỜI TỰ ĐỘNG - Guest Manager Module
   ============================================ */

const GuestManager = {
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
  filterStatus: 'all',
  selectedIds: new Set(),
  sortField: 'name',
  sortDir: 'asc',

  init() {
    this.render();
  },

  render() {
    this.renderStats();
    this.renderTable();
  },

  getFilteredGuests() {
    let guests = Storage.getGuests();
    
    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      guests = guests.filter(g => 
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.phone && g.phone.includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.title && g.title.toLowerCase().includes(q))
      );
    }

    // Filter
    if (this.filterStatus !== 'all') {
      guests = guests.filter(g => g.status === this.filterStatus);
    }

    // Sort
    guests.sort((a, b) => {
      let va = a[this.sortField] || '';
      let vb = b[this.sortField] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return guests;
  },

  renderStats() {
    const guests = Storage.getGuests();
    const total = guests.length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const sent = guests.filter(g => g.status === 'sent').length;
    const confirmed = guests.filter(g => g.status === 'confirmed').length;
    const declined = guests.filter(g => g.status === 'declined').length;

    const statsEl = document.getElementById('guestStats');
    if (!statsEl) return;

    statsEl.innerHTML = `
      <div class="stat-card" onclick="GuestManager.setFilter('all')">
        <div class="stat-icon purple"><i class="fas fa-users"></i></div>
        <div class="stat-info">
          <h4>${total}</h4>
          <p>Tổng khách mời</p>
        </div>
      </div>
      <div class="stat-card" onclick="GuestManager.setFilter('pending')">
        <div class="stat-icon yellow"><i class="fas fa-clock"></i></div>
        <div class="stat-info">
          <h4>${pending}</h4>
          <p>Chưa gửi</p>
        </div>
      </div>
      <div class="stat-card" onclick="GuestManager.setFilter('sent')">
        <div class="stat-icon blue"><i class="fas fa-paper-plane"></i></div>
        <div class="stat-info">
          <h4>${sent}</h4>
          <p>Đã gửi</p>
        </div>
      </div>
      <div class="stat-card" onclick="GuestManager.setFilter('confirmed')">
        <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info">
          <h4>${confirmed}</h4>
          <p>Xác nhận</p>
        </div>
      </div>
      <div class="stat-card" onclick="GuestManager.setFilter('declined')">
        <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
        <div class="stat-info">
          <h4>${declined}</h4>
          <p>Từ chối</p>
        </div>
      </div>
    `;
  },

  renderTable() {
    const tableEl = document.getElementById('guestTable');
    if (!tableEl) return;

    const guests = this.getFilteredGuests();
    const total = guests.length;
    const totalPages = Math.ceil(total / this.pageSize) || 1;
    
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageGuests = guests.slice(start, start + this.pageSize);

    const statusLabels = {
      pending: '<span class="status-badge status-pending">Chưa gửi</span>',
      sent: '<span class="status-badge status-sent">Đã gửi</span>',
      confirmed: '<span class="status-badge status-confirmed">Xác nhận</span>',
      declined: '<span class="status-badge status-declined">Từ chối</span>'
    };

    if (total === 0) {
      tableEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-plus"></i>
          <h3>Chưa có khách mời nào</h3>
          <p>Thêm khách mời bằng cách nhấn nút "Thêm khách" hoặc nhập từ file Excel/CSV</p>
          <div class="btn-group" style="justify-content:center">
            <button class="btn btn-primary" onclick="GuestManager.showAddModal()">
              <i class="fas fa-plus"></i> Thêm khách
            </button>
            <button class="btn btn-outline" onclick="GuestManager.importExcel()">
              <i class="fas fa-file-excel"></i> Nhập Excel
            </button>
          </div>
        </div>
      `;
      return;
    }

    const allChecked = pageGuests.length > 0 && pageGuests.every(g => this.selectedIds.has(g.id));

    tableEl.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-cell">
                <input type="checkbox" class="checkbox" ${allChecked ? 'checked' : ''} 
                       onchange="GuestManager.toggleAll(this.checked)">
              </th>
              <th onclick="GuestManager.toggleSort('name')" style="cursor:pointer">
                Họ tên ${this.sortField === 'name' ? (this.sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th class="hide-mobile">Chức danh</th>
              <th>Điện thoại</th>
              <th class="hide-mobile">Email</th>
              <th>Trạng thái</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${pageGuests.map(g => `
              <tr>
                <td class="checkbox-cell">
                  <input type="checkbox" class="checkbox" ${this.selectedIds.has(g.id) ? 'checked' : ''} 
                         onchange="GuestManager.toggleSelect('${g.id}', this.checked)">
                </td>
                <td><strong>${this.escapeHtml(g.name)}</strong></td>
                <td class="hide-mobile">${this.escapeHtml(g.title || '—')}</td>
                <td>${this.escapeHtml(g.phone || '—')}</td>
                <td class="hide-mobile">${this.escapeHtml(g.email || '—')}</td>
                <td>${statusLabels[g.status] || statusLabels.pending}</td>
                <td class="text-center">
                  <div class="d-flex gap-sm" style="justify-content:center">
                    <button class="btn btn-ghost btn-icon btn-sm" data-tooltip="Xem thư mời" 
                            onclick="GuestManager.previewInvitation('${g.id}')">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" data-tooltip="Sửa" 
                            onclick="GuestManager.showEditModal('${g.id}')">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" data-tooltip="Xóa" 
                            onclick="GuestManager.deleteGuest('${g.id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${totalPages > 1 ? `
      <div class="pagination">
        <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="GuestManager.goToPage(${this.currentPage - 1})">
          <i class="fas fa-chevron-left"></i>
        </button>
        ${this.getPaginationButtons(totalPages)}
        <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="GuestManager.goToPage(${this.currentPage + 1})">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>` : ''}

      ${this.selectedIds.size > 0 ? `
      <div class="card mt-md" style="background: rgba(108,99,255,0.1); border-color: var(--primary);">
        <div class="d-flex align-center justify-between gap-md" style="flex-wrap:wrap">
          <span><strong>${this.selectedIds.size}</strong> khách đã chọn</span>
          <div class="btn-group">
            <button class="btn btn-primary btn-sm" onclick="GuestManager.batchSendZalo()">
              <i class="fas fa-paper-plane"></i> <span class="btn-text">Gửi Zalo</span>
            </button>
            <button class="btn btn-accent btn-sm" onclick="GuestManager.batchExport()">
              <i class="fas fa-file-pdf"></i> <span class="btn-text">Xuất PDF</span>
            </button>
            <button class="btn btn-danger btn-sm" onclick="GuestManager.batchDelete()">
              <i class="fas fa-trash"></i> <span class="btn-text">Xóa</span>
            </button>
          </div>
        </div>
      </div>` : ''}
    `;
  },

  getPaginationButtons(totalPages) {
    let buttons = '';
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) buttons += `<button onclick="GuestManager.goToPage(1)">1</button>`;
    if (start > 2) buttons += `<button disabled>...</button>`;

    for (let i = start; i <= end; i++) {
      buttons += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="GuestManager.goToPage(${i})">${i}</button>`;
    }

    if (end < totalPages - 1) buttons += `<button disabled>...</button>`;
    if (end < totalPages) buttons += `<button onclick="GuestManager.goToPage(${totalPages})">${totalPages}</button>`;

    return buttons;
  },

  // ---- Filters & Sort ----
  setFilter(status) {
    this.filterStatus = status;
    this.currentPage = 1;
    this.render();

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === status);
    });
  },

  setSearch(query) {
    this.searchQuery = query;
    this.currentPage = 1;
    this.renderTable();
  },

  toggleSort(field) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.renderTable();
  },

  goToPage(page) {
    this.currentPage = page;
    this.renderTable();
  },

  // ---- Selection ----
  toggleSelect(id, checked) {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.renderTable();
  },

  toggleAll(checked) {
    const guests = this.getFilteredGuests();
    const start = (this.currentPage - 1) * this.pageSize;
    const pageGuests = guests.slice(start, start + this.pageSize);

    pageGuests.forEach(g => {
      if (checked) this.selectedIds.add(g.id);
      else this.selectedIds.delete(g.id);
    });
    this.renderTable();
  },

  // ---- CRUD ----
  showAddModal() {
    App.showModal('Thêm khách mời', `
      <div class="form-group">
        <label class="form-label">Họ và tên <span class="required">*</span></label>
        <input type="text" class="form-control" id="modalGuestName" placeholder="Nguyễn Văn A">
      </div>
      <div class="form-group">
        <label class="form-label">Chức danh</label>
        <input type="text" class="form-control" id="modalGuestTitle" placeholder="Giám đốc...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Số điện thoại</label>
          <input type="tel" class="form-control" id="modalGuestPhone" placeholder="0901234567">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="modalGuestEmail" placeholder="abc@email.com">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <textarea class="form-control" id="modalGuestNote" rows="2" placeholder="Ghi chú thêm..."></textarea>
      </div>
    `, () => {
      const name = document.getElementById('modalGuestName').value.trim();
      if (!name) { App.toast('Vui lòng nhập tên khách mời!', 'error'); return false; }

      Storage.saveGuest({
        name,
        title: document.getElementById('modalGuestTitle').value.trim(),
        phone: document.getElementById('modalGuestPhone').value.trim(),
        email: document.getElementById('modalGuestEmail').value.trim(),
        note: document.getElementById('modalGuestNote').value.trim()
      });

      this.render();
      App.toast('Đã thêm khách mời: ' + name, 'success');
      return true;
    });
  },

  showEditModal(id) {
    const guest = Storage.getGuests().find(g => g.id === id);
    if (!guest) return;

    App.showModal('Sửa thông tin khách mời', `
      <div class="form-group">
        <label class="form-label">Họ và tên <span class="required">*</span></label>
        <input type="text" class="form-control" id="modalGuestName" value="${this.escapeHtml(guest.name)}">
      </div>
      <div class="form-group">
        <label class="form-label">Chức danh</label>
        <input type="text" class="form-control" id="modalGuestTitle" value="${this.escapeHtml(guest.title || '')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Số điện thoại</label>
          <input type="tel" class="form-control" id="modalGuestPhone" value="${this.escapeHtml(guest.phone || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="modalGuestEmail" value="${this.escapeHtml(guest.email || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <textarea class="form-control" id="modalGuestNote" rows="2">${this.escapeHtml(guest.note || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Trạng thái</label>
        <select class="form-control" id="modalGuestStatus">
          <option value="pending" ${guest.status === 'pending' ? 'selected' : ''}>Chưa gửi</option>
          <option value="sent" ${guest.status === 'sent' ? 'selected' : ''}>Đã gửi</option>
          <option value="confirmed" ${guest.status === 'confirmed' ? 'selected' : ''}>Xác nhận</option>
          <option value="declined" ${guest.status === 'declined' ? 'selected' : ''}>Từ chối</option>
        </select>
      </div>
    `, () => {
      const name = document.getElementById('modalGuestName').value.trim();
      if (!name) { App.toast('Vui lòng nhập tên khách mời!', 'error'); return false; }

      Storage.saveGuest({
        id: guest.id,
        name,
        title: document.getElementById('modalGuestTitle').value.trim(),
        phone: document.getElementById('modalGuestPhone').value.trim(),
        email: document.getElementById('modalGuestEmail').value.trim(),
        note: document.getElementById('modalGuestNote').value.trim(),
        status: document.getElementById('modalGuestStatus').value
      });

      this.render();
      App.toast('Đã cập nhật: ' + name, 'success');
      return true;
    });
  },

  deleteGuest(id) {
    const guest = Storage.getGuests().find(g => g.id === id);
    App.confirm(`Xóa khách mời "${guest?.name}"?`, () => {
      Storage.deleteGuest(id);
      this.selectedIds.delete(id);
      this.render();
      App.toast('Đã xóa khách mời.', 'success');
    });
  },

  batchDelete() {
    App.confirm(`Xóa ${this.selectedIds.size} khách đã chọn?`, () => {
      Storage.deleteMultipleGuests([...this.selectedIds]);
      this.selectedIds.clear();
      this.render();
      App.toast('Đã xóa khách mời đã chọn.', 'success');
    });
  },

  // ---- Preview ----
  previewInvitation(id) {
    const guest = Storage.getGuests().find(g => g.id === id);
    if (!guest) return;

    const cardHtml = TemplateEditor.getCardHtml(guest.name);
    App.showModal(`Thư mời - ${guest.name}`, `
      <div style="overflow:auto; max-width:100%;">
        <div style="width:800px; transform-origin:top left;" id="modalPreviewCard">
          ${cardHtml}
        </div>
      </div>
      <div class="mt-md btn-group" style="justify-content:center">
        <button class="btn btn-primary btn-sm" onclick="ExportPrint.exportSingleImage('${guest.id}')">
          <i class="fas fa-image"></i> Xuất ảnh
        </button>
        <button class="btn btn-accent btn-sm" onclick="ExportPrint.exportSinglePDF('${guest.id}')">
          <i class="fas fa-file-pdf"></i> Xuất PDF
        </button>
        <button class="btn btn-success btn-sm" onclick="ZaloSender.sendSingle('${guest.id}')">
          <i class="fas fa-paper-plane"></i> Gửi Zalo
        </button>
      </div>
    `, null, true);

    // Scale preview in modal
    setTimeout(() => {
      const modal = document.querySelector('.modal-body');
      const card = document.getElementById('modalPreviewCard');
      if (modal && card) {
        const scale = Math.min((modal.clientWidth - 48) / 800, 1);
        card.style.transform = `scale(${scale})`;
        card.parentElement.style.height = (card.firstElementChild.offsetHeight * scale) + 'px';
      }
    }, 100);
  },

  // ---- Import/Export ----
  importExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          App.toast('File không có dữ liệu!', 'error');
          return;
        }

        let imported = 0;
        rows.forEach(row => {
          const name = row['Họ tên'] || row['Ho ten'] || row['Name'] || row['Tên'] || row['name'] || '';
          if (name.trim()) {
            Storage.saveGuest({
              name: name.trim(),
              title: (row['Chức danh'] || row['Title'] || row['Chuc danh'] || '').toString().trim(),
              phone: (row['Điện thoại'] || row['Phone'] || row['SĐT'] || row['Số điện thoại'] || '').toString().trim(),
              email: (row['Email'] || row['email'] || '').toString().trim(),
              note: (row['Ghi chú'] || row['Note'] || row['Ghi chu'] || '').toString().trim()
            });
            imported++;
          }
        });

        this.render();
        App.toast(`Đã nhập ${imported} khách mời từ file!`, 'success');
      } catch (err) {
        console.error('Import error:', err);
        App.toast('Lỗi khi đọc file! Vui lòng kiểm tra định dạng.', 'error');
      }
    };
    input.click();
  },

  exportExcel() {
    const guests = Storage.getGuests();
    if (guests.length === 0) {
      App.toast('Không có khách mời để xuất!', 'warning');
      return;
    }

    const statusMap = { pending: 'Chưa gửi', sent: 'Đã gửi', confirmed: 'Xác nhận', declined: 'Từ chối' };
    const data = guests.map((g, i) => ({
      'STT': i + 1,
      'Họ tên': g.name,
      'Chức danh': g.title || '',
      'Điện thoại': g.phone || '',
      'Email': g.email || '',
      'Trạng thái': statusMap[g.status] || 'Chưa gửi',
      'Ghi chú': g.note || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách khách mời');
    XLSX.writeFile(wb, `Danh_sach_khach_moi_${new Date().toISOString().slice(0,10)}.xlsx`);
    App.toast('Đã xuất danh sách ra file Excel!', 'success');
  },

  // ---- Batch Actions ----
  batchSendZalo() {
    const ids = [...this.selectedIds];
    if (ids.length === 0) return;
    
    // Navigate to Zalo sender tab with selected guests
    App.navigate('send');
    setTimeout(() => {
      ZaloSender.startBatchSend(ids);
    }, 300);
  },

  batchExport() {
    const ids = [...this.selectedIds];
    if (ids.length === 0) return;
    
    App.navigate('export');
    setTimeout(() => {
      ExportPrint.batchExportPDF(ids);
    }, 300);
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

/* ============================================
   THƯ MỜI TỰ ĐỘNG - Export & Print Module
   ============================================ */

const ExportPrint = {
  init() {
    this.renderExportPage();
  },

  renderExportPage() {
    const container = document.getElementById('exportContent');
    if (!container) return;

    const guests = Storage.getGuests();
    const settings = Storage.getSettings();

    container.innerHTML = `
      <!-- Export Settings -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-cog"></i> Cài đặt xuất</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Chất lượng ảnh</label>
            <select class="form-control" id="exportQuality" onchange="ExportPrint.updateSettings()">
              <option value="1" ${settings.exportQuality === 1 ? 'selected' : ''}>Chuẩn (1x)</option>
              <option value="2" ${settings.exportQuality === 2 ? 'selected' : ''}>Cao (2x) - Khuyên dùng</option>
              <option value="3" ${settings.exportQuality === 3 ? 'selected' : ''}>Rất cao (3x) - In ấn</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kích thước giấy</label>
            <select class="form-control" id="exportPaperSize" onchange="ExportPrint.updateSettings()">
              <option value="A4" ${settings.paperSize === 'A4' ? 'selected' : ''}>A4 (210 × 297mm)</option>
              <option value="A5" ${settings.paperSize === 'A5' ? 'selected' : ''}>A5 (148 × 210mm)</option>
              <option value="custom" ${settings.paperSize === 'custom' ? 'selected' : ''}>Tùy chỉnh</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Quick Export -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-bolt"></i> Xuất nhanh</div>
        </div>
        <p class="text-muted mb-md" style="font-size:0.85rem">Xuất thư mời mẫu (không có tên khách cụ thể)</p>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="ExportPrint.exportCurrentImage()">
            <i class="fas fa-image"></i> Xuất ảnh PNG
          </button>
          <button class="btn btn-accent" onclick="ExportPrint.exportCurrentPDF()">
            <i class="fas fa-file-pdf"></i> Xuất PDF
          </button>
          <button class="btn btn-outline" onclick="ExportPrint.printCurrent()">
            <i class="fas fa-print"></i> In luôn
          </button>
        </div>
      </div>

      <!-- Batch Export -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-layer-group"></i> Xuất hàng loạt</div>
          <span class="text-muted" style="font-size:0.8rem">${guests.length} khách mời</span>
        </div>

        ${guests.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-xl)">
            <i class="fas fa-users"></i>
            <h3>Chưa có khách mời</h3>
            <p>Thêm khách mời trước khi xuất hàng loạt</p>
          </div>
        ` : `
          <div id="exportGuestList" style="max-height:300px;overflow-y:auto;margin-bottom:var(--space-md);">
            ${guests.map(g => `
              <div class="d-flex align-center gap-sm" style="padding:8px 0; border-bottom:1px solid var(--border-color);">
                <input type="checkbox" class="checkbox export-guest-check" data-id="${g.id}" checked>
                <span style="flex:1;font-size:0.875rem;">${this.escapeHtml(g.name)}</span>
              </div>
            `).join('')}
          </div>

          <div class="d-flex gap-sm mb-md">
            <button class="btn btn-outline btn-sm" onclick="ExportPrint.selectAllExport(true)">
              <i class="fas fa-check-double"></i> Chọn tất cả
            </button>
            <button class="btn btn-outline btn-sm" onclick="ExportPrint.selectAllExport(false)">
              <i class="fas fa-times"></i> Bỏ chọn
            </button>
          </div>

          <div class="btn-group">
            <button class="btn btn-primary btn-lg" onclick="ExportPrint.batchExportImages()">
              <i class="fas fa-images"></i> Xuất tất cả ảnh PNG
            </button>
            <button class="btn btn-accent btn-lg" onclick="ExportPrint.batchExportPDFFromSelection()">
              <i class="fas fa-file-pdf"></i> Xuất PDF gộp
            </button>
          </div>

          <!-- Progress -->
          <div id="exportProgress" class="hidden mt-lg">
            <div class="d-flex justify-between mb-sm">
              <span id="exportProgressText">Đang xuất...</span>
              <span id="exportProgressCount">0/0</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" id="exportProgressBar" style="width:0%"></div>
            </div>
          </div>
        `}
      </div>

      <!-- Data Management -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-database"></i> Quản lý dữ liệu</div>
        </div>
        <p class="text-muted mb-md" style="font-size:0.85rem">Sao lưu và khôi phục toàn bộ dữ liệu ứng dụng</p>
        <div class="btn-group">
          <button class="btn btn-outline" onclick="ExportPrint.backupData()">
            <i class="fas fa-download"></i> Sao lưu dữ liệu
          </button>
          <button class="btn btn-outline" onclick="ExportPrint.restoreData()">
            <i class="fas fa-upload"></i> Khôi phục dữ liệu
          </button>
        </div>
        <div class="mt-md">
          <div class="text-muted" style="font-size:0.8rem">
            <i class="fas fa-info-circle"></i> 
            Bộ nhớ đã dùng: ${Storage.getUsage().usedMB} MB / 5 MB (${Storage.getUsage().percentage}%)
          </div>
          <div class="progress-bar mt-sm" style="max-width:300px">
            <div class="progress-bar-fill" style="width:${Storage.getUsage().percentage}%"></div>
          </div>
        </div>
      </div>
    `;
  },

  updateSettings() {
    const settings = Storage.getSettings();
    settings.exportQuality = parseInt(document.getElementById('exportQuality')?.value || 2);
    settings.paperSize = document.getElementById('exportPaperSize')?.value || 'A4';
    Storage.saveSettings(settings);
  },

  selectAllExport(checked) {
    document.querySelectorAll('.export-guest-check').forEach(cb => cb.checked = checked);
  },

  getSelectedExportIds() {
    const ids = [];
    document.querySelectorAll('.export-guest-check:checked').forEach(cb => ids.push(cb.dataset.id));
    return ids;
  },

  // ---- Create offscreen card for capture (batch export) ----
 async createCaptureCard(guestName) {
    const cardHtml = TemplateEditor.getCardHtml(guestName);
    
    const offscreen = document.createElement('div');
    // Thay vì ẩn hoàn toàn, ta để nó hiển thị nhưng đẩy ra ngoài tầm mắt của người dùng
    // giúp trình duyệt ưu tiên render nội dung hơn
    offscreen.style.cssText = 'position:fixed; left:-2000px; top:0; width:800px; z-index:-1000;';
    offscreen.innerHTML = cardHtml;
    document.body.appendChild(offscreen);

    // Đảm bảo tất cả ảnh bên trong đã được tải
    const images = offscreen.querySelectorAll('img');
    const imagePromises = [...images].map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    await Promise.all(imagePromises);
    
    // QUAN TRỌNG: Chờ thêm một khoảng ngắn (300ms - 500ms) để trình duyệt 
    // xử lý xong các thuộc tính CSS phức tạp (gradient, shadow, border-radius)
    await new Promise(resolve => setTimeout(resolve, 500));

    return { element: offscreen.firstElementChild, container: offscreen };
  },

  // ---- Export Current Template ----
  async exportCurrentImage() {
    const data = TemplateEditor.currentData;
    const guestName = data.guestNamePlaceholder || '';
    const filename = guestName 
      ? `Thu_moi_${this.sanitizeFilename(guestName)}.png`
      : 'Thu_moi.png';
    await this.exportImage(guestName, filename);
  },

  async exportCurrentPDF() {
    const data = TemplateEditor.currentData;
    const guestName = data.guestNamePlaceholder || '';
    const filename = guestName
      ? `Thu_moi_${this.sanitizeFilename(guestName)}.pdf`
      : 'Thu_moi.pdf';
    await this.exportPDF(guestName, filename);
  },

  printCurrent() {
    // Create a print-only div
    const data = TemplateEditor.currentData;
    const cardHtml = TemplateEditor.getCardHtml(data.guestNamePlaceholder || 'Quý Khách');
    
    const printFrame = document.createElement('iframe');
    printFrame.style.cssText = 'position:fixed; left:-9999px; top:-9999px; width:800px; height:500px;';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentDocument;
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="css/main.css">
        <link rel="stylesheet" href="css/template.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          body { margin:0; padding:0; background:white; }
          .invitation-card { width:100% !important; box-shadow:none !important; }
          @media print {
            @page { size: landscape; margin: 0; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>${cardHtml}</body>
      </html>
    `);
    doc.close();

    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      }, 500);
    };
  },

  // ---- Single Guest Export ----
  async exportSingleImage(guestId) {
    const guest = Storage.getGuests().find(g => g.id === guestId);
    if (!guest) return;
    await this.exportImage(guest.name, `Thu_moi_${this.sanitizeFilename(guest.name)}.png`);
  },

  async exportSinglePDF(guestId) {
    const guest = Storage.getGuests().find(g => g.id === guestId);
    if (!guest) return;
    await this.exportPDF(guest.name, `Thu_moi_${this.sanitizeFilename(guest.name)}.pdf`);
  },

  // ---- Core Export Functions ----
  // Export by capturing the live preview card on screen
  async exportImage(guestName, filename) {
    let tempContainer = null;
    try {
      App.toast('Đang tạo ảnh...', 'info');

      // Luôn tạo card mới để đảm bảo kích thước chuẩn 800px, không bị ảnh hưởng bởi CSS Scale của màn hình preview
      const result = await this.createCaptureCard(guestName);
      tempContainer = result.container;
      const targetElement = result.element;

      const settings = Storage.getSettings();
      const canvas = await html2canvas(targetElement, {
        scale: settings.exportQuality || 2,
        useCORS: true, // Cho phép chụp ảnh từ URL khác
        allowTaint: false,
        backgroundColor: null,
        width: 800,
        height: targetElement.offsetHeight,
        logging: true // Bật để xem log chi tiết nếu lỗi
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      App.toast('Đã xuất ảnh thành công!', 'success');
    } catch (err) {
      console.error('Export image error:', err);
      App.toast('Lỗi xuất ảnh: ' + err.message, 'error');
    } finally {
      if (tempContainer) document.body.removeChild(tempContainer);
    }
  },

 async exportPDF(guestName, filename) {
    let tempContainer = null;
    try {
      App.toast('Đang tạo PDF...', 'info');
      
      // Kiểm tra thư viện trước khi chạy
      if (typeof html2canvas === 'undefined') {
        throw new Error('Thư viện html2canvas chưa tải xong, vui lòng đợi vài giây.');
      }

      const { element, container } = await this.createCaptureCard(guestName);
      tempContainer = container;
      
      const settings = Storage.getSettings();
      const canvas = await html2canvas(element, {
        scale: settings.exportQuality || 2,
        useCORS: true,
        allowTaint: true,
        width: 800
      });

      const imgData = canvas.toDataURL('image/png');
      
      // LƯU Ý: Cách gọi đúng cho bản CDN mới nhất
      const { jsPDF } = window.jspdf; 
      const pdf = new jsPDF('l', 'mm', settings.paperSize === 'A5' ? 'a5' : 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, (pdfHeight - pdfImgHeight) / 2, pdfWidth, pdfImgHeight);
      pdf.save(filename);

      App.toast('Đã xuất PDF thành công!', 'success');
    } catch (err) {
      console.error('Export PDF error:', err);
      App.toast('Lỗi: ' + err.message, 'error');
    } finally {
      if (tempContainer) document.body.removeChild(tempContainer);
    }
  },

  // ---- Batch Export ----
  async batchExportImages() {
    const ids = this.getSelectedExportIds();
    if (ids.length === 0) {
      App.toast('Vui lòng chọn khách mời!', 'warning');
      return;
    }

    const guests = Storage.getGuests();
    this.showExportProgress(true);

    for (let i = 0; i < ids.length; i++) {
      const guest = guests.find(g => g.id === ids[i]);
      if (!guest) continue;

      this.updateExportProgress(`Đang xuất: ${guest.name}`, i, ids.length);
      await this.exportImage(guest.name, `Thu_moi_${this.sanitizeFilename(guest.name)}.png`);
      
      // Small delay between exports
      await new Promise(r => setTimeout(r, 300));
    }

    this.updateExportProgress('Hoàn tất!', ids.length, ids.length);
    App.toast(`Đã xuất ${ids.length} ảnh thư mời!`, 'success');
  },

  async batchExportPDFFromSelection() {
    const ids = this.getSelectedExportIds();
    await this.batchExportPDF(ids);
  },

  async batchExportPDF(ids) {
    if (!ids || ids.length === 0) {
      App.toast('Vui lòng chọn khách mời!', 'warning');
      return;
    }

    try {
      const guests = Storage.getGuests();
      const settings = Storage.getSettings();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', settings.paperSize === 'A5' ? 'a5' : 'a4');

      this.showExportProgress(true);

      for (let i = 0; i < ids.length; i++) {
        const guest = guests.find(g => g.id === ids[i]);
        if (!guest) continue;

        this.updateExportProgress(`Đang tạo: ${guest.name}`, i, ids.length);

        if (i > 0) pdf.addPage();

        const { element, container } = await this.createCaptureCard(guest.name);

        const canvas = await html2canvas(element, {
          scale: settings.exportQuality || 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          width: 800,
          height: element.offsetHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgRatio = canvas.width / canvas.height;
        
        let drawWidth = pdfWidth - 10;
        let drawHeight = drawWidth / imgRatio;
        if (drawHeight > pdfHeight - 10) {
          drawHeight = pdfHeight - 10;
          drawWidth = drawHeight * imgRatio;
        }

        const x = (pdfWidth - drawWidth) / 2;
        const y = (pdfHeight - drawHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, drawWidth, drawHeight);
        document.body.removeChild(container);
        
        await new Promise(r => setTimeout(r, 100));
      }

      this.updateExportProgress('Hoàn tất!', ids.length, ids.length);
      pdf.save(`Thu_moi_danh_sach_${new Date().toISOString().slice(0,10)}.pdf`);
      App.toast(`Đã xuất PDF gộp ${ids.length} thư mời!`, 'success');
    } catch (err) {
      console.error('Batch PDF error:', err);
      App.toast('Lỗi khi xuất PDF!', 'error');
    }
  },

  showExportProgress(show) {
    document.getElementById('exportProgress')?.classList.toggle('hidden', !show);
  },

  updateExportProgress(text, current, total) {
    const textEl = document.getElementById('exportProgressText');
    const countEl = document.getElementById('exportProgressCount');
    const barEl = document.getElementById('exportProgressBar');
    if (textEl) textEl.textContent = text;
    if (countEl) countEl.textContent = `${current}/${total}`;
    if (barEl) barEl.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
  },

  // ---- Data Backup/Restore ----
  backupData() {
    const data = Storage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `thu_moi_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    App.toast('Đã sao lưu dữ liệu!', 'success');
  },

  restoreData() {
    App.confirm('Khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại. Tiếp tục?', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (!data.version) throw new Error('Invalid backup file');
            Storage.importAllData(data);
            App.toast('Đã khôi phục dữ liệu thành công! Đang tải lại...', 'success');
            setTimeout(() => location.reload(), 1500);
          } catch (err) {
            App.toast('File không hợp lệ!', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  },

  // ---- Utils ----
  sanitizeFilename(str) {
    return str.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_').substring(0, 50);
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

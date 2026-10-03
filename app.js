'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const format = (value) => new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 2}).format(value);

// Progressive enhancement: the story remains readable without motion support.
if ('IntersectionObserver' in window && !reducedMotion) {
  document.body.classList.add('js-motion');
  const reveals = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        reveals.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});
  $$('.reveal').forEach((element) => reveals.observe(element));
}

function closeMenu() {
  $('#chapter-menu').hidden = true;
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
}
$('#menu-toggle').addEventListener('click', () => {
  const opened = $('#menu-toggle').getAttribute('aria-expanded') === 'true';
  $('#chapter-menu').hidden = opened;
  $('#menu-toggle').setAttribute('aria-expanded', String(!opened));
});
$$('#chapter-menu a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
document.addEventListener('click', (event) => {
  if (!$('#chapter-menu').contains(event.target) && !$('#menu-toggle').contains(event.target)) closeMenu();
});

let queuedScroll = false;
const chapters = $$('[data-chapter]');
const journeySteps = $$('.journey-step');
const sessionSteps = $$('.session-step');
function updateReading() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const progress = distance > 0 ? Math.min(100, Math.max(0, window.scrollY / distance * 100)) : 0;
  $('#progress').style.width = `${progress}%`;
  $('#reading-percent').textContent = `${Math.round(progress)}%`;
  let current = chapters[0];
  chapters.forEach((chapter) => {
    if (chapter.getBoundingClientRect().top <= window.innerHeight * 0.36) current = chapter;
  });
  $('#chapter-name').textContent = current.dataset.chapter;
  let activeStep = journeySteps[0];
  journeySteps.forEach((step) => {
    if (step.getBoundingClientRect().top <= window.innerHeight * 0.45) activeStep = step;
  });
  $('#journey-month').textContent = activeStep.dataset.month;
  $('#journey-year').textContent = activeStep.dataset.year;
  $$('.timeline-nav a').forEach((link) => {
    const active = link.hash === `#${activeStep.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
  });
  let activeSession = sessionSteps[0];
  sessionSteps.forEach((step) => {
    if (step.getBoundingClientRect().top <= window.innerHeight * 0.52) activeSession = step;
  });
  $('#session-day').textContent = activeSession.dataset.day;
  $('#session-event').textContent = activeSession.dataset.event;
  sessionSteps.forEach((step) => step.classList.toggle('active', step === activeSession));
  queuedScroll = false;
}
window.addEventListener('scroll', () => {
  if (!queuedScroll) {queuedScroll = true; requestAnimationFrame(updateReading);}
}, {passive: true});
window.addEventListener('resize', updateReading);
updateReading();

// Counts transcribed from the TTXVN table [3]. Dots represent amounts,
// never identified people, actual seats, or membership intersections.
const total = 492;
const groups = [
  {label: 'Công nhân', count: 80, color: '#edac8c'},
  {label: 'Nông dân', count: 100, color: '#edc786'},
  {label: 'Thợ thủ công', count: 6, color: '#e0a9ce'},
  {label: 'Quân nhân', count: 54, color: '#74bea9'},
  {label: 'Cán bộ chính trị', count: 141, color: '#859fed'},
  {label: 'Trí thức và nhân sĩ', count: 98, color: '#a3c4db'},
  {label: 'Đại biểu tôn giáo', count: 13, color: '#b5a0e2'}
];
const dimensions = {
  women: {label: 'Đại biểu nữ', count: 132, color: '#edac8c'},
  ethnic: {label: 'Đại biểu dân tộc thiểu số', count: 67, color: '#edc786'},
  young: {label: 'Đại biểu tuổi 20–30', count: 58, color: '#74bea9'}
};
const dots = [];
for (let row = 0; row < 12; row++) {
  const count = 30 + 2 * row;
  const radius = 100 + row * 18.5;
  for (let seat = 0; seat < count; seat++) {
    const angle = Math.PI - seat / (count - 1) * Math.PI;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(360 + Math.cos(angle) * radius));
    dot.setAttribute('cy', String(350 - Math.sin(angle) * radius));
    dot.setAttribute('r', '4.3');
    dot.classList.add('seat');
    dot.setAttribute('aria-hidden', 'true');
    $('#parliament').append(dot);
    dots.push(dot);
  }
}
let chartMode = 'occupation';
let selectedGroup = -1;
function currentGroups() {
  if (chartMode === 'occupation') return groups;
  const dimension = dimensions[chartMode];
  return [dimension, {label: 'Các đại biểu còn lại', count: total - dimension.count, color: '#c9cec7'}];
}
function paintChart() {
  const displayGroups = currentGroups();
  let rangeEnd = displayGroups[0].count;
  let groupIndex = 0;
  dots.forEach((dot, index) => {
    while (index >= rangeEnd && groupIndex < displayGroups.length - 1) {
      groupIndex++; rangeEnd += displayGroups[groupIndex].count;
    }
    dot.setAttribute('fill', displayGroups[groupIndex].color);
    dot.setAttribute('opacity', selectedGroup < 0 || groupIndex === selectedGroup ? '1' : '0.16');
  });
  const selection = selectedGroup < 0 ? null : displayGroups[selectedGroup];
  $('#highlight-count').textContent = format(selection ? selection.count : total);
  $('#highlight-label').textContent = selection ? (chartMode === 'occupation' ? 'TRONG NHÓM ĐÃ CHỌN' : 'ĐẠI BIỂU ĐÃ CHỌN') : 'ĐẠI BIỂU';
  $('#chart-status').textContent = selection
    ? `${selection.label}: ${format(selection.count)} đại biểu, ${format(selection.count / total * 100)}% tổng số. Nguồn TTXVN [3].`
    : `${displayGroups.length} nhóm hiển thị, tổng cộng 492 đại biểu. Nguồn TTXVN [3].`;
  $('#chart-desc').textContent = displayGroups.map((group) => `${group.label}: ${group.count}`).join('; ') + '. Mỗi chấm minh họa một đơn vị số lượng, không xác định người hay chỗ ngồi thực tế.';
  $$('#chart-legend button').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === selectedGroup));
    button.classList.toggle('selected', index === selectedGroup);
  });
}
function setChartMode(mode) {
  chartMode = mode;
  selectedGroup = mode === 'occupation' ? -1 : 0;
  $$('.chart-tabs button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('#legend-heading').textContent = mode === 'occupation' ? 'CHỌN NHÓM ĐỂ KHÁM PHÁ' : 'MỘT CHIỀU PHÂN LOẠI RIÊNG';
  $('#chart-legend').replaceChildren();
  currentGroups().forEach((group, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'legend-item';
    const swatch = document.createElement('i'); swatch.style.background = group.color;
    const label = document.createElement('span'); label.textContent = group.label;
    const count = document.createElement('b'); count.textContent = format(group.count);
    const percentage = document.createElement('small'); percentage.textContent = `${format(group.count / total * 100)}%`;
    button.append(swatch, label, count, percentage);
    button.addEventListener('click', () => {selectedGroup = selectedGroup === index ? -1 : index; paintChart();});
    $('#chart-legend').append(button);
  });
  paintChart();
}
$$('.chart-tabs button').forEach((button) => button.addEventListener('click', () => setChartMode(button.dataset.mode)));
$('#chart-reset').addEventListener('click', () => {selectedGroup = -1; paintChart();});
setChartMode('occupation');

const decrees = [
  {
    short: 'Tên nước & biểu trưng', category: 'TÊN NƯỚC & BIỂU TRƯNG', title: 'Tên gọi và biểu trưng chung', source: 1,
    body: '<p>Quốc hội quyết định tên nước là <strong>Cộng hòa xã hội chủ nghĩa Việt Nam</strong>, Thủ đô là Hà Nội; Quốc kỳ nền đỏ, ngôi sao vàng năm cánh; Quốc ca là <em>Tiến quân ca</em>.</p><p>Quốc huy mang dòng tên nước mới. Các biểu trưng được xác định cho Nhà nước thống nhất, tiếp nối những biểu tượng đã có trong lịch sử.</p><div class="document-insight"><span>VẤN ĐỀ ĐƯỢC GIẢI QUYẾT</span><p>Đặt tên và xác định biểu trưng để Nhà nước chung có căn cước chính thức trên phạm vi cả nước.</p></div>'
  },
  {
    short: 'Khóa Quốc hội', category: 'SỰ TIẾP NỐI CỦA QUỐC HỘI', title: 'Quốc hội thống nhất mang số khóa VI', source: 6,
    body: '<p>Nghị quyết xác định Quốc hội được bầu trong cuộc Tổng tuyển cử ngày 25/4/1976 là <strong>Quốc hội khóa VI</strong>.</p><p>Số khóa tiếp nối năm khóa Quốc hội trước đó. Đây là kỳ họp thứ nhất của Quốc hội nước Việt Nam thống nhất, đồng thời thuộc tiến trình Quốc hội bắt đầu từ năm 1946.</p><div class="document-insight"><span>VẤN ĐỀ ĐƯỢC GIẢI QUYẾT</span><p>Làm rõ sự liên tục của cơ quan đại diện, tránh hiểu năm 1976 là điểm bắt đầu toàn bộ lịch sử Quốc hội.</p></div>'
  },
  {
    short: 'Cơ sở hoạt động', category: 'TỔ CHỨC & HOẠT ĐỘNG', title: 'Vận hành khi chưa có Hiến pháp mới', source: 2,
    body: '<p>Quốc hội quyết định về tổ chức và hoạt động của Nhà nước trong thời gian chưa có Hiến pháp mới. Cơ sở vận hành là <strong>Hiến pháp năm 1959</strong>.</p><p>Trong kỳ họp, các chức danh lãnh đạo và thành phần cơ quan nhà nước được bầu, phê chuẩn để đảm nhiệm công việc của cả nước.</p><div class="document-insight"><span>VẤN ĐỀ ĐƯỢC GIẢI QUYẾT</span><p>Nhà nước chung cần hoạt động ngay; công việc trước mắt được triển khai đồng thời với việc chuẩn bị Hiến pháp mới.</p></div>'
  },
  {
    short: 'Dự thảo Hiến pháp', category: 'CHUẨN BỊ HIẾN PHÁP MỚI', title: 'Ủy ban dự thảo gồm 36 thành viên', source: 11,
    body: '<p>Ủy ban dự thảo Hiến pháp được thành lập với <strong>36 thành viên</strong>, do Trường Chinh làm Chủ tịch.</p><p>Nhiệm vụ ở năm 1976 là chuẩn bị bản Hiến pháp cho giai đoạn mới. Hiến pháp 1980 được thông qua về sau, tại kỳ họp thứ bảy của Quốc hội khóa VI.</p><div class="document-insight"><span>VẤN ĐỀ ĐƯỢC GIẢI QUYẾT</span><p>Hình thành cơ quan chịu trách nhiệm dự thảo, tạo bước nối từ tổ chức bộ máy đến xây dựng nền tảng hiến định.</p></div>'
  },
  {
    short: 'Tên Thành phố', category: 'THÀNH PHỐ SÀI GÒN – GIA ĐỊNH', title: 'Thành phố mang tên Hồ Chí Minh', source: 9,
    body: '<p>Quốc hội chính thức đặt tên thành phố Sài Gòn – Gia Định là <strong>Thành phố Hồ Chí Minh</strong>.</p><p>Quyết định này được thông qua bằng một nghị quyết riêng ngày 2/7/1976, cùng ngày với các nghị quyết nền tảng khác.</p><div class="document-insight"><span>ĐỌC CHO CHÍNH XÁC</span><p>Nghị quyết về tên thành phố và nghị quyết về tên nước là hai văn bản khác nhau, dù cùng thuộc dấu mốc ngày 2/7.</p></div>'
  },
  {
    short: 'Sáu ủy ban', category: 'CÁC ỦY BAN CỦA QUỐC HỘI', title: 'Phân công công việc theo lĩnh vực', source: 3,
    body: '<p>Quốc hội thành lập sáu ủy ban:</p><ul><li>Kế hoạch và ngân sách</li><li>Dự án pháp luật</li><li>Dân tộc</li><li>Văn hóa và giáo dục</li><li>Y tế và xã hội</li><li>Đối ngoại</li></ul><div class="document-insight"><span>VẤN ĐỀ ĐƯỢC GIẢI QUYẾT</span><p>Công việc nghị viện được phân công theo lĩnh vực. Sáu ủy ban này khác với Ủy ban dự thảo Hiến pháp ở hồ sơ 04.</p></div>'
  }
];
let activeDecree = 0;
function renderDecree(index, focus = false) {
  activeDecree = index;
  const decree = decrees[index];
  $$('#decree-tabs button').forEach((button, tabIndex) => {
    const selected = tabIndex === index;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  });
  $('#decree-panel').setAttribute('aria-labelledby', `decree-tab-${index}`);
  $('#decree-num').textContent = String(index + 1).padStart(2, '0');
  $('#decree-category').textContent = decree.category;
  $('#decree-title').textContent = decree.title;
  $('#decree-body').innerHTML = decree.body; // Authored static editorial content only.
  $('#decree-source').href = `#s${decree.source}`;
  $('#decree-source').textContent = `Đối chiếu nguồn [${decree.source}]`;
}
decrees.forEach((decree, index) => {
  const button = document.createElement('button');
  button.id = `decree-tab-${index}`;
  button.className = 'decree-tab';
  button.type = 'button'; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'decree-panel');
  const number = document.createElement('span'); number.className = 'tab-number'; number.textContent = String(index + 1).padStart(2, '0');
  const label = document.createElement('strong'); label.textContent = decree.short;
  const arrow = document.createElement('i'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
  button.append(number, label, arrow);
  button.addEventListener('click', () => renderDecree(index));
  button.addEventListener('keydown', (event) => {
    let next;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (activeDecree + 1) % decrees.length;
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (activeDecree + decrees.length - 1) % decrees.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = decrees.length - 1;
    if (next !== undefined) {event.preventDefault(); renderDecree(next, true);}
  });
  $('#decree-tabs').append(button);
});
renderDecree(0);

$$('#quiz button').forEach((button) => button.addEventListener('click', () => {
  $$('#quiz button').forEach((other) => {
    const selected = other === button;
    other.setAttribute('aria-pressed', String(selected));
    other.classList.toggle('selected', selected);
  });
  $('#quiz-feedback').hidden = false;
  $('#quiz-feedback').innerHTML = (button.dataset.answer === 'no' ? '<strong>Đúng — tên nước là một phần của quá trình.</strong> ' : '<strong>Hãy nhìn thêm những quyết định cùng ngày.</strong> ') + 'Bên cạnh tên gọi và biểu trưng, Quốc hội quyết định tổ chức, hoạt động của Nhà nước, thành lập các ủy ban và chuẩn bị Hiến pháp mới. Việc bầu lãnh đạo chung cũng là nhiệm vụ của kỳ họp. <a href="#s2">Đọc lại tư liệu [2]</a>.';
}));

const photoDialog = $('#photo-dialog');
let photoTrigger;
$$('[data-image]').forEach((button) => button.addEventListener('click', () => {
  photoTrigger = button;
  $('#dialog-image').src = button.dataset.image;
  $('#dialog-image').alt = button.querySelector('img')?.alt || button.dataset.alt || 'Ảnh tư liệu';
  $('#dialog-caption').textContent = button.dataset.caption;
  photoDialog.showModal();
}));
$('.dialog-close').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', (event) => {if (event.target === photoDialog) photoDialog.close();});
photoDialog.addEventListener('close', () => photoTrigger?.focus());

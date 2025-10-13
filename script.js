document.addEventListener('DOMContentLoaded', function() {
    // 1. Đồng hồ Đếm ngược (Countdown Timer)
    // Cập nhật ngày tháng năm tại đây
    // Parse target date from the visible text in #save-date-intro
    const dateEl = document.querySelector('#save-date-intro .details-col p');
    const timeContainer = document.querySelector('#save-date-intro .details-col--right');
    let target = null;
    if (dateEl) {
        const dateText = (dateEl.textContent || '').trim();
        const m = dateText.match(/(\d{1,2}).*?(\d{1,2}).*?(\d{4})/);
        if (m) {
            const day = parseInt(m[1], 10);
            const month = parseInt(m[2], 10);
            const year = parseInt(m[3], 10);
            let hh = 12, mm = 0;
            if (timeContainer) {
                const timeText = (timeContainer.textContent || '').trim();
                const tm = timeText.match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i);
                if (tm) {
                    hh = parseInt(tm[1], 10);
                    mm = parseInt(tm[2], 10);
                    const ap = tm[3] ? tm[3].toUpperCase() : '';
                    if (ap === 'PM' && hh < 12) hh += 12;
                    if (ap === 'AM' && hh === 12) hh = 0;
                }
            }
            target = new Date(year, month - 1, day, hh, mm, 0, 0);
        }
    }
    const weddingDate = (target ? target : new Date('Dec 07, 2025 12:00:00'));
    const countdownDate = weddingDate.getTime();
    
    const x = setInterval(function() {
        const now = new Date().getTime();
        const distance = countdownDate - now;
        
        // Tính toán thời gian
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Hiển thị kết quả ra HTML
        if (document.getElementById("days")) {
            document.getElementById("days").innerHTML = days;
            document.getElementById("hours").innerHTML = hours;
            document.getElementById("minutes").innerHTML = minutes;
            document.getElementById("seconds").innerHTML = seconds;
        }

        // Khi đếm ngược kết thúc
        if (distance < 0) {
            clearInterval(x);
            if (document.getElementById("days")) {
                document.getElementById("days").innerHTML = 0;
                document.getElementById("hours").innerHTML = 0;
                document.getElementById("minutes").innerHTML = 0;
                document.getElementById("seconds").innerHTML = 0;
            }
        }
    }, 1000);

    // 2. Xử lý Form Xác nhận Tham dự (RSVP)
    const form = document.getElementById('attendance-form');
    const formMessage = document.getElementById('form-message');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = (document.getElementById('name').value || '').trim();
        const message = (document.getElementById('message') ? document.getElementById('message').value : '').trim();
        const attendance = document.querySelector('input[name="attendance"]:checked').value;

        let sent = false;
        const app = window.APP_SCRIPT || null;    // Apps Script endpoint (JSON only)

        // JSON-only submission to Apps Script
        if (!sent && app && app.action) {
            const fields = (app.fields || {});
            const payload = { name, attendance };
            if (message) payload.message = message;
            // Include alternate keys if server expects localized names
            if (fields.name && fields.name !== 'name') payload[fields.name] = name;
            if (fields.attendance && fields.attendance !== 'attendance') payload[fields.attendance] = attendance;
            if (message && fields.message && fields.message !== 'message') payload[fields.message] = message;
            try {
                let ok = false;
                if (navigator.sendBeacon) {
                    const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' });
                    ok = navigator.sendBeacon(app.action, blob);
                }
                if (!ok) {
                    await fetch(app.action, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                        referrerPolicy: 'no-referrer',
                        body: JSON.stringify(payload)
                    });
                }
                sent = true;
            } catch (_) { /* network error -> treat as not sent */ }
        }

        formMessage.style.display = 'block';
        formMessage.style.color = 'green';
        formMessage.textContent = sent
            ? `Cảm ơn ${name}! Xác nhận của bạn đã được ghi nhận.`
            : `Đã nhận thông tin: ${name} – ${attendance}. (Chế độ demo)`;
        form.reset();
    });

    // 3) Bố cục phần intro theo mẫu: Accent đỏ -> intro-text -> ảnh 2x2 -> hàng chữ đỏ
    (function(){
        const groom = document.getElementById('groom-bride');
        if (!groom) return;

        // Accent đỏ phía trên intro
        const intro = groom.querySelector('.intro-text');
        if (intro && !groom.querySelector('.intro-accent')) {
            const accent = document.createElement('h3');
            accent.className = 'intro-accent';
            accent.textContent = 'Sweet Day';
            intro.parentNode.insertBefore(accent, intro);
        }

        // Hai ảnh hai bên, chữ ở giữa (nằm trong hàng ảnh)
        const photoRow = groom.querySelector('.photo-2x2');
        if (photoRow && !photoRow.querySelector('.center-words')) {
            photoRow.classList.add('with-center-words');

            // Bọc mỗi ảnh bằng khung mềm để có thể phủ gradient mờ mép
            const imgs = Array.from(photoRow.querySelectorAll('img'));
            imgs.forEach(img => {
                if (img.parentElement && img.parentElement.classList.contains('photo-soft')) return;
                const wrap = document.createElement('div');
                wrap.className = 'photo-soft';
                img.parentNode.insertBefore(wrap, img);
                wrap.appendChild(img);
            });

            // Chèn chữ ở giữa
            const center = document.createElement('div');
            center.className = 'center-words';
            center.innerHTML = '<span>FALL IN</span><span>LOVE</span><span>WITH YOU</span>';
            const firstBox = photoRow.querySelector('.photo-soft');
            if (firstBox && firstBox.nextSibling) {
                photoRow.insertBefore(center, firstBox.nextSibling);
            } else {
                photoRow.appendChild(center);
            }
        }
    })();

    // 4) Cập nhật lời mời trong Invitation (tránh lặp)
    (function(){
        const poem = document.querySelector('#invitation .poem-text');
        if (!poem) return;
        poem.innerHTML = [
            '<p>Ngày nắng lên, anh ghé qua con phố</p>',
            '<p>Ghé tiệm hoa, xin một nhành xuân</p>',
            '<p>Duyên gặp gỡ, em cười như nắng</p>',
            '<p>Từ phút giây, tim đã có nhau</p>',
            '<p>Đường xa lắm, xin cùng chung bước</p>',
            '<p>Mùa nào qua, tình vẫn vẹn nguyên</p>',
            '<br>',
            '<p class="red-text">Trọn kiếp, một người – là em</p>'
        ].join('');
    })();

    // 5) Calendar overlay trên ảnh full-width ở Invitation
    (function(){
        const row = document.querySelector('#invitation .image-row');
        const img = row ? row.querySelector('img.full-width-image') : null;
        if (!row || !img || row.querySelector('.calendar-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'calendar-overlay';

        const happiness = document.createElement('div');
        happiness.className = 'calendar-happiness';
        happiness.textContent = '囍';

        const subtitle = document.createElement('div');
        subtitle.className = 'calendar-subtitle';
        subtitle.textContent = 'Ngày vui đã chọn, trân trọng mời bạn';

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        const date = new Date(weddingDate.getTime());
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const selectedDay = date.getDate();

        // Build calendar: show days from 1st weekday offset
        const first = new Date(year, month, 1);
        const startWeekday = first.getDay(); // 0: Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Optionally include previous month placeholders to align grid
        for (let i = 0; i < startWeekday; i++) {
            const d = document.createElement('div');
            d.className = 'calendar-day calendar-day--muted';
            d.textContent = '';
            grid.appendChild(d);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day' + (d === selectedDay ? ' calendar-day--active' : '');
            cell.textContent = d;
            grid.appendChild(cell);
        }

        overlay.appendChild(happiness);
        overlay.appendChild(subtitle);
        overlay.appendChild(grid);
        row.style.position = 'relative';
        row.appendChild(overlay);
    })();

    // 6) Lấy tên khách mời từ URL (?guest=...)
    (function(){
        try {
            const params = new URLSearchParams(window.location.search);
            let guest = params.get('guest');
            if (guest) {
                // Hỗ trợ dạng dùng dấu + làm khoảng trắng
                guest = guest.replace(/\+/g, ' ');
                try { guest = decodeURIComponent(guest); } catch(_) {}
                const el = document.querySelector('#invite-after-gb .guest');
                if (el && guest.trim()) el.textContent = guest.trim();
            }
        } catch (_) { /* ignore */ }
    })();

    // 7) QR modal for donate buttons
    (function(){
        const modal = document.getElementById('qr-modal');
        if (!modal) return;
        const imgEl = document.getElementById('qr-image');
        const caption = modal.querySelector('.qr-caption');
        const closeBtn = modal.querySelector('.qr-close');
        const backdrop = modal.querySelector('.qr-backdrop');

        const open = (src, cap) => {
            if (src) imgEl.src = src; else imgEl.removeAttribute('src');
            caption.textContent = cap || '';
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        };
        const close = () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(()=>{ imgEl.removeAttribute('src'); }, 150);
        };

        document.querySelectorAll('.donate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const src = btn.getAttribute('data-qr') || '';
                const cap = btn.classList.contains('groom') ? 'Mừng cưới Nhà Trai' : 'Mừng cưới Nhà Gái';
                open(src, cap);
            });
        });

        [closeBtn, backdrop].forEach(el => el && el.addEventListener('click', close));
        document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
    })();

    // 8) Music toggle button (play/pause)
    (function(){
        const audio = document.getElementById('wedding-audio');
        const btn = document.getElementById('music-toggle');
        if (!audio || !btn) return;

        const sync = () => {
            const isPlaying = !audio.paused && !audio.ended;
            btn.classList.toggle('playing', isPlaying);
            btn.classList.toggle('off', !isPlaying);
            btn.setAttribute('aria-pressed', String(isPlaying));
            btn.setAttribute('aria-label', isPlaying ? 'Tắt nhạc' : 'Bật nhạc');
        };

        btn.addEventListener('click', async () => {
            try {
                if (audio.paused || audio.ended) {
                    await audio.play();
                } else {
                    audio.pause();
                }
            } catch (_) { /* ignore playback errors (autoplay policies, etc.) */ }
            finally { sync(); }
        });

        audio.addEventListener('play', sync);
        audio.addEventListener('pause', sync);
        audio.addEventListener('ended', () => { try { audio.currentTime = 0; } catch(_){}; sync(); });

        // Initialize state
        sync();
    })();
});

# 1976 — Từ hai miền đến một Nhà nước

Chuyên đề scrollytelling tiếng Việt về kỳ họp thứ nhất Quốc hội khóa VI, 24/6–3/7/1976.

[Đọc website](https://daotrunganhvt72.github.io/ky-hop-1976/)

Trang kể câu chuyện theo tám chương: bối cảnh hai chính phủ sau 1975; hiệp thương và tổng tuyển cử; dữ liệu đại biểu; diễn biến kỳ họp; sáu nghị quyết ngày 2/7; bộ máy lãnh đạo; ý nghĩa và giới hạn; thư mục nguồn.

## Chạy trang

Website tĩnh HTML/CSS/JavaScript, không cần cài thư viện hoặc build. Mở `index.html`, hoặc phục vụ thư mục bằng một máy chủ HTTP tĩnh. GitHub Pages: chọn nhánh `main`, thư mục `/ (root)`.

## Tư liệu

Mọi nguồn nằm ngay trong mục “Tủ tư liệu mở” trên trang. Số liệu có tệp `data.csv`; bảy nhóm thành phần cộng 492 đại biểu. Các chiều giới tính, dân tộc và tuổi được thể hiện độc lập, không cộng chung hoặc suy ra giao thoa. Chấm chỉ minh họa số lượng, không xác định cá nhân hay chỗ ngồi thực tế.

Ảnh là ảnh tư liệu từ TTXVN/VietnamPlus, Bảo tàng Lịch sử Quốc gia và media.quochoi.vn; xuất xứ gắn với chú thích ảnh. Giữ nguyên nội dung ảnh, không tô màu hay thêm chi tiết vào tư liệu. Quyền đối với ảnh thuộc chủ sở hữu tương ứng; kho mã không cấp phép lại ảnh báo chí.

Tên chức danh năm 1976 được giữ theo nguồn: Trường Chinh là Chủ tịch Ủy ban Thường vụ Quốc hội. Hiến pháp 1980 được thông qua về sau, không phải ở kỳ họp tháng 6–7/1976.

## Thiết kế & khả năng tiếp cận

Thiết kế triển lãm tương tác: nền đỏ trầm, ngôi sao vàng năm cánh và điểm sáng vàng, tiêu đề Barlow Condensed. `cinema.css` và `cinema.js` tạo ba cảnh có chiều sâu: poster mở đầu với sao vàng chuyển động nhẹ trên nền đỏ, các lớp hình của hành trình xoay qua bốn mốc, và khung nghị trường thay đổi theo bốn ngày. Nền sao vàng được vẽ bằng Canvas 2D, ảnh tư liệu hiển thị bằng phối cảnh CSS 3D. Tiến độ được nội suy theo thời gian; không ép cuộn hoặc thay đổi tỷ lệ dữ liệu.

Biểu đồ 492 chấm có bộ lọc, sáu hồ sơ nghị quyết dùng tab bàn phím, ảnh mở lớn và câu hỏi cuối bài. Có nút bật/tắt chuyển động trong mục lục và tôn trọng `prefers-reduced-motion`. Khi tắt chuyển động, toàn bộ bài chuyển về thứ tự đọc thông thường. Hỗ trợ điện thoại, không thu thập dữ liệu người đọc. Ngôi sao, ánh sáng và các hạt nền là trang trí; chúng tách biệt với biểu đồ dữ liệu 492 đại biểu.

Fonts được tải từ Google Fonts; trình duyệt có font dự phòng nếu offline. Nội dung chính vẫn đọc được khi JavaScript bị tắt; các tương tác cần JavaScript.

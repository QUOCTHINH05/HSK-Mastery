# HSK Mastery Hub - Chinh Phục Từ Vựng Tiếng Trung

**HSK Mastery Hub** là một ứng dụng web tương tác hiện đại, được thiết kế để giúp người học tiếng Trung ôn tập và ghi nhớ từ vựng từ cấp độ HSK 1 đến HSK 4 một cách hiệu quả. Ứng dụng kết hợp phương pháp trắc nghiệm thông minh, âm thanh trực quan và khả năng lưu trữ cá nhân hóa để tối ưu hóa lộ trình học tập.

---

## 📋 Mục lục
* [✨ Tính năng nổi bật](#-tính-năng-nổi-bật)
* [🛠 Công nghệ sử dụng](#-công-nghệ-sử-dụng)
* [📂 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
* [🚀 Hướng dẫn cài đặt cục bộ](#-hướng-dẫn-cài-đặt-cục-bộ)
* [📊 Nguồn dữ liệu](#-nguồn-dữ-liệu)
* [📄 Giấy phép](#-giấy-phép)

---

## ✨ Tính năng nổi bật

*   **📚 Phân loại cấp độ:** Hệ thống bài học được chia rõ ràng từ HSK 1 đến HSK 4, phù hợp với trình độ của từng người học.
*   **🔄 Chế độ học linh hoạt:**
    *   **Trung → Việt:** Rèn luyện khả năng nhận diện mặt chữ và nhớ nghĩa.
    *   **Việt → Trung:** Thử thách khả năng nhớ mặt chữ Hán dựa trên nghĩa tiếng Việt.
    *   **Trung → Anh:** Học 2 ngôn ngữ cùng lúc.
    *   **Anh → Trung:** Học 2 ngôn ngữ cùng lúc.
*   **🔊 Phát âm chuẩn:** Tích hợp công nghệ **Web Speech API** giúp người dùng nghe phát âm chuẩn xác của từng từ vựng ngay khi học.
*   **📓 Sổ tay từ khó:** Tính năng cho phép lưu lại những từ vựng bạn hay chọn sai hoặc cần chú ý thêm để ôn tập riêng biệt.
*   **💾 Lưu trữ cục bộ:** Toàn bộ dữ liệu sổ tay cá nhân được lưu trữ an toàn trên trình duyệt (**LocalStorage**), đảm bảo tiến độ học tập không bị mất đi khi tải lại trang.
*   **📱 Thiết kế Responsive:** Giao diện tối ưu, bắt mắt và mượt mà trên mọi thiết bị từ điện thoại di động đến máy tính.

---

## 🛠 Công nghệ sử dụng

Dự án được xây dựng với kiến trúc nhẹ nhàng, tập trung vào tốc độ và trải nghiệm người dùng:

*   **Frontend Framework:** `Vue.js 3` (Composition API) để quản lý trạng thái và giao diện tương tác.
*   **CSS Framework:** `Tailwind CSS` cho giao diện hiện đại và linh hoạt.
*   **Icon System:** `Font Awesome 6` cung cấp bộ biểu tượng trực quan.
*   **Audio Engine:** `Web Speech API` xử lý giọng đọc tự nhiên mà không cần file âm thanh nặng.
*   **Hosting:** Triển khai miễn phí và nhanh chóng trên `GitHub Pages`.

---

## 📂 Cấu trúc thư mục

```text
├── index.html          # Trang giới thiệu và điều hướng chính
├── app.html            # Giao diện ứng dụng học tập tập trung
├── css/
│   └── styles.css      # Các tùy chỉnh giao diện và hiệu ứng bổ sung
├── js/
│   ├── app.js          # Logic xử lý chính của Vue.js
│   ├── config.js       # Các cấu hình hệ thống
│   ├── csv.js          # Module xử lý và nạp dữ liệu từ file CSV
│   └── speech.js       # Module quản lý giọng đọc và âm thanh
├── voices/             # Kho lưu trữ các tài nguyên âm thanh bổ sung
└── data/               # Thư mục chứa các file từ vựng HSK 1-4 dạng CSV
```

---

## 🚀 Hướng dẫn cài đặt cục bộ

Để chạy dự án này trên môi trường máy tính của bạn:

1.  **Clone repository:**
    ```bash
    git clone [https://github.com/QUOCTHINH05/hsk-mastery.git](https://github.com/QUOCTHINH05/hsk-mastery.git)
    ```

2.  **Di chuyển vào thư mục dự án:**
    ```bash
    cd hsk-mastery
    ```

3.  **Khởi chạy:**
    *   Mở trực tiếp file `index.html` bằng trình duyệt.
    *   **Khuyến nghị:** Sử dụng extension **Live Server** trên VS Code để có trải nghiệm tốt nhất về đường dẫn và âm thanh.

---

## 📊 Nguồn dữ liệu

Bộ dữ liệu từ vựng được chuẩn hóa theo khung chương trình HSK quốc tế mới nhất, bao gồm đầy đủ:
*   Chữ Hán (Giản thể)
*   Phiên âm (Pinyin)
*   Từ loại, cách dùng
*   Nghĩa tiếng Việt chuẩn xác
*   Nghĩa Tiếng Anh, vừa học tiếng Trung, vừa học tiếng Anh

---

## 🤝 Đóng góp

Chúng tôi luôn hoan nghênh mọi đóng góp (HSK5, HSK6) để hoàn thiện ứng dụng hơn nữa!

1.  **Fork** dự án này.
2.  Tạo một nhánh tính năng mới (`git checkout -b feature/AmazingFeature`).
3.  Thực hiện **commit** các thay đổi (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** lên nhánh vừa tạo (`git push origin feature/AmazingFeature`).
5.  Mở một **Pull Request** để chúng tôi xem xét.

---


**👤 Phát triển bởi: Quoc Thinh**

Nếu ứng dụng này giúp ích cho việc học tiếng Trung của bạn, hãy dành tặng **1 ⭐** cho Repository này trên GitHub nhé!

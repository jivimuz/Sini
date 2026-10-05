# API Scaffold

Struktur ini dulu dipakai sebagai kerangka endpoint backend. Sekarang sumber utamanya dipindahkan ke folder feature, misalnya `src/app/auth/api` dan `src/app/post/api`.

Kelompok endpoint yang disiapkan:

- `auth` untuk login, register, lupa password, dan token
- `profile` untuk data profil dan avatar user
- `posts` untuk feed, detail, create, riwayat, dan like status
- `nearby` untuk discovery user/status di sekitar lokasi
- `chat` untuk conversation, message, typing, dan share lokasi
- `notifications` untuk daftar dan penandaan notifikasi
- `location` untuk data lokasi aktif dan reverse geocoding

Folder ini sekarang hanya jadi facade/kompatibilitas supaya import lama ke `src/api` tidak langsung pecah.
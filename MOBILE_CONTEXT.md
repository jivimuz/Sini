# Sini Mobile Context

## 1. Ringkasan

`Sini-Mobile` adalah aplikasi React Native berbasis Expo Router untuk berbagi status berbasis lokasi, menemukan pengguna/status di sekitar, chat, notifikasi, dan profil pengguna.

- Framework: Expo SDK 56, React Native 0.85, TypeScript
- Routing: Expo Router di `src/app`
- Styling: NativeWind
- HTTP: `fetch` melalui client terpusat di `src/app/api/client.ts`
- State: Zustand
- Server state: TanStack React Query tersedia, tetapi belum menjadi pola utama di semua screen
- Auth token: Expo Secure Store
- Realtime: Laravel Echo, Pusher/Reverb tersedia di dependency
- Lokasi/media: `expo-location`, `expo-image-picker`, `expo-image-manipulator`

## 2. Konfigurasi API

Client membaca `EXPO_PUBLIC_API_BASE_URL`.

Contoh development:

- Android emulator: `http://10.0.2.2:8000/api`
- iOS simulator: `http://localhost:8000/api`
- Physical device: `http://<IP_LAPTOP>:8000/api`

`src/app/api/client.ts` menangani:

- normalisasi base URL
- serialisasi query termasuk array
- JSON, `FormData`, dan body native lainnya
- header `Accept: application/json`
- bearer token dari Secure Store
- `ApiError` dengan `status` dan `details`

Service feature diekspor melalui facade `src/api/index.ts`.

## 3. Navigasi dan Auth

Route utama:

- `/auth/login`
- `/auth/register`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/` atau `/home`
- `/nearby`
- `/post`
- `/chat`
- `/chat/screens/chatRoom/[id]`
- `/profile`
- `/notification`
- `/about`

Guard navigasi berada di `src/app/_layout.tsx` dan bergantung pada `useAuth` di `src/stores/auth.store.ts`.

Status implementasi auth:

- Login sudah memanggil `POST /auth/login`, menyimpan `accessToken`, dan mengarahkan ke `/home`.
- Register, forgot password, logout, dan refresh token sudah memiliki service scaffold tetapi belum seluruhnya terhubung ke UI/state.
- `useAuth` masih menyimpan `isLoggedIn` secara in-memory; startup hydration, refresh token, dan logout Secure Store perlu diselesaikan.

## 4. Kontrak API Mobile

Semua path di bawah relatif terhadap `EXPO_PUBLIC_API_BASE_URL`.

### Auth

- `POST /auth/login`: `{ email, password }` -> `{ accessToken, tokenType, refreshToken?, expiresIn?, user? }`, atau `403 { message, email, requiresVerification: true }` jika email belum diverifikasi
- `POST /auth/register`: `{ name, email, password, username?, phone? }` -> `201 { message, email }` (tidak ada token; mengirim kode verifikasi ke email)
- `POST /auth/verify-email`: `{ email, code }` -> sukses mengembalikan sesi yang sama dengan login; lihat `API_CONTRACT.md` untuk kasus error (kode salah, kedaluwarsa, terlalu banyak percobaan, sudah diverifikasi)
- `POST /auth/resend-verification-code`: `{ email }`
- `POST /auth/forgot-password`: `{ email }`
- `POST /auth/logout`: `{ refreshToken? }`
- `POST /auth/refresh-token`: `{ refreshToken }`

### Profile

- `GET /profile/me`
- `PATCH /profile/me`: `{ name?, username?, bio?, phone?, language? }`
- `PATCH /profile/avatar`: multipart upload

### Post dan Discovery

- `GET /posts/feed`
- `GET /posts/{postId}`
- `POST /posts`: JSON atau multipart
- `GET /posts/history`
- `POST /posts/{postId}/like`
- `GET /nearby`

Query feed/nearby dapat memuat `latitude`, `longitude`, `page`, `limit`, `radius`, `categories[]`, dan `liveStatus`.

Payload post mendukung `caption`, `title`, `category`, koordinat, `isLive`, `isSelling`, `price`, `aspectRatio`, `locationName`, dan media.

### Chat

- `GET /chat/conversations`
- `GET /chat/messages?conversationId=...`
- `POST /chat/messages`: `{ conversationId, receiverId, text }`
- `POST /chat/typing`: `{ conversationId, receiverId, isTyping }`
- `POST /chat/location`: koordinat, conversation, receiver, title, dan distance opsional

### Notification dan Location

- `GET /notifications`: pagination opsional
- `POST /notifications/read`: `{ notificationId }`
- `POST /location/current`
- `POST /location/reverse-geocode`

## 5. Model Data Mobile

Model status utama berada di `src/types/userStatus.type.ts` dan membutuhkan:

- identitas: `id`, `name`, `avatarUrl`
- lokasi: `latitude`, `longitude`, `location_name`
- status: `category`, `is_live`, `created_at`
- media: `statusImageUrls`, `aspect_ratio`
- penjualan: `is_selling`, `price`, `currency_symbol`, `title`
- engagement: `is_liked`, `like_count`

Backend harus mengembalikan URL media yang dapat langsung dipakai mobile. Saat ini tipe response masih bercampur antara snake_case dan camelCase; kontrak final perlu dipilih dan dipakai konsisten.

## 6. State dan Integrasi yang Masih Dummy

- `src/stores/user.store.ts`: data user/status masih dummy; `fetchUsers` belum mengikat feed API.
- `src/stores/marker.store.ts`: marker masih dummy.
- `src/app/chat/stores/chat.store.ts`: percakapan dan pesan masih lokal.
- `src/app/home/stores/filter.store.ts`: filter lokal, perlu dihubungkan ke feed/nearby.
- `src/app/home/stores/route.store.ts`: rute lokal, belum ada service routing.
- `src/app/home/stores/notification.store.ts`: hanya flag notifikasi baru.
- Profile screen masih perlu binding ke `getMe`, update profile, dan avatar upload.
- Notification screen belum memiliki alur data lengkap.
- `src/hooks/echo.ts` memiliki konfigurasi Echo/Reverb, tetapi instance/event listener belum dipakai sebagai alur realtime utama.

## 7. Aturan Integrasi

1. Semua request baru memakai `apiRequest`, bukan `fetch` langsung.
2. Service feature diletakkan di `src/app/<feature>/api` dan diekspor dari facade bila diperlukan.
3. Error UI membedakan minimal status `401`, `422`, dan `500`/network.
4. Token hanya disimpan melalui `tokenStorage`; logout harus menghapus token dan state auth.
5. Response pagination harus memakai satu bentuk yang konsisten.
6. Media upload memakai `FormData`; jangan menetapkan `Content-Type` manual agar boundary multipart dibuat native.
7. Perubahan backend harus disertai kontrak payload/response yang sama dengan type mobile.
8. API yang memerlukan autentikasi harus menggunakan bearer token dan mengembalikan JSON untuk error.

## 8. Prioritas Integrasi

1. Auth lifecycle lengkap: register, hydrate, refresh, logout.
2. Profile dan avatar.
3. Feed/home, nearby, filter, detail, like, dan history.
4. Create post dengan upload media.
5. Conversation dan message persistence.
6. Realtime chat, typing, lokasi, dan notifikasi.
7. Location server-side dan routing bila dibutuhkan produk.

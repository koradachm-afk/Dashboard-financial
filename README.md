# AUTO PARKING — Frontend

ระบบจัดการที่จอดรถ ชื่อแบรนด์ **AUTO PARKING** (ไฟล์ Figma ยังชื่อ ParkPlan แต่ทุกหน้าจอเปลี่ยนเป็น AUTO PARKING แล้ว)
ใช้กล้องอ่านป้ายทะเบียนแทนบัตรจอด มี 3 ฝั่ง:

| ฝั่ง | ผู้ใช้ | อุปกรณ์ |
|---|---|---|
| **Admin Web** | เจ้าหน้าที่ / ผู้ดูแลระบบ | Desktop (ออกแบบที่ 1440px) |
| **Customer Web** | ลูกค้าที่มาจอด (สแกน QR → ค้นทะเบียน → เลือกรถจากรูปถ้าเจอหลายคัน → จ่ายด้วย QR PromptPay หรือ Mobile Banking) | มือถือ (ออกแบบที่ 390px) |
| **Kiosk** | จอที่ทางเข้า / ทางออก | จอ 1920×1080 |

> **ขอบเขตตอนนี้: หน้าบ้านอย่างเดียว** ยังไม่มี backend ข้อมูลทั้งหมดเป็น mock (JSON ใน `src/db/`)
>
> อัปเดตล่าสุด **6 พ.ย. 2026** · กำหนดส่ง **15 พ.ย. 2026** · แผนงานอยู่ใน ClickUp (space **Auto_Parking**)

**อัปเดตรอบนี้ (3 พ.ย.) · Customer Web**
- **ทะเบียนซ้ำ / คล้ายกัน:** ค้นแล้วเจอหลายคัน (เช่น กข 1234 กรุงเทพฯ, กข 1234 นนทบุรี, 1กข 1234) แสดงรายการพร้อม **รูปตอนเข้า** ให้ลูกค้าเลือกคันของตัวเอง (เฟรม 17.8)
- **วิธีชำระ:** เพิ่มหน้าเลือก **QR PromptPay / Mobile Banking** และหน้ารอยืนยันในแอปธนาคาร (17.9–17.11)
- Design System เพิ่ม component: Plate Match Card · Entry Snapshot · Payment Method Option · Bank Option · Radio
- ตัดสินแล้ว: แสดงรูป จังหวัด และเวลาเข้าของทุกคันที่ตรง · โลโก้ธนาคารใช้ไอคอนกลางไปก่อน · Mobile Banking ใช้ mock (ข้อ 10)

**รอบก่อน (2 พ.ย.)**
- ธีมเหลือ **สว่าง / มืด** (ไม่มี "ตามระบบ")
- System Settings ให้ Admin เข้าได้ **ตามสิทธิ์รายแท็บ** (ไม่ได้เป็นของ Superadmin อย่างเดียวแล้ว)
- Dashboard: ตารางความเคลื่อนไหวล่าสุดแยก **เวลาเข้า / เวลาออก** มีกรณี "ยังไม่ออก" และแบ่งหน้าละ 10 แถว
- Parking Heat Map มี **Export Excel**
- Audit Logs มีการกระทำ **ออกจากระบบ / ส่งออก** และลิ้นชักรายละเอียดครบทุกเคส
- เพิ่ม `cn()` ใน `src/utils/` ทุก component ต้องใช้ (ดู DESIGN-STYLE.md ข้อ 1.1)
- ตัดสินแล้ว: สถานะรถมี 2 ค่า · Role มี Superadmin / Admin · ชื่อแบรนด์ AUTO PARKING · เวลาออกหลังจ่าย 15 นาที · เกินเวลาคิดค่าจอดใหม่นับจากเวลาจ่ายครั้งล่าสุด (ข้อ 10)
- Figma เพิ่มหน้า 404 (07.10), Settings มุมมอง Admin ที่มีสิทธิ์ไม่ครบแท็บ (10.26 · เฟรม 10.25 "ดูได้" เลิกใช้แล้ว) และสวิตช์คิดค่าจอดใหม่ใน 10.3

---

## สารบัญ

1. [เริ่มต้นใช้งาน](#1-เริ่มต้นใช้งาน)
2. [Tech stack](#2-tech-stack)
3. [โครงสร้างโปรเจกต์](#3-โครงสร้างโปรเจกต์)
4. [Routes ↔ Figma ↔ ผู้รับผิดชอบ](#4-routes--figma--ผู้รับผิดชอบ)
5. [ก่อนลงมือทำฟังก์ชัน: อ่าน Figma ก่อน](#5-ก่อนลงมือทำฟังก์ชัน-อ่าน-figma-ก่อน)
6. [Figma อ้างอิงรายหน้า](#6-figma-อ้างอิงรายหน้า)
7. [กติกาการเขียนโค้ด](#7-กติกาการเขียนโค้ด)
8. [Mock data](#8-mock-data)
9. [Git และ Pull Request](#9-git-และ-pull-request)
10. [เรื่องที่ตัดสินแล้ว / ยังรอตัดสินใจ](#10-เรื่องที่ตัดสินแล้ว--ยังรอตัดสินใจ)
11. [แผนงานและกำหนดส่ง](#11-แผนงานและกำหนดส่ง)

---

## 1. เริ่มต้นใช้งาน

ต้องใช้ **Node.js 22.22.2+, 24.15+ หรือ 26+** (แนะนำ 24 LTS) · Node 20, 23 และ 25 ใช้ไม่ได้ เพราะ Vitest (ผ่าน Vite 8) ต้องใช้เวอร์ชันนี้ (ตาม `engines` ใน `package.json`)

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build สำหรับ production
npm run start      # รันเวอร์ชันที่ build แล้ว (ต้อง npm run build ก่อน) http://localhost:3000
npm run lint       # ตรวจโค้ดด้วย ESLint
npm test           # รัน test ทั้งหมดครั้งเดียว (Vitest) · npm run test:watch = โหมด watch
```

> ไฟล์ test (`*.test.ts` / `*.test.tsx`) **ไม่ขึ้น repo** (อยู่ใน `.gitignore`) แต่ละคนเขียนและรันในเครื่องตัวเอง · clone ใหม่แล้วยังไม่มี test `npm test` ก็ยังผ่าน

หน้าเริ่มต้นที่ควรลองเปิด:

| URL | หน้า |
|---|---|
| `/login` | เข้าสู่ระบบ · บัญชี demo: `superadmin` / `pass` (Superadmin แก้ไขได้ทุกหน้า) · `admin` / `pass` (Admin แก้ไขได้ทุกหน้า ยกเว้น Users) · seed อยู่ใน `src/db/user/` |
| `/dashboard` | หน้าแรกหลัง login |
| `/pay` | เว็บลูกค้า (เปิดด้วยมือถือหรือ DevTools โหมดมือถือ) |
| `/kiosk/entry` · `/kiosk/exit` | จอ Kiosk (เปิดเต็มจอ 1920×1080) |

---

## 2. Tech stack

| ส่วน | ใช้ |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS + token ตาม [DESIGN-STYLE.md](./DESIGN-STYLE.md) |
| UI components | TailGrids (ติดตั้งผ่าน `tailgrids.config.json` แล้วเก็บไว้ใน `src/components/tailgrids/core/`) ปรับสีและขนาดให้ตรง Figma ก่อนใช้ |
| ไอคอน | lucide-react (import ตรง ไม่ต้องห่อเป็น component) |
| ผังที่จอด | Fabric.js |
| กราฟ | Recharts |
| ธีม | next-themes (**สว่าง / มืด** ใช้กับ Admin เท่านั้น บันทึกผูกกับบัญชี) |
| รวม className | clsx + tailwind-merge ผ่าน `cn()` ใน `src/utils/cn.ts` |
| Export Excel | SheetJS (`xlsx`) |
| ฟอนต์ | Inter + Noto Sans Thai (`next/font/google`) |
| Backend (ภายหลัง) | MariaDB + Prisma |

---

## 3. โครงสร้างโปรเจกต์

```
auto_parking/
├─ public/
├─ src/
│  ├─ app/                        # routing ของ Next.js
│  │  ├─ layout.tsx               # root: <html lang="th">, ฟอนต์ (ThemeProvider อยู่ใน (admin) ไม่ใช่ที่นี่)
│  │  ├─ page.tsx                 # redirect → /dashboard
│  │  ├─ not-found.tsx            # 404 ไม่พบหน้า (URL ไม่มีอยู่ หรือ page เรียก notFound())
│  │  ├─ _components/             # not-found-view (เนื้อหาหน้า 404 ของ not-found.tsx)
│  │  ├─ globals.css              # token สี / ตัวอักษร / ระยะ ตาม DESIGN-STYLE.md
│  │  ├─ favicon.ico
│  │  │
│  │  ├─ (admin)/                 # หลังบ้าน ต้อง login (วงเล็บ = ไม่อยู่ใน URL)
│  │  │  ├─ layout.tsx            # ธีม Admin (AdminThemeProvider) + Sidebar · เช็ก session / สิทธิ์ทำใน page.tsx ของแต่ละหน้าผ่าน requirePage
│  │  │  ├─ _components/          # admin-theme-provider · session-sidebar · sidebar-skeleton · theme-sync
│  │  │  ├─ 403/                  # ไม่มีสิทธิ์เข้าถึง
│  │  │  ├─ account/              # บัญชีของฉัน
│  │  │  ├─ activity-log/         # รถเข้า–ออก (เดิมชื่อ Traffic Activity)
│  │  │  ├─ audit-logs/           # ประวัติการใช้งานระบบ
│  │  │  ├─ dashboard/
│  │  │  ├─ financial-overview/
│  │  │  ├─ heat-map/
│  │  │  ├─ parking-layout/
│  │  │  ├─ settings/             # แท็บ: branch · slot-types · fees (สิทธิ์แยกรายแท็บ)
│  │  │  └─ users/                # User & Permissions
│  │  │
│  │  ├─ (auth)/                  # login · forgot-password · set-password
│  │  │  ├─ layout.tsx            # โครงหน้า auth (BrandPanel ซ้าย + ฟอร์มขวา)
│  │  │  └─ _components/          # brand-panel · branch-name
│  │  ├─ (customer)/
│  │  │  └─ pay/                  # layout.tsx (ธีมสว่าง) · page.tsx (ยังเป็นหน้าเปล่า)
│  │  │     └─ [sessionId]/       # รายละเอียด · method · qr · bank · success (ยังไม่ได้ทำ)
│  │  └─ kiosk/                   # layout.tsx (ธีมสว่าง) · entry/ · exit/ (ยังเป็นหน้าเปล่า)
│  │
│  ├─ components/
│  │  ├─ tailgrids/core/          # component ที่ใช้หลายหน้า ดึงจาก TailGrids แล้วแปลงเป็น token ของเรา
│  │  ├─ admin-nav.ts             # รายการเมนูของ Admin (ใช้กับ Sidebar, หน้า 403 / 404, Account และ Users)
│  │  ├─ sidebarmenu.tsx          # เมนูด้านซ้ายของ Admin
│  │  └─ error-card.tsx           # การ์ดแจ้ง error (403 / 404)
│  │
│  ├─ config/
│  │  └─ site.ts                  # ชื่อแบรนด์ (siteConfig.brandName)
│  │
│  ├─ db/                         # ข้อมูลแทนฐานข้อมูลไปก่อน · 1 โดเมน = 1 โฟลเดอร์ (ฟังก์ชันกลาง + seed)
│  │  ├─ store.ts                 # ชั้นกลางของ localStorage (createStore / resetStore) · ใช้โดย prefs · settings · audit
│  │  ├─ settings/                # settings.ts · settings.json
│  │  ├─ prefs/                   # prefs.ts (ธีมของแต่ละบัญชี)
│  │  ├─ user/                    # users.ts (type + getUsers / getUserById / findUserByIdentifier)
│  │  │                           # user-store.ts (ข้อมูลใน memory ฝั่ง server · import user.json ที่เดียว)
│  │  │                           # user-actions.ts (createUser / updateUser / deleteUser) · access.ts · validation.ts
│  │  │                           # user.json · credentials.json (รหัสผ่าน demo, ฝั่ง server เท่านั้น)
│  │  ├─ auth/                    # auth.ts (getCurrentUser, requirePage, getPasswordSetter)
│  │  │                           # auth-actions.ts (login, logout, requestPasswordReset, setPassword, changePassword)
│  │  │                           # login-attempts.ts · audit-info.ts · password-rules.ts · password-store.ts
│  │  ├─ audit/                   # audit.ts (audit() + Audit Log ใน store) · audit-logs.json
│  │  ├─ floors/                  # floors.ts · floors.json (อาคาร / ชั้น / ช่องจอด)
│  │  ├─ slot-types/              # slot-types.ts · slot-types.json
│  │  ├─ sessions/                # sessions.ts · sessions.json (รถเข้า–ออก)
│  │  ├─ payments/                # payments.ts · payments.json
│  │  ├─ banks/                   # banks.ts · banks.json
│  │  └─ reports/                 # reports.ts · activity.json · dashboard.json · financial.json · heat-map.json
│  │
│  └─ utils/                      # ฟังก์ชันช่วย (ยังไม่มีตัว format วันที่ / ฿ / ระยะเวลา / ทะเบียน ให้เพิ่มเมื่อหน้าที่ต้องใช้ถูกสร้าง)
│     ├─ cn.ts                    # รวม className (clsx + tailwind-merge ที่รู้จัก token ของเรา)
│     ├─ id.ts                    # newSessionId() รหัสสุ่มจาก Web Crypto
│     ├─ user-agent.ts            # describeUserAgent() → "Chrome 130 · Windows"
│     ├─ generate-password.ts     # generatePassword() รหัสผ่านเริ่มต้นของผู้ใช้ใหม่
│     └─ reload-to.ts             # reloadTo() โหลดหน้าใหม่ทั้งหน้า ล้างสถานะฝั่ง client (ใช้หลังตั้ง / เปลี่ยนรหัสผ่าน)
│
├─ AGENTS.md                      # คำแนะนำสำหรับ AI coding agent
├─ CLAUDE.md                      # ค่าตั้งของ Claude Code (ชี้ไป AGENTS.md)
├─ DESIGN-STYLE.md                # กติกา UI ทั้งหมด (สี ตัวอักษร component layout)
├─ README.md
├─ eslint.config.mjs
├─ next.config.ts
├─ package.json
├─ tailgrids.config.json
├─ tsconfig.json
├─ vitest.config.mts              # ตั้งค่า Vitest (อยู่ใน repo)
└─ vitest.setup.ts                # setup ของ Vitest (อยู่ใน repo) · ไฟล์ *.test.ts(x) ไม่ขึ้น repo
```

**กติกาโฟลเดอร์ `app/`**

- ใน `app/` มีได้แค่ไฟล์ของ Next.js (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) และโฟลเดอร์ `_components/` (ขึ้นต้นด้วย `_` ไม่กลายเป็น route)
- `not-found.tsx` ที่ root รับทุก URL ที่ไม่มีอยู่ ถ้าหน้าแบบ `[sessionId]` หาข้อมูลไม่เจอ ให้เรียก `notFound()` จาก `next/navigation` ใน `page.tsx` แทนการเขียนหน้า "ไม่พบ" เอง
- `page.tsx` ทำแค่ 3 อย่าง: เช็กสิทธิ์ของหน้า → อ่าน `searchParams` → render component
- ตัวกรอง, ช่วงวัน, เลขหน้า และโหมดดู / แก้ไข เก็บใน URL (`?floor=B1&mode=edit`) refresh แล้วไม่หาย และส่งลิงก์ให้กันได้
- `layout.tsx` ใส่ได้แค่ของที่ทุกหน้าในโฟลเดอร์ใช้ร่วมกัน **ห้ามเช็กสิทธิ์ราย page ใน layout** เพราะ layout ไม่ทำงานซ้ำเมื่อเปลี่ยนหน้า
- component ที่ใช้หน้าเดียว เก็บไว้ข้างหน้านั้นใน `app/(admin)/<page>/_components/` (โฟลเดอร์ขึ้นต้นด้วย `_` ไม่กลายเป็น route) ถ้ามีหน้าที่สองต้องใช้ ค่อยย้ายไป `src/components/tailgrids/core/`

---

## 4. Routes ↔ Figma ↔ ผู้รับผิดชอบ

Figma: [AUTO PARKING / ParkPlan](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=2-2) · หน้า **📐 Screens** (หน้าจอ) และ **🎨 Design System** (component + สี)

| Route | หน้า | เฟรมหลักใน Figma | ผู้รับผิดชอบ |
|---|---|---|---|
| `/login` | เข้าสู่ระบบ | [09.7](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=58-12887) | อ๊อด (PM) |
| `/forgot-password` | ลืมรหัสผ่าน | [09.8](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=58-13040) | อ๊อด |
| `/set-password` | ตั้งรหัสผ่านใหม่ | [09.9](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=58-13189) | อ๊อด |
| — (ทุกหน้า Admin) | Sidebar + Profile menu | [09](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=56-10145) | อ๊อด |
| `/account` | บัญชีของฉัน | [09.2](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=57-12581) | อ๊อด |
| `/users` | User & Permissions | [07](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=37-6912) | อ๊อด |
| `/403` | ไม่มีสิทธิ์ | [07.9](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=39-8866) | อ๊อด |
| — (URL ที่ไม่มีอยู่) | ไม่พบหน้า 404 (`not-found.tsx`) | [07.10](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=396-49736) | อ๊อด |
| `/audit-logs` | Audit Logs | [08](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=50-9390) · [08.19 หน้า 2](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=364-49773) | อ๊อด |
| `/dashboard` | Dashboard | [12](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=156-28177) · [12.35 หน้า 2](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=353-47787) | ตาล |
| `/financial-overview` | Financial Overview | [13](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-24919) | ตาล |
| `/parking-layout` | Parking Layout | [01](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-3034) · [02](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-6185) | ริว |
| `/activity-log` | Activity Log | [14](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=103-16043) | ฟ่า |
| `/heat-map` | Parking Heat Map | [15](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-22253) · [15.9 Export](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=350-46134) | ฟ่า |
| `/settings/*` | System Settings (สิทธิ์รายแท็บ) | [10](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=59-13184) · [10.26 มุมมอง Admin](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=396-49801) | ต้น |
| `/pay/*` | Customer Web | [17](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43072) · [17.8 เลือกรถ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=436-50059) · [17.9–17.11 วิธีชำระ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=437-50236) | ต้น |
| `/kiosk/entry` | Kiosk ทางเข้า | [18](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=239-44453) | ต้น |
| `/kiosk/exit` | Kiosk ทางออก | [16](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43291) | ต้น |

แก้ไฟล์ในโฟลเดอร์ของคนอื่น ต้องให้เจ้าของหน้านั้นรีวิว ส่วน `layout.tsx` ระดับกลุ่ม, `components/` และ `globals.css` เป็นของอ๊อด

---

## 5. ก่อนลงมือทำฟังก์ชัน: อ่าน Figma ก่อน

ทำตามลำดับนี้ทุกครั้งก่อนเริ่มเขียนฟังก์ชันใหม่

1. **เปิดเฟรมหลักของหน้า** จากตารางในข้อ 4
2. **ไล่ดูเฟรมย่อยทุกเลข** (เช่น 14.1 – 14.15) แต่ละเฟรมคือ **state ที่โค้ดต้องรองรับ** เช่น dropdown เปิด, ผลการกรอง, ไม่พบผลลัพธ์, hover, error
3. **ดู prototype** (ปุ่ม ▶ Present มุมขวาบนใน Figma แล้วเลือก flow ตามชื่อหน้า) เพื่อดูว่าการกดแต่ละจุดพาไปที่ไหน
4. **ดู section `Components · <ชื่อหน้า>`** ข้างเฟรม และหน้า 🎨 Design System
   - ใช้ component ที่มีอยู่แล้ว
   - ถ้าโค้ดยังไม่มี ให้สร้างใน `components/` ตามสเปก **ห้ามสร้างหน้าตาใหม่เอง**
5. **จดข้อมูลที่หน้าต้องใช้** แล้วเพิ่ม mock ใน `src/db/` (ใช้ตัวเลขชุดเดียวกับในเฟรม จะเทียบหน้าจอได้ง่าย)
6. **ใช้ข้อความตาม Figma ทุกตัวอักษร** (หัวข้อ, ปุ่ม, placeholder, error) ห้ามคิดคำใหม่เอง
7. **เขียนตาม [DESIGN-STYLE.md](./DESIGN-STYLE.md)** ใช้เฉพาะ token ไม่ใส่สี hex ไม่ใช้ค่า arbitrary
8. **ก่อนเปิด PR** แคปหน้าจอจริงคู่กับเฟรม Figma ที่เลขเดียวกัน แนบใน PR

> ถ้า Figma กับสิ่งที่ต้องทำไม่ตรงกัน หรือ Figma ไม่มี state ที่ต้องใช้ **ให้ถาม PM ก่อนทำ** อย่าเดาเอง

---

## 6. Figma อ้างอิงรายหน้า

> ลิงก์ทุกอันเปิดไปที่เฟรมใน Figma โดยตรง · ☑ = ทำแล้ว · ☐ = ยังไม่ได้ทำ · ข้อที่ทำไปบางส่วนยังเป็น ☐ และมีหมายเหตุสั้น ๆ ว่าทำอะไรแล้ว ขาดอะไร (สรุปจากเฟรม)

### 6.1 Login / ลืมรหัสผ่าน / ตั้งรหัสใหม่ — อ๊อด

เฟรม: [09.7 Login](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=58-12887) · [09.8 ลืมรหัสผ่าน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=58-13040) · [09.9 ตั้งรหัสผ่านใหม่](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=58-13189) · [09.16 ก่อนส่ง](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=492-51025) · [09.17 เงื่อนไขยังไม่ผ่าน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=492-51331) · [09.18 ไม่พบ email](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=492-51178)

- ☑ Login ด้วย Username **หรือ** Email + รหัสผ่าน
- ☑ ใส่รหัสผิดครบ 5 ครั้งติดกัน → ล็อกการเข้าสู่ระบบ 15 นาที (ตัวนับอยู่ในหน่วยความจำของ server ใน `src/db/auth/login-attempts.ts` restart แล้วรีเซ็ต)
- ☐ ลืมรหัสผ่าน: กรอก email → แสดง "ส่งลิงก์แล้ว" (ซ่อนบางส่วนของ email) + ปุ่มส่งอีกครั้ง · ลิงก์อายุ 24 ชม.
  - ทำแล้วบางส่วน: กรอก email → ตั้งรหัสใหม่ได้ (ลิงก์รีเซ็ตอายุ 24 ชม.) · ที่ยังขาดคือ state "ส่งลิงก์แล้ว" (09.8)
  - mock ไม่ส่งอีเมล: ถ้า email ตรงกับบัญชีจะไปหน้า `/set-password` ทันที · ใครรู้ email ของบัญชีก็ตั้งรหัสใหม่ให้บัญชีนั้นได้ **ใช้สำหรับ demo เท่านั้น**
  - ยังไม่ทำ state "ส่งลิงก์แล้ว" (09.8) · เก็บไว้ใน Figma สำหรับตอนมีระบบส่งอีเมลจริง
- ☑ ตั้งรหัสใหม่: ใช้ทั้งจากอีเมลเชิญและลืมรหัสผ่าน · เช็กเงื่อนไขทีละข้อแบบ real-time:
  - อย่างน้อย 8 ตัวอักษร
  - มีตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก
  - มีตัวเลขอย่างน้อย 1 ตัว
  - มีอักขระพิเศษ
  - รหัสผ่านทั้งสองช่องตรงกัน
- mock: รหัสผ่านที่ตั้งใหม่เก็บในหน่วยความจำของ server · restart server แล้วรหัสกลับเป็น `pass`
- ☑ ผู้ใช้ใหม่ต้องตั้งรหัสใหม่ก่อนเข้าระบบครั้งแรก
- ☑ บันทึกลง Audit Logs ทั้งกรณีเข้าสู่ระบบสำเร็จและไม่สำเร็จ

### 6.2 Sidebar + Profile menu — อ๊อด

เฟรม: [09 Profile menu](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=56-10145) · [09.1 เลือกธีม](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=56-10458) · [09.5 ยืนยันออก](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=56-10805) · [09.6 ออกขณะผังยังไม่บันทึก](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=56-11033) · [09.11 มุมมอง Admin](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=163-29575) · [11 ธีมมืด](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=59-14500)

- ☑ เมนูเรียงตามนี้ (รายการเมนูอยู่ใน `src/components/admin-nav.ts`):
  - เมนูหลัก: Dashboard → Parking Layout → Financial Overview → Activity Log → Parking Heat Map
  - จัดการระบบ: User & Permissions → System Settings → Audit Logs
- ☑ ซ่อนเมนูที่ผู้ใช้ไม่มีสิทธิ์ · System Settings แสดงเมื่อมีสิทธิ์อย่างน้อย 1 แท็บ · หัวกลุ่มที่ไม่เหลือเมนูให้ซ่อนด้วย
- ☑ Profile menu มี 3 รายการ: บัญชีของฉัน · ธีม (**สว่าง / มืด** บันทึกผูกกับบัญชี ไม่ใช่แค่ในเครื่อง) · ออกจากระบบ (มี dialog ยืนยัน · บันทึกลง Audit Logs เป็น "ออกจากระบบ")
- ☐ ถ้ากดออกจากระบบขณะแก้ผังที่ยังไม่บันทึก ต้องมีให้เลือก "บันทึกและออก" หรือ "ออกโดยไม่บันทึก" (ยังไม่ได้ทำ เพราะ Parking Layout ยังไม่ได้สร้าง)

### 6.3 บัญชีของฉัน — อ๊อด

เฟรม: [09.2 Superadmin](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=57-12581) · [09.3 Admin](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=57-13060) · [09.4 เปลี่ยนรหัสสำเร็จ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=57-13273)

- ☑ แสดงข้อมูลบัญชี (Username, Email, Role, วันที่สร้าง) และ "สิทธิ์ของฉัน" ราย page รวม System Settings
- ☑ เปลี่ยนรหัสผ่าน (เงื่อนไขเดียวกับ 6.1)

### 6.4 User & Permissions — อ๊อด (เฉพาะ Superadmin)

เฟรม: [07 รายการ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=37-6912) · [07.1](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=39-7201)–[07.3](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=39-8323) กรอง · [07.4 แก้ไข (Drawer)](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=40-7811) · [07.5 ยืนยันเปลี่ยน Role](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=40-8335) · [07.6 เพิ่มผู้ใช้](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=41-8544) · [07.7 ยืนยันลบ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=41-8895) · [07.8 Toast](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=41-9418) · [07.9 หน้า 403](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=39-8866) · [07.10 หน้า 404](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=396-49736)

- ☑ ตารางผู้ใช้: ค้นหา username / email · กรองตาม "สิทธิ์การเห็นหน้า" (มีตัวเลือก System Settings) · ป้ายสิทธิ์รายหน้า (Page Access Chip) · แบ่งหน้า
- ☑ เพิ่มผู้ใช้:
  - Username ใช้ได้ a–z, 0–9, `.`, `_` และแก้ภายหลังไม่ได้
  - ระบบสร้างรหัสผ่านเริ่มต้นให้
  - เลือก Role
  - ติ๊กส่งอีเมลเชิญได้ (mock: บันทึกลง Audit Logs แต่ไม่ได้ส่งอีเมลจริง)
  - ถ้าเป็น Admin ให้เปิด drawer ตั้งสิทธิ์ต่อทันที
- ☑ แก้ไข (Drawer):
  - แก้ email
  - เปลี่ยน Role (ต้องยืนยันก่อน)
  - ตั้งสิทธิ์ราย page เป็น ไม่มีสิทธิ์ / แก้ไขได้
  - **System Settings ตั้งแยก 3 แท็บ:** ข้อมูลสาขา · ประเภทช่องจอด · ค่าจอดและการชำระเงิน (แถวกลุ่มไม่มีตัวเลือก มีแถวย่อยเยื้องเข้า)
  - ส่วนเนื้อหาของ drawer ต้อง scroll ได้ (รายการสิทธิ์ยาวเกินจอแล้ว)
  - ปุ่มลัด "แก้ไขได้ทุกหน้า" / "ล้างทั้งหมด"
- ☑ ลบผู้ใช้ (ยืนยัน → ลบถาวร → แสดง toast)
- ☑ Admin ที่เข้าหน้านี้ต้องไปหน้า 403
- ☑ ทุกการเปลี่ยนแปลงบันทึกลง Audit Logs
- mock: การเพิ่ม / แก้ไข / ลบผู้ใช้เก็บในหน่วยความจำของ server · restart server แล้วรายชื่อและสิทธิ์กลับเป็นค่าใน `user.json`

### 6.5 Audit Logs — อ๊อด

เฟรม: [08 รายการ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=50-9390) · [08.2 รายละเอียด](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=52-10037) · [08.3 มุมมอง Admin](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=52-10478) · [08.4](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=68-14298)–[08.13](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=69-16829) ตัวกรอง · [08.14](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=196-42130)–[08.18](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=196-43094) ปฏิทิน

- ☑ ตัวกรอง: ช่วงวันที่ (ค่าเริ่มต้น 7 วันล่าสุด / กำหนดเอง) · หน้า (9 ตัวเลือก: การเข้าสู่ระบบ, บัญชีของฉัน และ 7 หน้าในเมนู) · การกระทำ (สร้าง / แก้ไข / ลบ / เข้าสู่ระบบ / **ออกจากระบบ** / ล้มเหลว / **ส่งออก**) · ค้นหารายละเอียดหรือ username
- ☑ ตาราง: เวลา + IP · ผู้กระทำ + Role · การกระทำ · หน้า · รายละเอียด
- ☑ กดแถวเพื่อเปิด drawer รายละเอียด:
  - เลข `#AL-xxxxx`, เป้าหมาย, IP, อุปกรณ์
  - ตารางเทียบก่อน → หลัง
  - ปุ่มคัดลอกลิงก์ (ใช้ `?id=` ใน URL)
  - มีเฟรมรายละเอียดครบทุกเคส [08.20–08.38](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=366-46007) · แถว "ผลลัพธ์" อยู่ท้ายสุดและมีเส้นคั่นก่อน
- ☑ ข้อมูลตัวอย่าง 20 เคสไม่ซ้ำกัน แบ่ง 2 หน้า (08, [08.19](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=364-49773)) ใช้ mock ชุดนี้ให้ตรงกับ Figma
- ☑ Export Excel แสดงให้ทุกคนที่เปิดหน้า Audit Logs ได้ (ไม่มีป้ายดูอย่างเดียวแล้ว เลิกใช้เฟรม 08.3 ส่วนนี้)
  - ส่งออกทุกแถวที่ผ่านตัวกรอง (ไม่ใช่แค่หน้าที่เห็น) เป็น `.xlsx` พร้อม Toast มุมขวาบน และลงรายการ "ส่งออก" ใน log
  - Server Action `exportAuditInfo()` เช็กสิทธิ์ของ `audit-logs` ก่อน (ต้องเปิดหน้านี้ได้ คือ `edit`) · ไม่มีสิทธิ์ → ไม่ส่งออก
- ☑ log **แก้ไขหรือลบไม่ได้**
- ☐ มี `audit()` กลางให้ทุกหน้าเรียกใช้ (เขียนลง localStorage ผ่าน `src/db/store.ts` โดเมน `audit` หน้า Audit Logs จึงเห็นรายการจากการใช้งานจริงต่อจาก seed 20 เคส) · การ Export ทุกหน้าต้องเรียก `audit()` ด้วยการกระทำ "ส่งออก"
  - ทำแล้วบางส่วน: `audit()` ใช้งานได้แล้ว (login · logout · Users · เปลี่ยนรหัสผ่าน · Export ของ Audit Logs เรียกใช้อยู่) · ที่ยังขาดคือ Export ของหน้าอื่น (Heat Map · Activity Log · Financial Overview) ยังไม่ได้ต่อ
- ☐ การแก้ผังที่ยังไม่บันทึก **ไม่ลง log** บันทึกเฉพาะตอนกดบันทึก (ยังไม่ได้ทำ เพราะ Parking Layout ยังไม่ได้สร้าง)

### 6.6 Dashboard — ตาล

เฟรม: [12 หลัก](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=156-28177) · [12.1–12.2 hover](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=156-28719) · [12.3–12.22 การ์ดเปรียบเทียบ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=174-33160) · [12.23–12.25 ช่วงวัน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=176-37780) · [12.26–12.34 กำหนดเอง](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=183-38203) · [Components · Dashboard](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=156-28158) · [Components · Date range picker](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=196-40068)

- ☐ ช่วงเวลาของทั้งหน้า: วันนี้ / เมื่อวาน / 7 วัน / 30 วัน / กำหนดเอง
  - กำหนดเองใช้ปฏิทิน เลื่อนดูเดือนก่อนได้
  - ปุ่ม "กำหนดเอง" ต้องแสดงสถานะเลือกอยู่ตลอดที่ปฏิทินเปิด
- ☐ KPI 4 ใบ: ช่องว่างตอนนี้ · รายรับ · รถเข้า · เวลาจอดเฉลี่ย (+ % เทียบช่วงก่อน)
- ☐ กราฟรถเข้า–ออกรายชั่วโมง (เข้า / ออก / เข้าเมื่อวาน) + hover tooltip
- ☐ การ์ดช่องจอดตอนนี้ · รายรับ 14 วัน · การ์ดแจ้งเตือน (ไม่ทราบสถานะ / ปิดใช้งาน)
- ☐ การ์ดเปรียบเทียบประเภทรถ:
  - เลือก 2–4 ประเภท
  - เลือกช่วงวัน
  - สลับดูรถเข้า / เวลาจอดเฉลี่ย / รายรับ
  - ตารางสรุปด้านล่าง
- ☐ ความเคลื่อนไหวล่าสุด (ข้อมูลวันนี้ 1 แถว = 1 รายการจอด เรียงตามการเคลื่อนไหวล่าสุด):
  - คอลัมน์: เวลาเข้า · เวลาออก · เหตุการณ์ · ทะเบียน · ประเภทรถ · ช่องจอด · ค่าจอด
  - รถที่ยังจอดอยู่: เวลาออก = "ยังไม่ออก" · ค่าจอด = "ยังไม่ชำระ" (สีจาง)
  - แบ่งหน้าละ 10 แถว "แสดง 1–10 จาก 190" (เฟรม 12 และ 12.35) + ลิงก์ไป Activity Log
- ☐ **ทำ Date Range Picker เป็น component กลาง** (Audit Logs และ Activity Log ใช้ตัวเดียวกัน)
  - ทำแล้วบางส่วน: component กลางมีแล้วที่ `tailgrids/core/date-range-picker.tsx` และ Audit Logs ใช้อยู่ · ที่ยังขาดคือ Dashboard / Activity Log ยังไม่ได้เอาไปใช้
- seed: `reports/dashboard.json` · `sessions/sessions.json` · `floors/floors.json` · `payments/payments.json` (ยังไม่มีหน้าไหนอ่าน) · Date Range Picker มีแล้วที่ `tailgrids/core/date-range-picker.tsx` (Audit Logs ใช้อยู่) · Pagination มีแล้วที่ `tailgrids/core/pagination.tsx`

### 6.7 Financial Overview — ตาล

เฟรม: [13 หลัก](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-24919) · [13.1 วันก่อน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-25483) · [13.2 รายเดือน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-26051) · [13.3 รายปี](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-26619) · [13.4 หน้า 2](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-27181) · [13.5 Export](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-27745) · [Components · Financial](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=145-24900)

- ☐ มุมมอง รายวัน / รายเดือน / รายปี + ตัวเลือกวันที่ + ปุ่ม ‹ ›
- ☐ KPI: รายรับรวม · จำนวนรายการชำระ · ค่าจอดเฉลี่ยต่อครั้ง · ช่วงที่รายรับสูงสุด
- ☐ กราฟรายรับรายชั่วโมง / รายวัน / รายเดือน (ตามมุมมอง)
- ☐ แยกรายรับตามประเภทช่องจอด และตามระยะเวลาจอด
- ☐ ตารางรายการชำระ + แบ่งหน้า
- ☐ Export Excel ตามช่วงที่เลือก (เฉพาะผู้มีสิทธิ์แก้ไขได้) · ลง Audit Logs
- seed: `reports/financial.json` · `payments/payments.json` · `sessions/sessions.json` (ยังไม่มีหน้าไหนอ่าน)

### 6.8 Parking Layout — ริว

เฟรม: [01 โหมดดู](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-3034) · [01.1 popover](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=7-158) · [01.2 ตัวกรอง](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-3776) · [01.3 กรองแล้ว](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-4596) · [01.4 เลือกชั้น](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-5381) · [01.5 ชั้นว่าง](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=19-6742) · [02 โหมดแก้ไข](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-6185) · [02.1 เลือกประเภท](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=10-744) · [02.2 วางเป็นแถว](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=16-7117) · [03 ตั้งค่าช่อง](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=11-1402) · [04 เพิ่มชั้น](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=12-2051) · [05 empty state](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=12-3024) · [06 states ประกอบ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=13-2950)

**โหมดดู**
- ☐ เลือกอาคาร / ชั้น (dropdown ค้นหาได้)
- ☐ ตัวกรองประเภท + สถานะ (ช่องที่ไม่ตรงจาง 25%)
- ☐ คลิกช่องเพื่อเปิด popover (เลขช่อง, ประเภท, สถานะ)
- ☐ แผงขวา:
  - ภาพรวมชั้น
  - อัตราการใช้งาน
  - ช่องว่างแยกประเภท
  - แท็บรายการช่องจอด (คลิกแถวเพื่อไฮไลต์บนผัง)
  - แท็บกิจกรรมล่าสุด
- ☐ ซูม − / + / เต็มจอ

**โหมดแก้ไข**
- ☐ แถบเครื่องมือ:
  - วางวัตถุ: ช่องจอด, วางเป็นแถว, ทางเข้า–ออก, ประตูคนเดิน, ลูกศร, เสา, ลิฟต์, บันได
  - จัดการวัตถุ: เลือก, เลื่อนผัง, หมุน, จัดแนว, คัดลอก, วาง, ลบ
  - Undo / Redo
  - กริด / Snap
- ☐ วางเป็นแถว: เลือกประเภท + Prefix + เลขเริ่ม + จำนวน + ทิศทาง → แสดงตัวอย่างก่อนวาง
- ☐ แผงตั้งค่าช่อง:
  - เลขช่อง (เตือนเมื่อซ้ำในชั้นเดียวกัน)
  - ประเภท
  - ขนาด
  - หมุน 0 / 45 / 90°
  - ปิดใช้งาน / ซ่อมบำรุง
  - ลบ / ทำสำเนา
- ☐ เพิ่มชั้น: ชื่อ, ลำดับ, ขนาดพื้นที่ (ม.), อัปโหลดแปลน (PNG / JPG / PDF ≤ 10 MB)
- ☐ แถบ "มีการแก้ไขที่ยังไม่บันทึก N รายการ" + ย้อนกลับทั้งหมด + บันทึก (ลง Audit Logs)
- ☐ สถานะ ว่าง / ไม่ว่าง มาจากเซนเซอร์เท่านั้น ตั้งเองไม่ได้
- ☐ **export `FloorMapView` (โหมดดูอย่างเดียว) ให้ฟ่าใช้ทำ Heat Map**
- seed: `floors/floors.json` · `slot-types/slot-types.json` (ยังไม่มีหน้าไหนอ่าน)

### 6.9 Activity Log — ฟ่า

เฟรม: [14 หลัก](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=103-16043) · [14.1 วันที่](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=109-16362) · [14.2 เวลา](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=109-17301) · [14.3 ประเภทรถ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=109-18090) · [14.5–14.8 ค้นทะเบียน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=109-20414) · [14.9 ตามวัน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=109-24597) · [14.10 Export](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=109-25730) · [14.11–14.13 ปฏิทิน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=114-20142) · [Components · Activity Log](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=103-15981)

- ☐ ตัวกรอง: วันที่เริ่ม–สิ้นสุด · เวลาเริ่ม–สิ้นสุด · ประเภทรถ · ทะเบียน → ปุ่มค้นหา / ล้าง (ค่าเริ่มต้น 7 วันล่าสุด)
- ☐ KPI: รถเข้า · รถออก · จอดอยู่ตอนนี้ · เวลาจอดเฉลี่ย
- ☐ ตารางสีช่วงเวลาหนาแน่น (วัน × ชั่วโมง)
- ☐ กราฟประเภทรถตามช่วงเวลา (สลับตามชั่วโมง / ตามวัน) + ตารางสรุปตามประเภท
- ☐ ตารางรายการเข้า–ออก (สถานะมีแค่ **จอดอยู่ / ออกแล้ว**) + แบ่งหน้า
- ☐ กรณีไม่พบผลลัพธ์ (14.8)
- ☐ Export Excel ตามตัวกรอง · ลง Audit Logs
- seed: `reports/activity.json` · `sessions/sessions.json` (ยังไม่มีหน้าไหนอ่าน) · ใช้ Date Range Picker และ Pagination กลางที่มีแล้ว

### 6.10 Parking Heat Map — ฟ่า

เฟรม: [15 หลัก](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-22253) · [15.1 hover](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-22886) · [15.2 ชั่วโมงรวม](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-23519) · [15.3 อัตราการใช้](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-24152) · [15.4 7 วัน](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-24785) · [15.6 ประเภท](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-26052) · [15.8 เลือกช่อง](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-27286) · [15.9 Export Excel](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=350-46134) · [Components · Heat Map](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=140-22192)

- ☐ ตัวกรอง: อาคาร · ชั้น · 7 / 30 / 90 วัน · ค่าที่ใช้ระบายสี (จำนวนครั้ง / ชั่วโมงจอดรวม / อัตราการใช้) · ประเภทช่อง
- ☐ ผังระบายสี 6 ระดับ (ใช้ `FloorMapView` ของริว) + hover tooltip
- ☐ คลิกช่องเพื่อเปิดรายละเอียด: จำนวนครั้ง, ชั่วโมงรวม, อัตราการใช้, เวลาจอดเฉลี่ย, สถานะตอนนี้, กราฟเวลาที่เริ่มจอด
- ☐ อันดับช่องที่ใช้บ่อยที่สุด / น้อยที่สุด · ค่าเฉลี่ยตามแถว
- ☐ **Export Excel** (ปุ่มทุกเฟรม 15–15.8) → Toast "กำลังสร้างไฟล์ Excel" บอกขอบเขตข้อมูล (เช่น 63 ช่องจอด · ชั้น B1 · 30 วัน) · ลง Audit Logs
- seed: `reports/heat-map.json` · `floors/floors.json` (ยังไม่มีหน้าไหนอ่าน)

### 6.11 System Settings — ต้น (Superadmin + Admin ตามสิทธิ์รายแท็บ)

เฟรม: [10 ข้อมูลสาขา](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=59-13184) · [10.1 ประเภทช่องจอด](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=59-13582) · [10.2 แก้ไขประเภท](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=59-14098) · [10.3 ค่าจอด](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=66-14208) · [10.4–10.6 โลโก้](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=172-29898) · [10.7–10.22 จัดการประเภท](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=172-30204) · [10.23–10.24 บันทึก / error](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=172-34799)

- ☐ **สิทธิ์รายแท็บ** ([10.26](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=396-50004) แก้ไขได้ ตัวอย่างผู้ใช้ ops.mint · เฟรม 10.25 "ดูได้" เลิกใช้แล้ว):
  - แท็บที่ไม่มีสิทธิ์ให้ซ่อน เปิดหน้ามาให้อยู่แท็บแรกที่มีสิทธิ์
  - แท็บที่มีสิทธิ์ใช้งานได้ครบ ไม่มีโหมดดูอย่างเดียว
  - Sidebar แสดงเฉพาะหน้าที่มีสิทธิ์
- ☐ คำอธิบายใต้ชื่อหน้า: "Admin เห็นเฉพาะแท็บที่ได้รับสิทธิ์ · การเปลี่ยนแปลงทั้งหมดถูกบันทึกลง Audit Logs"
- ☐ แท็บข้อมูลสาขา: ชื่อสาขา + โลโก้ (PNG / SVG สี่เหลี่ยมจัตุรัส ≥ 256 px ≤ 1 MB) + ตัวอย่างการแสดงผล
- ☐ แท็บประเภทช่องจอด:
  - เพิ่ม / แก้ไขชื่อ, ไอคอน, สี, ขนาดตั้งต้น
  - ประเภทตั้งต้นลบไม่ได้
  - ลบได้เฉพาะประเภทที่ไม่มีช่องใช้อยู่ (hover ปุ่มลบแล้วแสดงเหตุผล)
- ☐ แท็บค่าจอด:
  - ราคาต่อชั่วโมง (> 0, ทศนิยมได้ 2 ตำแหน่ง)
  - เวลาออกหลังชำระ (นาที, > 0)
  - **สวิตช์คิดค่าจอดใหม่เมื่อออกเกินเวลา** (10.3, 10.23, 10.24) เปิด = คิดค่าจอดใหม่นับจากเวลาที่ชำระครั้งล่าสุดถึงเวลาออกจริง ตามราคาต่อชั่วโมง แล้วสร้าง QR ให้จ่ายส่วนที่เกิน · ปิด = เกินเวลาแล้วออกได้โดยไม่คิดเงินเพิ่ม
  - กล่องตัวอย่าง: 14:00 จ่าย → ≤ 14:15 ออกได้ → 14:16 เกินเวลา ต้องชำระเพิ่ม คิดใหม่นับจาก 14:00
  - ตัวอย่างการคำนวณ
  - error เมื่อกรอกค่าผิด
- ☐ ทุกการบันทึกลง Audit Logs
- ☐ ตกลง schema ประเภทช่องจอดกับริวก่อนเริ่ม (Settings เป็นที่สร้าง ผังเป็นที่นำไปใช้)
- seed: `settings/settings.json` (Login แสดงชื่อสาขา และ Sidebar ใช้อยู่แล้ว) · `slot-types/slot-types.json` · ยังไม่มีหน้า Settings

### 6.12 Customer Web — ต้น

เฟรม: [17 ค้นหา](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43072) · [17.1 กรอกแล้ว](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43137) · [17.2 ไม่พบ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43201) · [17.3 รอชำระ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43270) · [17.4 ชำระแล้ว](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43348) · [17.5 สแกนจ่าย](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43424) · [17.6 ไม่สำเร็จ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43485) · [17.7 สำเร็จ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=233-43542)

เพิ่มใหม่ (3 พ.ย.): [17.8 เลือกรถของคุณ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=436-50059) · [17.9 เลือกวิธีชำระ (QR)](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=437-50236) · [17.10 เลือกวิธีชำระ (Mobile Banking)](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=437-50346) · [17.11 รอยืนยันในแอปธนาคาร](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=437-50519)

Flow: 17 → 17.1 → (เจอหลายคัน 17.8) → 17.3 → 17.9 → QR 17.5 หรือ Mobile Banking 17.10 → 17.11 → 17.7

- ☐ ขั้นตอน ค้นหา → ตรวจสอบ → ชำระ (Step component) · 17.8 ยังอยู่ขั้น "ค้นหา" · 17.9–17.11 อยู่ขั้น "ชำระ"
- ☐ ค้นทะเบียน (เว้นวรรคหรือไม่ก็ได้) · ไม่พบ → error ใต้ช่อง + กล่องคำแนะนำ
- ☐ **ผลการค้นหา:** เจอ 1 คัน → ไป 17.3 ทันที · เจอตั้งแต่ 2 คัน → แสดงรายการ 17.8
  - เคสที่ต้องรองรับ: ทะเบียนเดียวกันต่างจังหวัด (กข 1234 กรุงเทพฯ / นนทบุรี) และต่างหมวด (กข 1234 / 1กข 1234)
  - ช่องค้นหาด้านบนยังแก้ได้ · คำค้นเก็บใน `?q=` แต่ห้ามใช้ทะเบียนเป็น `sessionId`
- ☐ **การ์ดรถ (Plate Match Card):**
  - รูปตอนเข้าจากกล้องทางเข้า + เวลาบนรูป · ทะเบียน · จังหวัด · "เข้า 17 ต.ค. · 18:42 · ประตู 1"
  - แสดงรูป จังหวัด และเวลาเข้าของ **ทุกคันที่ตรง** (ตัดสินแล้ว)
  - เรียงตามเวลาเข้า · เลือกได้ทีละคัน (Radio) · คันแรกถูกเลือกไว้ก่อน
  - ปุ่มหลักเปลี่ยนตามคันที่เลือก: "ยืนยัน · กข 1234 กรุงเทพมหานคร" · ปุ่มรอง "ไม่พบรถของฉัน · ค้นหาใหม่" กลับ 17
- ☐ **เลือกวิธีชำระ (17.9 / 17.10):** กด "ชำระเงิน" ใน 17.3 แล้วมาที่หน้านี้ · ค่าเริ่มต้น QR PromptPay
  - QR PromptPay → ปุ่ม "ถัดไป · แสดง QR PromptPay" → 17.5
  - Mobile Banking → เลือกธนาคาร 6 แห่ง (กสิกรไทย, ไทยพาณิชย์, กรุงเทพ, กรุงไทย, กรุงศรี, ทีทีบี) → ปุ่ม "เปิดแอป{ธนาคาร} · ชำระ ฿60" → 17.11
  - โลโก้ธนาคารใช้ไอคอน `Landmark` ไปก่อน
  - วิธีที่เลือกเก็บใน `?method=qr|bank&bank=<รหัส>` ย้อนกลับมาแล้วยังเลือกไว้เหมือนเดิม
- ☐ **รอยืนยันในแอปธนาคาร (17.11):**
  - นับถอยหลังแบบเดียวกับหน้า QR · ปุ่ม "เปิดแอป{ธนาคาร}อีกครั้ง" · ปุ่ม "เปลี่ยนวิธีชำระ" กลับ 17.10
  - ช่วงหน้าบ้านล้วนไม่เปิดแอปจริง เรียก `openBankApp()` กลางที่คืนค่า mock · จำลองผลด้วย `?state=success|failed`
  - สำเร็จใช้หน้า 17.7 เดียวกับ QR
- ☐ รายละเอียด: ทะเบียน, ประเภทรถ, เวลาเข้า, เวลาจอด, ยอดพร้อมวิธีคิด · ชำระแล้ว → "ไม่มียอดค้างชำระ"
- ☐ หน้า QR:
  - PromptPay QR
  - นับถอยหลัง
  - ปุ่มบันทึกรูป QR
  - หมดอายุหรือไม่สำเร็จ → ปุ่มสร้าง QR ใหม่
- ☐ สำเร็จ: เลขที่ธุรกรรม + เวลาที่ต้องออก
- ☐ จ่ายแล้วแต่ออกไม่ทันเวลา (15 นาที) → แสดงยอดที่ต้องจ่ายเพิ่ม คิดใหม่นับจากเวลาที่ชำระครั้งล่าสุด + สร้าง QR ใหม่ · ข้อความในหน้าสำเร็จ (17.7): "หากเกิน 15 นาที ต้องชำระค่าจอดเพิ่ม โดยคิดใหม่นับจากเวลาที่ชำระครั้งนี้"
- ☐ `sessionId` ใน URL ต้องเป็นรหัสสุ่ม **ห้ามใช้ทะเบียน**
- ☐ ธีมสว่างเท่านั้น · กว้างสูงสุด 480px
- seed: `sessions/sessions.json` · `payments/payments.json` · `banks/banks.json` · `settings/settings.json` · ยังไม่มีหน้า Customer (`/pay` เป็นหน้าเปล่า)

### 6.13 Kiosk ทางเข้า / ทางออก — ต้น

ทางเข้า: [18 รอรถ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=239-44453) · [18.1 อ่านป้าย](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=239-44618) · [18.2 บันทึกเวลาเข้า](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=239-44790) · [18.3 อ่านไม่สำเร็จ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=239-44978) · [18.4 ที่จอดเต็ม](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=239-45160)
ทางออก: [16 รอรถ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43291) · [16.1 อ่านป้าย](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43413) · [16.2 ค่าจอด + QR](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43541) · [16.3 ชำระสำเร็จ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43684) · [16.4 ชำระทางเว็บแล้ว](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43817) · [16.5 อ่านไม่สำเร็จ](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=234-43950) · [Components · Kiosk](https://www.figma.com/design/AoPiNS1OO38plLtnHvInSz/ParkPlan?node-id=220-42845)

- ☐ โครงจอ: Top Bar 80px · ซ้ายเป็นวิดีโอ CCTV + ผลการอ่านป้ายด้วย AI (ทะเบียน, ความมั่นใจ %, เวลาอ่าน) · ขวาเป็นข้อมูลรถ + การ์ดสถานะ
- ☐ จังหวะ: อ่านป้าย ~1.5 วินาที → แสดงผล → กลับหน้ารอรถหลัง 5 วินาที · อ่านไม่สำเร็จ → ลองใหม่อัตโนมัติหลัง 3 วินาที
- ☐ ทางเข้า: แสดงอัตราค่าจอด + ช่องว่างแยกประเภท · เต็มแล้วไม้กั้นไม่เปิด · บันทึกแล้วแสดง QR ไปหน้าลูกค้า
- ☐ ทางออก:
  - แสดงเวลาเข้า–ออก, เวลาจอดทั้งหมด, ค่าจอด + PromptPay QR
  - จ่ายแล้ว → ไม้กั้นเปิด
  - จ่ายทางเว็บแล้ว → เปิดทันที
- ☐ **ไม่มีปุ่มเรียกพนักงาน** · ไม่มี hover · ธีมสว่างเท่านั้น
- ☐ ช่วงหน้าบ้านล้วน: รองรับ `?state=` เพื่อเปิดแต่ละ state ตรง ๆ ได้ (เช่น `/kiosk/exit?state=fee`)
- seed: `sessions/sessions.json` · `floors/floors.json` · `settings/settings.json` · ยังไม่มีหน้า Kiosk (`/kiosk/entry` · `/kiosk/exit` เป็นหน้าเปล่า)

---

## 7. กติกาการเขียนโค้ด

กติกา UI ทั้งหมดอยู่ใน **[DESIGN-STYLE.md](./DESIGN-STYLE.md)** สรุปข้อที่พลาดบ่อย:

- ใช้ utility ที่อิง token เช่น `bg-surface`, `text-fg-2`, `border-line`, `rounded-xl`, `text-body`
- **ห้าม** ใส่สี hex ในไฟล์ `.tsx` · ห้ามใช้ค่า arbitrary (`text-[15px]`) · ห้ามใช้ `dark:` ใน component
- component จาก TailGrids ต้องแปลง class เป็น token ของเราก่อนใช้ (ตารางแปลงอยู่ใน DESIGN-STYLE.md ข้อ 1)
- ใช้ component กลางใน `src/components/tailgrids/core/` เสมอ ไม่สร้างปุ่ม / input / badge ใหม่ในหน้า
- รวม className ผ่าน `cn()` (`src/utils/cn.ts`) ไม่ต่อ string เอง ไม่อย่างนั้นขนาดตัวอักษรอย่าง `text-body` จะหายเมื่อเจอสี `text-fg`
- เรียกหน้า รถเข้า–ออก ว่า **Activity Log** ทุกที่ (ชื่อเดิม Traffic Activity เลิกใช้แล้ว)
- ตัวเลข, เงิน, เวลา ใส่ `tabular-nums` · รูปแบบ: `฿10,080` · `1 ชม. 58 น.` · `ส. 17 ต.ค. 2026` · `21:56`
- สถานะรถมีแค่ **จอดอยู่** และ **ออกแล้ว**
- ชื่อแบรนด์ **AUTO PARKING** อ่านจาก config ห้าม hard-code

สำหรับ AI coding agent: อ่าน [AGENTS.md](./AGENTS.md) และ DESIGN-STYLE.md ก่อนเขียนโค้ด

---

## 8. Mock data

ช่วงหน้าบ้านล้วน ข้อมูลแบ่งเป็น 2 ชั้น:
- **seed** = JSON ใน `src/db/<โดเมน>/*.json` ค่าตั้งต้นตรงกับ Figma **ห้ามแก้ตามการใช้งาน** · แต่ละโดเมนมีโฟลเดอร์ของตัวเอง (ฟังก์ชันกลาง + seed) ส่วน `store.ts` อยู่ที่ `src/db/`
- **store** = ข้อมูลที่เพิ่ม / แก้ระหว่างใช้งาน เก็บ localStorage ผ่าน `src/db/store.ts` ชั้นเดียว (key `autoparking:v1:<โดเมน>`) · เปิดครั้งแรกยังไม่มี key จะโหลดจาก seed · กติกาเต็มอยู่ใน [AGENTS.md](./AGENTS.md) ข้อ 2 กฎข้อ 11

| ไฟล์ seed | ข้อมูล | เก็บระหว่างใช้งาน (store) | ใช้ที่ |
|---|---|---|---|
| `user/user.json` | ผู้ใช้ demo 2 บัญชี `superadmin` · `admin` (อีเมล `@autoparking.co`), Role, สิทธิ์ราย page (System Settings แยก 3 แท็บ), ธีมตั้งต้น · **ไม่มีรหัสผ่าน** (ไฟล์นี้ import ได้เฉพาะ `user-store.ts` ฝั่ง server แต่ type ใน `users.ts` ที่ client import ได้ จึงห้ามเก็บรหัสผ่านใน JSON เด็ดขาด) | ไม่เก็บใน localStorage · การเพิ่ม / แก้ / ลบผู้ใช้เก็บในหน่วยความจำของ server (restart แล้วกลับเป็น seed) · ธีมที่เลือกเก็บที่ `prefs` (key = user id) | Login, Users, Account, Sidebar |
| `user/credentials.json` | รหัสผ่าน demo (`pass`) ราย user id | ไม่เก็บ · **import ได้เฉพาะ `src/db/auth/auth-actions.ts`** (ฝั่ง server) · รหัสผ่านที่ตั้งใหม่เก็บในหน่วยความจำของ server (`password-store.ts`) | Login, Set password, Account |
| `floors/floors.json` | อาคาร A → ชั้น B1 (48 × 32 ม., 63 ช่อง A–D พร้อมสถานะ / ประเภท / `note`, วัตถุบนผัง: เลน ลูกศร เสา ทางเข้า–ออก ลิฟต์ บันได ประตู) และ B2 (ว่าง) · พิกัดเป็นเมตรจากมุมซ้ายบนของชั้น · อ่านผ่าน `getFloors()` (`countSlotsByType` / `countSlotsByStatus` นับจากช่อง) | seed อย่างเดียวก่อน · ยังไม่มี store (ผังที่กดบันทึก / สถานะที่ผู้ดูแลตั้งจะเพิ่มทีหลัง) | ยังไม่มีหน้าไหนอ่าน (วางแผนไว้: Parking Layout, Heat Map) |
| `slot-types/slot-types.json` | ประเภทช่องจอด 6 แบบ: รถยนต์ทั่วไป · EV · ผู้พิการ · VIP (ค่าตั้งต้น) และ รถตู้ / รถใหญ่ · มอเตอร์ไซค์ — ไอคอน lucide, ชื่อ token สี, ขนาดตั้งต้น (ม.) · อ่านผ่าน `getSlotTypes()` · จำนวนช่องที่ใช้อยู่นับจาก floors ไม่เก็บในไฟล์นี้ | seed อย่างเดียวก่อน · ยังไม่มี store (ประเภทที่เพิ่ม / แก้ใน Settings จะเพิ่มทีหลัง) | ยังไม่มีหน้าไหนอ่าน (วางแผนไว้: Settings, Parking Layout) |
| `sessions/sessions.json` | รถเข้า–ออก 48 คัน (Figma 14 / 14.14 / 14.15, Dashboard 12 / 12.35, Financial 13 / 13.4 / 13.13, Customer 17.8) · ฟิลด์ `id` (`sess_001`…) `plate` `province` `vehicleType` `floor` `slot` `entryAt` `exitAt` `entryGate` `entryImage` `fee` · วันที่รูปแบบ `YYYY-MM-DD HH:MM` · `vehicleType` เป็น `null` ได้ (กล้องยังไม่จัดประเภท / Figma ไม่แสดง) และ `slot` เป็น `null` ได้ (ไม่ทราบช่อง ใช้กับกข 1234 กรุงเทพฯ / นนทบุรี / 1กข 1234 ซึ่งยังจอดอยู่) · `exitAt` เป็น `null` = ยังจอดอยู่ และ `fee` เป็น `null` = ยังไม่ชำระ · ช่อง `slot` ที่ไม่ใช่ `null` ต้องมีอยู่ในชั้น `floor` · อ่านผ่าน `getSessions()` / `isParked()` · `sessions.ts` ตรวจด้วย `isSessionList` ตอนโหลด ถ้าไม่ผ่านจะ throw | seed อย่างเดียวก่อน · ยังไม่มี store (รถเข้า–ออกที่เพิ่มระหว่างใช้งานจะเพิ่มทีหลัง) | ยังไม่มีหน้าไหนอ่าน (วางแผนไว้: Activity Log, Dashboard, Customer, Kiosk) |
| `payments/payments.json` | รายการชำระ 30 รายการตาม Financial 13 / 13.4 / 13.13 · ฟิลด์ `ref` (`PP…`) `sessionId` `amount` `method` (`"qr"` \| `"bank"`) `bank` `paidAt` · ทุกแถวเป็น PromptPay QR (`bank` เป็น `null`) · `amount` ต้องเท่ากับ `fee` ของ session และ `bank` ต้องเป็นรหัสใน `banks.json` เมื่อ `method` เป็น `"bank"` · อ่านผ่าน `getPayments()` / `paymentForSession()` · `payments.ts` ตรวจด้วย `isPaymentList` ตอนโหลด ถ้าไม่ผ่านจะ throw | seed อย่างเดียวก่อน · ยังไม่มี store | ยังไม่มีหน้าไหนอ่าน (วางแผนไว้: Financial, Dashboard, Customer) |
| `banks/banks.json` | ธนาคารสำหรับ Mobile Banking 6 แห่งตามลำดับ 17.10: `KBANK` กสิกรไทย · `SCB` ไทยพาณิชย์ · `BBL` กรุงเทพ · `KTB` กรุงไทย · `BAY` กรุงศรี · `TTB` ทีทีบี (`id` + `name`) · อ่านผ่าน `getBanks()` | ไม่เก็บ (seed คงที่) | ยังไม่มีหน้าไหนอ่าน (วางแผนไว้: Customer) |
| `audit/audit-logs.json` | ประวัติการใช้งาน 20 เคสตาม Figma 08 / 08.19 พร้อมข้อมูล drawer 08.2, 08.20–08.38 (`title`, `changes`, `extras`) · `audit.ts` ตรวจด้วย `isAuditLog` ตอนโหลด ถ้าไม่ผ่านจะ throw | `audit` (ทุกครั้งที่เรียก `audit()`) · seed ไม่ถูกเขียนลง store แต่แสดงต่อท้ายรายการที่เก็บไว้ | Audit Logs |
| `reports/*.json` (`dashboard` · `financial` · `activity` · `heat-map`) | ตัวเลขสรุปที่คำนวณไว้แล้วของ 4 หน้า (Dashboard 12, Financial 13, Activity Log 14, Parking Heat Map 15) ตามที่แต่ละเฟรมใน Figma แสดง **ไม่ปรับให้ตรงกันข้ามหน้า** (เช่น Heat Map 7 วัน 1,402 ครั้ง ส่วน Activity 1,395) · เก็บเฉพาะช่วงที่ Figma มีเฟรม `getXxx()` ใน `reports.ts` คืน `null` ถ้าไม่มีช่วงนั้น · ค่าที่อ่านจากเส้นกราฟมี `approx: true` · ค่าที่คำนวณได้ **ไม่เก็บ**: จำนวนช่อง / การแจ้งเตือน (จาก `floors`), อันดับช่องใช้มาก–น้อย, ค่าเฉลี่ยตามแถว, รายรับ 14 วัน (`getDailyRevenue` จากรายวันของ `financial`) | seed อย่างเดียว · ไม่มี store | ยังไม่มีหน้าไหนอ่าน (วางแผนไว้: Dashboard, Financial Overview, Activity Log, Parking Heat Map) |
| `settings/settings.json` | ตาม Figma 10 / 10.3: ชื่อสาขา (`branchName` "สาขาสยาม"), ราคาต่อชั่วโมง (`pricePerHour` 20 บาท, > 0 ทศนิยมไม่เกิน 2 ตำแหน่ง), เวลาออกหลังชำระ (`exitGraceMinutes` 15 นาที), คิดค่าจอดใหม่เมื่อออกเกินเวลา (`recalcOvertime` เปิด) · `settings.ts` ตรวจ JSON ตอนโหลด ถ้าไม่ผ่านจะ throw | `settings` · ค่าที่เก็บไว้แบบเก่า (มีแค่ `branchName`) ไม่ผ่าน validator จึงกลับไปใช้ seed | Login (ชื่อสาขา), Sidebar · วางแผนไว้: Settings, Customer, Kiosk |

กติกา:
- ใช้ตัวเลขชุดเดียวกับใน Figma (เช่น ทะเบียน `ผบ 9370`, ช่อง `B-07`, รายรับ `฿10,080`) จะเทียบหน้าจอกับเฟรมได้ง่าย
- หน้าห้าม import JSON ตรง ๆ และห้ามเรียก `localStorage` / `sessionStorage` เอง ให้เรียกผ่านฟังก์ชันกลาง (ข้อยกเว้นเดียวคือ `next-themes` ที่เขียน key `autoparking:v1:theme` เอง) วันที่มี backend จะแก้แค่ฟังก์ชันนั้น ส่วนหน้าไม่ต้องแตะ
- localStorage ผูกกับ browser และโดเมน · demo 3 ฝั่ง (Admin / Customer / Kiosk) ต้องเปิดใน browser เดียวกัน · อยากกลับไปเป็นค่าตาม Figma ให้เรียก `resetStore()`
- ห้ามใส่ข้อมูลจริงของคน (ชื่อ, อีเมล, ทะเบียนจริง) ลงใน mock
- รูปตอนเข้าใช้ภาพตัวอย่างใน `public/mock/entry/` ห้ามใช้รูปรถจริงที่เห็นทะเบียน (โฟลเดอร์นี้ยังไม่มี และทุก session มี `entryImage` เป็น `null` ไปก่อน)

---

## 9. Git และ Pull Request

- Branch: `feat/<route>-<เรื่อง>` เช่น `feat/activity-log-filters` · `fix/kiosk-exit-timer`
- 1 PR = 1 เรื่อง · ผู้รีวิวขั้นต่ำ: อ๊อด (PM) + เจ้าของหน้า (ถ้าแก้ของคนอื่น)
- **ในคำอธิบาย PR ต้องมี:**
  - เลขเฟรม Figma ที่ทำ (เช่น `14, 14.1–14.4`)
  - ภาพหน้าจอจริงคู่กับเฟรม
  - state ที่ยังไม่ได้ทำ (ถ้ามี)
- ชนิด branch (`feat/` `fix/` `ui/` `refactor/` `docs/` `chore/`) และ PR ที่ต้องชี้ไป `dev` ดูใน [AGENTS.md](./AGENTS.md) ข้อ 5
- ก่อนเปิด PR: `npm run lint` ผ่าน (และ `npm test` ในเครื่องถ้ามีไฟล์ test ของตัวเอง) และเปิดหน้า Admin ทั้งธีมสว่างและมืดแล้วอ่านได้ทุกจุด

---

## 10. เรื่องที่ตัดสินแล้ว / ยังรอตัดสินใจ

PM (อ๊อด) เป็นผู้ตัดสิน ระหว่างนี้ให้ทำตาม Figma ปัจจุบัน

**ตัดสินแล้ว**

| เรื่อง | ข้อสรุป |
|---|---|
| สถานะรถ (session) | มีแค่ **จอดอยู่ / ออกแล้ว** ไม่มี "เกินเวลาออก" หรือ "ชำระซ้ำ" |
| Role | **Superadmin / Admin** (Owner ใช้ Superadmin · Admin, Management, Staff ใช้ Admin ตามสิทธิ์) |
| ธีม | สว่าง / มืด เท่านั้น |
| System Settings | Admin เข้าได้ตามสิทธิ์รายแท็บ |
| ไฟล์ส่งออก | Excel (.xlsx) ตามที่ออกแบบใน Figma |
| ชื่อแบรนด์ | **AUTO PARKING** (โดเมนตัวอย่างใน mock: `autoparking.co`) |
| เวลาออกหลังจ่าย (Grace period) | **15 นาที** ตรงกันทั้ง Settings (10.3), Kiosk (16.2–16.4) และ Customer (17.7) |
| เกินเวลาออก | ประตูไม่เปิดจนกว่าจะจ่ายส่วนที่เกิน · **คิดค่าจอดใหม่นับจากเวลาที่จ่ายครั้งล่าสุด** (เปิด / ปิดได้ใน Settings) |
| ทะเบียนซ้ำ / คล้ายกัน (ลูกค้า) | แสดงรายการพร้อมรูปตอนเข้า, จังหวัด และเวลาเข้าของทุกคันที่ตรง ให้ลูกค้าเลือกเอง (17.8) ไม่ต้องซ่อนหรือเบลอ |
| วิธีชำระ (ลูกค้า) | **QR PromptPay** และ **Mobile Banking** · Kiosk ทางออกยังเป็น QR PromptPay อย่างเดียว |
| โลโก้ธนาคาร | Figma ใช้ไอคอนกลาง · โลโก้จริงต้องขอจากธนาคารหรือผู้ให้บริการชำระเงิน แล้วค่อยใส่ |
| Mobile Banking | การเปิดแอปธนาคารจากเว็บต้องผ่านผู้ให้บริการชำระเงิน ทีมทำแค่ frontend จึง **ใช้ mock ไปก่อน** |
| ระดับสิทธิ์ | **2 ระดับ: ไม่มีสิทธิ์ / แก้ไขได้** · เลิกใช้ "ดูได้" เมื่อ 6 พ.ย. 2026 · ใครเปิดหน้าได้ก็ใช้ทุกปุ่มในหน้านั้นได้ · ประวัติใน Audit Logs ที่เขียนว่า "ดูได้" คงไว้ตามเดิมเพราะเป็นเหตุการณ์ที่เกิดแล้ว |
| ความยาวรหัสผ่าน | **อย่างน้อย 8 ตัวอักษร** (Figma ปรับตามแล้ว ดู DESIGN-STYLE.md v2.2) |
| ล็อกการเข้าสู่ระบบ | ใส่รหัสผิดครบ **5 ครั้ง** ล็อก **15 นาที** (ตัวนับอยู่ในหน่วยความจำของ server) |
| user และสิทธิ์ | อยู่ในหน่วยความจำของ server ทับ seed `user.json` ที่คงที่ · restart แล้วกลับเป็น seed |
| ไฟล์ test | `*.test.ts(x)` ไม่ commit (ต่างคนต่างเก็บในเครื่อง) · `vitest.config.mts` กับ `vitest.setup.ts` อยู่ใน repo |
| ตัวเลขของ seed | แต่ละหน้าใช้ตัวเลขตามที่เฟรมของหน้านั้นแสดงใน Figma **ไม่ปรับให้ตรงกันข้ามหน้า** (ดูข้อ 8) |

**ยังรอตัดสินใจ**

| เรื่อง | รอ |
|---|---|
| ผู้ให้บริการชำระเงิน (payment gateway) สำหรับ Mobile Banking และโลโก้ธนาคารจริง | ช่วงทำ backend |

---

## 11. แผนงานและกำหนดส่ง

รายละเอียดและงานย่อยของแต่ละหน้าอยู่ใน ClickUp (space **Auto_Parking**) ใช้ tag ชื่อคนกรองงานของตัวเอง

| ช่วง | วันที่ | สิ่งที่ต้องเสร็จ |
|---|---|---|
| Setup Library / Node · วาง Layout | 2 – 6 พ.ย. | repo, globals.css, `cn()`, layout ทุกกลุ่ม, `components/tailgrids/core`, `sidebarmenu.tsx` |
| Page | 5 – 12 พ.ย. | ทุกหน้าตามข้อ 6 · **12 พ.ย. ทุกหน้าเปิด PR แล้ว** |
| Testing | 12 – 14 พ.ย. | Unit, Integration, UAT (เทียบ Figma, ทดสอบสิทธิ์, ธีมมืด, มือถือ) |
| Deployment | 13 – 15 พ.ย. | merge, build, deploy demo, อัปเดตเอกสาร · **ส่งงาน 15 พ.ย. 2026** |

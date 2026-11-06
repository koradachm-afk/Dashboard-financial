<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — AUTO PARKING

กฎสำหรับ AI coding agent ที่ทำงานใน repo นี้ อ่านให้จบก่อนแก้โค้ดทุกครั้ง
ไฟล์นี้เป็นสรุปแบบบังคับใช้ รายละเอียดเต็มอยู่ใน:

| ไฟล์ | ใช้เมื่อ |
|---|---|
| [README.md](./README.md) | โครงโปรเจกต์ · route ↔ เฟรม Figma ↔ ผู้รับผิดชอบ · checklist ฟังก์ชันรายหน้า (ข้อ 6) · mock data · ข้อตัดสินใจ |
| [DESIGN-STYLE.md](./DESIGN-STYLE.md) | สี · ตัวอักษร · ระยะ · component · layout · globals.css · checklist รีวิว |
| Figma `AoPiNS1OO38plLtnHvInSz` | หน้าตาและข้อความจริงของทุกหน้า (**source of truth**) |

**ลำดับความสำคัญเมื่อขัดกัน:** คำสั่งของผู้ใช้ → Figma → DESIGN-STYLE.md → README.md → ไฟล์นี้
ถ้าเอกสารกับ Figma ไม่ตรงกัน หรือ Figma ไม่มี state ที่ต้องใช้ **ให้หยุดแล้วถามผู้ใช้** ห้ามเดาเอง

---

## 1. ข้อเท็จจริงของโปรเจกต์

- **ชื่อแบรนด์:** AUTO PARKING (อ่านจาก config ห้าม hard-code) · โดเมนใน mock: `autoparking.co`
- **ขอบเขตตอนนี้: frontend อย่างเดียว** ไม่มี backend · seed อยู่ใน `src/db/<โดเมน>/*.json` · ข้อมูลที่เกิดระหว่างใช้งานเก็บ localStorage ผ่าน `src/db/store.ts` เท่านั้น · ห้ามเพิ่ม API route, ฐานข้อมูล หรือ auth จริงถ้าไม่ได้สั่ง
- **ขอบเขตของ localStorage:** เก็บข้อมูลธุรกรรม (session รถ, การชำระเงิน, สถานะช่องจอดที่ผู้ดูแลตั้ง, audit log) และค่าที่ผู้ดูแลแก้ (Settings: ข้อมูลสาขา / ค่าจอด, ประเภทช่องจอด, ผังที่จอดที่กดบันทึก) และค่าที่ผู้ใช้เลือก (โดเมน `prefs`: ธีมของ Admin ผูกกับบัญชี) · **user และสิทธิ์:** ไฟล์ seed คงที่ไม่ถูกแก้ · การเปลี่ยนแปลงจากหน้า User & Permissions เก็บในหน่วยความจำของ server (ต่อ process, restart แล้วกลับเป็น seed) ไม่เก็บใน localStorage เพื่อให้การเช็กสิทธิ์ใน `page.tsx` ฝั่ง server ทำงานต่อได้
- **localStorage ผูกกับ browser และโดเมนเดียว:** การ demo 3 ฝั่ง (Admin / Customer / Kiosk) ต้องเปิดใน browser เดียวกัน
- **3 ฝั่ง:** Admin Web (Desktop 1440) · Customer Web (มือถือ 390, `/pay`) · Kiosk ทางเข้า / ทางออก (1920×1080)
- **Stack:** Next.js (App Router) + TypeScript · Tailwind CSS v4 · TailGrids (`src/components/tailgrids/`) · next-themes · Recharts · Fabric.js · SheetJS (Export Excel)
- **Role:** มีแค่ `Superadmin` และ `Admin` · Admin เห็นหน้าตามสิทธิ์ที่ Superadmin ตั้ง: `ไม่มีสิทธิ์ / ดูได้ / แก้ไขได้`
- **System Settings** แยกสิทธิ์ 3 แท็บ: ข้อมูลสาขา · ประเภทช่องจอด · ค่าจอดและการชำระเงิน · หน้า User & Permissions เป็นของ Superadmin เท่านั้น
- **สถานะรถ (session):** มีแค่ `จอดอยู่` และ `ออกแล้ว` ห้ามเพิ่ม "เกินเวลาออก" หรือ "ชำระซ้ำ"
- **สถานะช่องจอด:** ว่าง / ไม่ว่าง มาจากเซนเซอร์เท่านั้น · ปิดใช้งาน / ซ่อมบำรุง ผู้ดูแลตั้งเองได้ · ไม่มีระบบจอง
- **ประเภทช่องจอดตั้งต้น:** รถยนต์ทั่วไป · EV · ผู้พิการ · VIP (เพิ่มเองได้ใน Settings)
- **เวลาออกหลังจ่าย:** 15 นาที · เกินเวลา ประตูไม่เปิดจนกว่าจะจ่ายส่วนที่เกิน · ถ้าเปิดสวิตช์ "คิดค่าจอดใหม่" ให้คิดใหม่ **นับจากเวลาที่จ่ายครั้งล่าสุด** ถึงเวลาออกจริง
- **Customer Web:** ค้นทะเบียน → ถ้าเจอตั้งแต่ 2 คัน (ทะเบียนเดียวกันต่างจังหวัด / ต่างหมวด) ให้เลือกจากรายการพร้อม **รูปตอนเข้า** (17.8) → ตรวจสอบ → เลือกวิธีชำระ **QR PromptPay / Mobile Banking** (17.9–17.11)
  - รายการรถแสดงรูป จังหวัด และเวลาเข้าของทุกคันที่ตรง **ตัดสินแล้ว ไม่ต้องซ่อนหรือเบลอ**
  - **Mobile Banking ใช้ mock เท่านั้น** ห้ามต่อ payment gateway หรือ deep link เข้าแอปธนาคารจริงเอง
  - โลโก้ธนาคารใช้ไอคอน `Landmark` ไปก่อน **ห้ามดึงโลโก้ธนาคารจากเว็บมาใส่เอง**
  - Kiosk ทางออกยังชำระด้วย QR PromptPay อย่างเดียว
- **ชื่อเมนู:** ใช้ **Activity Log** ห้ามใช้ "Traffic Activity"
- **ธีม:** Admin มี **สว่าง / มืด** เท่านั้น (ไม่มี "ตามระบบ") บันทึกผูกกับบัญชี (เก็บใน store โดเมน `prefs` ใช้ user id เป็น key เพราะ user เป็น seed คงที่) · Customer และ Kiosk สว่างเท่านั้น
- **Kiosk** ไม่มีปุ่มเรียกพนักงาน และไม่มี hover

---

## 2. โครงสร้างและไฟล์

```
src/
├─ app/
│  ├─ layout.tsx · page.tsx · not-found.tsx · globals.css
│  ├─ (admin)/   layout.tsx + 403 · account · activity-log · audit-logs · dashboard ·
│  │             financial-overview · heat-map · parking-layout · settings · users
│  ├─ (auth)/    login · forgot-password · set-password
│  ├─ (customer)/pay/   ค้นหา + เลือกรถ (17–17.2, 17.8) · [sessionId]/ → รายละเอียด · method · qr · bank · success
│  └─ kiosk/     entry · exit
├─ components/
│  ├─ tailgrids/        component ที่ใช้หลายหน้า (ดึงจาก TailGrids แล้วแปลงเป็น token ของเรา)
│  └─ sidebarmenu.tsx   เมนูด้านซ้ายของ Admin
├─ db/                  store.ts (ชั้นกลางของ localStorage) · 1 โดเมน = 1 โฟลเดอร์ (ฟังก์ชันกลาง + seed JSON)
│                       settings/ · user/ · audit/ · auth/
└─ utils/               cn.ts · id.ts (newSessionId) · user-agent.ts · format วันที่ / เงิน / ระยะเวลา / ทะเบียน
```

**กฎ**
1. ใน `app/` มีได้แค่ไฟล์ของ Next.js: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
2. `page.tsx` ทำแค่ 3 อย่าง: **เช็กสิทธิ์ของหน้า → อ่าน `searchParams` → render component**
   - หน้าที่ต้องอ่านข้อมูลจาก localStorage: `page.tsx` (Server Component) เช็กสิทธิ์ + อ่าน `searchParams` แล้วส่งต่อให้ Client Component (`"use client"`) ใน `_components/` เป็นคนอ่านข้อมูล
3. **ห้ามเช็กสิทธิ์ราย page ใน `layout.tsx`** (layout ไม่ทำงานซ้ำเมื่อเปลี่ยนหน้า) · ไม่มีสิทธิ์ → redirect `/403`
   - เช็กด้วย `await requirePage("<page-key>")` จาก `@/db/auth/auth` ใน `page.tsx` (Server Component, ไม่มี `"use client"`) · ต้องการสิทธิ์แก้ไขใส่ `requirePage("<page-key>", "edit")` · ไม่มี session → `/login` · สิทธิ์ไม่พอ → `/403`
   - page-key: `dashboard` · `parking-layout` · `financial-overview` · `activity-log` · `heat-map` · `users` · `audit-logs` · `settings.branch` · `settings.slot-types` · `settings.fees`
   - ต้องการข้อมูลผู้ใช้ที่ login อยู่ (ชื่อ, Role) ใช้ค่าที่ `requirePage` คืนมา หรือ `getCurrentUser()`
4. ตัวกรอง, ช่วงวัน, เลขหน้า, โหมดดู / แก้ไข เก็บใน URL (`?floor=B1&mode=edit`)
5. หาข้อมูลไม่เจอใน route แบบ `[id]` → เรียก `notFound()` จาก `next/navigation` ไม่เขียนหน้า "ไม่พบ" เอง
6. component ที่ใช้หน้าเดียว → `app/(admin)/<page>/_components/` · ใช้ตั้งแต่ 2 หน้า → ย้ายไป `src/components/tailgrids/`
7. หน้าห้าม import JSON ใน `src/db/` ตรง ๆ ให้เรียกผ่านฟังก์ชันกลาง (วันที่มี backend จะแก้ที่ฟังก์ชันเดียว) · import JSON ได้เฉพาะไฟล์ใน `src/db/` (`store.ts` และฟังก์ชันอ่าน seed)
   - **ห้ามเรียก `localStorage` / `sessionStorage` ตรง ๆ นอก `src/db/store.ts`** หน้าและ component เรียกผ่านฟังก์ชันกลาง เช่น `getSessions()`, `addSession()`, `updateSlot()` เท่านั้น · **ข้อยกเว้นเดียว:** `next-themes` ใน `AdminThemeProvider` เขียน key `autoparking:v1:theme` เอง (ห้ามอ่านหรือเขียน key นี้จากที่อื่น ค่าธีมของบัญชีจริงอยู่ในโดเมน `prefs` ผ่าน `store.ts`)
   - 1 โดเมน = 1 โฟลเดอร์ `src/db/<โดเมน>/` (ฟังก์ชันกลาง `<โดเมน>.ts` + seed JSON) · import ผ่าน `@/db/<โดเมน>/<ไฟล์>` · `store.ts` อยู่ที่ `src/db/` ที่เดียว
   - **`src/db/user/credentials.json` import ได้เฉพาะ `src/db/auth/auth-actions.ts`** (ฝั่ง server) ห้าม client component หรือไฟล์ที่ client import ดึงไปใช้ เพราะรหัสผ่านจะหลุดไปอยู่ใน bundle ของ browser · ตรวจหลัง build ว่า `.next/static` ไม่มีเนื้อหาของไฟล์นี้
8. mock ใช้ตัวเลขชุดเดียวกับ Figma (เช่น ทะเบียน `ผบ 9370`, ช่อง `B-07`, รายรับ `฿10,080`) · ห้ามใส่ข้อมูลจริงของคน
9. `sessionId` ใน URL ของหน้าลูกค้าต้องเป็นรหัสสุ่ม **ห้ามใช้ทะเบียนรถ** (คำค้นเก็บใน `?q=` ได้ แต่ห้ามใช้เป็น id ใน path)
   - สร้างด้วย `newSessionId()` จาก `@/utils/id` (ใช้ `crypto.randomUUID()` และ fallback เป็น `crypto.getRandomValues()` เมื่ออยู่นอก secure context) · **ห้ามใช้ `Math.random()`, ห้ามใช้ทะเบียน, ห้ามใช้ลำดับเลข**
   - วิธีชำระเก็บใน `?method=qr|bank` · ธนาคารที่เลือกเก็บใน `&bank=<รหัส>`
   - การเปิดแอปธนาคารและผลการชำระเรียกผ่านฟังก์ชันกลางที่คืนค่า mock เท่านั้น
10. ทุกการเปลี่ยนแปลงสำคัญ, การเข้า / ออกจากระบบ และการ Export ต้องเรียก `audit()` กลาง · การแก้ผังที่ยังไม่บันทึกไม่ต้องลง log
11. **กฎของ store** (`src/db/store.ts`)
    - key ขึ้นต้น `autoparking:v1:<โดเมน>` (เช่น `sessions`, `payments`, `slots`, `audit`, `settings`, `prefs`) เพื่อ reset / migrate ได้
    - อ่านครั้งแรกถ้ายังไม่มี key ให้ใช้ seed แล้วเขียนกลับ
    - ครอบทุกการอ่าน / เขียนด้วย `try/catch` และ fallback เป็น in-memory เมื่อ storage เต็มหรือถูกปิด
    - parse แล้วต้องตรวจรูปแบบข้อมูลก่อนใช้ (ผู้ใช้แก้ใน DevTools ได้) ถ้าไม่ผ่านให้ใช้ seed
    - อ่านใน `useEffect` หรือ `useSyncExternalStore` เท่านั้น ห้ามอ่านตอน render บน server เพื่อเลี่ยง hydration mismatch
    - เรียก `newSessionId()` ใน event handler หรือฟังก์ชันของ store เท่านั้น ห้ามเรียกใน body ของ component
    - `audit()` ต้องเขียนลง store เดียวกัน เพื่อให้หน้า Audit Logs เห็นรายการจากการใช้งานจริง
    - sync ข้ามแท็บด้วย event `storage` ได้
    - seed ที่ใช้ตรงกับ Figma ต้องมี `sessionId` ตายตัว (เช่น `sess_...`) ส่วนรายการที่สร้างใหม่ใช้ id สุ่ม
    - มีฟังก์ชัน `resetStore()` สำหรับ dev (ล้าง key `autoparking:v1:*` แล้วโหลด seed ใหม่)
    - ห้ามเก็บข้อมูลจริงของคนใน localStorage (ตรงกับกฎข้อ 8)

**ไฟล์ที่ห้ามแก้ถ้าไม่ได้สั่ง:** `layout.tsx` ระดับกลุ่ม, `src/components/`, `globals.css` (เจ้าของคือ PM) · บล็อก `nextjs-agent-rules` ด้านบนของไฟล์นี้ · `package.json` (ห้ามเพิ่ม dependency โดยไม่ถาม)

---

## 3. UI และสไตล์ (สรุปจาก DESIGN-STYLE.md)

**ต้องทำ**
- ใช้ utility ที่อิง token ของเราเท่านั้น: `bg-surface`, `bg-page`, `bg-subtle`, `text-fg`, `text-fg-2`, `text-fg-3`, `border-line`, `bg-primary`, `text-on-primary`, `rounded-xl`, `shadow-pop` ฯลฯ
- ขนาดตัวอักษรใช้สเกลของเรา: `text-nano · micro · caption · label · body · control · title · lead · h3 · h2 · h1 · kpi · kiosk-md · kiosk-lg · kiosk-xl` (ข้อความมาตรฐาน Admin = `text-body` 13px)
- spacing ใช้เฉพาะค่าในตาราง DESIGN-STYLE.md ข้อ 4
- รวม className ด้วย `cn()` จาก `@/utils/cn` เสมอ วาง `className` จากภายนอกไว้ท้ายสุด
- ใช้ component กลางใน `src/components/tailgrids/` ทุกครั้งที่มี ไม่สร้างปุ่ม / input / badge / select ใหม่ในหน้า
- ข้อความบน UI ใช้ **ตาม Figma ทุกตัวอักษร** (หัวข้อ, ปุ่ม, placeholder, error)
- ตัวเลข, เงิน, เวลา ใส่ `tabular-nums` · ข้อความไทย line-height ≥ 1.4
- ห้ามแยกความหมายด้วยสีอย่างเดียว ต้องมีจุด ไอคอน หรือข้อความประกอบ

**ห้ามทำ**
- ห้ามใส่สี hex / rgb ในไฟล์ `.tsx` (`bg-[#3758F9]`, `style={{color}}`) · สีอยู่ใน `globals.css` ที่เดียว
- ห้ามใช้ค่า arbitrary ของ font-size, radius, shadow, spacing (`text-[15px]`, `p-[7px]`) ยกเว้น `z-[60]` ของ toast
- ห้ามใช้ variant `dark:` ใน component (ธีมสลับผ่าน CSS variables)
- ห้ามใช้ class ของ TailGrids ตรง ๆ (`text-dark`, `text-body-color`, `border-stroke`, `bg-gray-*`, `shadow-1`) ต้องแปลงตามตารางใน DESIGN-STYLE.md ข้อ 1
- ห้ามใช้พาเลตต์ default ของ Tailwind (`bg-blue-500`, `text-gray-600`)
- ห้ามติดตั้ง preset / plugin / theme ของ TailGrids
- ห้ามใช้ `uppercase` กับข้อความไทย
- ห้ามสลับหน้าที่สี: `slot-occupied` = มีรถจอด · `danger` = error / ลบ · สีประเภทช่องจอดใช้กับไอคอนเท่านั้น

**รูปแบบข้อมูล**

| ข้อมูล | รูปแบบ |
|---|---|
| วันที่ | `ส. 17 ต.ค. 2026` · ในตาราง `2026-10-17 21:48` |
| เวลา | 24 ชม. `21:56` |
| ระยะเวลา | `1 ชม. 58 น.` |
| เงิน | `฿10,080` · หน้าชำระเงิน `฿60.00` |
| ช่องจอด | `B-07` |
| ค่าที่ยังไม่เกิด | เขียนเป็นคำ สี `text-fg-3` เช่น `ยังไม่ออก` · `ยังไม่ชำระ` (ห้ามใช้ "-") |
| ตาราง | แบ่งหน้าละ 10 แถว · "แสดง 1–10 จาก 190" |

**สิทธิ์บนหน้าจอ**
- ไม่มีสิทธิ์: ซ่อนเมนูใน Sidebar · เข้า URL ตรง → `/403`
- ดูได้: ซ่อนหรือ disable ปุ่มเพิ่ม / แก้ไข / ลบ / บันทึก / Export แล้วแสดงป้าย "สิทธิ์ดูอย่างเดียว · …" (เฟรม 08.3, 10.25)
- Settings: ซ่อนแท็บที่ไม่มีสิทธิ์ และเปิดมาที่แท็บแรกที่มีสิทธิ์ (10.26)

---

## 4. ขั้นตอนก่อนเขียนฟังก์ชันใหม่

1. เปิดเฟรมหลักของหน้าจากตารางใน README.md ข้อ 4
2. ไล่ดูเฟรมย่อยทุกเลข (เช่น 14.1–14.15) แต่ละเฟรมคือ state ที่โค้ดต้องรองรับ
3. อ่าน checklist ☐ ของหน้านั้นใน README.md ข้อ 6
4. ใช้ component ที่มีอยู่แล้ว ถ้ายังไม่มีให้สร้างตามสเปกใน DESIGN-STYLE.md ข้อ 8 ห้ามออกแบบหน้าตาเอง
5. เพิ่ม mock ใน `src/db/` ด้วยตัวเลขเดียวกับเฟรม

---

## 5. Git workflow

โมเดล: Git Flow ย่อ ไม่มี `release/*` และ `hotfix/*`

```
main  ← production เท่านั้น (ติด tag v0.1, v0.2, v1.0 ...)
  └── dev  ← รวมงานจากทุก branch ย่อย
        ├── feat/*  ├── fix/*  ├── ui/*
        ├── refactor/*  ├── docs/*  └── chore/*
```

**กฎเหล็ก**
1. **ห้าม commit ตรงเข้า `main` หรือ `dev`** ทำงานใน branch ย่อยเสมอ
2. branch ย่อย **แตกจาก `dev` เท่านั้น** และ merge กลับเข้า `dev` ผ่าน Pull Request
3. **1 branch = 1 งาน** ถ้างานปนหลายประเภท ให้แยก branch
4. ลบ branch ทั้ง local และ remote ทันทีหลัง merge
5. ติด tag เฉพาะบน `main` รูปแบบ `vMAJOR.MINOR`
6. agent **ห้าม push, merge, ลบ branch หรือติด tag** ถ้าผู้ใช้ไม่ได้สั่ง

**เลือกประเภท branch** ตาม "ผลของงาน" ถามตามลำดับ หยุดที่ข้อแรกที่ใช่

| ลำดับ | คำถาม | Prefix | ตัวอย่าง |
|---|---|---|---|
| 1 | เพิ่มความสามารถใหม่ให้ผู้ใช้? | `feat/` | `feat/activity-log-filters` |
| 2 | แก้ของที่พังอยู่? | `fix/` | `fix/kiosk-exit-timer` |
| 3 | แก้เฉพาะหน้าตา ไม่แตะ logic? | `ui/` | `ui/sidebar-spacing` |
| 4 | จัดโค้ดใหม่ ผลลัพธ์เหมือนเดิม? | `refactor/` | `refactor/audit-service` |
| 5 | แก้เฉพาะเอกสาร? | `docs/` | `docs/agents-rules` |
| 6 | tooling, dependency, config? | `chore/` | `chore/extend-cn-tailwind-merge` |

**ตั้งชื่อ:** `<type>/<คำอธิบายสั้น>` ตัวพิมพ์เล็ก kebab-case ภาษาอังกฤษ 3–5 คำ ขึ้นต้นด้วยชื่อ route เมื่อเป็นงานของหน้า (`feat/heat-map-export`) · ใส่เลข ticket ได้ (`fix/123-cart-total`) · ห้ามชื่อกว้าง เช่น `feat/update`, `fix/bug`

**ขั้นตอน**
```bash
# เริ่มงาน
git checkout dev && git pull origin dev
git checkout -b feat/heat-map-export

# ระหว่างทำ (commit prefix ตรงกับประเภท branch)
git add <ไฟล์ที่แก้>
git commit -m "feat: add export excel button to heat map"

# dev เดินไปไกล
git fetch origin && git rebase origin/dev

# เสร็จงาน → push แล้วเปิด PR เป้าหมาย dev
git push -u origin feat/heat-map-export
```
Release: PR `dev` → `main` → ทดสอบผ่าน → merge → `git tag -a v1.0 -m "Release v1.0"`
แก้บั๊กด่วนบน production: ใช้ `fix/*` จาก `dev` ตามปกติแล้ว release ใหม่

**คำอธิบาย PR ต้องมี:** เลขเฟรม Figma ที่ทำ (เช่น `14, 14.1–14.4`) · ภาพหน้าจอจริงคู่กับเฟรม · state ที่ยังไม่ได้ทำ
**ผู้รีวิว:** PM (อ๊อด) + เจ้าของหน้า ถ้าแก้ไฟล์ในโฟลเดอร์ของคนอื่น

---

## 6. Definition of Done (ตรวจก่อนบอกว่าเสร็จ)

**โค้ด**
- [ ] `npm run lint` และ `npm run build` ผ่าน
- [ ] ไม่มีสี hex / rgb, ค่า arbitrary, `dark:` หรือ class ของ TailGrids ในไฟล์ `.tsx`
- [ ] ใช้ component กลางและ `cn()` · ตัวเลขใส่ `tabular-nums` · รูปแบบข้อมูลตามข้อ 3
- [ ] เช็กสิทธิ์ใน `page.tsx` · โหมด "ดูได้" ซ่อน / ล็อกปุ่มแก้ไข
- [ ] ไม่มีคำว่า Traffic Activity หรือ ParkPlan หลงเหลือบน UI
- [ ] เปิดหน้า Admin ทั้งธีมสว่างและมืดแล้วอ่านได้ทุกจุด
- [ ] เทียบกับเฟรม Figma ที่มีเลขเดียวกันครบทุก state
- [ ] ไม่มีการเรียก `localStorage` / `sessionStorage` นอก `src/db/store.ts` (ยกเว้น key `autoparking:v1:theme` ที่ `next-themes` เขียนเอง)
- [ ] `sessionId` ใหม่สร้างผ่าน `newSessionId()` เท่านั้น ไม่ได้สร้างใน render
- [ ] เปิดหน้าแล้วไม่มี hydration warning ใน console
- [ ] ทดสอบหลังกด `resetStore()` แล้วข้อมูลกลับเป็น seed ตรงกับเฟรม Figma
- [ ] ข้อมูลใน localStorage ที่ถูกแก้ผิดรูปแบบ ไม่ทำให้หน้าพัง
- [ ] หน้าลูกค้า: ทดสอบครบทุกกรณี
  - ค้นหาเจอ 1 คัน → ไป 17.3 ทันที · เจอหลายคัน → 17.8 · ไม่พบ → 17.2
  - ชำระได้ทั้ง QR PromptPay และ Mobile Banking (mock)

**Git**
- [ ] อยู่บน branch ย่อยที่แตกจาก `dev` ชื่อตรงกติกา และทำงานเดียว
- [ ] commit message มี prefix ถูกต้อง (`feat:` `fix:` `ui:` `refactor:` `docs:` `chore:`)
- [ ] PR เป้าหมายคือ `dev` (ยกเว้น PR release ไป `main`) · ไม่มี conflict
- [ ] `refactor/*`: ยืนยันแล้วว่าพฤติกรรมเดิมไม่เปลี่ยน

---

## 7. เมื่อผู้ใช้สั่งงาน

- ผู้ใช้อธิบายงานโดยไม่บอกประเภท → เลือก prefix ตามตารางข้อ 5 บอกเหตุผลสั้น ๆ แล้วเสนอชื่อ branch พร้อมคำสั่ง git
- ผู้ใช้จะ commit / push ตรงเข้า `main` หรือ `dev` → เตือนว่าผิดกฎ แล้วเสนอแตก branch ย่อย
- งานใหญ่หรือปนหลายประเภท → เสนอแยกเป็นหลาย branch
- งานต้องเพิ่ม dependency, เปลี่ยน token ใน `globals.css` หรือแก้ component กลาง → ถามก่อน
- Figma ไม่มี state ที่ต้องใช้ → ทำตาม DESIGN-STYLE.md ข้อ 16 ถ้ายังไม่ครอบคลุมให้ถาม
- งานต้องต่อระบบชำระเงินจริง (payment gateway, deep link แอปธนาคาร, โลโก้ธนาคาร) → หยุดแล้วถาม เพราะขอบเขตตอนนี้เป็น mock
- งานที่ต้องให้ Superadmin แก้สิทธิ์ / user แล้วมีผลจริง → ทำแล้วผ่านที่เก็บในหน่วยความจำของ server (`src/db/user/user-store.ts`) · แก้ user ผ่าน Server Action ใน `src/db/user/user-actions.ts` เท่านั้น ห้ามย้ายไปเก็บใน localStorage

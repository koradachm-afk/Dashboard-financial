# AUTO PARKING — Design Style & Tailwind Scope

> แหล่งความจริง (source of truth): Figma `AoPiNS1OO38plLtnHvInSz`
> - หน้า **🎨 Design System** — ตัวแปรสี (Variables) + Components
> - หน้า **📐 Screens** — Admin Web, Customer Web, Kiosk ทางเข้า / ทางออก
>
> เอกสารนี้แปลง Figma ออกมาเป็นกติกาสำหรับโค้ด (Next.js + Tailwind CSS v4)
> ถ้าเอกสารนี้กับ Figma ไม่ตรงกัน **ให้ยึด Figma** แล้วแก้เอกสารนี้ตาม
>
> **เวอร์ชัน 2.4 · อัปเดต 6 พ.ย. 2026**

### มีอะไรเปลี่ยน

**v2.4 (6 พ.ย.) · Mobile Banking**

| เรื่อง | เดิม | ตอนนี้ | ข้อ |
|---|---|---|---|
| โลโก้ธนาคาร (Bank Option) | วงสีเทา + ไอคอน `Landmark` | ไอคอนจริงจากเว็บทางการ 4 แห่ง (ไทยพาณิชย์ · กรุงเทพ · กรุงไทย · ทีทีบี) · กสิกรไทยและกรุงศรีเป็นวงสีประจำธนาคาร + อักษรย่อ (component property `Initials`) จนกว่าจะได้ไฟล์ | 8.5 |
| ผลการชำระผ่านแอป | มีแค่รอยืนยัน (17.11) และสำเร็จ (17.7) | เพิ่ม **17.12** ไม่สำเร็จ / ยกเลิก และ **17.13** หมดเวลารอยืนยัน | 9.3 |

**v2.3 (6 พ.ย.) · สิทธิ์เหลือ 2 ระดับ**

| เรื่อง | เดิม | ตอนนี้ | ข้อ |
|---|---|---|---|
| ระดับสิทธิ์ | ไม่มีสิทธิ์ / ดูได้ / แก้ไขได้ | **ไม่มีสิทธิ์ / แก้ไขได้** · เลิกโหมดดูอย่างเดียว | 8.2, 9.5 |
| Access Level Picker | 3 ตัวเลือก | 2 ตัวเลือก · ปุ่มลัด "ดูได้ทุกหน้า" เป็น "แก้ไขได้ทุกหน้า" | 8.2 |
| Page Access Chip | Edit / View | มีแบบ Edit แบบเดียว | 8.2 |
| ป้าย "สิทธิ์ดูอย่างเดียว" | Audit Logs (08.3) และ Settings (10.25) | เลิกใช้ · Export Excel แสดงให้ทุกคนที่เปิดหน้าได้ · ลบเฟรม 08.3 และ 10.25 ออกจาก Figma แล้ว | 9.5 |

**v2.2 (6 พ.ย.) · รหัสผ่าน**

| เรื่อง | เดิม | ตอนนี้ | ข้อ |
|---|---|---|---|
| ความยาวรหัสผ่านขั้นต่ำ | อย่างน้อย 10 ตัวอักษร | **อย่างน้อย 8 ตัวอักษร** ทั้งเงื่อนไขในหน้าตั้งรหัส / เปลี่ยนรหัส และข้อความใต้ช่องรหัสผ่านตอนเพิ่มผู้ใช้ · แก้ใน Figma แล้ว (07.6, 09.2, 09.3, 09.4, 09.9, 09.17, 09.19) | 9.2 |

**v2.1 (3 พ.ย.) · Customer Web**

| เรื่อง | เดิม | ตอนนี้ | ข้อ |
|---|---|---|---|
| ทะเบียนซ้ำ / คล้ายกัน | ไปหน้ารายละเอียดทันที | หน้า **17.8 เลือกรถของคุณ** + Plate Match Card และ Entry Snapshot (รูปตอนเข้า) | 8.5, 9.3 |
| วิธีชำระ | PromptPay QR อย่างเดียว | เลือก **QR PromptPay / Mobile Banking** (17.9–17.10) + หน้ารอยืนยันในแอปธนาคาร (17.11) | 8.5, 9.3 |
| Component ใหม่ | — | Radio · Payment Method Option · Bank Option · ไอคอน smartphone, landmark, zoom-in | 7, 8.1, 8.5 |

**v2 (2 พ.ย.)**

| เรื่อง | เดิม | ตอนนี้ | ข้อ |
|---|---|---|---|
| ชื่อเมนู | Traffic Activity | **Activity Log** | 8.1, 8.5 |
| ธีม | สว่าง / มืด / ตามระบบ | **สว่าง / มืด** เท่านั้น บันทึกผูกกับบัญชี | 13 |
| ที่เก็บ component | `src/components/ui/` | **`src/components/tailgrids/core/`** + `src/components/sidebarmenu.tsx` | 1, 8 |
| รวม className | ต่อ string เอง | ใช้ **`cn()`** (clsx + tailwind-merge ที่ตั้งค่าขนาดตัวอักษรของเราแล้ว) | 1.1 |
| System Settings | เฉพาะ Superadmin | Admin เข้าได้ **ตามสิทธิ์รายแท็บ** (3 แท็บ) | 8.1, 9.5 |
| Action Badge | 5 แบบ | เพิ่ม **Logout** และ **Export** เป็น 7 แบบ | 8.2 |
| ตาราง | — | เพิ่มรูปแบบค่าที่ยังไม่เกิด (ยังไม่ออก / ยังไม่ชำระ) และ pagination 10 แถว | 8.3 |
| Export Excel | — | ปุ่ม + Toast "กำลังสร้างไฟล์" (Heat Map, Activity Log, Financial, Audit Logs) | 10.1 |
| Drawer | Body scroll ได้ | Body ต้อง `overflow-y-auto` (ลิ้นชักผู้ใช้ยาวเกินจอแล้ว) + แบบแผนลิ้นชักรายละเอียด Audit | 10 |
| หน้า 404 | ยังไม่มี | เฟรม **07.10** (โครงเดียวกับ 403) | 9.5 |
| Settings สิทธิ์ไม่ครบแท็บ | ยังไม่มี | เฟรม **10.26** (เฟรม 10.25 "ดูได้" ลบออกใน v2.3) | 9.5 |
| ค่าจอดเกินเวลา | 10.3 กับ 17.7 เขียนไม่ตรงกัน | 15 นาทีตรงกันทุกจอ + สวิตช์ "คิดค่าจอดใหม่เมื่อออกเกินเวลา" (นับจากเวลาจ่ายครั้งล่าสุด) | 9.5 |
| ชื่อแบรนด์ | ParkPlan (รอตัดสินใจ) | **AUTO PARKING** ทุกหน้าจอ | 12 |

---

## สารบัญ

1. [ขอบเขต Tailwind / TailGrids](#1-ขอบเขต-tailwind--tailgrids) (+ 1.1 `cn()`)
2. [สี (Color tokens)](#2-สี-color-tokens)
3. [ตัวอักษร (Typography)](#3-ตัวอักษร-typography)
4. [ระยะห่าง (Spacing)](#4-ระยะห่าง-spacing)
5. [มุมโค้ง (Radius)](#5-มุมโค้ง-radius)
6. [เงาและลำดับชั้น (Shadow / z-index)](#6-เงาและลำดับชั้น-shadow--z-index)
7. [ไอคอน](#7-ไอคอน)
8. [Components](#8-components)
9. [Layout แต่ละฝั่ง](#9-layout-แต่ละฝั่ง) (+ 9.5 สิทธิ์)
10. [Overlay: Modal / Drawer / Dropdown / Toast](#10-overlay-modal--drawer--dropdown--toast) (+ 10.1 Export Excel)
11. [กราฟและ Heat Map](#11-กราฟและ-heat-map)
12. [รูปแบบข้อความและตัวเลข](#12-รูปแบบข้อความและตัวเลข)
13. [ธีมมืด (Dark mode)](#13-ธีมมืด-dark-mode)
14. [globals.css พร้อมใช้](#14-globalscss-พร้อมใช้)
15. [Checklist ตอนรีวิว PR](#15-checklist-ตอนรีวิว-pr)
16. [สิ่งที่ Figma ยังไม่ได้กำหนด](#16-สิ่งที่-figma-ยังไม่ได้กำหนด)

---

## 1. ขอบเขต Tailwind / TailGrids

### หน้าที่ของแต่ละตัว

| ตัว | บทบาท | สรุป |
|---|---|---|
| **Tailwind CSS v4** | เครื่องมือหลักในการเขียน style | ใช้ได้เฉพาะ token ที่ประกาศใน `@theme` ของเรา (ข้อ 14) |
| **Components กลาง** (`src/components/tailgrids/core/*` และ `src/components/sidebarmenu.tsx`) | หน้าตาทุกอย่างที่มีใน Figma | หน้า (page) ต้องประกอบจาก component เหล่านี้ |
| **TailGrids** | ต้นแบบโครง markup ที่ดึงมาไว้ใน `src/components/tailgrids/core/` (ตาม `tailgrids.config.json`) | ดึงมาแล้วต้องแปลง class เป็น token ของเราทุกตัว ไม่ใช้ theme ของ TailGrids |

Figma ใช้ component ของโปรเจกต์เองทั้งหมด ไม่ได้ต่อ library ของ TailGrids
พาเลตต์สีของเราบังเอิญใกล้ TailGrids (primary `#3758F9`, `#111928`, `#637381`, `#DFE4EA`)
แต่ **ชื่อ class ต่างกัน** และขนาดตัวอักษร / เงา ไม่เหมือนกัน

### ✅ ทำได้

- ใช้ utility ของ Tailwind ที่อิง token ของเรา เช่น `bg-surface`, `text-fg-2`, `border-line`, `rounded-xl`, `shadow-pop`, `text-body`
- ใช้ spacing ตามสเกลในข้อ 4 (`gap-3`, `px-5`, `py-4.5` ฯลฯ)
- ดึง component ของ TailGrids มาไว้ใน `src/components/tailgrids/core/` แล้ว **แปลง class ทุกตัวเป็น token ของเรา** ตามตารางด้านล่าง และปรับหน้าตาให้ตรงกับ component ชื่อเดียวกันใน Figma
- component ที่ใช้แค่หน้าเดียว ให้เก็บไว้ข้างหน้านั้นใน `app/(admin)/<page>/_components/` ไม่ต้องใส่ใน `src/components/`
- ใช้ `tabular-nums` กับตัวเลขในตาราง, KPI และเวลา

### ❌ ห้าม

- ห้ามติดตั้ง preset / plugin / tailwind config ของ TailGrids เพราะจะเพิ่มชุดสี เงา และขนาดตัวอักษรที่ชนกับของเรา
- ห้ามใช้ชื่อ class ของ TailGrids ในโค้ด เช่น `text-dark`, `text-body-color`, `border-stroke`, `bg-gray-2`, `shadow-1`
- ห้ามใช้สีตรง ๆ ในโค้ด (`bg-[#3758F9]`, `style={{color:'#111928'}}`) ให้ใช้ token เท่านั้น
- ห้ามใช้ค่า arbitrary สำหรับ font-size / radius / shadow (`text-[15px]`, `rounded-[10px]`) ถ้าต้องการค่าใหม่ ให้เพิ่มใน Figma ก่อน แล้วค่อยเพิ่ม token
- ห้ามใช้ variant `dark:` ใน component เพราะธีมมืดสลับผ่าน CSS variables อยู่แล้ว (ข้อ 13)
- ห้ามสร้าง component ใหม่ที่หน้าตาซ้ำกับ component ใน Figma (Button, Input, Badge ฯลฯ ต้องใช้ตัวกลาง)
- ห้ามใช้พาเลตต์ default ของ Tailwind (`bg-blue-500`, `text-gray-600`) เพราะถูกปิดไว้ใน `@theme` แล้ว

### ตารางแปลง class จาก TailGrids เป็น token ของเรา

> อิงชุดสีของ TailGrids v2 — ก่อนใช้ ให้ตรวจกับเวอร์ชันที่คัดลอกมาอีกครั้ง

| TailGrids | AUTO PARKING | ค่า (Light) |
|---|---|---|
| `bg-primary` / `text-primary` | `bg-primary` / `text-primary` | `#3758F9` |
| `bg-blue-dark` (hover) | `hover:bg-primary-hover` | `#1B44C8` |
| `text-dark` | `text-fg` | `#111928` |
| `text-body-color` | `text-fg-2` | `#637381` |
| `text-dark-6` / `text-body-color` แบบจาง | `text-fg-3` | `#9CA3AF` |
| `border-stroke` | `border-line` | `#DFE4EA` |
| `bg-gray-1` | `bg-subtle` | `#F9FAFB` |
| `bg-gray-2` | `bg-page` | `#F3F4F6` |
| `bg-white` (พื้นการ์ด) | `bg-surface` | `#FFFFFF` |
| `text-green` / `bg-green-light-6` | `text-success` / `bg-success-soft` | `#22AD5C` / `#DAF8E6` |
| `text-red` / `bg-red-light-6` | `text-danger` / `bg-danger-soft` | `#E10E0E` / `#FEEBEB` |
| `text-sm` (14px) | `text-control` | 14px |
| `text-base` (16px) | `text-lead` | 16px |
| `shadow-1`, `shadow-card` ฯลฯ | `shadow-sm` / `shadow-pop` | ข้อ 6 |
| `rounded-md` / `rounded-lg` | ใช้ชื่อเดิมได้ (ค่าตรงกัน) | 6px / 8px |

### 1.1 รวม className ด้วย `cn()`

ทุก component ต้องรวม class ผ่าน `cn()` ใน `src/utils/cn.ts` และ**ต้องบอก tailwind-merge ว่าขนาดตัวอักษรและ radius ของเรามีชื่ออะไร**
ไม่อย่างนั้น tailwind-merge จะเข้าใจว่า `text-body` เป็นสี แล้วลบทิ้งเมื่อเจอ `text-fg`

```ts
// src/utils/cn.ts   (npm i clsx tailwind-merge)
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["nano", "micro", "caption", "label", "body", "control", "title",
             "lead", "h3", "h2", "h1", "kpi", "kiosk-md", "kiosk-lg", "kiosk-xl"],
      radius: ["xs", "sm", "md", "lg", "pop", "xl", "modal", "2xl"],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

- ถ้าเพิ่มขนาดตัวอักษรหรือ radius ใหม่ใน `@theme` ต้องเพิ่มชื่อในไฟล์นี้ด้วย
- `className` ที่ส่งเข้ามาจากภายนอกให้วางท้ายสุด: `cn(base, variants[v], className)` ค่าจากภายนอกจะชนะ

---

## 2. สี (Color tokens)

ชื่อ CSS variable ตั้งตามชื่อ Variable ใน Figma (`/` เปลี่ยนเป็น `-` และขึ้นต้นด้วย `--pp-`)
ส่วน Tailwind class เป็นชื่อสั้นสำหรับใช้ในโค้ด

### 2.1 พื้นฐาน

| Figma Variable | CSS var | Tailwind | Light | Dark | ใช้กับ |
|---|---|---|---|---|---|
| color/primary | `--pp-primary` | `primary` | `#3758F9` | `#5B7BFF` | ปุ่มหลัก, ลิงก์, เมนูที่เลือก, focus |
| color/primary-hover | `--pp-primary-hover` | `primary-hover` | `#1B44C8` | `#7C96FF` | hover ของปุ่มหลัก |
| color/primary-soft | `--pp-primary-soft` | `primary-soft` | `#EEF1FF` | `#1E2A5C` | พื้นเมนูที่เลือก, Badge Info, ช่วงวันในปฏิทิน |
| bg/page | `--pp-bg-page` | `page` | `#F3F4F6` | `#0E1520` | พื้นหลังทั้งหน้า |
| bg/surface | `--pp-bg-surface` | `surface` | `#FFFFFF` | `#172131` | การ์ด, sidebar, modal, input |
| bg/subtle | `--pp-bg-subtle` | `subtle` | `#F9FAFB` | `#1B2636` | พื้นรองในการ์ด, hover แถว, Type Chip |
| bg/canvas | `--pp-bg-canvas` | `canvas` | `#EEF0F4` | `#111A27` | พื้นหลังพื้นที่วาดผัง |
| bg/overlay | `--pp-overlay` | `overlay` | `#111928` @ 45% | `#000000` @ 60% | ฉากหลัง modal / drawer |
| border/default | `--pp-border` | `line` | `#DFE4EA` | `#2A3647` | เส้นขอบทั่วไป, เส้นคั่นแถว |
| border/strong | `--pp-border-strong` | `line-strong` | `#C9D0D8` | `#3B4859` | ขอบ checkbox, แกนกราฟ |
| border/focus | `--pp-border-focus` | `focus` | `#3758F9` | `#5B7BFF` | ขอบ input ตอน focus, focus ring |
| text/primary | `--pp-text` | `fg` | `#111928` | `#F1F3F7` | ข้อความหลัก |
| text/secondary | `--pp-text-2` | `fg-2` | `#637381` | `#A3ADBC` | คำอธิบาย, หัวตาราง, label |
| text/muted | `--pp-text-3` | `fg-3` | `#9CA3AF` | `#6E7A8C` | placeholder, hint, ข้อความรอง |
| text/on-primary | `--pp-on-primary` | `on-primary` | `#FFFFFF` | `#FFFFFF` | ข้อความบนพื้น primary |

### 2.2 สถานะช่องจอด (Slot status)

| Figma Variable | Tailwind | Light | Dark |
|---|---|---|---|
| status/available | `slot-available` | `#22AD5C` | `#34C77B` |
| status/available-soft | `slot-available-soft` | `#DAF8E6` | `#123526` |
| status/occupied | `slot-occupied` | `#F23030` | `#F26464` |
| status/occupied-soft | `slot-occupied-soft` | `#FEEBEB` | `#3A1C22` |
| status/disabled | `slot-disabled` | `#6B7280` | `#8A94A3` |
| status/disabled-soft | `slot-disabled-soft` | `#E5E7EB` | `#253042` |
| status/unknown | `slot-unknown` | `#D1D5DB` | `#3B4859` |
| status/unknown-soft | `slot-unknown-soft` | `#F9FAFB` | `#172131` |

### 2.3 ประเภทช่องจอด (Slot type)

| Figma Variable | Tailwind | Light | Dark |
|---|---|---|---|
| type/general | `type-general` | `#374151` | `#C9D1DC` |
| type/ev | `type-ev` | `#0EA5E9` | `#38BDF8` |
| type/accessible | `type-accessible` | `#6366F1` | `#8B93FF` |
| type/vip | `type-vip` | `#F59E0B` | `#FBBF24` |

### 2.4 Feedback (ชื่อเรียกตามความหมาย)

| Tailwind | ผูกกับ Figma | Light | ใช้กับ |
|---|---|---|---|
| `success` / `success-soft` | status/available(-soft) | `#22AD5C` / `#DAF8E6` | ชำระสำเร็จ, บันทึกแล้ว, Badge Success |
| `warning` / `warning-soft` | feedback/warning(-soft) | `#D97706` / `#FFFBEB` | อ่านป้ายไม่สำเร็จ, รอชำระ, Event "ออก" |
| `danger` | feedback/danger | `#E10E0E` | ข้อความ error, ปุ่มลบ, ขอบ input error |
| `danger-soft` | status/occupied-soft | `#FEEBEB` | พื้น Badge Danger, กล่องแจ้ง error |

### 2.5 กติกาการใช้สี

1. **สีสถานะใช้กับพื้นและขอบของช่องจอด ส่วนสีประเภทใช้กับไอคอนเท่านั้น** ห้ามเอาสีประเภทมาเติมพื้นช่องจอด เพราะจะชนกับสีสถานะ
2. **มีสีแดงสองตัว:** `slot-occupied` (`#F23030`) ใช้กับ "มีรถจอด" ส่วน `danger` (`#E10E0E`) ใช้กับ error และการลบ ห้ามสลับกัน
3. Badge และกล่องแจ้งเตือนใช้คู่ "พื้น `*-soft` + ตัวอักษรสีเต็ม" เสมอ
4. ห้ามแยกความหมายด้วยสีอย่างเดียว ต้องมีจุด ไอคอน หรือข้อความประกอบ (Status Badge มีจุด 8px + ข้อความ)
5. Segmented / Toggle: ถ้าวางบนพื้น `page` ให้ใช้พื้น `subtle` แต่ถ้าวางบนการ์ด (`surface`) ให้ใช้พื้น `page` (Figma ทำแบบนี้ เช่น Range filter ใช้ subtle ส่วน Mode Toggle ใช้ page)

---

## 3. ตัวอักษร (Typography)

### 3.1 ฟอนต์

| ฟอนต์ | ใช้กับ | น้ำหนัก |
|---|---|---|
| **Inter** | อักษรละติน, ตัวเลข, เวลา, ชื่อเมนูภาษาอังกฤษ | 400 / 500 / 600 / 700 |
| **Noto Sans Thai** | อักษรไทย | 400 / 500 / 600 / 700 |

- โหลดผ่าน `next/font/google` แล้วตั้ง CSS variable `--font-inter` และ `--font-thai`
- font stack: `Inter → Noto Sans Thai → system-ui` Inter ไม่มีอักษรไทย เบราว์เซอร์จึงสลับไป Noto Sans Thai ให้เองทีละตัวอักษร
- ใน Figma ไม่มี Text Style ตารางด้านล่างสรุปจากการใช้งานจริงในทุกหน้าจอ

### 3.2 สเกลขนาด (มีแค่ชุดนี้ ขนาด default ของ Tailwind ถูกปิดไว้)

| Tailwind | ขนาด / line-height | น้ำหนักที่ใช้ | ใช้กับ |
|---|---|---|---|
| `text-nano` | 9 / 12 | 500 | จังหวัดใต้ทะเบียนใน Plate ขนาดเล็ก, ป้ายแกนกราฟ (ใช้เฉพาะใน component) |
| `text-micro` | 10 / 14 | 600 | เลขช่องในผัง (Parking Slot) |
| `text-caption` | 11 / 16 | 400–600 | Badge เล็ก (Session, Event, Payment), หัวกลุ่มเมนู, hint |
| `text-label` | 12 / 18 | 400–600 | หัวตาราง (600), Status Badge (500), ข้อความรองใต้ KPI |
| `text-body` | 13 / 20 | 400 | **ข้อความมาตรฐานของ Admin**, เซลล์ตาราง, ตัวเลือกใน dropdown, ปุ่ม sm |
| `text-control` | 14 / 21 | 400–500 | input md, ปุ่ม md, เมนู sidebar, Detail Row |
| `text-title` | 15 / 23 | 600 | หัวการ์ด |
| `text-lead` | 16 / 24 | 400–500 | ปุ่ม lg, label บน Kiosk |
| `text-h3` | 18 / 27 | 400–700 | ชื่อแบรนด์ใน sidebar, input lg (หน้าลูกค้า) |
| `text-h2` | 22 / 30 | 700 | ชื่อแบรนด์บน Kiosk, หัวข้อหน้าลูกค้า |
| `text-h1` | 24 / 32 | 700 | ชื่อหน้า (Page title) |
| `text-kpi` | 28 / 34 | 700 | ตัวเลข KPI |
| `text-kiosk-md` | 30 / 42 | 700 | เวลาจอดทั้งหมดบน Kiosk |
| `text-kiosk-lg` | 40 / 48 | 700 | ทะเบียนขนาดใหญ่บน Kiosk |
| `text-kiosk-xl` | 88 / 96 | 700 | ยอดค่าจอดบน Kiosk |

### 3.3 กติกา

- ข้อความไทยต้องมี line-height อย่างน้อย 1.4 ไม่อย่างนั้นสระบนและวรรณยุกต์จะถูกตัด ยกเว้นข้อความที่เป็นตัวเลขล้วน (KPI, ยอดเงิน)
- น้ำหนักใช้แค่ `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700)
- ห้ามใช้ตัวพิมพ์ใหญ่ทั้งคำ (`uppercase`) กับข้อความไทย
- ตัวเลขในตาราง, KPI, เวลา และยอดเงินใส่ `tabular-nums`

---

## 4. ระยะห่าง (Spacing)

ใช้สเกลของ Tailwind (1 หน่วย = 4px) แต่ **จำกัดเฉพาะค่าที่มีใน Figma**:

| Tailwind | px | ใช้บ่อยกับ |
|---|---|---|
| `0.5` | 2 | ช่องว่างใน segmented, gap ระหว่างชื่อกับรายละเอียด |
| `0.75` | 3 | padding ของ segmented container, padding แนวตั้งของ badge |
| `1` | 4 | gap หัวหน้า ↔ คำอธิบาย |
| `1.5` | 6 | gap ใน badge / chip, gap ระหว่าง label กับ input |
| `2` | 8 | gap ในปุ่ม, gap แถวเครื่องมือ |
| `2.5` | 10 | padding ซ้ายของ badge, gap ใน dropdown option |
| `3` | 12 | padding ปุ่ม sm / input, gap ใน header |
| `3.5` | 14 | padding segmented item, padding date picker |
| `4` | 16 | **gap ระหว่างการ์ด / section**, padding ปุ่ม md |
| `4.5` | 18 | padding แนวตั้งของ KPI card, การ์ดหน้าลูกค้า |
| `5` | 20 | **padding แนวนอนของการ์ด**, padding เนื้อหาหน้าลูกค้า |
| `6` | 24 | padding ของ Main, modal, การ์ด Kiosk |
| `7` | 28 | padding แนวตั้งของ body Kiosk |
| `8` | 32 | gap สองคอลัมน์ของ Kiosk, padding ล่างของ Main |
| `10` · `12` · `14` · `16` | 40 · 48 · 56 · 64 | layout ใหญ่ (Kiosk top bar, Login brand panel) |
| `9.5` · `11.5` | 38 · 46 | แถวตารางสิทธิ์รายหน้า (ความสูงแถว, ระยะเยื้องแถวย่อย) |
| `9` · `11` · `22` | 36 · 44 · 88 | วงโลโก้ธนาคาร (Bank Option) · กล่องไอคอนของ Payment Method Option · วงไอคอนหน้า 17.11 |
| `24` · `32` | 96 · 128 | ขนาด Entry Snapshot (`h-24 w-32`) |

**ห้ามใช้ค่าอื่นหรือค่า arbitrary** (`p-[7px]`) ถ้าจำเป็นจริงให้คุยกับคนออกแบบก่อน

---

## 5. มุมโค้ง (Radius)

| Tailwind | px | ใช้กับ |
|---|---|---|
| `rounded-xs` | 2 | ชิ้นส่วนเล็กด้านใน (แถบ progress, connector) |
| `rounded-sm` | 4 | ช่องจอดในผัง, checkbox, Plate, Heat cell |
| `rounded-md` | 6 | ปุ่ม sm, input md, select, Type Chip, Action Badge, icon button, วันในปฏิทิน, option ใน dropdown |
| `rounded-lg` | 8 | ปุ่ม md, Nav Item, กรอบ segmented / toggle |
| `rounded-pop` | 10 | dropdown, popover, date picker, toast |
| `rounded-xl` | 12 | **การ์ด Admin**, KPI, ปุ่ม lg, input lg, PromptPay QR |
| `rounded-modal` | 14 | modal |
| `rounded-2xl` | 16 | การ์ดหน้าลูกค้า, การ์ด Kiosk, กรอบวิดีโอ CCTV |
| `rounded-full` | 999 | Badge แบบเม็ดยา, switch, avatar, Vehicle Chip |

---

## 6. เงาและลำดับชั้น (Shadow / z-index)

การ์ดใน Admin **ไม่มีเงา** ใช้เส้นขอบ `border-line` แทน เงามีไว้เฉพาะของที่ลอยอยู่เหนือหน้า

| Tailwind | Light | ใช้กับ |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgb(0 0 0 / .08)` | segmented item ที่เลือก |
| `shadow-sm` | `0 1px 3px rgb(18 26 41 / .08)` | การ์ดที่ถูกเลือก / hover (ถ้ามี) |
| `shadow-md` | `0 2px 8px rgb(18 26 41 / .08)` | แถบเครื่องมือลอยขนาดเล็ก |
| `shadow-tooltip` | `0 4px 12px rgb(18 26 41 / .18)` | tooltip ของกราฟ |
| `shadow-pop` | `0 8px 24px rgb(18 26 41 / .16)` | dropdown, popover, date picker, toast |
| `shadow-modal` | `0 20px 48px rgb(18 26 41 / .24)` | modal |
| `shadow-drawer` | `-8px 0 32px rgb(18 26 41 / .18)` | drawer ด้านขวา |
| `shadow-primary` | `0 4px 10px rgb(56 89 250 / .28)` | ปุ่มหลักขนาดใหญ่ (หน้าลูกค้า / Kiosk) |

ในธีมมืดใช้สีดำและเพิ่มความเข้ม (ค่าดูในข้อ 14)

**z-index (กำหนดในโค้ด Figma ไม่มี):**

| ชั้น | ค่า |
|---|---|
| sticky header ของตาราง | `z-10` |
| sidebar (มือถือ) | `z-30` |
| dropdown / popover / date picker | `z-40` |
| overlay + modal / drawer | `z-50` |
| toast | `z-[60]` (ยกเว้นให้ใช้ค่า arbitrary ได้เฉพาะตรงนี้) |

---

## 7. ไอคอน

- ใช้ **lucide-react** เท่านั้น (Figma วาดจาก lucide ขนาดฐาน 24px เส้น 2)
- ใช้ค่า default ของ lucide (เส้นหนาขึ้นลงตามขนาด) **ห้ามตั้ง `absoluteStrokeWidth`** เพราะ Figma ใช้เส้นที่ย่อตามขนาด เช่น 16px ได้เส้น 1.33
- สีไอคอนใช้ `currentColor` ตามข้อความรอบข้าง ยกเว้นไอคอนประเภทช่องจอด ใช้ `text-type-*`

| ขนาด | ใช้กับ |
|---|---|
| 12 | เครื่องหมายถูกใน checkbox, ปุ่ม × ใน Vehicle Chip |
| 14 | Type Chip, Event Badge, ไอคอนประกอบ footer |
| 16 | ปุ่ม sm / md, input md, select, KPI label, option ใน dropdown |
| 18 | ไอคอนในช่องจอดบนผัง |
| 20 | Nav Item, ปุ่ม lg, input lg, Mobile Header |
| 22 | โลโก้ใน sidebar, ไอคอน toast, ไอคอนในการ์ด Kiosk |
| 28 | Kiosk Top Bar |

ไอคอนที่มีใน Design System: car, zap, accessibility, crown, layout-dashboard, map, wallet, activity, flame, shield-check, users, chevron-*, plus, minus, search, filter, eye / eye-off, pencil, save, undo, redo, copy, clipboard, trash, rotate-cw, grid, magnet, pointer, hand, align, rows, square-parking, log-in, log-out, door-open, arrow-*, stairs, x, upload, image, building, map-pin, layers, wrench, cpu, info, alert-triangle, maximize, bell, clock, lock, check, ban, list, history, mail, user / user-plus, calendar, download, settings, chevrons-up-down, sun, moon, monitor, bike, truck, timer, receipt, coins, trending-up, triangle-alert, video, loader, scan-line, qr-code, smartphone, landmark, zoom-in

ไอคอนหน้าลูกค้าที่เพิ่มรอบนี้: `QrCode` (ตัวเลือก QR PromptPay) · `Smartphone` (Mobile Banking, หน้ารอยืนยัน) · `Landmark` (แทนโลโก้ธนาคารไปก่อน) · `ZoomIn` (เตรียมไว้สำหรับขยายรูปตอนเข้า ยังไม่ได้ใช้)

---

## 8. Components

component ที่ใช้หลายหน้าอยู่ใน `src/components/tailgrids/core/` (เมนูด้านซ้ายอยู่ที่ `src/components/sidebarmenu.tsx`) และมีชื่อ / props ตรงกับ Figma

> **ข้อนี้คือสเปก ไม่ใช่รายการของที่ทำแล้ว** · ตอนนี้ใน `src/components/tailgrids/core/` มี: avatar · button · checkbox · date-range-picker · dialog (`ConfirmDialog`) · dropdown · form-alert · input · multi-select-filter · pagination · password-input (`PasswordInput`) · password-rule-list · role-badge · segmented-control · sheet (Drawer) · sidebar (มี hook `useIsMobile` อยู่ในไฟล์เดียวกัน) · toast · tooltip · และ `src/components/error-card.tsx`
> ที่มีสเปกแต่ยังไม่ได้ทำ: Select · Radio · Switch · Tab · Icon Button · Badge / Chip (ที่ใช้อยู่ตอนนี้เป็นของเฉพาะหน้าใน `_components/` ของหน้านั้น) · Card · KPI Card · Table · Plate · Detail Row · Step · PromptPay QR · Mobile Header · Entry Snapshot · Plate Match Card · Payment Method Option · Bank Option · Kiosk Top Bar · Heat Cell
> ถ้าหน้าที่กำลังทำต้องใช้ตัวที่ยังไม่มี ให้สร้างใน `src/components/tailgrids/core/` ตามสเปกในข้อนี้
ไอคอน import จาก `lucide-react` โดยตรง ไม่ต้องสร้าง component ไอคอนเอง
class ในตารางเป็นสูตรตั้งต้น ถ้าต้องปรับให้แก้ที่ component ตัวเดียว ห้ามไปแก้ที่หน้า

### 8.1 พื้นฐาน (หน้า Design System)

#### Button — `Variant: Primary | Secondary | Ghost | Danger | Danger Solid` · `Size: sm | md | lg` · `icon?`

| Size | ความสูง | padding X | radius | ตัวอักษร | ไอคอน |
|---|---|---|---|---|---|
| sm | 32 (`h-8`) | 12 | `rounded-md` | `text-body font-medium` | 16 |
| md | 40 (`h-10`) | 16 | `rounded-lg` | `text-control font-medium` | 16 |
| lg | 52 (`h-13`) | 20 | `rounded-xl` | `text-lead font-medium` | 20 |

```
base:      inline-flex items-center justify-center gap-2 whitespace-nowrap
           disabled:opacity-50 disabled:pointer-events-none
Primary:   bg-primary text-on-primary hover:bg-primary-hover
Secondary: bg-surface text-fg border border-line hover:bg-subtle
Ghost:     text-fg-2 hover:bg-subtle hover:text-fg
Danger:    bg-surface text-danger border border-danger hover:bg-danger-soft
Danger Solid: bg-danger text-on-primary hover:bg-danger/90
```
> Danger (ขอบแดง) ใช้กับปุ่มลบทั่วไป · Danger Solid (`variant="danger-solid"` พื้นแดงทึบ) ใช้กับปุ่มยืนยันลบถาวรใน Confirm dialog เช่น "ลบถาวร" (เฟรม 07.7) · ยังไม่มี token สี hover ของ danger จึงใช้ `bg-danger/90`
> Figma มีแค่สถานะ default ส่วน hover / disabled ในสูตรด้านบนกำหนดเพิ่มในโค้ด (ดูข้อ 16)
> ใช้ lg เฉพาะหน้าลูกค้าและ Kiosk ส่วน Admin ใช้ md เป็นหลัก

#### Icon Button (Tool) — `State: Default | Active | Disabled`
`size-8 rounded-md grid place-items-center text-fg-2 hover:bg-subtle` · Active: `bg-primary-soft text-primary` · Disabled: `text-fg-3`

#### Input — `State: Default | Focus | Error` · `Size: md | lg` · `icon?`

| Size | ความสูง | padding | radius | ตัวอักษร | ไอคอน |
|---|---|---|---|---|---|
| md | 36 (`h-9`) | X 12, gap 8 | `rounded-md` | `text-control` | 16 |
| lg | 56 (`h-14`) | X 16, gap 10 | `rounded-xl` | `text-h3 font-normal` | 20 |

```
base:  flex items-center bg-surface border border-line text-fg placeholder:text-fg-3
Focus: focus-within:border-focus focus-within:ring-1 focus-within:ring-focus
Error: border-danger ring-1 ring-danger  + ข้อความ error ด้านล่าง: text-label text-danger
```
> Figma ใช้ขอบหนา 1.5px ตอน focus / error ในโค้ดใช้ `border` + `ring-1` แทน ได้ความหนาใกล้เคียงกัน

**ช่องรหัสผ่าน** ใช้ `PasswordInput` (`src/components/tailgrids/core/password-input.tsx`) คือ Input ที่มีปุ่มตาท้ายช่อง (ใน Figma คือ Input ที่เปิด `showTrailing` ไอคอน `icon/eye`)
- ไอคอน `eye` ตอนซ่อน / `eye-off` ตอนแสดง ขนาด 16 `text-fg-3 hover:text-fg-2` · aria-label "แสดงรหัสผ่าน" / "ซ่อนรหัสผ่าน" · มีกรอบ focus `focus-visible:ring-2 ring-focus`
- แต่ละช่องสลับแยกกัน เริ่มต้นเป็นซ่อน · ช่อง disabled ปุ่มก็ disabled
- ใช้ที่: Login (09.7), ตั้งรหัสผ่านใหม่ (09.9, 09.17), บัญชีของฉัน (09.2–09.4, 09.19) · **ยกเว้น** modal เพิ่มผู้ใช้ (07.6) ที่ปุ่มตาเป็นปุ่มแยกข้างช่อง ถัดจาก "สร้างอัตโนมัติ"
> ใช้ lg เฉพาะหน้าลูกค้า (ช่องกรอกทะเบียน)

#### Select
`h-9 rounded-md border border-line bg-surface pl-3 pr-2.5 gap-2 text-control` + ไอคอนหน้า 16 (ถ้ามี) + `chevron-down` 16 สี `text-fg-3`

#### Checkbox — `State: On | Off`
`size-4 rounded-sm` · Off: `bg-surface border-[1.5px] border-line-strong` · On: `bg-primary text-on-primary` + ไอคอน check 12

#### Radio — `State: On | Off`
`size-5 rounded-full bg-surface` · Off: `border-2 border-line-strong` · On: `border-[6px] border-primary`
ใช้ในการ์ดที่เลือกได้ทีละอัน (Plate Match Card, Payment Method Option) ทั้งการ์ดเป็นพื้นที่กด ใช้ `<input type="radio">` ซ่อนไว้ + `<label>` ครอบการ์ด เพื่อให้ใช้คีย์บอร์ดและ screen reader ได้

#### Switch — `State: On | Off`
`w-9 h-5 rounded-full p-0.5` · On: `bg-primary` · Off: `bg-slot-unknown` (ผูกตาม Figma) · ปุ่มกลมสีขาว 16

#### Tab — `State: Active | Default`
container `flex gap-4 border-b border-line` · tab `px-1 py-2.5 text-body font-medium text-fg-2` · Active: `text-primary font-semibold border-b-2 border-primary`

#### Segmented Item / Mode Toggle / Access Level Picker / Role toggle
```
container: inline-flex rounded-lg p-0.75 gap-0.5 bg-subtle (บน page) | bg-page (บน surface)
item:      h-8 rounded-md px-3.5 gap-1.5 text-body font-medium text-fg-2
active:    bg-surface text-fg font-semibold shadow-xs
```
Access Level Picker มี 2 ตัวเลือก (ไม่มีสิทธิ์ / แก้ไขได้) ใช้ `text-label` ส่วนตัวเลือก Locked ใช้ `text-fg-3`

**ตารางสิทธิ์รายหน้า (Access matrix ในลิ้นชักแก้ไขผู้ใช้ 07.4 / 07.5):**
```
กรอบ:      rounded-xl border border-line overflow-hidden
แถวหน้า:   h-11.5 (46) pl-3 pr-1.5 flex items-center justify-between border-b border-line
           ไอคอนเมนู 16 + ชื่อหน้า text-body · ขวา: Access Level Picker
แถวกลุ่ม:  System Settings → h-9.5 (38) ไม่มีเส้นคั่นล่าง · ขวาแสดงคำใบ้ "ตั้งสิทธิ์แยกตามแท็บ" text-label text-fg-3 แทน picker
แถวย่อย:   3 แท็บของ System Settings (ข้อมูลสาขา / ประเภทช่องจอด / ค่าจอดและการชำระเงิน)
           h-11.5 pl-9.5 (38) bg-subtle ไม่มีไอคอน · ชื่อ text-body font-medium · ขวา: Access Level Picker
```
ลำดับแถว: Dashboard → Parking Layout → Financial Overview → Activity Log → Parking Heat Map → System Settings (+3 แท็บ) → Audit Logs
หน้า User & Permissions ไม่อยู่ในตาราง เพราะเป็นของ Superadmin เท่านั้น

#### Nav Item — `State: Default | Active`
`h-10 rounded-lg px-3 gap-3 text-control font-medium text-fg-2 hover:bg-subtle` + ไอคอน 20
Active: `bg-primary-soft text-primary font-semibold`

#### Sidebar
`w-64 (256) bg-surface border-r border-line pt-5 px-4 pb-4 flex flex-col gap-6`
- แบรนด์: โลโก้ 36 `rounded-lg bg-primary` + ไอคอน square-parking 22 · ชื่อ `text-h3 font-bold` · ชื่อสาขา `text-caption font-medium text-fg-2`
- หัวกลุ่ม ("เมนูหลัก", "จัดการระบบ"): `text-caption font-semibold text-fg-3`
- ลำดับเมนู: Dashboard → Parking Layout → Financial Overview → **Activity Log** → Parking Heat Map · *จัดการระบบ:* User & Permissions → System Settings → Audit Logs
- แสดงเฉพาะเมนูที่ผู้ใช้มีสิทธิ์ (แก้ไขได้) · System Settings แสดงเมื่อมีสิทธิ์อย่างน้อย 1 แท็บ · ถ้าหัวกลุ่มไม่เหลือเมนูให้ซ่อนหัวกลุ่มด้วย
- ไฟล์: `src/components/sidebarmenu.tsx` · รายการเมนูมาจาก `src/components/admin-nav.ts`
- ล่างสุด: Profile menu (avatar + ชื่อ + Role)

### 8.2 Badge และ Chip

| Component | Props | สูตร |
|---|---|---|
| **Badge** | `Tone: Neutral \| Info \| Success \| Warning \| Danger \| On media` · `dot?` | `inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-3 text-body font-semibold` + จุด 7px |
| **Status Badge** (ช่องจอด) | `Status: Available \| Occupied \| Disabled \| Unknown` | `h-6 rounded-full pl-2 pr-2.5 gap-1.5 text-label font-medium` + จุด 8px · Unknown มีขอบ `border-slot-unknown` |
| **Type Chip** | `Type: General \| EV \| Accessible \| VIP` | `rounded-md border border-line bg-subtle px-2 py-0.75 gap-1.5 text-label font-medium text-fg` + ไอคอน 14 สี `text-type-*` |
| **Role Badge** | `Role: Superadmin \| Admin` | `rounded-full pl-2 pr-2.5 py-0.75 text-label font-semibold` · Superadmin `bg-primary-soft text-primary` · Admin `bg-page text-fg-2` |
| **Action Badge** (Audit) | `Action: Create \| Update \| Delete \| Login \| Logout \| Failed \| Export` | `rounded-md pl-2 pr-2.5 py-0.75 text-label font-semibold` · Create "สร้าง" = success · Update "แก้ไข" = primary · Delete "ลบ" = slot-occupied · Login "เข้าสู่ระบบ" และ Logout "ออกจากระบบ" = `bg-page text-fg-2` · Failed "ล้มเหลว" = warning · Export "ส่งออก" = `bg-subtle border border-line text-fg` |
| **Session Status** | `Status: Parked \| Exited` | `rounded-full px-2.5 py-0.75 text-caption font-semibold` · Parked `bg-primary-soft text-primary` · Exited `bg-subtle text-fg-2` |
| **Event Badge** | `Event: In \| Out` | แบบเดียวกับ Session Status + ไอคอน 14 · In=primary · Out=warning |
| **Payment Badge** | — | แบบเดียวกับ Session Status · `bg-success-soft text-success` |
| **Page Access Chip** | `Level: Edit` | `size-6.5 rounded-md grid place-items-center` · `bg-primary-soft border border-primary text-primary` |
| **Vehicle Chip** | `Remove: Default \| Locked` | `rounded-full border border-line bg-surface pl-0.75 pr-1 py-0.75 gap-0.5 text-body` + ปุ่ม × 12 |
| **Vehicle Tag** | `Sedan \| SUV \| Pickup \| Hatchback \| Van \| EVcar` | ไอคอนรถ + `text-body text-fg` ไม่มีกรอบ |

Tone ของ Badge:

| Tone | พื้น | ตัวอักษร |
|---|---|---|
| Neutral | `bg-subtle` | `text-fg-2` |
| Info | `bg-primary-soft` | `text-primary` |
| Success | `bg-success-soft` | `text-success` |
| Warning | `bg-warning-soft` | `text-warning` |
| Danger | `bg-danger-soft` | `text-danger` |
| On media (บนวิดีโอ) | `bg-black/55` | `text-white` |

### 8.3 ข้อมูลและตาราง

#### Card (Admin)
```
card:   rounded-xl border border-line bg-surface overflow-hidden
header: flex items-center gap-3 px-5 py-4 border-b border-line
title:  text-title font-semibold text-fg   (+ คำอธิบาย text-label text-fg-2)
body:   px-5 py-4
```

#### KPI Card
`rounded-xl border border-line bg-surface px-5 py-4.5 flex flex-col gap-2`
- label: ไอคอน 16 + `text-body text-fg-2`
- value: `text-kpi font-bold tabular-nums` + หน่วย `text-body text-fg-2`
- sub: `text-label` · ขึ้นเป็น `text-success` · ลงเป็น `text-danger` · ปกติ `text-fg-3`

#### Table
```
header row: h-11 px-4 gap-3 border-b border-line  · ตัวอักษร text-label font-semibold text-fg-2
body row:   h-14 px-4 gap-3 border-b border-line  · ตัวอักษร text-body text-fg
            hover:bg-subtle (ถ้าแถวคลิกได้)
คอลัมน์ที่เรียงอยู่: text-primary + ไอคอน arrow-down 14
ตัวเลข / เงิน: ชิดขวา, tabular-nums, font-semibold
```
Pagination (ท้ายการ์ด): **10 แถวต่อหน้า** · ข้อความ "แสดง 1–10 จาก 190" `text-label text-fg-2` + ปุ่มหน้า `size-8 rounded-md border border-line` โดยหน้าปัจจุบันเป็น `bg-primary text-on-primary` · ปุ่มก่อนหน้าในหน้าแรกและปุ่มถัดไปในหน้าสุดท้ายเป็น disabled

**ค่าที่ยังไม่เกิด:** ไม่ใช้ "-" หรือเว้นว่าง ให้เขียนเป็นคำ สี `text-fg-3`
- เวลาออกของรถที่ยังจอดอยู่ → "ยังไม่ออก" (`text-body text-fg-3`)
- ค่าจอดที่ยังไม่ได้จ่าย → "ยังไม่ชำระ" (`text-label text-fg-3`)

**ตารางความเคลื่อนไหวล่าสุด (Dashboard):** ข้อมูลของวันนี้ 1 แถว = 1 รายการจอด เรียงตามการเคลื่อนไหวล่าสุด
คอลัมน์: เวลาเข้า (90) · เวลาออก (90) · เหตุการณ์ (120) · ทะเบียน (140) · ประเภทรถ (170) · ช่องจอด (110) · ค่าจอด (ที่เหลือ ชิดขวา)
คำอธิบายใต้หัวการ์ด: "วันนี้ · 17 ต.ค. 2026 · 190 รายการ"

#### Plate (ป้ายทะเบียน)

| ขนาด | ใช้ที่ | กรอบ | ทะเบียน | จังหวัด |
|---|---|---|---|---|
| sm (96×40) | ตาราง | `rounded-sm border-[1.5px] border-fg bg-surface px-2.5 pt-0.5 pb-0.75` | `text-body font-semibold` | `text-nano` |
| lg (288×119) | Kiosk, หน้าลูกค้า | `rounded-xl border-[3px] border-fg` | `text-kiosk-lg font-bold` | `text-h2` |

ป้ายทะเบียนใช้พื้น `surface` + ขอบ `fg` เสมอ เพื่อให้ดูเหมือนป้ายจริงในทั้งสองธีม

#### Detail Row
`flex justify-between gap-3` · label `text-control text-fg-2` · value `text-control font-semibold text-fg`

### 8.4 ผังที่จอด (Map)

| Component | สเปก |
|---|---|
| **Parking Slot** `Status × Type × State(Default/Hover)` | 40×80 (Accessible 56×80) · `rounded-sm` · ขอบ 1.5px `slot-*` · พื้น `slot-*-soft` · เลขช่อง `text-micro font-semibold` (Disabled / Unknown ใช้ `text-fg-2`) · ไอคอนประเภท 18 |
| **Map / Gate** `Kind: Entry/Exit` | 240×60 |
| **Map / Door, Lane arrow, Pillar, Elevator, Stairs** | 28 / 24 / 14 / 56 / 56 px |
| สีพื้นผัง | `map-floor`, ผนัง `map-wall`, เสา `map-pillar`, ช่องทางวิ่ง `map-lane`, เส้นจราจร `map-marking`, กริด `map-grid`, พื้นหลังรอบผัง `canvas` |

Fabric.js อ่าน CSS variable ไม่ได้เอง ต้องดึงค่าด้วย `getComputedStyle(document.documentElement).getPropertyValue('--pp-map-wall')` แล้ว render ใหม่ทุกครั้งที่เปลี่ยนธีม

### 8.5 Component ส่วนเพิ่ม (Kiosk / Customer / Dashboard)

| Component | สเปก |
|---|---|
| **Step** `State: Done / Current / Upcoming` | วงกลม 22 + เลข `text-label font-bold` · Done / Current `bg-primary text-on-primary` · Upcoming `text-fg-3` · เส้นเชื่อมสูง 2 สี `primary` (ผ่านแล้ว) หรือ `line` |
| **PromptPay QR** | 210×247 · `rounded-xl border border-line p-3 gap-2.5` · **พื้นขาวเสมอทั้งสองธีม** (เพื่อให้สแกนได้) · แถบหัว "THAI QR PAYMENT" ใช้สีแบรนด์ PromptPay ไม่ผูกกับ theme |
| **Mobile Header** | 390×97 · `bg-surface` · ปุ่มย้อนกลับหรือโลโก้ + ชื่อ `text-control font-semibold` + บรรทัดรอง `text-caption text-fg-3` |
| **Entry Snapshot** (รูปตอนเข้า) | 128×96 (4:3) · `rounded-pop overflow-hidden` · รูป `object-cover` · แถบไล่เฉดดำด้านล่าง (`bg-linear-to-b from-transparent to-black/70` สูง 28) · ซ้าย: ชื่อกล้อง `text-nano text-white/80` · ขวา: เวลาเข้า `text-caption font-semibold text-white tabular-nums` |
| **Plate Match Card** `State: Default / Selected` | `flex items-center gap-3 rounded-2xl border border-line bg-surface p-3` · Selected: `border-2 border-primary bg-primary-soft` · ซ้าย Entry Snapshot · กลาง (`flex-1 gap-0.5`): ทะเบียน `text-h3 font-bold` · จังหวัด `text-body text-fg-2` · "เข้า 17 ต.ค. · 18:42 · ประตู 1" `text-label text-fg-3` · ขวา Radio |
| **Payment Method Option** `State: Default / Selected` | `flex items-center gap-3 rounded-2xl border border-line bg-surface p-4` · Selected: `border-2 border-primary bg-primary-soft` · กล่องไอคอน `size-11 rounded-xl bg-subtle` + ไอคอน 24 `text-fg-2` (Selected: กล่อง `bg-surface` ไอคอน `text-primary`) · ชื่อ `text-title font-semibold` · คำอธิบาย `text-body text-fg-2` · ขวา Radio |
| **Bank Option** `State: Default / Selected` | กว้าง 106 · `flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-2 pt-3 pb-2.5` · Selected: `border-2 border-primary bg-primary-soft` · วงโลโก้ `size-9 rounded-full overflow-hidden` ใส่ไอคอนจริงของธนาคารเต็มวง (`object-cover`) สำหรับ ไทยพาณิชย์ · กรุงเทพ · กรุงไทย · ทีทีบี (ที่มาของไฟล์ดู README §6.12) · กสิกรไทยและกรุงศรียังไม่มีไฟล์ ใช้วงสีประจำธนาคาร + อักษรย่อ Inter Bold 11 แทน: กสิกรไทย `#138F2D` ตัวอักษรขาว "K" · กรุงศรี `#FEC43B` ตัวอักษรสีเข้ม "BAY" (สีเป็นค่าประมาณ ในโค้ดต้องเพิ่มเป็น token เช่น `bank-kbank` ก่อนใช้) · ชื่อธนาคาร `text-label font-medium text-center` · วางเป็น `grid grid-cols-3 gap-x-4 gap-y-2.5` |
| **Kiosk Top Bar** | สูง 80 · `px-10 py-4.5 bg-surface border-b border-line` · แบรนด์ `text-h2 font-bold` · ไอคอน 28 · ขวาสุดเป็น Badge สถานะระบบ + นาฬิกา |
| **Calendar Day** `Default/Today/Selected/In range/Disabled/Empty` | 38×34 `rounded-md text-body` · Today: `border border-primary text-primary font-semibold` · Selected: `bg-primary text-on-primary font-semibold` · In range: `bg-primary-soft text-primary font-medium` · Disabled: `text-fg-3` |
| **Date Range Picker** | 320 กว้าง · `rounded-pop border border-line bg-surface p-3.5 gap-3 shadow-pop` · ใช้ตัวเดียวกันทั้ง Dashboard, Audit Logs, Activity Log |
| **Heat Cell / Heat Slot** `Level 0–5 / None / Dim` | `rounded-sm` · พื้น `heat-1…6` · ตัวอักษร `text-caption font-medium` · Level 0–2 ใช้ `heat-ink-low` · Level 3–5 ใช้ `heat-ink-high` · None ใช้ `bg-page text-fg-3` |

---

## 9. Layout แต่ละฝั่ง

### 9.1 Admin Web (Desktop)

- ออกแบบที่ 1440×900 รองรับตั้งแต่ 1280px ขึ้นไปเต็มรูปแบบ
- โครงสร้าง: `flex` → Sidebar 256 (sticky, สูงเต็มจอ) + Main
- Main: `bg-page pt-6 px-6 pb-8 flex flex-col gap-4`
- **Page header:** ชื่อหน้า `text-h1 font-bold` + คำอธิบาย `text-body text-fg-2` (gap 4) · ปุ่ม / ตัวกรองชิดขวา gap 12
- **Grid:** gap 16 ทุกแนว · Dashboard ใช้ KPI 4 คอลัมน์ และแถวการ์ดแบบ 2 : 1 (740 + 380)
- หน้า Parking Layout: พื้นที่ผังใช้ `bg-canvas` + แถบเครื่องมือ Icon Button
- หน้าจอเล็กกว่า 1024px: Sidebar กลายเป็น drawer (Figma ไม่มี ใช้พฤติกรรมที่มีในโค้ดตอนนี้)

### 9.2 Login / ลืมรหัสผ่าน

- แบ่ง 2 ฝั่ง: Brand panel กว้าง 620 `bg-primary text-on-primary pt-14 px-16 pb-12 gap-7` + ฝั่งฟอร์ม
- ฟอร์มกว้าง 400 อยู่กลางฝั่งขวา `gap-5` · ใช้ Input md และปุ่ม Primary md เต็มความกว้าง
- กล่องตกแต่งใน brand panel: `rounded-modal bg-primary-hover p-5`
- เงื่อนไขรหัสผ่าน (09.9, 09.2, 07.6): **อย่างน้อย 8 ตัวอักษร** (เปลี่ยนจาก 10 เมื่อ v2.2)

### 9.3 Customer Web (มือถือ)

- ออกแบบที่ 390×844 รองรับ 360–430px · บนจอใหญ่ให้จัดกึ่งกลาง `max-w-[480px] mx-auto`
- **ธีมสว่างเท่านั้น** (ดูข้อ 13)
- โครงสร้าง: Mobile Header → Stepper (`pt-3.5 px-5`) → Content `pt-5 px-5 pb-6 flex flex-col gap-4`
- **การ์ด:** `rounded-2xl border border-line bg-surface p-4.5 gap-3`
- **การ์ดยอดเงิน:** `rounded-2xl bg-primary-soft border border-primary p-4.5`
- **ปุ่ม:** Button lg เต็มความกว้าง (`w-full`) วางล่างสุดของเนื้อหา · ปุ่มรองใช้ Ghost lg
- **Flow 3 ขั้น:** ค้นหา → ตรวจสอบ → ชำระ (Step component)
  - 17.8 เลือกรถ ยังอยู่ขั้น "ค้นหา" · 17.9–17.11 เลือกวิธีชำระ / รอยืนยัน อยู่ขั้น "ชำระ"
- **หน้าเลือกรถ (17.8):**
  - ช่องค้นหา (Input lg) อยู่บนสุด แก้คำค้นได้
  - ถัดมาเป็นหัวรายการ "ผลการค้นหา · 3 คัน" `text-body font-medium text-fg-2`
  - รายการ Plate Match Card `flex flex-col gap-2.5`
  - ปิดท้ายด้วยปุ่ม Primary "ยืนยัน · {ทะเบียน} {จังหวัด}" + Ghost "ไม่พบรถของฉัน · ค้นหาใหม่"
  - หน้านี้ยาวกว่าจอ (เฟรมสูง 962) ให้เลื่อนทั้งหน้า ปุ่มไม่ต้องติดขอบล่าง
- **หน้าเลือกวิธีชำระ (17.9 / 17.10):**
  - หัวข้อ "เลือกวิธีชำระเงิน" + สรุปยอด `text-control text-fg-2`
  - ป้าย "วิธีชำระเงิน" `text-body font-medium text-fg-2` ตามด้วย Payment Method Option 2 ตัว `gap-2.5`
  - (Mobile Banking) ป้าย "เลือกแอปธนาคาร" + grid Bank Option
  - หมายเหตุ `text-label text-fg-3`
  - ปุ่ม Primary ชิดล่างของเนื้อหา (มี spacer `flex-1` คั่น) + Ghost "ยกเลิก"
- **หน้ารอยืนยันในแอปธนาคาร (17.11):** โครงเดียวกับหน้า QR (17.5) แต่แทน QR ด้วยวงไอคอน `size-22 rounded-full bg-primary-soft` + `Smartphone` 40 `text-primary` · แถบสถานะเตือนพร้อมนับถอยหลังเหมือนเดิม · ปุ่ม Secondary "เปิดแอป{ธนาคาร}อีกครั้ง" + Ghost "เปลี่ยนวิธีชำระ"
- **ชำระผ่านแอปไม่สำเร็จ / ยกเลิก (17.12):** โครงเดียวกับ 17.11 · หัวข้อ "ชำระเงินไม่สำเร็จ" · วงไอคอน `bg-danger-soft` + `TriangleAlert` สี danger (แบบเดียวกับ 17.6) · ไม่มีแถบนับถอยหลัง · ปุ่มเหมือน 17.11
- **หมดเวลารอยืนยัน (17.13):** โครงเดียวกับ 17.11 · หัวข้อ "หมดเวลารอยืนยัน" · วงไอคอน `bg-warning-soft` + `Clock` สี warning · แถบสถานะเหลือแค่ไอคอนและ "00:00" · ปุ่ม Secondary "เริ่มชำระใหม่" (`RotateCw`) + Ghost "เปลี่ยนวิธีชำระ" · ไม่มีหมายเหตุใต้ปุ่ม

### 9.4 Kiosk ทางเข้า / ทางออก

- ขนาดตายตัว **1920×1080** แนวนอน: `h-dvh w-dvw overflow-hidden`
- **ธีมสว่างเท่านั้น** และไม่มี hover state (เป็นจอแสดงผล ไม่ได้ใช้เมาส์)
- โครงสร้าง: Kiosk Top Bar (80) → Body `py-7 px-8 flex gap-8`
  - **คอลัมน์ซ้าย 1080:** หัวข้อกล้อง → กรอบวิดีโอ CCTV 16:9 (`rounded-2xl`, 1080×608) → การ์ดผลการอ่านป้ายด้วย AI (`rounded-2xl px-6 py-4.5 gap-8`) → (ทางเข้า) การ์ดช่องว่างตอนนี้
  - **คอลัมน์ขวา 744:** การ์ดรถและเวลา (`rounded-2xl p-6 gap-4`) → การ์ดค่าจอด / สถานะ (`rounded-2xl py-7 px-6 gap-7`)
- **ขนาดตัวอักษรขั้นต่ำ 14px** (มองจากในรถ)
- **การ์ดสถานะ:** ใช้พื้นตามผล ได้แก่ สำเร็จ `bg-success-soft border-success` · เตือน `bg-warning-soft border-warning` · เต็ม / ผิดพลาด `bg-danger-soft border-danger`
- **จังหวะของ prototype:** อ่านป้าย 1.5 วินาที → แสดงผล → กลับหน้ารอรถหลัง 5 วินาที · อ่านไม่สำเร็จจะลองอ่านใหม่อัตโนมัติหลัง 3 วินาที

### 9.5 สิทธิ์และการแสดงผลตามสิทธิ์ (Admin Web)

| บทบาท | เห็นอะไร |
|---|---|
| **Superadmin** | ทุกหน้า รวม User & Permissions (หน้านี้เป็นของ Superadmin เท่านั้น) |
| **Admin** | เฉพาะหน้าที่ Superadmin ตั้งให้ แต่ละหน้าเป็น ไม่มีสิทธิ์ / แก้ไขได้ |

- **ไม่มีสิทธิ์:** ซ่อนเมนูใน Sidebar · ถ้าเข้า URL ตรงให้ไปหน้า 403 (เฟรม 07.9)
- **แก้ไขได้:** เปิดหน้าได้และใช้งานได้ครบ (ไม่มีโหมดดูอย่างเดียว และไม่มีป้าย "สิทธิ์ดูอย่างเดียว")
- **System Settings** แยกสิทธิ์ 3 แท็บ: ข้อมูลสาขา · ประเภทช่องจอด · ค่าจอดและการชำระเงิน · คำอธิบายใต้ชื่อหน้า: "Admin เห็นเฉพาะแท็บที่ได้รับสิทธิ์ · การเปลี่ยนแปลงทั้งหมดถูกบันทึกลง Audit Logs"
- **บัญชีของฉัน (09.3)** มีการ์ด "สิทธิ์ของฉัน" แสดงทุกหน้ารวม System Settings
- เช็กสิทธิ์ใน `page.tsx` ของแต่ละหน้า ห้ามเช็กใน `layout.tsx`

**แท็บของ Settings (เฟรม 10.26)**
- แท็บที่มีสิทธิ์ใช้งานได้ครบ ไม่มีโหมดดูอย่างเดียว (เฟรม 10.25 ลบออกจาก Figma แล้ว)
- แท็บที่ไม่มีสิทธิ์ถูกซ่อน และเปิดหน้ามาที่แท็บแรกที่มีสิทธิ์

**หน้า 404 (เฟรม 07.10)** ใช้กล่องเดียวกับ 403 (07.9): วงกลม 72 + ไอคอน `search` 32 · รหัส "404" `text-body font-semibold text-fg-3` · หัวข้อ "ไม่พบหน้าที่ต้องการ" `text-h2 font-bold` · คำอธิบาย `text-control text-fg-2` · ปุ่ม Primary "กลับไปหน้าแรก" (ไป Dashboard)

**สวิตช์คิดค่าจอดใหม่ (เฟรม 10.3)** แถวใหม่ใต้ "เวลาออกจากที่จอดหลังชำระเงิน" มีเส้นคั่น · ไอคอน `rotate-cw` · หัวข้อ "คิดค่าจอดใหม่เมื่อออกเกินเวลา" · คำอธิบาย · hint "ปิดไว้ = เกินเวลาแล้วออกได้โดยไม่คิดเงินเพิ่ม" · Switch ชิดขวาบน

---

## 10. Overlay: Modal / Drawer / Dropdown / Toast

| ชนิด | สเปก |
|---|---|
| **Overlay** | `fixed inset-0 bg-overlay` (Light 45% / Dark 60%) |
| **Modal** | กว้าง 560 (ฟอร์ม) · `rounded-modal bg-surface pt-6 px-6 pb-5 gap-4.5 shadow-modal` · หัว: ไอคอนในวงกลม 44 `bg-primary-soft` + ชื่อ + คำอธิบาย + ปุ่มปิด (Icon Button 32) · ท้าย: ปุ่มชิดขวา gap 8 (ยกเลิก = Secondary, ยืนยัน = Primary หรือ Danger) |
| **Confirm dialog** | ใช้โครงเดียวกับ Modal แต่แคบกว่า · การลบใช้ปุ่ม Danger |
| **Drawer** | ด้านขวา กว้าง 520 สูงเต็มจอ · `bg-surface shadow-drawer flex flex-col` · Header `pt-5 pr-4 pb-5 pl-6 border-b` · Body `flex-1 overflow-y-auto py-5 px-6 gap-5.5` (**ต้อง scroll ได้** ลิ้นชักแก้ไขผู้ใช้ยาวเกินจอแล้วหลังเพิ่มสิทธิ์ System Settings) · Footer `py-4 px-6 border-t` ปุ่มชิดขวา ติดล่างเสมอ |
| **Drawer รายละเอียด** (Audit Logs 08.20–08.38) | ใช้ Drawer เดียวกันแต่ไม่มี Footer · Body เป็นกลุ่ม Detail Row คั่นด้วยเส้น `border-line` · แถว "ผลลัพธ์" อยู่ท้ายสุดและมีเส้นคั่นก่อนเสมอ · ค่าเดิม → ค่าใหม่ แสดงเป็น `ค่าเดิม → ค่าใหม่` |
| **Dropdown / Popover** | `rounded-pop border border-line bg-surface pt-2.5 px-2 pb-2 gap-0.5 shadow-pop` · option `h-9 rounded-md px-2 gap-2.5 text-body` · option ที่เลือก `bg-primary-soft text-primary font-semibold` · ท้ายเมนูมีเส้นคั่น + ปุ่ม "ล้างที่เลือก" `text-label font-semibold text-primary` |
| **Toast** | มุมขวาบน · `rounded-pop border border-line bg-surface pt-3 pr-2.5 pb-3 pl-3.5 gap-3 shadow-pop` · ไอคอน 22 สีตามผล · หัว `text-control` + รายละเอียด `text-label text-fg-2` · ปุ่มปิด · ในโค้ดคือ `Toast` (`tailgrids/core/toast.tsx`) มี `placement` = `top-center` (ค่าตั้งต้น ใช้กับข้อความสำเร็จในหน้า Users / บัญชีของฉัน) หรือ `top-right` (Export Excel ตาม 10.1) · `icon` + `iconClassName` (ค่าตั้งต้น `circle-check` สี success) · `closeLabel` (ค่าตั้งต้น "ปิด") |
| **กล่องข้อมูล (Info box)** | `rounded-lg bg-primary-soft py-2.5 px-3 gap-2` + ไอคอน info 16 + `text-label` |

### 10.1 Export Excel

ใช้รูปแบบเดียวกันทุกหน้าที่ส่งออกได้ (Parking Heat Map, Activity Log, Financial Overview, Audit Logs)

- **ปุ่ม:** Button `Secondary md` + ไอคอน `download` 16 · ข้อความ "Export Excel" · วางใน page header ชิดขวา
- **ระหว่างสร้างไฟล์:** ปุ่มเป็น loading (ไอคอนหมุน, กดซ้ำไม่ได้) + Toast มุมขวาบน กว้าง 316 ห่างขอบขวาและบน 20
  - หัว "กำลังสร้างไฟล์ Excel" · รายละเอียดบอกขอบเขตข้อมูล เช่น "63 ช่องจอด · ชั้น B1 · 30 วัน"
- **เสร็จ:** Toast เปลี่ยนเป็นสำเร็จ (ไอคอน `circle-check` สี success) แล้วดาวน์โหลดไฟล์
- ไฟล์ส่งออกตามตัวกรองที่เลือกอยู่บนหน้า และทุกครั้งที่ส่งออกต้องเกิดรายการ Export ใน Audit Logs
- ตัวอย่างใน Figma: `15.9 · Parking Heat Map — Export Excel`

---

## 11. กราฟและ Heat Map

- ไลบรารี: **Recharts** ใส่สีผ่าน CSS variable ได้เลย เช่น `stroke="var(--pp-chart-1)"`
- **ลำดับสีชุดข้อมูลตายตัว ห้ามวนสีซ้ำ:**

| ลำดับ | Tailwind | Light | Dark |
|---|---|---|---|
| 1 | `chart-1` | `#2A78D6` | `#3987E5` |
| 2 | `chart-2` | `#EB6834` | `#D95926` |
| 3 | `chart-3` | `#1BAF7A` | `#199E70` |
| 4 | `chart-4` | `#EDA100` | `#C98500` |
| 5 | `chart-5` | `#E87BA4` | `#D55181` |
| 6 | `chart-6` | `#008300` | `#008300` |

- **สีตามข้อมูล ไม่ใช่ตามอันดับ:** ตัวกรองประเภทรถ (Sedan / SUV / Pickup) ต้องให้แต่ละประเภทได้สีเดิมเสมอ แม้จะเอาบางประเภทออก
- ถ้ามีมากกว่า 6 ชุด ให้รวมเป็น "อื่น ๆ"
- **Heat scale** (สีเดียวไล่จากอ่อนไปเข้ม): `heat-1 … heat-6` (Light `#CDE2FB → #104281`) ตัวอักษรบนช่องใช้ `heat-ink-low` ที่ระดับ 1–3 และ `heat-ink-high` ที่ระดับ 4–6
- เส้นกริดใช้ `line` แบบจาง · แกนใช้ `line-strong` · ป้ายแกน `text-nano` หรือ `text-caption` สี `fg-3`
- แท่งกราฟมุมบนโค้ด 4px · เส้นกราฟหนา 2px · tooltip `rounded-pop bg-surface border border-line shadow-tooltip`
- **กราฟแกนเดียวเท่านั้น** (Dashboard ที่เทียบ รถเข้า / เวลาจอดเฉลี่ย / รายรับ ใช้การสลับ metric ไม่ใช่สองแกน)

---

## 12. รูปแบบข้อความและตัวเลข

| ข้อมูล | รูปแบบ | ตัวอย่าง |
|---|---|---|
| ภาษา | ไทย + อังกฤษ (ชื่อเมนูหลักเป็นภาษาอังกฤษ) | "Financial Overview" / "รายรับรวม" |
| วันที่ | วันย่อ + วันที่ + เดือนย่อไทย + ปี ค.ศ. | `ส. 17 ต.ค. 2026` · ในตาราง `2026-10-17 21:48` |
| เวลา | 24 ชั่วโมง | `21:56` · `21:56:08` |
| ระยะเวลา | ชม. / น. | `1 ชม. 58 น.` · `59 นาที` |
| เงิน | ใส่ ฿ ข้างหน้า ไม่เว้นวรรค มีจุลภาคคั่นหลักพัน | `฿10,080` · หน้าชำระเงินแสดงทศนิยม `฿60.00` |
| อัตรา | `20 บาท/ชม.` | — |
| ทะเบียน | หมวดอักษร + เลข และจังหวัดอยู่บรรทัดล่าง | `ผบ 9370` / `กรุงเทพมหานคร` |
| ช่องจอด | แถว-เลข 2 หลัก | `B-07` |
| เปอร์เซ็นต์เปลี่ยนแปลง | มีเครื่องหมาย ทศนิยม 1 ตำแหน่ง | `+1.0%` · `-23.3%` |
| ชื่อแบรนด์ | **AUTO PARKING** (ตัวพิมพ์ใหญ่ทั้งคำ) อ่านจากไฟล์ config ห้าม hard-code | `AUTO PARKING` · `© 2026 AUTO PARKING · Parking Management` |
| ค่าที่ยังไม่เกิด | เขียนเป็นคำ สี `fg-3` ห้ามใช้ "-" | `ยังไม่ออก` · `ยังไม่ชำระ` |
| สถานะรถ (Session) | มีแค่ 2 ค่า | `จอดอยู่` · `ออกแล้ว` |

---

## 13. ธีมมืด (Dark mode)

| ฝั่ง | ธีม |
|---|---|
| Admin Web | **สว่าง / มืด** (ไม่มี "ตามระบบ") ผ่าน `next-themes` (`attribute="data-theme"`, `themes={["light","dark"]}`, `enableSystem={false}`) · ค่าที่เลือก**บันทึกผูกกับบัญชี** (key = user id) · ช่วงหน้าบ้านล้วนเก็บใน localStorage ผ่าน `src/db/store.ts` โดเมน `prefs` จึงจำได้เฉพาะ browser นั้น วันที่มี backend จะย้ายไปเก็บกับบัญชีจริง · ค่าตั้งต้นมาจาก seed ของผู้ใช้ |
| Customer Web | **สว่างเท่านั้น** ครอบ layout ด้วย `<div data-theme="light">` |
| Kiosk | **สว่างเท่านั้น** ครอบ layout ด้วย `<div data-theme="light">` |

กติกา:
- ธีมสลับผ่าน CSS variables ทั้งหมด **component ห้ามใช้ `dark:`**
- ถ้าจำเป็นต้องมีค่าเฉพาะธีมมืด ให้เพิ่มเป็น token ใหม่ใน Figma ทั้งสองโหมด แล้วค่อยเพิ่มใน `globals.css`
- สิ่งที่คงสีเดิมทั้งสองธีม: PromptPay QR (พื้นขาว), ป้ายทะเบียน (ใช้ surface + fg ตามธีม แต่ดูเป็นป้าย), วิดีโอ CCTV, รูปตอนเข้า (Entry Snapshot)
- ตัวอย่างธีมมืดใน Figma: เฟรม `11 · ตัวอย่างธีมมืด — Parking Layout`
- ตัวเลือกธีมใน Profile menu (เฟรม 09.1) มี 2 ตัวเลือก: สว่าง (`sun`) / มืด (`moon`)

---

## 14. globals.css พร้อมใช้

```css
@import "tailwindcss";

/* ───────────── Raw tokens (ชื่อตาม Figma Variables) ───────────── */
:root,
[data-theme="light"] {
  color-scheme: light;
  --pp-primary: #3758F9;
  --pp-primary-hover: #1B44C8;
  --pp-primary-soft: #EEF1FF;
  --pp-bg-page: #F3F4F6;
  --pp-bg-surface: #FFFFFF;
  --pp-bg-subtle: #F9FAFB;
  --pp-bg-canvas: #EEF0F4;
  --pp-overlay: rgb(17 25 40 / 0.45);
  --pp-border: #DFE4EA;
  --pp-border-strong: #C9D0D8;
  --pp-border-focus: #3758F9;
  --pp-text: #111928;
  --pp-text-2: #637381;
  --pp-text-3: #9CA3AF;
  --pp-on-primary: #FFFFFF;
  --pp-status-available: #22AD5C;
  --pp-status-available-soft: #DAF8E6;
  --pp-status-occupied: #F23030;
  --pp-status-occupied-soft: #FEEBEB;
  --pp-status-disabled: #6B7280;
  --pp-status-disabled-soft: #E5E7EB;
  --pp-status-unknown: #D1D5DB;
  --pp-status-unknown-soft: #F9FAFB;
  --pp-type-general: #374151;
  --pp-type-ev: #0EA5E9;
  --pp-type-accessible: #6366F1;
  --pp-type-vip: #F59E0B;
  --pp-feedback-warning: #D97706;
  --pp-feedback-warning-soft: #FFFBEB;
  --pp-feedback-danger: #E10E0E;
  --pp-map-floor: #FFFFFF;
  --pp-map-wall: #1F2A37;
  --pp-map-pillar: #4B5563;
  --pp-map-lane: #F4F5F7;
  --pp-map-marking: #9CA3AF;
  --pp-map-grid: #E9ECF1;
  --pp-chart-1: #2A78D6;
  --pp-chart-2: #EB6834;
  --pp-chart-3: #1BAF7A;
  --pp-chart-4: #EDA100;
  --pp-chart-5: #E87BA4;
  --pp-chart-6: #008300;
  --pp-heat-1: #CDE2FB;
  --pp-heat-2: #9EC5F4;
  --pp-heat-3: #6DA7EC;
  --pp-heat-4: #3987E5;
  --pp-heat-5: #256ABF;
  --pp-heat-6: #104281;
  --pp-heat-ink-low: #111928;
  --pp-heat-ink-high: #FFFFFF;
  --pp-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.08);
  --pp-shadow-sm: 0 1px 3px rgb(18 26 41 / 0.08);
  --pp-shadow-md: 0 2px 8px rgb(18 26 41 / 0.08);
  --pp-shadow-tooltip: 0 4px 12px rgb(18 26 41 / 0.18);
  --pp-shadow-pop: 0 8px 24px rgb(18 26 41 / 0.16);
  --pp-shadow-modal: 0 20px 48px rgb(18 26 41 / 0.24);
  --pp-shadow-drawer: -8px 0 32px rgb(18 26 41 / 0.18);
  --pp-shadow-primary: 0 4px 10px rgb(56 89 250 / 0.28);
}

[data-theme="dark"] {
  color-scheme: dark;
  --pp-primary: #5B7BFF;
  --pp-primary-hover: #7C96FF;
  --pp-primary-soft: #1E2A5C;
  --pp-bg-page: #0E1520;
  --pp-bg-surface: #172131;
  --pp-bg-subtle: #1B2636;
  --pp-bg-canvas: #111A27;
  --pp-overlay: rgb(0 0 0 / 0.6);
  --pp-border: #2A3647;
  --pp-border-strong: #3B4859;
  --pp-border-focus: #5B7BFF;
  --pp-text: #F1F3F7;
  --pp-text-2: #A3ADBC;
  --pp-text-3: #6E7A8C;
  --pp-on-primary: #FFFFFF;
  --pp-status-available: #34C77B;
  --pp-status-available-soft: #123526;
  --pp-status-occupied: #F26464;
  --pp-status-occupied-soft: #3A1C22;
  --pp-status-disabled: #8A94A3;
  --pp-status-disabled-soft: #253042;
  --pp-status-unknown: #3B4859;
  --pp-status-unknown-soft: #172131;
  --pp-type-general: #C9D1DC;
  --pp-type-ev: #38BDF8;
  --pp-type-accessible: #8B93FF;
  --pp-type-vip: #FBBF24;
  --pp-feedback-warning: #F5B544;
  --pp-feedback-warning-soft: #33290F;
  --pp-feedback-danger: #F26464;
  --pp-map-floor: #152030;
  --pp-map-wall: #8A94A3;
  --pp-map-pillar: #6E7A8C;
  --pp-map-lane: #1B2738;
  --pp-map-marking: #56637A;
  --pp-map-grid: #1F2B3C;
  --pp-chart-1: #3987E5;
  --pp-chart-2: #D95926;
  --pp-chart-3: #199E70;
  --pp-chart-4: #C98500;
  --pp-chart-5: #D55181;
  --pp-chart-6: #008300;
  --pp-heat-1: #1B2A44;
  --pp-heat-2: #184F95;
  --pp-heat-3: #1C5CAB;
  --pp-heat-4: #2A78D6;
  --pp-heat-5: #5598E7;
  --pp-heat-6: #9EC5F4;
  --pp-heat-ink-low: #F1F3F7;
  --pp-heat-ink-high: #0E1520;
  --pp-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.3);
  --pp-shadow-sm: 0 1px 3px rgb(0 0 0 / 0.35);
  --pp-shadow-md: 0 2px 8px rgb(0 0 0 / 0.35);
  --pp-shadow-tooltip: 0 4px 12px rgb(0 0 0 / 0.5);
  --pp-shadow-pop: 0 8px 24px rgb(0 0 0 / 0.45);
  --pp-shadow-modal: 0 20px 48px rgb(0 0 0 / 0.6);
  --pp-shadow-drawer: -8px 0 32px rgb(0 0 0 / 0.5);
  --pp-shadow-primary: 0 4px 10px rgb(91 123 255 / 0.35);
}

/* ───────────── Tailwind theme: เปิดเฉพาะ token ของเรา ───────────── */
@theme inline {
  /* ปิดค่า default ของ Tailwind ที่ไม่อยู่ใน Figma */
  --color-*: initial;
  --font-*: initial;
  --font-weight-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;

  /* สี */
  --color-white: #FFFFFF;
  --color-black: #000000;
  --color-primary: var(--pp-primary);
  --color-primary-hover: var(--pp-primary-hover);
  --color-primary-soft: var(--pp-primary-soft);
  --color-page: var(--pp-bg-page);
  --color-surface: var(--pp-bg-surface);
  --color-subtle: var(--pp-bg-subtle);
  --color-canvas: var(--pp-bg-canvas);
  --color-overlay: var(--pp-overlay);
  --color-line: var(--pp-border);
  --color-line-strong: var(--pp-border-strong);
  --color-focus: var(--pp-border-focus);
  --color-fg: var(--pp-text);
  --color-fg-2: var(--pp-text-2);
  --color-fg-3: var(--pp-text-3);
  --color-on-primary: var(--pp-on-primary);
  --color-slot-available: var(--pp-status-available);
  --color-slot-available-soft: var(--pp-status-available-soft);
  --color-slot-occupied: var(--pp-status-occupied);
  --color-slot-occupied-soft: var(--pp-status-occupied-soft);
  --color-slot-disabled: var(--pp-status-disabled);
  --color-slot-disabled-soft: var(--pp-status-disabled-soft);
  --color-slot-unknown: var(--pp-status-unknown);
  --color-slot-unknown-soft: var(--pp-status-unknown-soft);
  --color-success: var(--pp-status-available);
  --color-success-soft: var(--pp-status-available-soft);
  --color-warning: var(--pp-feedback-warning);
  --color-warning-soft: var(--pp-feedback-warning-soft);
  --color-danger: var(--pp-feedback-danger);
  --color-danger-soft: var(--pp-status-occupied-soft);
  --color-type-general: var(--pp-type-general);
  --color-type-ev: var(--pp-type-ev);
  --color-type-accessible: var(--pp-type-accessible);
  --color-type-vip: var(--pp-type-vip);
  --color-map-floor: var(--pp-map-floor);
  --color-map-wall: var(--pp-map-wall);
  --color-map-pillar: var(--pp-map-pillar);
  --color-map-lane: var(--pp-map-lane);
  --color-map-marking: var(--pp-map-marking);
  --color-map-grid: var(--pp-map-grid);
  --color-chart-1: var(--pp-chart-1);
  --color-chart-2: var(--pp-chart-2);
  --color-chart-3: var(--pp-chart-3);
  --color-chart-4: var(--pp-chart-4);
  --color-chart-5: var(--pp-chart-5);
  --color-chart-6: var(--pp-chart-6);
  --color-heat-1: var(--pp-heat-1);
  --color-heat-2: var(--pp-heat-2);
  --color-heat-3: var(--pp-heat-3);
  --color-heat-4: var(--pp-heat-4);
  --color-heat-5: var(--pp-heat-5);
  --color-heat-6: var(--pp-heat-6);
  --color-heat-ink-low: var(--pp-heat-ink-low);
  --color-heat-ink-high: var(--pp-heat-ink-high);

  /* ฟอนต์ (ตั้ง --font-inter / --font-thai ด้วย next/font) */
  --font-sans: var(--font-inter), var(--font-thai), ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ขนาดตัวอักษร */
  --text-nano: 9px;            --text-nano--line-height: 12px;
  --text-micro: 10px;          --text-micro--line-height: 14px;
  --text-caption: 11px;        --text-caption--line-height: 16px;
  --text-label: 12px;          --text-label--line-height: 18px;
  --text-body: 13px;           --text-body--line-height: 20px;
  --text-control: 14px;        --text-control--line-height: 21px;
  --text-title: 15px;          --text-title--line-height: 23px;
  --text-lead: 16px;           --text-lead--line-height: 24px;
  --text-h3: 18px;             --text-h3--line-height: 27px;
  --text-h2: 22px;             --text-h2--line-height: 30px;
  --text-h1: 24px;             --text-h1--line-height: 32px;
  --text-kpi: 28px;            --text-kpi--line-height: 34px;
  --text-kiosk-md: 30px;       --text-kiosk-md--line-height: 42px;
  --text-kiosk-lg: 40px;       --text-kiosk-lg--line-height: 48px;
  --text-kiosk-xl: 88px;       --text-kiosk-xl--line-height: 96px;

  /* มุมโค้ง (rounded-full / rounded-none ใช้ได้ตามปกติ) */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-pop: 10px;
  --radius-xl: 12px;
  --radius-modal: 14px;
  --radius-2xl: 16px;

  /* เงา */
  --shadow-xs: var(--pp-shadow-xs);
  --shadow-sm: var(--pp-shadow-sm);
  --shadow-md: var(--pp-shadow-md);
  --shadow-tooltip: var(--pp-shadow-tooltip);
  --shadow-pop: var(--pp-shadow-pop);
  --shadow-modal: var(--pp-shadow-modal);
  --shadow-drawer: var(--pp-shadow-drawer);
  --shadow-primary: var(--pp-shadow-primary);
}

/* ───────────── Base ───────────── */
@layer base {
  body {
    background: var(--pp-bg-page);
    color: var(--pp-text);
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 20px;
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: 2px solid var(--pp-border-focus);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
}
```

ตัวอย่างการตั้งฟอนต์ใน `app/layout.tsx`:

```tsx
import { Inter, Noto_Sans_Thai } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });
const thai = Noto_Sans_Thai({ subsets: ["thai"], weight: ["400", "500", "600", "700"], variable: "--font-thai" });

// <html lang="th" className={`${inter.variable} ${thai.variable}`} suppressHydrationWarning>
```

> **หมายเหตุสำหรับโค้ดตัวต้นแบบ (`parkplan-next`):** ตอนนี้ใช้ชื่อ var แบบสั้น (`--primary`, `--text-2`, `--ok`) และ CSS class เขียนเอง (`.card-h`, `.page-head`) เมื่อเริ่มโปรเจกต์จริงให้ใช้ไฟล์ด้านบนแทนทั้งหมด แล้วเขียน component ใหม่ด้วย utility ของ Tailwind

---

## 15. Checklist ตอนรีวิว PR

- [ ] ไม่มีสี hex / rgb ในไฟล์ `.tsx` (ยกเว้น `globals.css`)
- [ ] ไม่มี class ของ TailGrids (`text-dark`, `text-body-color`, `border-stroke`, `shadow-1`, `bg-gray-*`)
- [ ] ไม่มีค่า arbitrary ของ font-size, radius, shadow หรือ spacing (`[..px]`)
- [ ] ไม่มี variant `dark:` ใน component
- [ ] ปุ่ม, input, checkbox และ component อื่นที่มีใน `src/components/tailgrids/core/` ใช้ตัวกลาง ไม่ได้เขียนซ้ำในหน้า (select, badge ยังไม่มีตัวกลาง ดูหมายเหตุต้นข้อ 8)
- [ ] รวม class ผ่าน `cn()` (ข้อ 1.1) ไม่ต่อ string เอง
- [ ] หน้าเช็กสิทธิ์ใน `page.tsx` (ไม่มีสิทธิ์ → `/403`) โดยสิทธิ์มีแค่ 2 ระดับ
- [ ] ใช้ชื่อ "Activity Log" ไม่มีคำว่า Traffic Activity หลงเหลือ
- [ ] ตัวเลข, เงิน, เวลา ใส่ `tabular-nums` และใช้รูปแบบตามข้อ 12
- [ ] ข้อความไทยไม่ถูกตัดสระ (line-height ≥ 1.4)
- [ ] สีสถานะช่องจอดกับสีประเภทไม่สลับหน้าที่กัน (ข้อ 2.5)
- [ ] เปิดทั้งธีมสว่างและมืด (หน้า Admin) แล้วอ่านได้ทุกจุด
- [ ] เทียบกับเฟรมใน Figma ที่มีเลขเดียวกัน (เช่น `13 · Financial Overview`)

---

## 16. สิ่งที่ Figma ยังไม่ได้กำหนด

ให้ทำตามแนวทางด้านล่างไปก่อน แล้วเพิ่มลง Figma ภายหลัง:

| เรื่อง | แนวทางชั่วคราว |
|---|---|
| Hover / pressed / disabled ของปุ่มและแถวตาราง | ใช้สูตรในข้อ 8 (hover = `primary-hover` หรือ `bg-subtle`, disabled = `opacity-50`) |
| หน้า 500 / ระบบขัดข้อง | ใช้โครงเดียวกับหน้า 404 (เฟรม 07.10) เปลี่ยนไอคอนเป็น `alert-triangle` |
| Loading / skeleton | กล่อง `bg-subtle rounded-md animate-pulse` ตามรูปทรงของเนื้อหาจริง |
| Sidebar บนจอเล็ก | ใช้ drawer ที่มีในโค้ดตอนนี้ |
| ธีมมืดของหน้าลูกค้าและ Kiosk | ยังไม่มี บังคับธีมสว่าง |
| Animation / transition | `transition-colors duration-150` สำหรับ hover · modal / drawer เลื่อนเข้า 200ms |
| ฟอร์ม: ตำแหน่ง label และข้อความ error | label `text-body font-medium` อยู่เหนือ input (gap 6) · error `text-label text-danger` อยู่ใต้ input |
| สีปุ่ม Switch ตอนปิด | Figma ผูกกับ `status/unknown` ควรเปลี่ยนเป็น token ของตัวเอง (เช่น `control/off`) |
| Mobile Banking ชำระไม่สำเร็จ / หมดเวลา | ใช้โครงหน้า 17.6 ปุ่มหลักเป็น "เปิดแอป{ธนาคาร}อีกครั้ง" และปุ่มรองเป็น "เปลี่ยนวิธีชำระ" |
| โลโก้ธนาคารจริง | ใช้ `Landmark` ในวง `bg-subtle` ไปก่อน · โลโก้จริงรอจากธนาคารหรือผู้ให้บริการชำระเงิน |
| แตะรูปตอนเข้าเพื่อขยาย | Figma ยังไม่มี ยังไม่ต้องทำ (มีไอคอน `zoom-in` เตรียมไว้) |
| รูปตอนเข้าโหลดไม่ขึ้น | กล่อง `bg-subtle` ขนาดเท่ารูป + ไอคอน `image` 20 `text-fg-3` |

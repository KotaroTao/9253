# Gemini イラスト生成プロンプト — アンケート5ステップ手順

歯科医院スタッフ向け使い方マニュアル（`/guide`）に掲載する、
医院端末でのアンケート実施手順イラスト用プロンプトです。

## 共通スタイル指定（全プロンプトの冒頭に付与）

```
Style: flat design illustration, clean vector style, soft pastel color palette
(light blue #E0F2FE, white, light gray, accent teal #0D9488), minimal detail,
no text on the illustration, friendly and professional tone suitable for a
Japanese dental clinic staff manual, consistent character design across all
images, 4:3 aspect ratio, white background
```

---

## Step 1: アンケート画面を開く

```
[共通スタイル指定を冒頭に付与]

Scene: A dental clinic reception desk. A female receptionist in a clean white
uniform is standing behind the counter. She is tapping the screen of an iPad
on a simple stand. The iPad screen shows a simple dashboard interface with a
prominent blue button. The environment is a clean, modern Japanese dental
clinic reception area with minimal furniture.

Key elements:
- iPad on a stand at the reception counter
- Receptionist tapping the screen with one finger
- A subtle glow/highlight effect around the button being tapped on the iPad
- Clean, modern dental clinic interior in the background
- A small circular number "1" badge in teal color at the top-left corner
```

## Step 2: 患者属性を入力

```
[共通スタイル指定を冒頭に付与]

Scene: Close-up view of an iPad screen on a stand at a dental clinic reception.
The receptionist's hand is selecting options on a form displayed on the iPad.
The form shows a series of selection buttons arranged in groups (like toggle
buttons or chips), representing patient attributes such as visit type and
treatment category. Some buttons appear selected (highlighted in teal).

Key elements:
- iPad screen prominently displayed showing a form with selectable chip/button groups
- A hand tapping one of the selection buttons
- Multiple rows of options visible on screen (representing visit type, treatment type, age group, gender)
- Some chips highlighted in teal to show "selected" state
- A small circular number "2" badge in teal color at the top-left corner
```

## Step 3: 患者さまに端末を渡す

```
[共通スタイル指定を冒頭に付与]

Scene: A friendly interaction between a dental clinic receptionist and a
patient. The receptionist (in white uniform) is handing an iPad to a patient
(casually dressed) across the reception counter. Both are smiling. The iPad
screen shows a welcome message with a large start button. The gesture conveys
"please go ahead" warmth.

Key elements:
- Receptionist extending the iPad toward the patient with both hands
- Patient reaching out to receive the iPad
- Both characters smiling warmly
- The iPad screen showing a prominent "start" button
- The reception counter between them
- A small circular number "3" badge in teal color at the top-left corner
```

## Step 4: 患者さまが回答

```
[共通スタイル指定を冒頭に付与]

Scene: A patient sitting in a dental clinic waiting area chair, holding an iPad
and tapping on the screen. The iPad screen shows a star rating interface with
5 stars, where 4 stars are filled in gold/yellow. The patient looks relaxed and
is casually tapping a star. A subtle progress bar is visible near the top of
the iPad screen. A small clock icon or "30 sec" visual hint is shown nearby to
indicate the quick completion time.

Key elements:
- Patient comfortably seated, holding iPad with both hands
- iPad screen showing a 5-star rating question (4 stars filled)
- A thin progress bar near the top of the screen
- A small "30秒" or stopwatch icon floating near the iPad to convey speed
- Relaxed, comfortable waiting area setting
- A small circular number "4" badge in teal color at the top-left corner
```

## Step 5: 自動リセット

```
[共通スタイル指定を冒頭に付与]

Scene: An iPad on a stand at the reception counter, with no one touching it.
The screen shows a friendly "thank you" completion screen with a checkmark
icon and a subtle circular countdown/timer indicator, suggesting the screen
will automatically return to the start. A curved arrow icon floats near the
iPad symbolizing the auto-reset cycle. The overall feeling is "all done,
ready for the next patient."

Key elements:
- iPad on stand, unattended at reception counter
- Screen showing a large teal checkmark in a circle (completion state)
- A subtle circular countdown timer or progress ring around the checkmark
- A curved recycling/loop arrow icon floating next to the iPad
- Clean, calm atmosphere conveying "automatic and hands-free"
- A small circular number "5" badge in teal color at the top-left corner
```

---

## 使用方法

1. Gemini (gemini.google.com) を開く
2. 「共通スタイル指定」をコピーし、各Stepのプロンプト冒頭に貼り付ける
3. 1つずつ画像を生成する（一度に全部ではなく1枚ずつ）
4. キャラクターの一貫性を保つため、Step 1で生成された画像をStep 2以降のプロンプトと一緒にアップロードし「同じキャラクターデザインで」と追記すると効果的
5. 生成された画像を `/public/images/guide/` に `step-1.png` 〜 `step-5.png` として保存

## 全体フロー図（オプション）

5ステップを1枚の横長画像にまとめたい場合:

```
[共通スタイル指定を冒頭に付与]

Create a horizontal flow diagram illustration showing 5 sequential steps of
a patient survey process at a Japanese dental clinic:

Step 1 (left): Receptionist taps iPad to open survey
Step 2: Close-up of iPad showing form with selectable chips
Step 3: Receptionist hands iPad to smiling patient
Step 4: Patient tapping star ratings on iPad
Step 5 (right): iPad on stand showing checkmark with circular reset arrow

Connect each step with a simple right-pointing arrow. Place circled numbers
(1-5) in teal above each scene. Keep each scene in a rounded rectangle frame.
The overall image should be wide (16:9 ratio) and work as a single instructional
banner image.
```

## ガイドページへの組み込み方

画像を生成・保存後、`/guide` ページの各 StepCard に画像を追加する場合のコード例:

```tsx
// src/app/guide/page.tsx の StepCard を拡張
function StepCard({ step, title, children, imageSrc }: {
  step: number
  title: string
  children: React.ReactNode
  imageSrc?: string
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {imageSrc && (
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image src={imageSrc} alt={`Step ${step}: ${title}`} fill className="object-cover" />
        </div>
      )}
      <div className="flex gap-4 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {step}
        </div>
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  )
}
```

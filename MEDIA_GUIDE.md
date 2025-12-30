# Media Assets Guide

This guide shows you how to add images and videos to the README.

## 📁 Directory Structure

Create this folder structure in the project root:

```
adk-nodejs/
├── assets/
│   ├── demo.gif                      # Main demo GIF (hero section)
│   ├── demo.mp4                      # Alternative: demo video
│   ├── architecture-diagram.png      # Multi-agent architecture visual
│   ├── screenshot-idle.png           # UI in idle state
│   ├── screenshot-listening.png      # UI while listening
│   ├── screenshot-speaking.png       # UI while speaking
│   ├── tool-execution-demo.gif       # Tool workflow demo
│   └── youtube-thumbnail.png         # Optional: YouTube thumbnail
└── README.md
```

## 🎬 What to Record/Create

### 1. **Hero Demo** (Priority 1)
**Format:** GIF (< 5MB) or link to YouTube
**Content:**
- Show voice interaction
- Show tool execution (background color change)
- Show Pixel responding
- Duration: 10-15 seconds

**Tools to create GIF:**
- macOS: [Gifox](https://gifox.app/)
- Windows: [ScreenToGif](https://www.screentogif.com/)
- Cross-platform: [LICEcap](https://www.cockos.com/licecap/)

### 2. **Screenshots** (Priority 2)
**Resolution:** 1920x1080 or 1280x720
**What to capture:**
- `screenshot-idle.png`: Pixel idle state, clean UI
- `screenshot-listening.png`: When user is speaking (show waveform if possible)
- `screenshot-speaking.png`: When Pixel is responding

### 3. **Architecture Diagram** (Priority 3)
**Tool:** Draw.io, Figma, or Excalidraw
**Content:**
```
User Input
    ↓
[FunctionGemma] ← Router
    ↓
Decision: Tool or Conversation?
    ↓
  Tool? → Execute → [Gemma 2] → Response
    ↓
  No Tool? → [Gemma 2] → Response
```

### 4. **Tool Execution Demo** (Optional)
**Format:** GIF
**Content:**
- Show: "Change background to blue"
- Show: FunctionGemma detecting tool
- Show: Background changing
- Show: Gemma 2 responding

## 📝 How to Add Media to README

### Step 1: Add your files to `assets/` folder

```bash
mkdir -p assets
# Add your images/videos to this folder
```

### Step 2: Uncomment the HTML comments in README.md

Find sections marked with `<!-- ... -->` and uncomment them.

**Example:**

Before:
```markdown
<!--
![Demo](./assets/demo.gif)
-->
```

After:
```markdown
![Demo](./assets/demo.gif)
*Watch Pixel respond to voice commands in real-time*
```

### Step 3: Update file paths if needed

If your files have different names, update the paths:
```markdown
![Demo](./assets/my-demo.gif)
```

## 🎥 Video Options

### Option 1: YouTube Video (Recommended for long demos)
1. Upload video to YouTube
2. Get video ID from URL: `https://youtu.be/VIDEO_ID`
3. Update README:
```markdown
[![Watch Demo](https://img.shields.io/badge/▶-Watch_Full_Demo-red?style=for-the-badge&logo=youtube)](https://youtu.be/VIDEO_ID)
```

### Option 2: Embedded GIF (Recommended for quick demos)
1. Create GIF (< 5MB for GitHub)
2. Place in `assets/demo.gif`
3. Uncomment in README

### Option 3: Loom or Vimeo
Similar to YouTube, just update the link.

## 🎨 Image Optimization

**Before adding images:**
1. **Resize** to reasonable dimensions (1920x1080 max)
2. **Compress**:
   - PNG: Use [TinyPNG](https://tinypng.com/)
   - GIF: Use [Gifski](https://gif.ski/) or [ezgif.com](https://ezgif.com/)
3. **Keep file size** < 5MB for GIFs, < 1MB for PNGs

## ✅ Checklist

- [ ] Create `assets/` folder
- [ ] Record demo GIF or video
- [ ] Take 3 screenshots (Idle, Listening, Speaking)
- [ ] (Optional) Create architecture diagram
- [ ] Optimize all images
- [ ] Add files to `assets/` folder
- [ ] Uncomment sections in README.md
- [ ] Update file paths if needed
- [ ] Commit changes

## 📊 Example README Sections (Already Added)

### Hero Section (Line ~11)
```markdown
![Demo](./assets/demo.gif)
```

### Demo & Screenshots Section (Line ~30)
```markdown
### Quick Demo GIF
![Demo GIF](./assets/demo.gif)

### Screenshots
<table>...
```

### Architecture Overview (Line ~67)
```markdown
![Multi-Agent Architecture](./assets/architecture-diagram.png)
```

## 🚀 Quick Start

Fastest way to get started:

1. **Screen record 15 seconds:**
   - Start app
   - Say "Change background to blue"
   - Show it working

2. **Convert to GIF:**
   ```bash
   # macOS with ffmpeg
   ffmpeg -i demo.mov -vf "fps=10,scale=800:-1" assets/demo.gif
   ```

3. **Add to README:**
   ```bash
   mkdir assets
   mv demo.gif assets/
   # Uncomment sections in README.md
   git add assets/ README.md
   git commit -m "docs: Add demo media"
   ```

Done! 🎉

---

**Note:** All media placeholders are already in the README as HTML comments. Just add your files and uncomment!

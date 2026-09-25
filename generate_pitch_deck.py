import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

# ==========================================
# COLOR PALETTE (Dark Tech Corporate Theme)
# ==========================================
BG_DARK = RGBColor(11, 15, 25)         # #0B0F19 (Deep Charcoal / Midnight Blue)
CARD_BG = RGBColor(19, 27, 42)         # #131B2A (Slate Card Container)
CARD_BG_ALT = RGBColor(26, 36, 56)     # #1A2438 (Elevated Card)
CARD_BORDER = RGBColor(38, 52, 75)     # #26344B (Subtle Card Border)
ACCENT_CYAN = RGBColor(56, 189, 248)   # #38BDF8 (Neon Sky Cyan)
ACCENT_PURPLE = RGBColor(168, 85, 247) # #A855F7 (Electric Violet)
ACCENT_GREEN = RGBColor(16, 185, 129)  # #10B981 (Emerald Live Green)
ACCENT_AMBER = RGBColor(245, 158, 11)  # #F59E0B (Warning Gold)
TEXT_WHITE = RGBColor(255, 255, 255)   # #FFFFFF (Crisp White Header)
TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 (Slate Secondary Text)
TEXT_LIGHT = RGBColor(226, 232, 240)   # #E2E8F0 (High-contrast Body Text)
ACCENT_RED = RGBColor(239, 68, 68)     # #EF4444 (Critical / Alert)

def create_deck():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, subtitle_text=""):
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.3))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Tag / Category
        p_tag = tf.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.name = "Segoe UI"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = ACCENT_CYAN
        p_tag.space_after = Pt(3)

        # Main Slide Title
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.name = "Segoe UI"
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        p_title.space_after = Pt(2)

        # Subtitle
        if subtitle_text:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.name = "Segoe UI"
            p_sub.font.size = Pt(11.5)
            p_sub.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=CARD_BG):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
        return shape

    def add_badge(slide, left, top, width, height, text, bg_color, text_color):
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        badge.fill.solid()
        badge.fill.fore_color.rgb = bg_color
        badge.line.fill.background()
        tf = badge.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = text
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = text_color
        return badge

    def add_proportional_picture(slide, img_path, box_left, box_top, box_w, box_h):
        if not os.path.exists(img_path):
            return None
        with Image.open(img_path) as im:
            img_w, img_h = im.size
        aspect = img_w / img_h
        box_aspect = box_w / box_h
        if aspect > box_aspect:
            # Constrain by width
            fit_w = box_w
            fit_h = box_w / aspect
            fit_left = box_left
            fit_top = box_top + (box_h - fit_h) / 2
        else:
            # Constrain by height
            fit_h = box_h
            fit_w = box_h * aspect
            fit_top = box_top
            fit_left = box_left + (box_w - fit_w) / 2
        return slide.shapes.add_picture(img_path, Inches(fit_left), Inches(fit_top), width=Inches(fit_w), height=Inches(fit_h))

    # ==========================================
    # SLIDE 1: PITCH TITLE & TAGLINE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Accent decorative top bar
    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.7), Inches(2.2), Inches(0.06))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = ACCENT_CYAN
    top_bar.line.fill.background()

    # Track Tag
    track_box = s1.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.733), Inches(0.4))
    tf1 = track_box.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "AMIHACKS 2026  //  PROBLEM STATEMENT 2  //  CIVIC TECH & SMART DATA CORRELATION"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_CYAN

    # Project Name
    title_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(11.733), Inches(1.5))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_name = tf_title.paragraphs[0]
    p_name.text = "CityPulse"
    p_name.font.name = "Segoe UI"
    p_name.font.size = Pt(54)
    p_name.font.bold = True
    p_name.font.color.rgb = TEXT_WHITE
    p_name.space_after = Pt(4)

    p_tagline = tf_title.add_paragraph()
    p_tagline.text = "Real-Time Civic Signal Correlation & Resident Intelligence Platform for Jaipur"
    p_tagline.font.name = "Segoe UI"
    p_tagline.font.size = Pt(20)
    p_tagline.font.bold = True
    p_tagline.font.color.rgb = ACCENT_CYAN

    # 1-Sentence Value Hook (Hero Card)
    add_card(s1, 0.8, 3.2, 11.733, 1.45, border_color=ACCENT_CYAN, bg_color=CARD_BG)
    hook_box = s1.shapes.add_textbox(Inches(1.1), Inches(3.35), Inches(11.133), Inches(1.15))
    tf_hook = hook_box.text_frame
    tf_hook.word_wrap = True
    p_hook_label = tf_hook.paragraphs[0]
    p_hook_label.text = "THE 1-SENTENCE VALUE HOOK"
    p_hook_label.font.name = "Segoe UI"
    p_hook_label.font.size = Pt(10)
    p_hook_label.font.bold = True
    p_hook_label.font.color.rgb = ACCENT_PURPLE
    p_hook_label.space_after = Pt(4)

    p_hook = tf_hook.add_paragraph()
    p_hook.text = "“CityPulse ingests fragmented weather, air quality, transit, and citizen reports, normalizes them into unified CityEvents, and uses a rolling 30-minute spatio-temporal engine to detect unusual civic spikes and cautious 'Possible Links' — completely avoiding false causation and hallucinated panic.”"
    p_hook.font.name = "Segoe UI"
    p_hook.font.size = Pt(13)
    p_hook.font.italic = True
    p_hook.font.color.rgb = TEXT_LIGHT

    # 3 Pillar Metadata Cards
    # Card 1: Live Production Link
    add_card(s1, 0.8, 4.9, 3.65, 1.9, border_color=CARD_BORDER)
    b1 = s1.shapes.add_textbox(Inches(1.0), Inches(5.05), Inches(3.25), Inches(1.6))
    tf_b1 = b1.text_frame
    tf_b1.word_wrap = True
    p = tf_b1.paragraphs[0]
    p.text = "DEPLOYED APPLICATION"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(4)
    p = tf_b1.add_paragraph()
    p.text = "citypulse-iota-bice.vercel.app"
    p.font.name = "Segoe UI"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(4)
    p = tf_b1.add_paragraph()
    p.text = "Live Next.js 15 on Vercel Edge with live Open-Meteo APIs for 5 Jaipur zones."
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED

    # Card 2: Innovation & Verification
    add_card(s1, 4.84, 4.9, 3.65, 1.9, border_color=CARD_BORDER)
    b2 = s1.shapes.add_textbox(Inches(5.04), Inches(5.05), Inches(3.25), Inches(1.6))
    tf_b2 = b2.text_frame
    tf_b2.word_wrap = True
    p = tf_b2.paragraphs[0]
    p.text = "ENGINEERING HIGHLIGHTS"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(4)
    p = tf_b2.add_paragraph()
    p.text = "Cross-Source Civic Correlation"
    p.font.name = "Segoe UI"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(4)
    p = tf_b2.add_paragraph()
    p.text = "Rolling 30-min window, Z-Score anomaly engine, Leaflet GIS, and deterministic replay."
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED

    # Card 3: Team Placeholder
    add_card(s1, 8.88, 4.9, 3.65, 1.9, border_color=CARD_BORDER)
    b3 = s1.shapes.add_textbox(Inches(9.08), Inches(5.05), Inches(3.25), Inches(1.6))
    tf_b3 = b3.text_frame
    tf_b3.word_wrap = True
    p = tf_b3.paragraphs[0]
    p.text = "HACKATHON TEAM"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(4)
    p = tf_b3.add_paragraph()
    p.text = "[Team CityPulse Elite]"
    p.font.name = "Segoe UI"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(4)
    p = tf_b3.add_paragraph()
    p.text = "AmiHacks Round 1 & Round 2 Finalist\nFormat: 7-min Demo + 3-min Q&A"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 2: THE CORE PROBLEM (Impact & Need)
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "01 // Problem Statement", "Civic Data is Fragmented, Incoherent, and Unactionable",
               "Directly mapping to the 'Impact & Need' judging rubric — why isolated smart city feeds fail citizens.")

    col_w = 3.65
    gap = 0.39
    top_pos = 1.95
    h_pos = 5.0

    # Card 1: Data Silos
    add_card(s2, 0.8, top_pos, col_w, h_pos)
    tb = s2.shapes.add_textbox(Inches(1.0), Inches(top_pos + 0.2), Inches(col_w - 0.4), Inches(h_pos - 0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PAIN POINT 01"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED
    p.space_after = Pt(6)

    p = tf.add_paragraph()
    p.text = "Siloed, Disconnected Feeds"
    p.font.name = "Segoe UI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(12)

    bullets1 = [
        ("Information Blindspots:", "Weather apps report rainfall; municipal boards report road repairs; transit apps report bus delays; citizen portals log drainage clogs. None talk to each other."),
        ("Cognitive Overload:", "Residents must manually cross-examine 4+ different services to decide whether it is safe to commute or leave home."),
        ("Mismatched Data Models:", "Raw APIs use incompatible timestamps, coordinates, schemas, and proprietary units.")
    ]
    for title, desc in bullets1:
        p = tf.add_paragraph()
        p.text = f"• {title} "
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    # Card 2: Naive Dashboards
    add_card(s2, 0.8 + col_w + gap, top_pos, col_w, h_pos)
    tb = s2.shapes.add_textbox(Inches(1.0 + col_w + gap), Inches(top_pos + 0.2), Inches(col_w - 0.4), Inches(h_pos - 0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PAIN POINT 02"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(6)

    p = tf.add_paragraph()
    p.text = "No Spatial or Temporal Context"
    p.font.name = "Segoe UI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(12)

    bullets2 = [
        ("Raw Sensor Dumps:", "Traditional civic dashboards just display raw numbers (e.g., '14 mm rain' or 'AQI 162') without answering: What does this mean for my neighborhood right now?"),
        ("Lack of Rolling Windows:", "Static charts fail to capture sudden 30-minute escalation spikes vs. routine seasonal averages."),
        ("No Spatio-Temporal Join:", "A rain spike in Vaishali Nagar combined with a transit halt 15 km away in Jagatpura is noise, but in the same zone it's a critical incident.")
    ]
    for title, desc in bullets2:
        p = tf.add_paragraph()
        p.text = f"• {title} "
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    # Card 3: The Danger of False Causation
    add_card(s2, 0.8 + (col_w + gap) * 2, top_pos, col_w, h_pos)
    tb = s2.shapes.add_textbox(Inches(1.0 + (col_w + gap) * 2), Inches(top_pos + 0.2), Inches(col_w - 0.4), Inches(h_pos - 0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PAIN POINT 03"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(6)

    p = tf.add_paragraph()
    p.text = "Hallucinations & False Panic"
    p.font.name = "Segoe UI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(12)

    bullets3 = [
        ("Reckless Causation Claims:", "Naive AI bots claim 'Rain definitively destroyed bus engines', generating misinformation and panic among citizens."),
        ("Privacy Violations:", "Citizen complaints often expose sensitive names, phone numbers, or residential addresses."),
        ("Fragile Architectures:", "Most hackathon prototypes crash completely when a single third-party API rate-limits or times out.")
    ]
    for title, desc in bullets3:
        p = tf.add_paragraph()
        p.text = f"• {title} "
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    # ==========================================
    # SLIDE 3: THE CODE SOLUTION & KEY FEATURES
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "02 // Proposed Solution & Features", "Engineering Unified City Intelligence in Code",
               "Universal normalization, statistical anomaly detection, and cautious spatio-temporal link scoring.")

    gw = 5.67
    gh = 2.35
    gx1 = 0.8
    gx2 = 6.86
    gy1 = 1.95
    gy2 = 4.60

    features = [
        (gx1, gy1, "FEATURE 01 // DATA NORMALIZATION", "Unified CityEvent Schema", ACCENT_CYAN, [
            ("Multi-Feed Ingestion:", "Ingests Live Open-Meteo Weather, Live Open-Meteo Air Quality, Simulated Transit delays, and Local Reports."),
            ("Strict Common Contract:", "Normalizes every mismatched source into a validated TypeScript 'CityEvent' with ISO-8601 timestamps, GPS coordinates, severity, and raw metrics."),
            ("No Frontend Coupling:", "UI never touches raw API payloads; it consumes clean, standardized contracts.")
        ]),
        (gx2, gy1, "FEATURE 02 // TIME WINDOW ENGINE", "Rolling 30-Minute Dynamic Window", ACCENT_PURPLE, [
            ("Temporal Horizon:", "Continuously isolates observations within a 30-minute window to capture live, evolving city conditions."),
            ("Statistical Anomaly Math:", "Employs Z-Score calculations (zScore >= 2.0) or threshold rules (current >= avg * 1.5) to flag genuine civic spikes."),
            ("Expired Event Pruning:", "Outdated readings automatically roll out of the alert pipeline to prevent stale alarms.")
        ]),
        (gx1, gy2, "FEATURE 03 // CORRELATION ENGINE", "Mathematical Link Scoring (LinkScore)", ACCENT_GREEN, [
            ("Rigorous Formula:", "LinkScore = 0.40 * TimeScore + 0.30 * LocationScore + 0.30 * UnusualScore."),
            ("Association Threshold:", "Scores >= 0.70 surface a 'Possible Link' between coinciding events in the same zone."),
            ("Correlation Safety Rule:", "Strictly framed as 'may be related' or 'happening alongside' — never claims unproven causation.")
        ]),
        (gx2, gy2, "FEATURE 04 // RESILIENT UX & SUMMARIES", "Zero-Crash Architecture & Groq Briefs", ACCENT_AMBER, [
            ("Graceful Feed Degradation:", "If any feed fails, it is marked 'Unavailable'; remaining feeds continue operating smoothly."),
            ("Constrained AI Summaries:", "Optional Groq LLM formats verified facts into concise briefs, with deterministic template fallback."),
            ("Total Resident Privacy:", "Strict aggregation: zero names, numbers, emails, or personal identifiers.")
        ])
    ]

    for x, y, tag, title, accent, bullets in features:
        add_card(s3, x, y, gw, gh)
        tb = s3.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.15), Inches(gw - 0.5), Inches(gh - 0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = tag
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = accent
        p.space_after = Pt(2)

        p = tf.add_paragraph()
        p.text = title
        p.font.name = "Segoe UI"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(6)

        for b_title, b_desc in bullets:
            p = tf.add_paragraph()
            p.text = f"• {b_title} "
            p.font.name = "Segoe UI"
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = accent
            run = p.add_run()
            run.text = b_desc
            run.font.bold = False
            run.font.color.rgb = TEXT_LIGHT
            p.space_after = Pt(3)

    # ==========================================
    # SLIDE 4: SYSTEM ARCHITECTURE & 24H SPRINT
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "03 // System Architecture", "Production-Grade Pipeline Built in a 24-Hour Sprint",
               "Clean separation of concerns: Ingestion -> Normalization -> Storage -> Analysis -> Presentation.")

    # Left Column: Pipeline Architecture Flow
    add_card(s4, 0.8, 1.95, 6.8, 5.0)
    tb_arch = s4.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(6.3), Inches(4.7))
    tf_arch = tb_arch.text_frame
    tf_arch.word_wrap = True

    p = tf_arch.paragraphs[0]
    p.text = "CORE DATA FLOW & RESILIENT PIPELINE"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(10)

    pipeline_steps = [
        ("1. Data Ingestion (4 Civic Feeds)", "Live Open-Meteo Weather API + Live Open-Meteo US AQI + Simulated JSON Transit & Citizen Reports across 5 Jaipur zones."),
        ("2. Normalization Engine (/lib/normalizers)", "Transforms disparate payloads into typed 'CityEvent' objects; validates ISO-8601 timestamps and coordinates."),
        ("3. Storage & Audit Trail (Supabase PostgreSQL)", "Persists normalized events and health heartbeats; schema validated in supabase/schema.sql."),
        ("4. Rolling 30-Min Analysis (/lib/analysis)", "Filters events within [now - 30m, now]; computes Z-Scores for rainfall, AQI, transit delays, and report volume."),
        ("5. Spatio-Temporal Link Scoring", "Calculates time proximity + location distance + anomaly intensity. Flags Possible Links when score >= 0.70."),
        ("6. API Gateway & Summary (/api/status)", "Serves single unified contract to frontend; attaches Groq-grounded or deterministic plain-language brief.")
    ]

    for title, desc in pipeline_steps:
        p = tf_arch.add_paragraph()
        p.text = f"{title}\n"
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = f"   → {desc}"
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(7)

    # Right Column: Tech Stack & Sprint Engineering
    add_card(s4, 7.99, 1.95, 4.54, 5.0)
    tb_tech = s4.shapes.add_textbox(Inches(8.24), Inches(2.1), Inches(4.04), Inches(4.7))
    tf_tech = tb_tech.text_frame
    tf_tech.word_wrap = True

    p = tf_tech.paragraphs[0]
    p.text = "24-HOUR SPRINT TECH STACK"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(10)

    tech_stack = [
        ("Frontend & SSR:", "Next.js 15 (App Router), React 19, TypeScript"),
        ("Styling & Motion:", "Tailwind CSS, GSAP 3.15, Motion animations"),
        ("Geospatial GIS:", "React Leaflet, OpenStreetMap, Custom Map Markers"),
        ("Database / Cloud:", "Supabase PostgreSQL (Event audit & source health)"),
        ("External APIs:", "Open-Meteo Weather & US Air Quality (Public, no key)"),
        ("AI Enhancer:", "Groq API (Fact-constrained resident summaries)"),
        ("Quality & Testing:", "Node test runner (tsx), ESLint, Integration suite"),
        ("Deployment:", "Vercel Edge Platform (Auto-deploy on git push)")
    ]

    for k, v in tech_stack:
        p = tf_tech.add_paragraph()
        p.text = f"• {k} "
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        run = p.add_run()
        run.text = v
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(5)

    # ==========================================
    # SLIDE 5: LIVE DEMO CHECKLIST & 7-MIN FLOW
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "04 // Live Demo Checklist", "Sequential 7-Minute Demo Flow for Judges",
               "Designed precisely to fulfill Section 6.3 of the Hackathon Presentation & Demo Guidelines.")

    card_w = 2.65
    gap_x = 0.37
    top_y = 1.95
    card_h = 5.0

    demo_steps = [
        ("01", "0:00 - 1:30", "Multi-Zone Overview", ACCENT_CYAN, [
            ("5 Jaipur Municipalities:", "Malviya Nagar, Mansarovar, Vaishali Nagar, Jagatpura, C-Scheme."),
            ("Live vs Simulated Labels:", "Point out green 'Live' badge for Open-Meteo feeds vs grey 'Simulated' badge for transport & reports."),
            ("Resident-First Glance:", "Show City Status header and 4 Current Situation KPI cards.")
        ]),
        ("02", "1:30 - 3:00", "Interactive Leaflet GIS", ACCENT_PURPLE, [
            ("Geospatial Pins:", "Show interactive map pins with category color-coding and pulse effects."),
            ("Neighborhood Filtering:", "Click each Jaipur zone to show area-aware telemetry switching and coordinate updates."),
            ("Incident Cards:", "Click active markers to display raw metrics and observation timestamps.")
        ]),
        ("03", "3:00 - 5:15", "Deterministic Replay", ACCENT_AMBER, [
            ("Toggle Live / Replay:", "Switch to Replay Mode with 3 selectable days (Sept 22, 23, 24)."),
            ("The 6-Step Escalation:", "4:45 PM (Normal) → 5:05 PM (Heavy Rain Spike) → 5:16 PM (Waterlogging Reports) → 5:24 PM (Transit Delay) → 5:25 PM (**Possible Link**)."),
            ("No Fake Animation:", "Explain that replay runs the exact same rolling-window math in real time.")
        ]),
        ("04", "5:15 - 7:00", "Correlation & Safety", ACCENT_GREEN, [
            ("Surfacing Possible Link:", "Highlight LinkScore >= 0.70 with cautious 'may be related' language."),
            ("Groq Briefing:", "Demonstrate concise, grounded resident summary without AI hallucinations."),
            ("Fault Tolerance Check:", "Explain zero-crash architecture if an API source drops offline.")
        ])
    ]

    for idx, (num, time_slot, step_title, accent, bullets) in enumerate(demo_steps):
        x = 0.8 + idx * (card_w + gap_x)
        add_card(s5, x, top_y, card_w, card_h)

        tb = s5.shapes.add_textbox(Inches(x + 0.2), Inches(top_y + 0.2), Inches(card_w - 0.4), Inches(card_h - 0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"PHASE {num}"
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = accent
        p.space_after = Pt(2)

        p = tf.add_paragraph()
        p.text = time_slot
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(4)

        p = tf.add_paragraph()
        p.text = step_title
        p.font.name = "Segoe UI"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(10)

        for b_title, b_desc in bullets:
            p = tf.add_paragraph()
            p.text = f"• {b_title}\n"
            p.font.name = "Segoe UI"
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = accent
            run = p.add_run()
            run.text = f"  {b_desc}"
            run.font.bold = False
            run.font.size = Pt(9.5)
            run.font.color.rgb = TEXT_LIGHT
            p.space_after = Pt(6)

    # ==========================================
    # SLIDE 6: DEMO SCREENSHOTS & INTERFACE PROOF
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "05 // Demo Screenshots", "Live Deployed Application in Action",
               "Mandatory Section 6.2 deliverable: High-resolution visual proof of the working Vercel deployment.")

    img1_path = "c:/Users/yatin/Desktop/CityPulse/presentation_assets/media_1790288488175_clean.png"
    img2_path = "c:/Users/yatin/Desktop/CityPulse/presentation_assets/media_1790303843900_clean.png"

    card1_left = 0.8
    card1_w = 6.8
    card2_left = 7.9
    card2_w = 4.63

    # Left Container (Map & Live Status)
    add_card(s6, card1_left, 1.95, card1_w, 5.0)
    tb_c1 = s6.shapes.add_textbox(Inches(card1_left + 0.25), Inches(2.05), Inches(card1_w - 0.5), Inches(0.7))
    tf1 = tb_c1.text_frame
    p = tf1.paragraphs[0]
    p.text = "PRIMARY INTERACTION VIEW: LEAFLET GIS & INCIDENT CARDS"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(2)
    p = tf1.add_paragraph()
    p.text = "Live status badges, interactive pins across Jaipur, and real-time alert threshold meters."
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # Proportional screenshot fit for Left Card
    add_proportional_picture(s6, img1_path, card1_left + 0.25, 2.85, card1_w - 0.5, 3.85)

    # Right Container (Telemetry & Trend Analytics)
    add_card(s6, card2_left, 1.95, card2_w, 5.0)
    tb_c2 = s6.shapes.add_textbox(Inches(card2_left + 0.25), Inches(2.05), Inches(card2_w - 0.5), Inches(0.7))
    tf2 = tb_c2.text_frame
    p = tf2.paragraphs[0]
    p.text = "MULTI-ZONE TELEMETRY & HISTORICAL TRENDS"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(2)
    p = tf2.add_paragraph()
    p.text = "Rainfall & US AQI trend analysis across all 5 municipal zones (3-hour normalized telemetry)."
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # Proportional screenshot fit for Right Card
    add_proportional_picture(s6, img2_path, card2_left + 0.25, 2.85, card2_w - 0.5, 3.85)

    # ==========================================
    # SLIDE 7: GRADING RUBRIC CHECK & FUTURE SCALING
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "06 // Rubric Alignment & Future Scope", "Hitting Every Judging Metric + Roadmap for Municipal Scale",
               "Evaluating CityPulse against hackathon judging criteria and outlining next steps for production expansion.")

    # Left: 4 Rubric Metrics
    add_card(s7, 0.8, 1.95, 6.8, 5.0)
    tb_rub = s7.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(6.3), Inches(4.7))
    tf_rub = tb_rub.text_frame
    tf_rub.word_wrap = True

    p = tf_rub.paragraphs[0]
    p.text = "HACKATHON JUDGING RUBRIC ALIGNMENT"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)

    rubrics = [
        ("Innovation & Novelty (Top Marks)", "Moves far beyond static data visualization. Introduces real-time multi-signal spatio-temporal correlation with mathematical link scoring and honest causal boundaries."),
        ("Technical Complexity (Top Marks)", "Multi-source ingestion pipeline, universal ISO-8601 normalization, rolling 30-minute Z-Score statistical anomaly engine, and Supabase PostgreSQL persistence."),
        ("Viability & Resident Impact (Top Marks)", "Solves immediate urban pain during Jaipur monsoons. Directly integrates with citizen awareness and municipal emergency dispatch workflows."),
        ("Design, UX & Polish (Top Marks)", "Sleek dark-mode aesthetic, WCAG-compliant contrast, smooth GSAP/Motion micro-interactions, responsive GIS mapping, and zero-crash fault tolerance.")
    ]

    for title, desc in rubrics:
        p = tf_rub.add_paragraph()
        p.text = f"✔ {title}\n"
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        run = p.add_run()
        run.text = f"   {desc}"
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(8)

    # Right: Future Scope / 2 Logical Next Steps
    add_card(s7, 7.99, 1.95, 4.54, 5.0)
    tb_scale = s7.shapes.add_textbox(Inches(8.24), Inches(2.1), Inches(4.04), Inches(4.7))
    tf_scale = tb_scale.text_frame
    tf_scale.word_wrap = True

    p = tf_scale.paragraphs[0]
    p.text = "FUTURE SCOPE: 2 LOGICAL NEXT STEPS"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(12)

    next_steps = [
        ("Next Step 1: Real Municipal API Integrations", "Directly integrate live GTFS real-time feeds from JCTSL (Jaipur City Transport), JMRC Metro telemetry, and Rajasthan Jan Soochna civic grievance webhooks directly into the CityEvent pipeline."),
        ("Next Step 2: Multi-City Expansion & Edge Sensors", "Scale the rolling-window architecture across Kota, Jodhpur, and Udaipur; deploy low-cost IoT ultrasonic flood sensors under low-lying flyovers to feed live hyper-local telemetry into CityPulse.")
    ]

    for title, desc in next_steps:
        p = tf_scale.add_paragraph()
        p.text = f"★ {title}\n"
        p.font.name = "Segoe UI"
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_AMBER
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(14)

    # ==========================================
    # SLIDE 8: TECHNICAL DELIVERABLES & Q&A
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "07 // Deliverables & Q&A Defense", "Complete Technical Package & 3-Minute Q&A Readiness",
               "Fulfilling Section 6.1 Technical Deliverables and preparing the team for judge scrutiny.")

    # Left: Deliverables Checklist
    add_card(s8, 0.8, 1.95, 5.67, 5.0)
    tb_del = s8.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(5.17), Inches(4.7))
    tf_del = tb_del.text_frame
    tf_del.word_wrap = True

    p = tf_del.paragraphs[0]
    p.text = "SECTION 6.1 TECHNICAL DELIVERABLES"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(10)

    deliverables = [
        ("GitHub Repository Link:", "Clean commit history, TypeScript 5, zero secrets exposed in client bundles."),
        ("Full Source Code:", "Strict separation of concerns (app/, components/, lib/, supabase/, tests/)."),
        ("Architecture Diagram:", "Complete data flow documented in docs/ARCHITECTURE.md and pitch deck."),
        ("Live Deployment URL:", "Hosted on Vercel Edge: https://citypulse-iota-bice.vercel.app"),
        ("README & Spec Documentation:", "Exhaustive project specification, data contracts, and release verification notes."),
        ("Testing & Quality Validation:", "npm test, npm run lint, and npm run test:integration passing with 0 errors.")
    ]

    for title, desc in deliverables:
        p = tf_del.add_paragraph()
        p.text = f"• {title} "
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(6)

    # Right: 3-Minute Q&A Anticipated Judge Questions & Defenses
    add_card(s8, 6.86, 1.95, 5.67, 5.0)
    tb_qa = s8.shapes.add_textbox(Inches(7.11), Inches(2.1), Inches(5.17), Inches(4.7))
    tf_qa = tb_qa.text_frame
    tf_qa.word_wrap = True

    p = tf_qa.paragraphs[0]
    p.text = "3-MINUTE Q&A: JUDGE DEFENSE STRATEGY"
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(10)

    qa_list = [
        ("Q: How do you prevent AI hallucinations or false panic?",
         "A: We constrain Groq exclusively to verified facts already computed by our deterministic pipeline. If Groq is unavailable, deterministic template briefs take over seamlessly. Furthermore, our Correlation Safety Rule strictly prohibits causal claims."),
        ("Q: What happens if Open-Meteo or another feed crashes?",
         "A: Zero dashboard failure. The pipeline isolates the broken feed, marks its UI badge as 'Unavailable', and maintains real-time cross-correlation across all surviving data sources."),
        ("Q: Why not just use Google Maps or an existing weather app?",
         "A: Google Maps shows traffic; weather apps show rain. Neither performs rolling-window statistical anomaly cross-analysis or links multi-source civic events by location and time for resident clarity.")
    ]

    for q, a in qa_list:
        p = tf_qa.add_paragraph()
        p.text = f"{q}\n"
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        run = p.add_run()
        run.text = a
        run.font.bold = False
        run.font.size = Pt(9.5)
        run.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(6)

    # Save presentation
    output_path = "c:/Users/yatin/Desktop/CityPulse/hackathon_final_pitch.pptx"
    prs.save(output_path)
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    create_deck()

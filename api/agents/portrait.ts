import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ═══════════════════════════════════════════════════════════════════
//  PORTRAIT ENGINE — Nudio-derived, exact API structure
// ═══════════════════════════════════════════════════════════════════

// ─── Lens (3) ───

const LENS_CHOICES = [
  {
    id: 'lens-tele',
    label: 'Telephoto / Flattering',
    prompt: 'shot on an 85mm portrait lens with flattering facial compression, shallow depth of field, creamy bokeh background, and tight focus on the subject',
  },
  {
    id: 'lens-standard',
    label: 'Standard / Natural',
    prompt: 'shot on a 50mm lens, natural human eye perspective with accurate facial proportions and medium depth of field',
  },
  {
    id: 'lens-wide',
    label: 'Wide / Environmental',
    prompt: 'shot on a 24mm lens, wide angle perspective with slightly elongated features, expansive background view, and deep depth of field',
  },
];

// ─── Retouch (3) ───

const RETOUCH_CHOICES = [
  {
    id: 'finish-polished',
    label: 'Polished professional',
    prompt: 'Retouching: clean corporate makeup, neatly groomed hair, and smoothed skin while retaining texture for a professional headshot finish.',
  },
  {
    id: 'finish-glamour',
    label: 'High glamour',
    prompt: 'Retouching: flawless airbrushed skin finish with subtle grain, bold editorial makeup, and perfectly styled hair for a magazine-ready portrait.',
  },
  {
    id: 'finish-raw',
    label: 'Raw authenticity',
    prompt: 'Retouching: natural skin texture remains visible with minimal makeup, slight imperfections, and unstyled natural hair for documentary realism.',
  },
];

// ─── Wardrobe ───

const WARDROBE_MALE = [
  { id: 'style-original', label: 'Original wardrobe', prompt: 'the clothing already worn in the upload, preserved authentically while removing wrinkles and pinning fabric for the most flattering fit', useOriginal: true },
  { id: 'style-corporate', label: 'Tailored formal', prompt: 'modern executive tailoring inspired by Brioni, Kiton, Armani, or Thom Browne—sleek suits, immaculate shirts, sharp ties, and luxurious fabrics that photograph like a GQ cover', useOriginal: false },
  { id: 'style-casual', label: 'City smart', prompt: 'elevated off-duty layers referencing Todd Snyder, Arket, COS, Fear of God, Peter Millar, or Bonobos—neutral palettes, premium knits, relaxed tailoring, and street-ready confidence', useOriginal: false },
  { id: 'style-dramatic', label: 'Art-forward', prompt: 'experimental menswear silhouettes inspired by New York Men\'s Day runways or Lemon8 street fashion—statement outerwear, layered textures, unexpected proportions, and bold accessories', useOriginal: false },
];

const WARDROBE_FEMALE = [
  { id: 'style-original', label: 'Original wardrobe', prompt: 'the clothing already worn in the upload, preserved authentically while removing wrinkles and pinning fabric for the most flattering fit', useOriginal: true },
  { id: 'style-women-tailored', label: 'Editorial womenswear', prompt: 'powerful womenswear tailoring that feels like a Khaite, Proenza Schouler, or The Row look—sculpted blazers, fluid trousers, monochrome palettes, and architectural silhouettes that read like a Vogue feature', useOriginal: false },
  { id: 'style-women-play', label: 'Playful womenswear', prompt: 'fashion-forward womenswear inspired by Jacquemus, Loewe, Cult Gaia, and other modern labels—unexpected cutouts, asymmetric draping, color-pop accessories, and artful textures that photograph with lively energy', useOriginal: false },
  { id: 'style-women-punk', label: 'Edgy rebel', prompt: 'avant-garde punk couture referencing Alexander McQueen, Balenciaga, Rick Owens, and Ann Demeulemeester—glossy leathers, sculpted jackets, metal hardware, and daring asymmetry', useOriginal: false },
  { id: 'style-women-vintage', label: 'Vintage chic', prompt: 'vintage-inspired luxury drawing from Chanel couture, Dior New Look, and Gucci archives—elegant midi silhouettes, nipped waists, silk scarves, brooches, and refined glove details', useOriginal: false },
  { id: 'style-women-sport', label: 'Sport luxe', prompt: 'elevated performance wear inspired by Prada Linea Rossa, Moncler Grenoble, and Louis Vuitton sport capsules—sleek technical fabrics, structured windbreakers, bold stripes, and sculpted sneakers', useOriginal: false },
];

// ─── Backdrops — full Nudio set (15 backdrops) ───

const BACKDROP_CHOICES = [
  { id: 'pink', label: 'Light Pink', description: 'Savage Seamless Light Pink (#08, hex #F6CADC)', tone: 'the signature nudio pink backdrop' },
  { id: 'primary-red', label: 'Primary Red', description: 'Savage Seamless Primary Red (#08R, hex #CE1126)', tone: 'a vivid primary red backdrop with high contrast' },
  { id: 'crimson', label: 'Crimson', description: 'Savage Seamless Crimson (#06, hex #8C1B2F)', tone: 'a rich crimson backdrop with dramatic depth' },
  { id: 'evergreen', label: 'Evergreen', description: 'Savage Seamless Evergreen (#18, hex #2E5339)', tone: 'a rich forest green backdrop (hex #2E5339) with natural depth and zero pink cast' },
  { id: 'bone', label: 'Bone', description: 'Savage Seamless Bone (#51, hex #E8DCC9)', tone: 'a warm, neutral bone backdrop' },
  { id: 'fashion-grey', label: 'Fashion Grey', description: 'Savage Seamless Fashion Grey (#56, hex #90969B)', tone: 'a soft city-fog grey backdrop with studio neutrality' },
  { id: 'deep-yellow', label: 'Deep Yellow', description: 'Savage Seamless Deep Yellow (#71, hex #FFB300)', tone: 'a glowing amber yellow backdrop with sunshine warmth' },
  { id: 'canary', label: 'Canary', description: 'Savage Seamless Canary (#38, hex #FFF44F)', tone: 'a light yellow backdrop with playful energy' },
  { id: 'blue-mist', label: 'Blue Mist', description: 'Savage Seamless Blue Mist (#41, hex #7CAFD6)', tone: 'a cool powder blue backdrop with airy vibrancy' },
  { id: 'ultramarine', label: 'Ultramarine', description: 'Savage Seamless Ultramarine (#05, hex #2B3D8C)', tone: 'a deep ocean blue backdrop with gallery depth' },
  { id: 'thunder-grey', label: 'Thunder Grey', description: 'Savage Seamless Thunder Grey (#27, hex #4A4C4E)', tone: 'a dramatic charcoal grey backdrop with soft shadow falloff' },
  { id: 'mint-green', label: 'Mint Green', description: 'Savage Seamless Mint Green (#40, hex #BEE7B8)', tone: 'a fresh pale green backdrop with modern calm' },
  { id: 'black', label: 'Black', description: 'Savage Seamless Black (#20, hex #000000)', tone: 'a midnight black backdrop with polished studio contrast' },
  { id: 'chesnut', label: 'Chestnut', description: 'Savage Seamless Chestnut (#16, hex #6B3F2E)', tone: 'a warm brown backdrop with organic depth' },
  { id: 'purple', label: 'Purple', description: 'Savage Seamless Purple (#62, hex #6F2DA8)', tone: 'a deep purple backdrop with stylish depth' },
];

// ─── Lighting — full Nudio set (42 setups across 4 groups) ───

function lp(text: string): string {
  return `${text.replace(/\s+/g, ' ').trim()} Describe only the light's effect on the subject and seamless backdrop. Keep every fixture, boom, stand, cable, reflection, or hardware element out of frame—lights must feel implied and invisible. Frame so the seamless background fills edge-to-edge with no studio floor, backdrop roll, or paper edge visible.`;
}

const LIGHTING_CHOICES = [
  // Executive & Authority
  { id: 'classic-executive', name: 'Classic Executive', prompt: lp('[Lighting Setup: Classic Executive], main light is a medium softbox positioned camera right creating modeled light, fill light from an umbrella near camera axis to open shadows, subject against a seamless [USER_COLOR] studio backdrop, background lit naturally by spill from the main light.') },
  { id: 'pure-high-key', name: 'Pure High Key', prompt: lp('[Lighting Setup: Pure High Key], main light is a medium softbox camera right, a gridded head bounces off the studio ceiling for general fill, two umbrellas blow out the seamless [USER_COLOR] backdrop to pure white, gobos prevent background flare on subject.') },
  { id: 'dramatic-rim-edge', name: 'Dramatic Rim Edge', prompt: lp('[Lighting Setup: Dramatic Rim Edge], main light is a medium softbox camera left, tight 30-degree gridded spot light with a warming gel acting as a hard rim/hair light from rear right, gobos used to shape light patterns on the seamless [USER_COLOR] backdrop.') },
  { id: 'hard-contrast', name: 'Hard Contrast', prompt: lp('[Lighting Setup: Hard Contrast], main light is a tight 30-degree grid spot camera left creating hard shadows, a medium softbox is placed directly behind the grid to soften the core shadow slightly, white reflector fill camera right, seamless [USER_COLOR] backdrop.') },
  { id: 'hero-low-angle', name: 'Hero Low Angle', prompt: lp('[Lighting Setup: Hero Low Angle], low angle hero perspective with a medium softbox from camera right, gridded spot light acting as a tight hair light from rear left, separate medium softbox illuminating the seamless [USER_COLOR] backdrop to create separation.') },
  { id: 'overhead-authority', name: 'Overhead Authority', prompt: lp('[Lighting Setup: Overhead Authority], main light is a large softbox on a boom stand positioned overhead and slightly left, silver reflector below camera right providing crisp fill, subject against a seamless [USER_COLOR] studio backdrop.') },
  { id: 'ambient-balance', name: 'Ambient Balance', prompt: lp('[Lighting Setup: Ambient Balance], main light is a medium softbox camera right feathering light onto the subject, subtle ambient studio practicals create a warm glow on the seamless [USER_COLOR] backdrop.') },
  { id: 'hard-architectural', name: 'Hard Architectural', prompt: lp('[Lighting Setup: Hard Architectural], main light is a hard 40-degree grid with spun glass diffusion from camera right creating distinct shadows, 20-degree gridded hair light, dedicated 30-degree gridded spot creating a pool of light on the seamless [USER_COLOR] backdrop.') },
  { id: 'controlled-spot', name: 'Controlled Spot', prompt: lp('[Lighting Setup: Controlled Spot], main light is a 40-degree grid with spun glass diffusion camera left, heavily goboed for precision, a separate 20-degree grid puts a tight spot on the seamless [USER_COLOR] backdrop.') },
  // Mood, Drama & Character
  { id: 'shadow-vignette', name: 'Shadow Vignette', prompt: lp('[Lighting Setup: Shadow Vignette], main light is a medium softbox from camera right creating deep shadows, silver reflector on camera left adding crisp fill, separate background light with a tight 40-degree grid and diffusion casting a controlled pool of light onto the center of the seamless [USER_COLOR] backdrop, creating a vignette effect.') },
  { id: 'faux-window', name: 'Faux Window', prompt: lp('[Lighting Setup: Faux Window], beauty dish with a grid positioned camera left and low, gobos used to shape the light into a window pattern on the subject and the seamless [USER_COLOR] backdrop.') },
  { id: 'backstage-grit', name: 'Backstage Grit', prompt: lp('[Lighting Setup: Backstage Grit], single beauty dish main light camera left providing crisp contrasty light, practical bulb lights positioned in the background creating ambient glow on the seamless [USER_COLOR] backdrop.') },
  { id: 'studio-drama', name: 'Studio Drama', prompt: lp('[Lighting Setup: Studio Drama], main light is a medium softbox camera right creating dramatic shadows, controlled spill illuminates the seamless [USER_COLOR] backdrop.') },
  { id: 'dual-gel-drama', name: 'Dual Gel Drama', prompt: lp('[Lighting Setup: Dual Gel Drama], 30-degree grid main light camera left for high contrast, two separate background lights with gobos, one with a blue gel and one with a green gel, casting distinct color washes on the seamless [USER_COLOR] backdrop. Render only the gels\' color story—not the physical backlights—so the moody washes feel like pure atmosphere.') },
  { id: 'warm-whimsy', name: 'Warm Whimsy', prompt: lp('[Lighting Setup: Warm Whimsy], treat the warm gelled heads as invisible ceiling bounces—you only describe the comforting golden wrap on the subject and subtle gradient on the seamless [USER_COLOR] backdrop. Never reveal the light bank on camera-left; if it starts to edge into frame, punch in or shift the angle until only the subject and backdrop remain.') },
  { id: 'tungsten-mix', name: 'Tungsten Mix', prompt: lp('[Lighting Setup: Tungsten Mix], main light is a grid with spun glass diffusion and a CTO gel applied, a second 30-degree grid with black foil gobos creates a triangular shadow pattern on the seamless [USER_COLOR] backdrop.') },
  { id: 'theatrical-stage', name: 'Theatrical Stage', prompt: lp('[Lighting Setup: Theatrical Stage], large softbox main light camera left, background features four separate heads fitted with 30-degree grids and varied colored gels creating stage-like spotlights on the seamless [USER_COLOR] backdrop.') },
  { id: 'surreal-pop', name: 'Surreal Pop', prompt: lp('[Lighting Setup: Surreal Pop], medium softbox main light camera right, processed with high-saturation color grading creating a surreal pop-art aesthetic against the seamless [USER_COLOR] backdrop.') },
  { id: 'artistic-gradient', name: 'Artistic Gradient', prompt: lp('[Lighting Setup: Artistic Gradient], main light is a beauty dish with a 30-degree grid camera right, gridded reflector for tight hair light, two umbrellas with colored gels illuminating the seamless [USER_COLOR] backdrop creating a graduated color effect.') },
  { id: 'motion-blur', name: 'Motion Blur', prompt: lp('[Lighting Setup: Motion Blur], main light is a 30-degree grid camera left, a 20-degree grid acts as a hair light, continuous tungsten hot lights illuminate the seamless [USER_COLOR] backdrop allowing for motion blur drag during exposure.') },
  { id: 'color-blur', name: 'Color Blur', prompt: lp('[Lighting Setup: Color Blur], large softbox main light camera left, 20-degree grid with blue gel hitting subjects from right rear, tungsten lights on seamless [USER_COLOR] backdrop creating warm motion blur effect.') },
  { id: 'gel-wash-split', name: 'Gel Wash Split', prompt: lp('[Lighting Setup: Gel Wash Split], main light is a medium softbox camera left, two background lights are fired through a diffusion screen, one with a red gel and one with a blue gel, creating a colored wash over the seamless [USER_COLOR] backdrop.') },
  { id: 'hard-shadow-play', name: 'Hard Shadow Play', prompt: lp('[Lighting Setup: Hard Shadow Play], beauty dish main light creating sharp defined shadows, single gridded background light carving dramatic shapes on the seamless [USER_COLOR] backdrop.') },
  // Families & Groups
  { id: 'group-overhead', name: 'Group Overhead', prompt: lp('[Lighting Setup: Group Overhead], large softbox placed high on a boom stand overhead/camera right to light the group evenly and avoid reflections, seamless [USER_COLOR] studio backdrop.') },
  { id: 'natural-fill', name: 'Natural Fill', prompt: lp('[Lighting Setup: Natural Fill], large softbox main light with on-camera flash diffuser used for subtle fill to open shadows on subjects, seamless [USER_COLOR] studio backdrop.') },
  { id: 'studio-window', name: 'Studio Window', prompt: lp('[Lighting Setup: Studio Window], medium softbox main light camera left simulating window light, a 30-degree gridded spot light creates accent on the seamless [USER_COLOR] backdrop.') },
  { id: 'soft-bonding', name: 'Soft Bonding', prompt: lp('[Lighting Setup: Soft Bonding], medium octagon softbox main light camera left providing soft wrapping light, a 40-degree grid with spun glass diffusion acts as a subtle rim light from rear right against seamless [USER_COLOR] backdrop.') },
  { id: 'active-coverage', name: 'Active Coverage', prompt: lp('[Lighting Setup: Active Coverage], large octagon softbox main light camera right for broad coverage allowing movement, large reflector fill camera left, seamless [USER_COLOR] studio backdrop.') },
  { id: 'balanced-softbox', name: 'Balanced Softbox', prompt: lp('[Lighting Setup: Balanced Softbox], medium rectangular softbox camera right providing main illumination, additional fill from umbrella camera left, seamless [USER_COLOR] studio backdrop.') },
  { id: 'warm-interior', name: 'Warm Interior', prompt: lp('[Lighting Setup: Warm Interior], medium softbox main light camera right, a second light with a 30-degree grid is angled down from above to separate subjects from the seamless [USER_COLOR] backdrop.') },
  { id: 'bounce-fill', name: 'Bounce Fill', prompt: lp('[Lighting Setup: Bounce Fill], medium softbox main light camera right with a gentle ceiling bounce providing fill over the seamless [USER_COLOR] backdrop. The ceiling glow should feel natural and sourceless—never depict the reflector or bounce card itself.') },
  { id: 'even-balance', name: 'Even Balance', prompt: lp('[Lighting Setup: Even Balance], medium softbox main light camera right creating even illumination across multiple subjects against seamless [USER_COLOR] backdrop.') },
  { id: 'umbrella-fill', name: 'Umbrella Fill', prompt: lp('[Lighting Setup: Umbrella Fill], portable strobe bounced into an off-camera white umbrella to illuminate subjects evenly against the seamless [USER_COLOR] backdrop. Treat the umbrella as invisible; only the wraparound quality of the light is shown.') },
  { id: 'twilight-balance', name: 'Twilight Balance', prompt: lp('[Lighting Setup: Twilight Balance], medium softbox main light camera right, background lights with blue gel creating cool tone gradient on seamless [USER_COLOR] backdrop.') },
  { id: 'large-space-fill', name: 'Large Space Fill', prompt: lp('[Lighting Setup: Large Space Fill], medium softbox left, large softbox right for main subjects, two additional heads are bounced off the studio ceiling to create ambient fill over seamless [USER_COLOR] backdrop.') },
  { id: 'studio-spotlight', name: 'Studio Spotlight', prompt: lp('[Lighting Setup: Studio Spotlight], emulate the feel of a large plume soft wrap coming from camera right and a tight 30-degree rim accent on the hero subject, yet keep every fixture off-frame and unseen. Treat both sources as implied, invisible lights sculpting the subject—never show the physical softbox, boom, or spotlight head. Allow only their effect on the seamless [USER_COLOR] backdrop and the subject\'s edges to be visible.') },
  // Studio Clean & Commercial
  { id: 'butterfly-beauty', name: 'Butterfly Beauty', prompt: lp('[Lighting Setup: Butterfly Beauty], imagine a large overhead softbox and white reflector shaping the face, plus a gridded hair light for separation on the seamless [USER_COLOR] backdrop. Describe only the luminous beauty ripple—never the reflector, boom, or any hardware. If a reflector would be visible, reframe tighter so only the subject and backdrop remain.') },
  { id: 'edgy-rim', name: 'Edgy Rim', prompt: lp('[Lighting Setup: Edgy Rim], main light is a large gridded softbox camera left, strong rim lighting provided by two medium softboxes placed rear left and rear right of subject creating bright highlights on clothing edges, distinct hair light from an overhead gridded boom spot, seamless [USER_COLOR] studio backdrop.') },
  { id: 'enveloping-soft', name: 'Enveloping Soft', prompt: lp('[Lighting Setup: Enveloping Soft], medium softbox main light camera right, two fill lights bounced off studio ceiling and walls to create an enveloping soft light against seamless [USER_COLOR] backdrop.') },
  { id: 'formal-promo', name: 'Formal Promo', prompt: lp('[Lighting Setup: Formal Promo], medium softbox main light camera right with an extra grid placed in front of it for tighter control, large white reflector fill, 40-degree gridded boom hair light, spun glass diffused grid on seamless [USER_COLOR] backdrop.') },
  { id: 'high-angle-down', name: 'High Angle Down', prompt: lp('[Lighting Setup: High Angle Down], camera elevated on ladder looking down, octagon softbox on boom stand angled down toward subject, reflector on floor for fill, seamless [USER_COLOR] studio backdrop.') },
  { id: 'graphic-studio', name: 'Graphic Studio', prompt: lp('[Lighting Setup: Graphic Studio], high camera angle, medium softbox main light, medium softbox lighting backdrop, 30-degree gridded hair light, 30-degree grid with red gel creating accent on seamless [USER_COLOR] backdrop.') },
  { id: 'mixed-commercial', name: 'Mixed Commercial', prompt: lp('[Lighting Setup: Mixed Commercial], medium light bank main camera left, a 30-degree grid bounces off ceiling for fill, separate accent light on seamless [USER_COLOR] backdrop creating depth.') },
  { id: 'clamshell-beauty', name: 'Clamshell Beauty', prompt: lp('[Lighting Setup: Clamshell Beauty], large softbox overhead as main light, large reflector below face creating wrap-around beauty lighting, hair light separating from seamless [USER_COLOR] backdrop.') },
  { id: 'clean-corporate', name: 'Clean Corporate', prompt: lp('[Lighting Setup: Clean Corporate], medium softbox camera right creating flattering modeling, white reflector fill, even illumination on seamless [USER_COLOR] backdrop.') },
  { id: 'fashion-forward', name: 'Fashion Forward', prompt: lp('[Lighting Setup: Fashion Forward], large octabank main light, strip lights as edge lights creating definition, seamless [USER_COLOR] backdrop with subtle gradient from background lights.') },
];

// ═══════════════════════════════════════════════════════════════════
//  PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════

interface WardrobeChoice { id: string; label: string; prompt: string; useOriginal: boolean }
interface LightingChoice { id: string; name: string; prompt: string }
interface BackdropChoice { id: string; label: string; description: string; tone: string }
interface LensChoice { id: string; label: string; prompt: string }
interface RetouchChoice { id: string; label: string; prompt: string }

interface PortraitCombo {
  lens: LensChoice;
  retouch: RetouchChoice;
  wardrobe: WardrobeChoice;
  lighting: LightingChoice;
  backdrop: BackdropChoice;
}

function buildPrompt(combo: PortraitCombo): string {
  const { lens, retouch, wardrobe, lighting, backdrop } = combo;

  const lightingText = lighting.prompt.replaceAll('[USER_COLOR]', backdrop.description);

  const wardrobeLine = wardrobe.useOriginal
    ? 'Use the clothing from the upload but steam away wrinkles and discreetly pin fabrics into the most flattering drape. Reimagine the outfit with new accessories, layers, or styling so each portrait feels freshly tailored even when garments repeat.'
    : `Restyle the subject in ${wardrobe.prompt}. Explore varied silhouettes, fabrics, and accessories so the wardrobe never repeats the same combination twice.`;

  return `Transform this casual iPhone selfie into a cinematic, fashion-editorial portrait while maintaining absolute realism. Maintain original skin tone and ethnic features exactly. Maintain forehead, nose, lips, eye color, and proportions precisely. Keep grey hair, scars, and asymmetry untouched.

Above every styling decision, the final portrait must feel undeniably like the same person\u2014when they see it, they should instantly recognize themselves in the image.

Preserve bone structure: keep identical cheekbones, jawline width, chin length, ear height, and eye spacing. Do not shrink or enlarge facial features. If the model is uncertain about facial geometry, err on the side of a slightly slimmer interpretation rather than widening the face. Professional retouching, makeup, and hair styling are allowed, but they must sit on top of the original geometry so the subject is instantly recognizable as themselves.

Do not introduce hair color changes or grey strands that weren't in the upload; honor the original pigment. Use sophisticated posing, body posture, tailored clothing, shaping garments, and flattering angles to naturally slim or elongate the physique while keeping anatomy believable.

Respect the subject's identity yet allow creative posing and lighting experimentation. Do not alter the shot's width-to-height proportions\u2014match the original aspect ratio exactly instead of cropping to a new frame.

Render using the Labs portrait research stack with ${lens.prompt}. Style the subject as if a wardrobe stylist, hair stylist, and makeup artist were on set \u2014 polished yet effortless.

Place the subject in front of a seamless nudio studio backdrop (${backdrop.label} \u2014 ${backdrop.description}) with ${lightingText}. Interpret every lighting diagram as creative direction only\u2014describe the sculpting effect (soft wrap, rim glow, hair separation, etc.) without ever depicting the physical fixtures or their reflections. The light sources must feel implied, invisible, and completely outside the frame.

Never show lighting equipment, stands, modifiers, reflections of fixtures, cables, rolled seamless edges, or studio floors. If any hardware begins to appear, immediately recompose or crop tighter until only the subject and the perfectly smooth ${backdrop.label} seamless wall remain edge to edge. This is non-negotiable: no matter what lighting technique you follow, frame and crop like a master photographer so zero physical lighting elements ever enter the shot. If hiding the gear requires changing the camera height or angle, do so instinctively.

${wardrobeLine} Avoid displaying visible brand logos, monograms, or text on garments or accessories\u2014keep all surfaces clean and label-free by default.

Use the Labs portrait workflow at its standard 2048-by-2048 render size for faster turnaround.

${retouch.prompt} Composition goals: shallow depth of field (f/2.0\u2013f/4.0 feel), precise focus on the eyes, natural confident expression, studio color grading that feels filmic but still honest. Mood keywords: editorial, refined, confident, minimalism, cinematic realism. Render up to 4K resolution with fully photorealistic detail.`;
}

// ═══════════════════════════════════════════════════════════════════
//  COMBO GENERATOR — 3 unique combos from the full pools
// ═══════════════════════════════════════════════════════════════════

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function generateCombos(gender: string): PortraitCombo[] {
  const wardrobePool = gender === 'female' ? WARDROBE_FEMALE : WARDROBE_MALE;

  const lenses = shuffle(LENS_CHOICES);
  const retouches = shuffle(RETOUCH_CHOICES);
  const wardrobes = shuffle(wardrobePool);
  const backdrops = shuffle(BACKDROP_CHOICES);
  const lightings = shuffle(LIGHTING_CHOICES);

  return [0, 1, 2].map(i => ({
    lens: lenses[i]!,
    retouch: retouches[i]!,
    wardrobe: wardrobes[i]!,
    lighting: lightings[i]!,
    backdrop: backdrops[i]!,
  }));
}

// ═══════════════════════════════════════════════════════════════════
//  HANDLER — matches Nudio backend API call structure exactly
// ═══════════════════════════════════════════════════════════════════

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType, agentId, gender } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'imageBase64 and mimeType required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Strip data URL prefix if present (same as Nudio backend)
    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const combos = generateCombos(gender || 'male');
    const portraits: Array<{ index: number; imageBase64: string; combo: PortraitCombo }> = [];
    const errors: string[] = [];

    // gemini-2.5-flash-image — same model as Nudio
    const imageModel = 'gemini-2.5-flash-image';

    for (let i = 0; i < combos.length; i++) {
      const combo = combos[i]!;
      const promptText = buildPrompt(combo);

      try {
        // Exact same API call structure as Nudio's optimize-listing backend
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  { inlineData: { mime_type: mimeType, data: base64Data } },
                  { text: promptText }
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                topP: 0.95,
                topK: 40,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Portrait ${i + 1} API error:`, errorText);
          errors.push(`Portrait ${i + 1}: API ${response.status}`);
          continue;
        }

        const data = await response.json();

        // CRITICAL: Use inlineData (camelCase) not inline_data (snake_case)
        let foundImage = false;
        if (data.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part.inlineData) {
              portraits.push({ index: i, imageBase64: part.inlineData.data, combo });
              foundImage = true;
              break;
            }
          }
        }

        if (!foundImage) {
          const textParts = data.candidates?.[0]?.content?.parts
            ?.filter((p: any) => p.text)
            ?.map((p: any) => p.text)
            ?.join(' ');
          errors.push(`Portrait ${i + 1}: No image returned${textParts ? ` \u2014 ${textParts.slice(0, 200)}` : ''}`);
        }
      } catch (genErr: any) {
        const msg = genErr.message || String(genErr);
        console.error(`Portrait ${i + 1} generation failed:`, msg);
        errors.push(`Portrait ${i + 1}: ${msg}`);
      }
    }

    if (portraits.length === 0) {
      return res.status(500).json({ error: 'All portrait generations failed', details: errors });
    }

    // Upload portraits to Supabase storage
    const results = [];
    for (const portrait of portraits) {
      const buffer = Buffer.from(portrait.imageBase64, 'base64');
      const fileName = `portraits/${agentId || 'temp'}/${Date.now()}-${portrait.index}.png`;

      const { error: uploadErr } = await supabase.storage
        .from('listing-designs')
        .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

      if (uploadErr) { console.error('Upload error:', uploadErr); continue; }

      const { data: urlData } = supabase.storage.from('listing-designs').getPublicUrl(fileName);

      results.push({
        url: urlData.publicUrl,
        index: portrait.index,
        settings: {
          lens: portrait.combo.lens.label,
          retouch: portrait.combo.retouch.label,
          wardrobe: portrait.combo.wardrobe.label,
          lighting: portrait.combo.lighting.name,
          backdrop: portrait.combo.backdrop.label,
        },
      });
    }

    // Upload original
    const origBuffer = Buffer.from(base64Data, 'base64');
    const origFileName = `portraits/${agentId || 'temp'}/${Date.now()}-original.jpg`;
    await supabase.storage.from('listing-designs').upload(origFileName, origBuffer, { contentType: mimeType, upsert: true });
    const { data: origUrlData } = supabase.storage.from('listing-designs').getPublicUrl(origFileName);

    // Save all portrait options to agent record so they persist across page reloads
    if (agentId) {
      await supabase
        .from('agents')
        .upsert({
          id: agentId,
          portrait_options: {
            original: origUrlData.publicUrl,
            portraits: results,
            generated_at: new Date().toISOString(),
          },
        }, { onConflict: 'id' })
        .then(() => {})
        .catch((e: any) => console.error('Failed to save portrait options:', e));
    }

    return res.status(200).json({
      portraits: results,
      original: origUrlData.publicUrl,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err: any) {
    console.error('Portrait handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

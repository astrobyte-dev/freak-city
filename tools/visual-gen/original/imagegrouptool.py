import argparse
import itertools
import os
import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image, ImageEnhance

# 1. Command-line controls for prompt content and style
DEFAULT_STYLE = (
    "32-bit retro pixel art, PS1 texture aesthetic, grungy neon cyberpunk district, "
    "vivid magenta and electric cyan neon glow, heavy shadows, acid rain puddles, "
    "post-dystopian melancholy atmosphere"
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Batch-generate cyberpunk/dystopian scene images with a shared style."
    )
    parser.add_argument(
        "--style",
        default=DEFAULT_STYLE,
        help="Style modifier string appended to every prompt (default: built-in 32-bit neon cyberpunk style).",
    )
    parser.add_argument(
        "--prompt",
        action="append",
        default=None,
        help="A concept prompt to use instead of the built-in pool. Repeat --prompt to supply several; "
             "they are cycled to fill --count images.",
    )
    parser.add_argument(
        "--prompts-file",
        default=None,
        help="Path to a text file with one concept prompt per line. Overrides --prompt and the built-in pool.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=20,
        help="Number of images to generate (default: 20).",
    )
    parser.add_argument(
        "--output-dir",
        default="output_images",
        help="Directory to save generated PNGs into (default: output_images).",
    )
    return parser.parse_args()


args = parse_args()

# 2. Style modifier applied to every generation (overridable via --style)
style_injection = args.style

# 3. Pool of 20 concept prompts covering interiors, exteriors, streets,
#    people, street vendors/selling, and general cyberpunk dystopia
#    (used as the default when --prompt / --prompts-file are not given)
default_concepts = [
    "dystopian interior of a building inside a red light district, poor souls selling whatever they can to survive, flowing alcohol, refractive slicked rainbow reflections from the windows, technopunk atmosphere",
    "cramped cyberpunk apartment interior, flickering neon sign bleeding through a cracked window, a lone figure slumped at a table, steam rising from a cheap noodle cup",
    "exterior of a towering megacorp skyscraper at night, holographic billboards looming over rain-soaked streets, drones patrolling between the buildings",
    "narrow back-alley street market, vendors hawking bootleg cybernetics and black-market implants from makeshift stalls, steam vents hissing into the neon fog",
    "crowded night market street scene, street food vendor grilling mystery meat on a rusted cart, customers haggling under strings of neon lanterns",
    "interior of an underground black-market clinic, a back-alley surgeon installing a cybernetic arm, dim red emergency lighting, wires hanging from the ceiling",
    "rain-slicked cyberpunk street at midnight, neon reflections pooling in the gutters, a lone pedestrian walking beneath a wall of glowing advertisements",
    "exterior tenement slum stacked with makeshift shacks and tangled wiring, laundry lines strung between buildings, smog choking the skyline above",
    "interior of a crowded noodle bar, patrons hunched over bowls under buzzing fluorescent tubes, a bartender pouring synthetic liquor behind a scratched counter",
    "street vendor selling salvaged electronics spread on a tarp, haggard customers picking through the scraps, neon signage reflecting off wet pavement",
    "wide shot of a dystopian city skyline choked in smog, towering arcology structures piercing through toxic orange clouds, distant flying vehicles",
    "interior of an abandoned subway station turned shantytown, refugees huddled around a burning barrel, graffiti-covered concrete pillars",
    "cyberpunk street corner with a fortune teller's stall, glowing holographic cards, a weary customer paying in scavenged credits",
    "exterior of a rundown apartment block covered in illegal neon signage and satellite dishes, a fire escape crowded with drying laundry and potted plants",
    "interior of a smoky underground bar, patrons with visible cybernetic augmentations drinking in silence, a single spotlight on an empty stage",
    "rain-soaked street crossing crowded with pedestrians under umbrellas, towering neon advertisements reflected in puddles, a stray dog scavenging near a food cart",
    "exterior view of a crumbling overpass turned into a slum market, tarps strung overhead for shelter, vendors selling scavenged parts and food",
    "interior of a corporate lobby fallen into disrepair, cracked marble floors, a broken holographic directory flickering weakly, a homeless figure sleeping in the corner",
    "narrow alleyway street scene, a street performer playing a battered instrument for scattered coins, neon graffiti glowing on the brick walls",
    "wide dystopian street view at dawn, exhausted workers trudging past shuttered storefronts, a single neon-lit ramen stall still open, mist rolling low over the pavement",
]

assert len(default_concepts) == 20, "Expected exactly 20 prompts"

# 4. Resolve the actual prompt list to use, in priority order:
#    --prompts-file > --prompt (one or more) > built-in default pool
if args.prompts_file:
    with open(args.prompts_file, "r", encoding="utf-8") as f:
        chosen_concepts = [line.strip() for line in f if line.strip()]
    if not chosen_concepts:
        raise ValueError(f"No prompts found in --prompts-file '{args.prompts_file}'")
elif args.prompt:
    chosen_concepts = args.prompt
else:
    chosen_concepts = default_concepts

# Cycle the chosen prompt(s) to exactly match --count images
user_concepts = list(itertools.islice(itertools.cycle(chosen_concepts), args.count))

output_dir = args.output_dir
os.makedirs(output_dir, exist_ok=True)

print("Loading model...")
pipeline = AutoPipelineForText2Image.from_pretrained(
    "stabilityai/sdxl-turbo",
    torch_dtype=torch.float16 if (torch.cuda.is_available()) else torch.float32,
    variant="fp16"
).to("cuda" if torch.cuda.is_available() else "cpu")


# 5. Post-processing pipeline for the "32-bit Crunch"
def apply_retro_crunch(img, target_width=320):
    # Downscale using nearest-neighbor to lock in pixel structure
    aspect_ratio = img.height / img.width
    target_height = int(target_width * aspect_ratio)
    img_small = img.resize((target_width, target_height), Image.Resampling.NEAREST)

    # Quantize colors to simulate a restricted retro color palette
    img_quantized = img_small.quantize(colors=48, method=Image.Quantize.MEDIANCUT).convert("RGB")

    # Push contrast to make the neon elements pop against dark grime
    enhancer = ImageEnhance.Contrast(img_quantized)
    return enhancer.enhance(1.3)


# 6. Generate and save all images
for index, user_concept in enumerate(user_concepts, start=1):
    full_prompt = f"{user_concept}, {style_injection}"
    print(f"[{index}/{len(user_concepts)}] Generating: '{full_prompt}'...")

    image = pipeline(
        prompt=full_prompt,
        num_inference_steps=2,
        guidance_scale=0.0
    ).images[0]

    final_asset = apply_retro_crunch(image, target_width=320)
    output_filename = os.path.join(output_dir, f"lucid_street_asset_{index:02d}.png")
    final_asset.save(output_filename, "PNG")

    print(f"  Saved 32-bit grungy PNG to {output_filename}")

print(f"Success! Generated {len(user_concepts)} images in '{output_dir}/'")

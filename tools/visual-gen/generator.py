"""Local SDXL Turbo implementation; imports Torch only when generation is requested."""
import importlib.metadata
import os
import shutil
from pathlib import Path

VERSION = "freak-city-visual-gen/3"
MODEL = "stabilityai/sdxl-turbo"


def retro_crunch(image, width=320, colors=48, contrast=1.3):
    from PIL import Image, ImageEnhance
    if not 32 <= width <= 640 or not 2 <= colors <= 256 or not 0.5 <= contrast <= 2:
        raise ValueError("Crunch bounds: width 32..640, colors 2..256, contrast 0.5..2")
    small = image.convert("RGB").resize((width, max(1, round(width * image.height / image.width))), Image.Resampling.NEAREST)
    return ImageEnhance.Contrast(small.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGB")).enhance(contrast)


def display_upscale(image, width):
    """Nearest neighbour only; rounded height preserves aspect within one pixel."""
    from PIL import Image
    if not isinstance(width, int) or not image.width <= width <= 2048:
        raise ValueError("Display width must be between pixel width and 2048")
    return image.resize((width, round(width * image.height / image.width)), Image.Resampling.NEAREST)


def model_load_options(device, torch, revision=None, offline=False):
    options = {"torch_dtype": torch.float16 if device == "cuda" else torch.float32,
               "local_files_only": offline, "use_safetensors": True}
    if device == "cuda":
        options["variant"] = "fp16"
    if revision:
        options["revision"] = revision
    return options


def cache_space_check():
    cache = Path(os.environ.get("HF_HOME", Path.home() / ".cache/huggingface")).expanduser()
    ancestor = cache
    while not ancestor.exists():
        ancestor = ancestor.parent
    # A conservative early check, not an assertion of the final download size.
    if shutil.disk_usage(ancestor).free < 2_000_000_000:
        raise RuntimeError("Less than 2 GB free on the model cache volume. Free space or set HF_HOME before generation.")


class SDXLTurbo:
    def __init__(self, device="cuda", allow_cpu=False, revision=None, offline=False, reference=None):
        try:
            import torch
            from diffusers import AutoPipelineForText2Image, AutoPipelineForImage2Image
        except ImportError as error:
            raise RuntimeError("Missing local model dependencies. Install tools/visual-gen/requirements.txt in a virtual environment; dry-run and fixture modes do not need them.") from error
        if device == "cuda" and not torch.cuda.is_available():
            raise RuntimeError("CUDA unavailable. Check the NVIDIA driver and Torch wheel. CPU is never selected silently; explicitly use --device cpu --allow-cpu if intended.")
        if device == "cpu" and not allow_cpu:
            raise RuntimeError("CPU generation can be extremely slow. Explicitly add --allow-cpu to use it.")
        cache_space_check()
        print(f"Loading {MODEL} on {device}; {'FP16 weights' if device == 'cuda' else 'FP32 default weights; CPU may be very slow'}.")
        self.torch = torch
        self.device = device
        self.reference = reference
        try:
            pipeline_type = AutoPipelineForImage2Image if reference is not None else AutoPipelineForText2Image
            self.pipeline = pipeline_type.from_pretrained(MODEL, **model_load_options(device, torch, revision, offline)).to(device)
        except Exception as error:
            text = str(error).lower()
            if "out of memory" in text:
                raise RuntimeError("Model loading ran out of memory. Free GPU memory or use a smaller supported local adapter; no automatic CPU fallback.") from error
            if "variant" in text or "dtype" in text:
                raise RuntimeError("Unsupported weight variant or dtype. CUDA requests fp16; CPU requests the default FP32 weights. Check the model revision and Diffusers version.") from error
            raise RuntimeError("Model load/download failed. Check network access, model access, HF_HOME free space and cache. With --offline, weights must already be cached.") from error
        self.environment = {"device": device, "dtype": "float16" if device == "cuda" else "float32",
                            "weightVariant": "fp16" if device == "cuda" else "default",
                            "torch": importlib.metadata.version("torch"), "diffusers": importlib.metadata.version("diffusers"),
                            "modelRevision": revision or "un-pinned", "cuda": torch.version.cuda,
                            "gpu": torch.cuda.get_device_name(0) if device == "cuda" else None,
                            "pipeline": type(self.pipeline).__name__, "scheduler": type(self.pipeline.scheduler).__name__,
                            "timestepSpacing": self.pipeline.scheduler.config.timestep_spacing}

    def generate(self, spec, options, seed):
        prompt = spec["modelPrompt"]
        # Prevent silent truncation of the actual compact prompt.
        for name in ("tokenizer", "tokenizer_2"):
            tokenizer = getattr(self.pipeline, name, None)
            if tokenizer and len(tokenizer(prompt).input_ids) > tokenizer.model_max_length:
                raise ValueError("Model prompt exceeds CLIP context; shorten it. Full review facts remain in the sidecar.")
        try:
            inputs = {"image": self.reference.copy(), "strength": options["strength"]} if self.reference is not None else {"width": options["width"], "height": options["height"]}
            with self.torch.inference_mode():
                return self.pipeline(prompt=prompt, generator=self.torch.Generator(device="cpu").manual_seed(seed),
                                     num_inference_steps=options["steps"], guidance_scale=0.0,
                                     **inputs).images[0]
        except self.torch.cuda.OutOfMemoryError as error:
            raise RuntimeError("Generation ran out of GPU memory. Free memory or lower dimensions; no silent CPU fallback.") from error


def fixture_image(seed, width, height):
    """Deterministic test texture, deliberately not an AI-generated room."""
    import random
    from PIL import Image, ImageDraw
    rng = random.Random(seed)
    image = Image.new("RGB", (width, height), (32, 30, 37))
    draw = ImageDraw.Draw(image)
    for _ in range(1800):
        x, y = rng.randrange(width), rng.randrange(height)
        c = rng.choice([(45, 40, 47), (55, 47, 51), (27, 32, 39), (67, 60, 59)])
        draw.rectangle((x, y, x + rng.randrange(2, 8), y + 2), fill=c)
    return image

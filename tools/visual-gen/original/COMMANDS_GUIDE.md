# Pipeline Execution & Command Quick Reference

Execute the script from your terminal using the following options to customize asset generation:

* **Basic Generation:** Runs the script with default settings, producing 20 images using the built-in concept pool.
  ```powershell
  python imagegentoo.py
  ```
* **Custom Batch Size & Directory:** Directs output to a custom folder while overriding the target asset count.
  ```powershell
  python imagegentoo.py --count 5 --output-dir my_game_assets
  ```
* **Inline Prompt Injection:** Bypasses default pools by supplying manual prompts directly via command flags.
  ```powershell
  python imagegentoo.py --prompt "abandoned synth-lab" --prompt "cyberpunk street vendor" --count 2
  ```
* **File-Based Batching:** Pulls external prompt lists line-by-line from a text file.
  ```powershell
  python imagegentoo.py --prompts-file prompts.txt --count 10
  ```

---

## Detailed Argument Breakdown

| Argument Flag | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--style` | String | Neon cyberpunk aesthetic | Appends global modifier text to every generated prompt. |
| `--prompt` | String (Repeatable) | Built-in 20-item pool | Custom concept prompt; repeat flag for multiple distinct inputs. |
| `--prompts-file` | File Path | `None` | Reads text lines sequentially to use as custom concept prompts. |
| `--count` | Integer | `20` | Total number of asset files to generate (auto-cycles prompts if limit exceeds pool). |
| `--output-dir` | Directory Path | `output_images` | Destination folder where finalized PNG assets are written. |

---

## Script Mechanics Overview

1. **Argument Parsing:** Uses Python's built-in `argparse` module to handle CLI inputs, allowing overrides for styling, batch counts, and input sources.
2. **Prompt Resolution:** Evaluates priority rules (`--prompts-file` > `--prompt` > built-in default pool) and cycles through items using `itertools.cycle` to hit the requested `--count`.
3. **Model Initialization:** Loads `stabilityai/sdxl-turbo` through `diffusers` with hardware-accelerated precision (`torch.float16` on CUDA).
4. **Retro Crunch Post-Processing:** 
   * **Downscaling:** Resizes the generated image via nearest-neighbor interpolation (`Image.Resampling.NEAREST`) to establish the target pixel structure.
   * **Color Quantization:** Reduces the color count down to 48 using median-cut quantization (`Image.Quantize.MEDIANCUT`).
   * **Contrast Boost:** Enhances overall contrast to make neon values pop against the dark, grimy shadows.

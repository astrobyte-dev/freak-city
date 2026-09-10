# Local AI Pipeline Setup Guide

This guide covers setting up your local environment to run high-speed image generation assets (SDXL Turbo) while routing heavy model weights away from your main OS drive to a secondary drive (e.g., `G:\LLMModels`).

---

## 1. Prerequisites
* Python 3.10+ installed on your system.
* A dedicated secondary drive or partition with at least 15GB–20GB of free space (e.g., `G:\`).
* An NVIDIA GPU with CUDA support for accelerated local processing.

---

## 2. Environment Configuration (Routing Models to Secondary Drive)

To prevent models from filling up your primary SSD (`C:` drive), configure the Hugging Face cache directory globally.

### Windows (System Environment Variables)
1. Press the Windows key, search for **Environment Variables**, and select **Edit the system environment variables**.
2. Click the **Environment Variables...** button at the bottom right.
3. Under **User variables**, click **New...**:
   * **Variable name:** `HF_HOME`
   * **Variable value:** `G:\LLMModels\HF_HOME`
4. Click **OK** on all windows to save.
5. Restart your terminal or code editor (like VS Code) for changes to take effect.

---

## 3. Installation & Dependencies

1. Clone or download your project folder containing the script and requirements.
2. Open a terminal in your project directory.
3. Install the required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

---

## 4. Running the Script Safely

1. Verify your GPU is accessible and path variables are recognized:
   ```powershell
   python -c "import os, torch; print('HF Path:', os.environ.get('HF_HOME')); print('GPU Ready:', torch.cuda.is_available())"
   ```
2. Execute your asset generation script:
   ```powershell
   python imagegentoo.py
   ```

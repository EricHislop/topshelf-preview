#!/usr/bin/env python3
"""Queue SDXL product shots into local ComfyUI and save into the repo."""
import json, os, time, urllib.parse, urllib.request, shutil, sys

API = "http://127.0.0.1:8188"
OUT = os.path.expanduser("~/code/sillage-demo/assets/img")

STYLE = ("editorial luxury product photograph, a single small clear glass fragrance decant vial "
         "with a matte black cap standing upright on rough dark stone, ")
TAIL = (", fine fragrance mist in the air, shallow depth of field, 85mm, photorealistic, "
        "high detail, no text, no labels, no branding, no watermark")
NEG = ("text, words, letters, numbers, label, logo, watermark, signature, deformed, blurry, "
       "low quality, cartoon, illustration, painting, multiple bottles, hands, people, faces")

JOBS = [
    ("noir-29", "warm near-black background, one hard amber side light from the right, drifting smoke", 832, 1216, 11),
    ("citrus-vert", "pale cool blue-green background, soft morning daylight from the left, condensation on the glass", 832, 1216, 22),
    ("fig-cedar", "muted olive green background, soft diffused window light, a single fig leaf resting beside the vial", 832, 1216, 33),
    ("amber-soleil", "deep burnt orange background, hard low sunlight, long shadow, glowing amber liquid", 832, 1216, 44),
    ("salt-rose", "dusty rose background, soft overcast light, a few dried rose petals on the stone", 832, 1216, 55),
    ("vetiver-03", "cool grey green background, low raking light, a piece of charred oak beside the vial", 832, 1216, 66),
    ("tonka-nuit", "deep chocolate brown background, warm lamp light from one side, tonka beans on the stone", 832, 1216, 77),
    ("white-tea", "warm off white bone background, clean soft light, the edge of a white porcelain cup", 832, 1216, 88),
    ("hero", "three small glass vials with black caps on a long dark stone slab, wide cinematic still life, a shaft of warm light cutting across, smoke in the dark, deep shadow", 1216, 832, 99),
    ("trio", "three glass vials of different sizes in a row on dark stone, overhead three quarter view, soft warm light, deep shadow", 1216, 832, 111),
]

def graph(prompt, neg, w, h, seed):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["1", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "5": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": 30, "cfg": 6.5,
              "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0,
              "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]}},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"filename_prefix": "sillage", "images": ["6", 0]}},
    }

def post(path, payload):
    req = urllib.request.Request(API + path, data=json.dumps(payload).encode(),
                                headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=30))

def wait(pid, timeout=600):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.load(urllib.request.urlopen(f"{API}/history/{pid}", timeout=15))
            if pid in h:
                return h[pid]
        except Exception:
            pass
        time.sleep(2)
    raise TimeoutError(pid)

def main():
    os.makedirs(OUT, exist_ok=True)
    for name, scene, w, h, seed in JOBS:
        dest = os.path.join(OUT, name + ".png")
        if os.path.exists(dest) and os.path.getsize(dest) > 50000:
            print("skip", name); continue
        prompt = STYLE + scene + TAIL
        pid = post("/prompt", {"prompt": graph(prompt, NEG, w, h, seed)})["prompt_id"]
        res = wait(pid)
        img = res["outputs"]["7"]["images"][0]
        q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
        with urllib.request.urlopen(f"{API}/view?{q}", timeout=60) as r, open(dest, "wb") as f:
            shutil.copyfileobj(r, f)
        print("ok", name, os.path.getsize(dest), flush=True)

if __name__ == "__main__":
    main()

"""Explicit pinned FP16 download. Never fetch alternate formats or model families."""
import argparse
import json
import os
from pathlib import Path
import shutil
import time


def prepare(download=False):
    from huggingface_hub import hf_hub_download, try_to_load_from_cache
    models=json.loads(Path(__file__).with_name("controlnet-models.json").read_text())
    cache=Path(os.environ.get("HF_HOME",Path.home()/".cache/huggingface"))
    ancestor=cache
    while not ancestor.exists(): ancestor=ancestor.parent
    total=sum(m["selectedBytes"] for m in models)
    if download and shutil.disk_usage(ancestor).free < total*2:
        raise RuntimeError("Model cache needs twice the selected download size free for staging")
    started=time.perf_counter(); records=[]
    for model in models:
        for file in model["files"]:
            cached=try_to_load_from_cache(model["repo"],file["file"],revision=model["revision"])
            present=isinstance(cached,str) and Path(cached).is_file()
            record={"repo":model["repo"],"revision":model["revision"],**file,"cachedBefore":present}
            if download:
                path=Path(hf_hub_download(model["repo"],file["file"],revision=model["revision"]))
                if path.stat().st_size!=file["bytes"]: raise RuntimeError("Downloaded size differs from pinned inventory")
                record["path"]=str(path)
            records.append(record)
    return {"hfHome":str(cache),"selectedBytes":total,"uncachedFileBytes":sum(r["bytes"] for r in records if not r["cachedBefore"]),
            "byteMeaning":"Selected file payload; excludes HTTP overhead and cache deduplication", "downloaded":download,
            "elapsedSeconds":round(time.perf_counter()-started,3),"files":records}


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument("--download",action="store_true"); parser.add_argument("--report")
    args=parser.parse_args(); report=prepare(args.download)
    if args.report: Path(args.report).write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k!="files"},indent=2))

import os
import json
import urllib.request
import argparse
import hashlib
import sys

DOI = "10.5281/zenodo.3987736"
ZENODO_API_URL = "https://zenodo.org/api/records/3987736"
RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "climate_raw")

def verify_md5(filepath, expected_md5):
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest() == expected_md5

def download_file(url, filepath):
    print(f"Downloading {url} to {filepath}...")
    urllib.request.urlretrieve(url, filepath)

def run_downloader():
    parser = argparse.ArgumentParser(description="Zenodo CMIP6 Climate Dataset Downloader")
    parser.add_argument("--dry-run", action="store_true", help="Print file metadata without downloading")
    parser.add_argument("--sample", action="store_true", help="Generate local sample files for Tamil Nadu / Kerala coordinates")
    args = parser.parse_args()

    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    print(f"Querying Zenodo API for record DOI: {DOI}...")
    
    try:
        req = urllib.request.Request(
            ZENODO_API_URL, 
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req) as response:
            metadata = json.loads(response.read().decode())
        
        files_list = metadata.get("files", [])
        print(f"Successfully retrieved metadata. Total archive files: {len(files_list)}")
        
        # Save metadata info locally
        meta_filepath = os.path.join(RAW_DATA_DIR, "zenodo_metadata.json")
        with open(meta_filepath, "w") as f:
            json.dump(metadata, f, indent=2)
        print(f"Saved dataset metadata descriptor to {meta_filepath}")

        # Summary of files
        for f_info in files_list:
            name = f_info.get("key", "")
            size_mb = f_info.get("size", 0) / (1024 * 1024)
            checksum = f_info.get("checksum", "")
            print(f"- File: {name} ({size_mb:.2f} MB) Checksum: {checksum}")

        # Append paths (three directory levels to get project root)
        sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

        if args.dry_run:
            print("Dry-run active. Skipping file downloads.")
            return

        if args.sample:
            print("Sample mode active. Generating calibration sample records...")
            # Reuse logic to populate data/climate_raw with Tamil Nadu/Kerala coordinate grid columns
            from scripts.generate_sample_climate import generate_sample_data
            generate_sample_data()
            return

        # Attempt to download first file (if user wishes)
        if len(files_list) > 0:
            first_file = files_list[0]
            download_url = first_file["links"]["self"]
            out_path = os.path.join(RAW_DATA_DIR, first_file["key"])
            download_file(download_url, out_path)
            
            expected_hash = first_file["checksum"].replace("md5:", "")
            if verify_md5(out_path, expected_hash):
                print("Verification SUCCESS: MD5 matches Zenodo record.")
            else:
                print("Verification FAILED: MD5 mismatch.")

    except Exception as e:
        print(f"Error querying Zenodo API: {e}")
        if args.sample or not args.dry_run:
            print("Falling back to local sample generation...")
            sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            from scripts.generate_sample_climate import generate_sample_data
            generate_sample_data()

if __name__ == "__main__":
    run_downloader()

#!/usr/bin/env python3
import subprocess
import os
import glob

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=5).decode().strip()
    except Exception as e:
        return f"ERR: {e}"

print("=== SDDM Package Info ===")
print(run("dpkg -l | grep -i sddm"))

print("\n=== SDDM Systemd Status ===")
print(run("systemctl is-active sddm || true"))

print("\n=== SDDM Config Files ===")
for p in ["/etc/sddm.conf", "/usr/lib/sddm/sddm.conf.d", "/etc/sddm.conf.d"]:
    if os.path.exists(p):
        print(f"Path: {p}")
        if os.path.isdir(p):
            for f in sorted(glob.glob(f"{p}/*")):
                print(f"  File: {f}")
                print(run(f"cat '{f}'"))
        else:
            print(run(f"cat '{p}'"))

print("\n=== SDDM Themes in /usr/share/sddm/themes ===")
if os.path.exists("/usr/share/sddm/themes"):
    for t in os.listdir("/usr/share/sddm/themes"):
        t_path = os.path.join("/usr/share/sddm/themes", t)
        print(f"Theme: {t}")
        meta = os.path.join(t_path, "metadata.desktop")
        theme_conf = os.path.join(t_path, "theme.conf")
        if os.path.exists(meta):
            print("  metadata.desktop:", run(f"head -n 10 '{meta}'"))
        if os.path.exists(theme_conf):
            print("  theme.conf:", run(f"head -n 10 '{theme_conf}'"))

print("\n=== Active SDDM Theme from kreadconfig6 / sddm ===")
print(run("kreadconfig6 --file /etc/sddm.conf.d/kde_settings.conf --group Theme --key Current || true"))
print(run("sddm-greeter --version || true"))

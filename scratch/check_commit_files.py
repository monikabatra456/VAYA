# scratch/check_commit_files.py
import subprocess

def run(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return res.stdout, res.stderr

out, err = run("git ls-tree -r --name-only c2f5f90 | grep -i wonder")
print("c2f5f90 wonder files:\n", out)

out, err = run("git log -p -n 1 --stat c2f5f90")
print("c2f5f90 stat:\n", out[:1500])

# scratch/check_git_wonder.py
import subprocess

def run(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return res.stdout

print("Git show c2f5f90 --stat:")
print(run("git show --stat c2f5f90"))

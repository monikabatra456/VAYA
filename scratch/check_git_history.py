# scratch/check_git_history.py
import subprocess

def run(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return res.stdout, res.stderr

out, err = run("git log -n 15 --oneline")
print("Git log:\n", out)

out, err = run("git status --short")
print("Git status:\n", out)

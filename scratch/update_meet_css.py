with open('src/components/meet/meet.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace will-change on .mv-word
old_word = """.mv-word {
  display: inline-block;
  white-space: pre;
  will-change: transform, opacity, filter;
}"""

new_word = """.mv-word {
  display: inline-block;
  white-space: pre;
  will-change: transform, opacity;
}"""

old_col = """.mv-left-col {
  position: absolute;
  left: 9vw;
  top: 50%;
  transform: translateY(-50%);
  max-width: 40vw;
  z-index: 10;
  display: flex;
  flex-direction: column;
}"""

new_col = """.mv-left-col {
  position: absolute;
  left: 9vw;
  top: 50%;
  transform: translateY(-50%);
  max-width: 40vw;
  z-index: 10;
  display: flex;
  flex-direction: column;
  will-change: transform, opacity;
}"""

# Normalize for matching
content = content.replace("\r\n", "\n")
old_word_n = old_word.replace("\r\n", "\n")
new_word_n = new_word.replace("\r\n", "\n")
old_col_n = old_col.replace("\r\n", "\n")
new_col_n = new_col.replace("\r\n", "\n")

if old_word_n in content:
    content = content.replace(old_word_n, new_word_n)
    print("Replaced .mv-word successfully")
else:
    print("WARNING: .mv-word not found")

if old_col_n in content:
    content = content.replace(old_col_n, new_col_n)
    print("Replaced .mv-left-col successfully")
else:
    print("WARNING: .mv-left-col not found")

# Restore CRLF
content = content.replace("\n", "\r\n")

with open('src/components/meet/meet.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated src/components/meet/meet.css")


import time
import os
import shutil
from PIL import Image
from playwright.sync_api import sync_playwright

artifact_dir = r'C:\Users\lenovo\.gemini\antigravity\brain\432d51ee-f3ad-41df-84d9-a05aa065a089'
os.makedirs('scratch/screenshots', exist_ok=True)
os.makedirs(artifact_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    
    print('Navigating to http://localhost:3000...')
    page.goto('http://localhost:3000', wait_until='networkidle')
    time.sleep(1)

    # Scroll to #meet-vaya section
    print('Scrolling to #meet-vaya...')
    page.evaluate('''() => {
        const el = document.getElementById('meet-vaya');
        if (el) el.scrollIntoView({ behavior: 'instant' });
    }''')
    time.sleep(1.5)

    # Wait for phone stage to be visible
    page.wait_for_selector('.mv-phone-stage', state='visible')
    
    # Pause GSAP floating animations for steady screenshots
    page.evaluate('''() => {
        if (window.gsap) {
            window.gsap.globalTimeline.pause();
        }
    }''')
    time.sleep(0.3)

    bbox = page.locator('.mv-phone-stage').bounding_box()
    print('Phone stage bbox:', bbox)

    def capture_state(name, thumb_transform, shadow_styles=None, ripple_styles=None):
        page.evaluate(f'''() => {{
            const thumb = document.querySelector('.mv-thumb-img');
            const shadow = document.querySelector('.mv-contact-shadow');
            const ripple = document.querySelector('.mv-ripple');
            if (thumb) thumb.style.transform = '{thumb_transform}';
            
            if (shadow) {{
                shadow.style.left = '{shadow_styles.get("left", "70%") if shadow_styles else "70%"}';
                shadow.style.top = '{shadow_styles.get("top", "79%") if shadow_styles else "79%"}';
                shadow.style.opacity = '{shadow_styles.get("opacity", "0") if shadow_styles else "0"}';
                shadow.style.transform = '{shadow_styles.get("transform", "translate(-50%, -50%) scale(1)") if shadow_styles else "translate(-50%, -50%) scale(1)"}';
            }}
            
            if (ripple) {{
                ripple.style.left = '{ripple_styles.get("left", "70%") if ripple_styles else "70%"}';
                ripple.style.top = '{ripple_styles.get("top", "79%") if ripple_styles else "79%"}';
                ripple.style.opacity = '{ripple_styles.get("opacity", "0") if ripple_styles else "0"}';
                ripple.style.transform = '{ripple_styles.get("transform", "translate(-50%, -50%) scale(0.4)") if ripple_styles else "translate(-50%, -50%) scale(0.4)"}';
            }}
        }}''')
        time.sleep(0.3)

        full_path = f'scratch/screenshots/{name}_1440.png'
        phone_path = f'scratch/screenshots/{name}_phone.png'
        page.screenshot(path=full_path)
        
        # Crop phone stage using PIL
        im = Image.open(full_path)
        # Add slight margin around bbox
        bx1 = max(0, int(bbox['x']))
        by1 = max(0, int(bbox['y']))
        bx2 = min(im.width, int(bbox['x'] + bbox['width']))
        by2 = min(im.height, int(bbox['y'] + bbox['height']))
        phone_crop = im.crop((bx1, by1, bx2, by2))
        phone_crop.save(phone_path)
        print(f'Saved {name} (full and phone crop).')

    # 1. At Rest
    capture_state('verify_rest', 'none', {'opacity': '0'}, {'opacity': '0'})

    # 2. Mid Reach
    capture_state(
        'verify_mid_reach',
        'translate(-3px, -2px) rotate(-17deg) scale(1.02)',
        {'opacity': '0.2', 'transform': 'translate(-50%, -50%) scale(1.05)'},
        {'opacity': '0'}
    )

    # 3. Contact (reach/press moment with ripple and contact shadow)
    capture_state(
        'verify_contact',
        'translate(-6px, -2px) rotate(-34deg) scale(0.97)',
        {'opacity': '0.35', 'transform': 'translate(-50%, -50%) scale(0.95)'},
        {'opacity': '0.65', 'transform': 'translate(-50%, -50%) scale(0.7)'}
    )

    # 4. Return
    capture_state(
        'verify_return',
        'translate(-2px, -1px) rotate(-10deg) scale(1.0)',
        {'opacity': '0.05'},
        {'opacity': '0'}
    )

    browser.close()

# 5. Generate 3x Zoom Crops from the captured 1440px screenshots
img_rest = Image.open('scratch/screenshots/verify_rest_phone.png')
img_contact = Image.open('scratch/screenshots/verify_contact_phone.png')
w_s, h_s = img_rest.size

# Joint is around x=59.3%, y=45.7% of the phone stage
jx = int(0.593 * w_s)
jy = int(0.457 * h_s)
box_size = int(0.09 * w_s)

joint_crop_rest = img_rest.crop((jx - box_size, jy - box_size, jx + box_size, jy + box_size))
joint_zoom_rest = joint_crop_rest.resize((box_size * 2 * 3, box_size * 2 * 3), Image.NEAREST)
joint_zoom_rest.save('scratch/screenshots/zoom3x_thumb_joint_rest.png')

joint_crop_contact = img_contact.crop((jx - box_size, jy - box_size, jx + box_size, jy + box_size))
joint_zoom_contact = joint_crop_contact.resize((box_size * 2 * 3, box_size * 2 * 3), Image.NEAREST)
joint_zoom_contact.save('scratch/screenshots/zoom3x_thumb_joint_contact.png')

# Right bezel under thumb (y 280-450 in image = y 21.7% - 34.8% of phone stage, x ~ 57%)
bx = int(0.573 * w_s)
by = int(0.28 * h_s)
bw = int(0.06 * w_s)
bh = int(0.12 * h_s)

bezel_crop_rest = img_rest.crop((bx - bw, by - bh, bx + bw, by + bh))
bezel_zoom_rest = bezel_crop_rest.resize((bw * 2 * 3, bh * 2 * 3), Image.NEAREST)
bezel_zoom_rest.save('scratch/screenshots/zoom3x_right_bezel_rest.png')

bezel_crop_contact = img_contact.crop((bx - bw, by - bh, bx + bw, by + bh))
bezel_zoom_contact = bezel_crop_contact.resize((bw * 2 * 3, bh * 2 * 3), Image.NEAREST)
bezel_zoom_contact.save('scratch/screenshots/zoom3x_right_bezel_contact.png')

print('Generated 3x zoom crops.')

# Copy files to artifact dir
for fname in os.listdir('scratch/screenshots'):
    src = os.path.join('scratch/screenshots', fname)
    dst = os.path.join(artifact_dir, fname)
    shutil.copy2(src, dst)
print('Copied all verification screenshots and 3x zoom crops to artifact directory.')

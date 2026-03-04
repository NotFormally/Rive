import re

with open('src/components/LandingPage.tsx', 'r') as f:
    text = f.read()

# 1. GSAP Colors
text = text.replace('"rgba(242, 240, 233, 0.6)"', '"rgba(11, 19, 30, 0.8)"')
text = text.replace('color: "#1A1A1A"', 'color: "#F2F0E9"')
text = text.replace('backgroundColor: "#F2F0E9"', 'backgroundColor: "#1A2332"')

# 2. Main wrappers bg and features
text = text.replace('bg-[#F2F0E9]', 'bg-[#0B131E]')
text = text.replace('text-[#1A1A1A]', 'text-[#F2F0E9]')

# 3. Cards backgrounds
text = text.replace('bg-slate-50', 'bg-[#121A26]')
text = text.replace('bg-white', 'bg-[#1A2332]')
text = text.replace('bg-slate-100', 'bg-white/10')
text = text.replace('bg-slate-900', 'bg-black/40')

# 4. Borders
text = text.replace('border-slate-200/60', 'border-white/10')
text = text.replace('border-slate-200', 'border-white/10')
text = text.replace('border-slate-100', 'border-white/5')
text = text.replace('border-slate-300', 'border-white/20')
text = text.replace('border-b border-white/10 pb-3 mb-3', 'border-b border-white/10 pb-3 mb-3') # Safety

# 5. Texts
text = text.replace('text-slate-600', 'text-slate-300')
text = text.replace('text-slate-700', 'text-slate-200')
text = text.replace('text-slate-800', 'text-white')
text = text.replace('text-slate-400', 'text-slate-400') # keep as is
text = text.replace('text-slate-500', 'text-slate-400')

# 6. Shadows
text = text.replace('shadow-sm', 'shadow-[0_8px_30px_rgb(0,0,0,0.4)]')
text = text.replace('shadow-lg', 'shadow-[0_15px_40px_rgb(0,0,0,0.6)]')
text = text.replace('shadow-xl shadow-slate-200/50', 'shadow-[0_20px_50px_rgb(0,0,0,0.5)]')

# Some specific elements might need manual adjustments. We will see how it goes.
with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(text)


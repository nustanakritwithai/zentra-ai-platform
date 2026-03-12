#!/usr/bin/env python3
"""Migrate ZENTRA AI from monotone orange to Dynamic View multi-color palette."""
import re, os

BASE = "/home/user/workspace/zentra-platform/client/src"

# ============================================================
# LANDING PAGE — most complex, needs per-section colors
# ============================================================
def migrate_landing():
    path = f"{BASE}/pages/landing.tsx"
    with open(path) as f:
        content = f.read()

    # Feature card colors — make each DIFFERENT
    content = content.replace(
        '"from-orange-500 to-red-500"',
        '"from-teal-500 to-cyan-500"', 1  # AI Agent
    )
    content = content.replace(
        '"from-red-500 to-pink-500"',
        '"from-violet-500 to-fuchsia-500"', 1  # Generative UI
    )
    content = content.replace(
        '"from-amber-500 to-orange-500"',
        '"from-amber-500 to-yellow-500"', 1  # Dynamic Pricing
    )
    content = content.replace(
        '"from-orange-400 to-red-400"',
        '"from-emerald-500 to-teal-500"', 1  # Shopping Assistant
    )
    content = content.replace(
        '"from-red-400 to-rose-500"',
        '"from-pink-500 to-rose-500"', 1  # Visual Search
    )
    content = content.replace(
        '"from-amber-400 to-orange-500"',
        '"from-sky-500 to-blue-500"', 1  # AI Analytics
    )

    # Stats counter gradient
    content = content.replace(
        'from-orange-400 via-red-400 to-orange-500',
        'from-teal-400 via-cyan-300 to-sky-400'
    )

    # Z logo
    content = content.replace(
        'from-orange-500 via-red-500 to-amber-500',
        'from-teal-400 via-cyan-400 to-sky-500'
    )

    # Nav signup button
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20',
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/20'
    )

    # Hero background glow orbs
    content = content.replace(
        'bg-gradient-to-b from-orange-500/[0.03] via-transparent to-red-500/[0.03]',
        'bg-gradient-to-b from-teal-500/[0.03] via-transparent to-violet-500/[0.03]'
    )
    content = content.replace(
        'bg-orange-500/10 rounded-full blur-[100px]',
        'bg-teal-500/10 rounded-full blur-[100px]'
    )
    content = content.replace(
        'bg-red-500/10 rounded-full blur-[100px]',
        'bg-violet-500/10 rounded-full blur-[100px]'
    )
    content = content.replace(
        'bg-amber-500/5 rounded-full blur-[120px]',
        'bg-fuchsia-500/5 rounded-full blur-[120px]'
    )

    # Decorative lines
    content = content.replace(
        'via-orange-500/20 to-transparent',
        'via-teal-500/20 to-transparent'
    )
    content = content.replace(
        'via-red-500/15 to-transparent',
        'via-violet-500/15 to-transparent'
    )

    # LIVE badge
    content = content.replace(
        'border-orange-500/30 bg-orange-500/5 animate-slide-up',
        'border-emerald-500/30 bg-emerald-500/5 animate-slide-up'
    )
    content = content.replace(
        'text-orange-500\" />\n            <span className=\"text-orange-400\">LIVE',
        'text-emerald-500\" />\n            <span className=\"text-emerald-400\">LIVE'
    )

    # Hero headline gradient
    content = content.replace(
        'from-orange-400 via-red-500 to-amber-400',
        'from-teal-400 via-cyan-300 to-sky-400'
    )

    # Hero CTA button (main)
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40',
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40'
    )

    # Hero secondary CTA
    content = content.replace(
        'border-orange-500/30 hover:bg-orange-500/5 hover:border-orange-500/50',
        'border-teal-500/30 hover:bg-teal-500/5 hover:border-teal-500/50'
    )

    # "ง่ายมาก" badge
    content = content.replace(
        'border-orange-500/30 bg-orange-500/5\">\n            <Rocket className=\"w-3 h-3 mr-1 text-orange-500',
        'border-teal-500/30 bg-teal-500/5\">\n            <Rocket className=\"w-3 h-3 mr-1 text-teal-500'
    )

    # Steps section gradient top bar
    content = content.replace(
        'bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 opacity-0',
        'bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 opacity-0'
    )

    # Steps icon background
    content = content.replace(
        'from-orange-500/10 to-red-500/10',
        'from-teal-500/10 to-cyan-500/10'
    )

    # Steps icon color
    content = content.replace(
        'text-orange-500\" />',
        'text-teal-500\" />'
    )

    # Steps number circle
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs',
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs'
    )

    # "ฟีเจอร์ที่ทรงพลัง" badge
    content = content.replace(
        'border-orange-500/30 bg-orange-500/5\">\n            <Zap className=\"w-3 h-3 mr-1 text-orange-500',
        'border-violet-500/30 bg-violet-500/5\">\n            <Zap className=\"w-3 h-3 mr-1 text-violet-500'
    )

    # Feature card icons (generic remaining)
    content = content.replace(
        'text-orange-500\" />\n',
        'text-teal-400\" />\n'
    )

    # Pricing highlight ring
    content = content.replace(
        'ring-orange-500/60 shadow-xl shadow-orange-500/10',
        'ring-teal-500/60 shadow-xl shadow-teal-500/10'
    )

    # Pricing top bar
    content = content.replace(
        'bg-gradient-to-r from-orange-500 via-red-500 to-amber-500\" />',
        'bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500\" />'
    )

    # Popular badge
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 text-xs border-0 shadow-lg',
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-xs border-0 shadow-lg'
    )

    # Price text gradient
    content = content.replace(
        'from-orange-400 to-red-500 bg-clip-text',
        'from-teal-400 to-cyan-400 bg-clip-text'
    )

    # Checkmark in pricing
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shrink-0',
        'bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center shrink-0'
    )

    # Pricing CTA buttons
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40',
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40'
    )
    content = content.replace(
        'hover:border-orange-500/30',
        'hover:border-teal-500/30'
    )

    # CTA section at bottom
    content = content.replace(
        'from-orange-500/5 via-red-500/5 to-amber-500/5',
        'from-teal-500/5 via-violet-500/5 to-fuchsia-500/5'
    )

    # Bottom CTA button
    content = content.replace(
        'from-orange-500 to-red-500 text-white px-8 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40',
        'from-teal-500 to-cyan-600 text-white px-8 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40'
    )

    # Footer Z logo
    content = content.replace(
        'from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-[10px]',
        'from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-[10px]'
    )

    # Catch remaining orange references
    content = content.replace('shadow-orange-500/20', 'shadow-teal-500/20')
    content = content.replace('shadow-orange-500/', 'shadow-teal-500/')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ landing.tsx")

# ============================================================
# AUTH PAGE
# ============================================================
def migrate_auth():
    path = f"{BASE}/pages/auth.tsx"
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500/5', 'from-teal-500/5')
    content = content.replace('to-red-500/5', 'to-violet-500/5')
    content = content.replace('bg-orange-500/10', 'bg-teal-500/10')
    content = content.replace('bg-red-500/10', 'bg-violet-500/10')
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center',
        'bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center'
    )
    content = content.replace(
        'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20',
        'from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20'
    )
    content = content.replace('text-orange-400 hover:text-orange-300', 'text-teal-400 hover:text-teal-300')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ auth.tsx")

# ============================================================
# DASHBOARD
# ============================================================
def migrate_dashboard():
    path = f"{BASE}/pages/dashboard.tsx"
    with open(path) as f:
        content = f.read()

    # Revenue card → emerald
    content = content.replace(
        'color: "from-orange-500 to-amber-500", iconBg: "bg-orange-500/10", iconColor: "text-orange-500"',
        'color: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500"'
    )
    # Monthly sales → sky blue
    content = content.replace(
        'color: "from-red-500 to-orange-500", iconBg: "bg-red-500/10", iconColor: "text-red-500"',
        'color: "from-sky-500 to-blue-500", iconBg: "bg-sky-500/10", iconColor: "text-sky-500"'
    )
    # Orders → amber (keep some warm)
    content = content.replace(
        'color: "from-amber-500 to-orange-500", iconBg: "bg-amber-500/10", iconColor: "text-amber-500"',
        'color: "from-amber-500 to-yellow-500", iconBg: "bg-amber-500/10", iconColor: "text-amber-500"'
    )
    # Customers → violet
    content = content.replace(
        'color: "from-orange-400 to-red-400", iconBg: "bg-orange-400/10", iconColor: "text-orange-400"',
        'color: "from-violet-500 to-fuchsia-500", iconBg: "bg-violet-500/10", iconColor: "text-violet-500"'
    )

    # Live pulse dot
    content = content.replace('bg-orange-400 opacity-75', 'bg-emerald-400 opacity-75')
    content = content.replace('bg-orange-500\"', 'bg-emerald-500\"')

    # AI badge
    content = content.replace(
        'border-orange-500/30 bg-orange-500/5',
        'border-violet-500/30 bg-violet-500/5'
    )
    content = content.replace(
        'text-orange-500\" />6 Agents',
        'text-violet-500\" />6 Agents'
    )

    # Catch red-500 in status (keep for cancelled status)
    # content remains with red-500 for cancelled — that's correct

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ dashboard.tsx")

# ============================================================
# MALL PAGE
# ============================================================
def migrate_mall():
    path = f"{BASE}/pages/mall.tsx"
    with open(path) as f:
        content = f.read()

    # Background gradient
    content = content.replace(
        'from-orange-500/[0.08] via-transparent to-red-500/[0.05]',
        'from-teal-500/[0.08] via-transparent to-violet-500/[0.05]'
    )
    content = content.replace(
        'bg-orange-500/[0.04]',
        'bg-teal-500/[0.04]'
    )

    # Mall Z logo
    content = content.replace(
        'from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20',
        'from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20'
    )

    # Category active
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20',
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20',
    )

    # Store icon gradient
    content = content.replace(
        'from-orange-500/20 to-red-500/20',
        'from-teal-500/20 to-cyan-500/20'
    )
    content = content.replace('text-orange-400 font-bold', 'text-teal-400 font-bold')

    # Chevron hover
    content = content.replace('group-hover:text-orange-400', 'group-hover:text-teal-400')

    # Card hover border
    content = content.replace('hover:border-orange-500/20', 'hover:border-teal-500/20')

    # Price
    content = content.replace('text-orange-400\">฿', 'text-emerald-400\">฿')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ mall.tsx")

# ============================================================
# STORE SETTINGS
# ============================================================
def migrate_store_settings():
    path = f"{BASE}/pages/store-settings.tsx"
    with open(path) as f:
        content = f.read()

    # Tab active state
    content = content.replace(
        'data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20',
        'data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20'
    )

    # Section icons — make each different
    content = content.replace(
        'text-orange-400\" /><CardTitle',
        'text-teal-400\" /><CardTitle', 1  # store info
    )
    content = content.replace(
        'text-red-400\" /><CardTitle',
        'text-violet-400\" /><CardTitle', 1  # theme
    )
    content = content.replace(
        'text-orange-400\" /><CardTitle',
        'text-sky-400\" /><CardTitle', 1  # link
    )
    content = content.replace(
        'text-orange-400\" /><CardTitle',
        'text-emerald-400\" /><CardTitle', 1  # payment
    )

    # Badge
    content = content.replace(
        'bg-orange-500/10 text-orange-400 border-orange-500/30',
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    )

    # Theme selected state
    content = content.replace(
        'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500',
        'border-teal-500 bg-teal-500/5 ring-1 ring-teal-500'
    )
    content = content.replace(
        'hover:border-orange-500/20',
        'hover:border-teal-500/20'
    )

    # View store button
    content = content.replace(
        'hover:text-orange-400 hover:border-orange-500/20',
        'hover:text-teal-400 hover:border-teal-500/20'
    )

    # Save buttons
    content = content.replace(
        'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20',
        'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/20'
    )

    # Code highlight
    content = content.replace('text-orange-400/60', 'text-teal-400/60')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ store-settings.tsx")

# ============================================================
# AI AGENTS — each agent a different color
# ============================================================
def migrate_ai_agents():
    path = f"{BASE}/pages/ai-agents.tsx"
    with open(path) as f:
        content = f.read()

    # Replace all orange with varied colors for agents
    # Generic orange→teal replacements
    content = content.replace('from-orange-500 to-red-500', 'from-teal-500 to-cyan-600')
    content = content.replace('from-orange-500 to-amber-500', 'from-teal-500 to-cyan-500')
    content = content.replace('bg-orange-500', 'bg-teal-500')
    content = content.replace('text-orange-500', 'text-teal-500')
    content = content.replace('text-orange-400', 'text-teal-400')
    content = content.replace('border-orange-500', 'border-teal-500')
    content = content.replace('shadow-orange-500', 'shadow-teal-500')
    content = content.replace('from-red-500 to-pink-500', 'from-violet-500 to-fuchsia-500')
    content = content.replace('from-amber-500 to-orange-500', 'from-amber-500 to-yellow-500')
    content = content.replace('from-green-500 to-teal-500', 'from-emerald-500 to-teal-500')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ ai-agents.tsx")

# ============================================================
# AI CHAT
# ============================================================
def migrate_ai_chat():
    path = f"{BASE}/pages/ai-chat.tsx"
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500 to-red-500', 'from-violet-500 to-fuchsia-600')
    content = content.replace('from-orange-500', 'from-teal-500')
    content = content.replace('to-red-500', 'to-cyan-600')
    content = content.replace('bg-orange-500', 'bg-violet-500')
    content = content.replace('text-orange-500', 'text-violet-500')
    content = content.replace('text-orange-400', 'text-violet-400')
    content = content.replace('border-orange-500', 'border-violet-500')
    content = content.replace('shadow-orange-500', 'shadow-violet-500')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ ai-chat.tsx")

# ============================================================
# GENERIC: Products, Orders, Customers, Categories, Discounts, etc
# ============================================================
def migrate_generic(filename, primary="teal", secondary="cyan"):
    path = f"{BASE}/pages/{filename}"
    if not os.path.exists(path):
        print(f"  skip {filename} (not found)")
        return
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500 to-red-500', f'from-{primary}-500 to-{secondary}-600')
    content = content.replace('from-orange-500 to-amber-500', f'from-{primary}-500 to-{secondary}-500')
    content = content.replace('hover:from-orange-600 hover:to-red-600', f'hover:from-{primary}-600 hover:to-{secondary}-700')
    content = content.replace('bg-orange-500', f'bg-{primary}-500')
    content = content.replace('text-orange-500', f'text-{primary}-500')
    content = content.replace('text-orange-400', f'text-{primary}-400')
    content = content.replace('border-orange-500', f'border-{primary}-500')
    content = content.replace('shadow-orange-500', f'shadow-{primary}-500')
    content = content.replace('hover:text-orange', f'hover:text-{primary}')
    content = content.replace('hover:border-orange', f'hover:border-{primary}')
    # Don't touch red in status badges for orders (that's semantic)

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ {filename}")

# ============================================================
# SIDEBAR
# ============================================================
def migrate_sidebar():
    path = f"{BASE}/components/app-sidebar.tsx"
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500 to-red-500', 'from-teal-500 to-cyan-600')
    content = content.replace('bg-orange-500', 'bg-teal-500')
    content = content.replace('text-orange-500', 'text-teal-500')
    content = content.replace('text-orange-400', 'text-teal-400')
    content = content.replace('border-orange-500', 'border-teal-500')
    content = content.replace('shadow-orange-500', 'shadow-teal-500')
    content = content.replace('from-orange-500', 'from-teal-500')
    content = content.replace('to-red-500', 'to-cyan-600')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ app-sidebar.tsx")

# ============================================================
# ONBOARDING
# ============================================================
def migrate_onboarding():
    path = f"{BASE}/pages/onboarding.tsx"
    if not os.path.exists(path):
        print("  skip onboarding.tsx (not found)")
        return
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500 to-red-500', 'from-teal-500 to-cyan-600')
    content = content.replace('hover:from-orange-600 hover:to-red-600', 'hover:from-teal-600 hover:to-cyan-700')
    content = content.replace('bg-orange-500', 'bg-teal-500')
    content = content.replace('text-orange-500', 'text-teal-500')
    content = content.replace('text-orange-400', 'text-teal-400')
    content = content.replace('border-orange-500', 'border-teal-500')
    content = content.replace('shadow-orange-500', 'shadow-teal-500')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ onboarding.tsx")

# ============================================================
# AFFILIATE — use emerald/teal theme
# ============================================================
def migrate_affiliate():
    path = f"{BASE}/pages/affiliate.tsx"
    if not os.path.exists(path):
        print("  skip affiliate.tsx")
        return
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500 to-red-500', 'from-teal-500 to-cyan-600')
    content = content.replace('from-orange-500 to-amber-500', 'from-emerald-500 to-teal-500')
    content = content.replace('hover:from-orange-600 hover:to-red-600', 'hover:from-teal-600 hover:to-cyan-700')
    content = content.replace('bg-orange-500', 'bg-teal-500')
    content = content.replace('text-orange-500', 'text-emerald-500')
    content = content.replace('text-orange-400', 'text-emerald-400')
    content = content.replace('border-orange-500', 'border-teal-500')
    content = content.replace('shadow-orange-500', 'shadow-teal-500')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ affiliate.tsx")

# ============================================================
# MARKETPLACE — keep platform brand colors, change generic orange
# ============================================================
def migrate_marketplace():
    path = f"{BASE}/pages/marketplace.tsx"
    if not os.path.exists(path):
        print("  skip marketplace.tsx")
        return
    with open(path) as f:
        content = f.read()

    # Only replace generic orange (not platform-specific ones)
    content = content.replace('from-orange-500 to-red-500', 'from-teal-500 to-cyan-600')
    content = content.replace('hover:from-orange-600 hover:to-red-600', 'hover:from-teal-600 hover:to-cyan-700')
    content = content.replace('shadow-orange-500', 'shadow-teal-500')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ marketplace.tsx")

# ============================================================
# KNOWLEDGE BASE
# ============================================================
def migrate_knowledge_base():
    path = f"{BASE}/pages/knowledge-base.tsx"
    if not os.path.exists(path):
        print("  skip knowledge-base.tsx")
        return
    with open(path) as f:
        content = f.read()

    content = content.replace('from-orange-500 to-red-500', 'from-violet-500 to-fuchsia-600')
    content = content.replace('from-orange-500', 'from-violet-500')
    content = content.replace('bg-orange-500', 'bg-violet-500')
    content = content.replace('text-orange-500', 'text-violet-500')
    content = content.replace('text-orange-400', 'text-violet-400')
    content = content.replace('border-orange-500', 'border-violet-500')
    content = content.replace('shadow-orange-500', 'shadow-violet-500')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ knowledge-base.tsx")

# ============================================================
# SEO HEAD
# ============================================================
def migrate_seo_head():
    path = f"{BASE}/components/seo-head.tsx"
    if not os.path.exists(path):
        print("  skip seo-head.tsx")
        return
    with open(path) as f:
        content = f.read()

    content = content.replace('#FF6B35', '#00C9A7')  # theme-color
    content = content.replace('#E65028', '#00A88A')

    with open(path, 'w') as f:
        f.write(content)
    print(f"✓ seo-head.tsx")


# ============================================================
# RUN ALL
# ============================================================
if __name__ == "__main__":
    print("=== ZENTRA AI Dynamic View Color Migration ===\n")
    migrate_landing()
    migrate_auth()
    migrate_dashboard()
    migrate_mall()
    migrate_store_settings()
    migrate_ai_agents()
    migrate_ai_chat()
    migrate_sidebar()
    migrate_onboarding()
    migrate_affiliate()
    migrate_marketplace()
    migrate_knowledge_base()
    migrate_seo_head()
    migrate_generic("products.tsx", "teal", "cyan")
    migrate_generic("orders.tsx", "teal", "cyan")
    migrate_generic("customers.tsx", "teal", "cyan")
    migrate_generic("categories.tsx", "teal", "cyan")
    migrate_generic("discounts.tsx", "teal", "cyan")
    migrate_generic("pricing.tsx", "teal", "cyan")
    migrate_generic("storefront.tsx", "teal", "cyan")
    print("\n=== Migration complete ===")

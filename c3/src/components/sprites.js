/* Character sprite color palettes based on anime appearance */
export const CHAR_PALETTES = {
    goku: { hair: '#1a1a2e', skin: '#f5c78a', top: '#ff6b35', bottom: '#2563eb', accent: '#ff6b35' },
    vegeta: { hair: '#1a1a2e', skin: '#f5c78a', top: '#1e40af', bottom: '#1e40af', accent: '#e8c547' },
    piccolo: { hair: '#1a1a2e', skin: '#3cb371', top: '#e8e0cc', bottom: '#7b4dbe', accent: '#e8e0cc' },
    tanjiro: { hair: '#6b2131', skin: '#f5c78a', top: '#2d5a27', bottom: '#1a1a2e', accent: '#ff3333' },
    naruto: { hair: '#f5c542', skin: '#f5c78a', top: '#ff7b00', bottom: '#ff7b00', accent: '#2563eb' },
    sasuke: { hair: '#1a1a2e', skin: '#f0dcc0', top: '#e8e0cc', bottom: '#2c3e50', accent: '#7b4dbe' },
    sakura: { hair: '#ff91a4', skin: '#fde8d0', top: '#e8364f', bottom: '#e8364f', accent: '#ff91a4' },
    kakashi: { hair: '#c0c0c0', skin: '#f0dcc0', top: '#2d3748', bottom: '#2d3748', accent: '#1e40af' },
    itachi: { hair: '#1a1a2e', skin: '#f0dcc0', top: '#2d0a0a', bottom: '#1a1a1a', accent: '#e8364f' },
    light: { hair: '#8b6914', skin: '#f5c78a', top: '#e8e0cc', bottom: '#4a3728', accent: '#e8364f' },
    luffy: { hair: '#1a1a2e', skin: '#f5c78a', top: '#e8364f', bottom: '#3b82f6', accent: '#f5c542' },
    zoro: { hair: '#22c55e', skin: '#f0dcc0', top: '#1a4a1a', bottom: '#1a1a2e', accent: '#22c55e' },
    gojo: { hair: '#e8e0cc', skin: '#f0dcc0', top: '#1a1a2e', bottom: '#1a1a2e', accent: '#3b82f6' },
    yuji: { hair: '#ff7b9c', skin: '#f5c78a', top: '#1a1a2e', bottom: '#1a1a2e', accent: '#ff7b9c' },
    levi: { hair: '#1a1a2e', skin: '#f0dcc0', top: '#4a3728', bottom: '#2d3748', accent: '#3cb371' },
    frieza: { hair: '#d8b4fe', skin: '#e8e0f0', top: '#7b4dbe', bottom: '#7b4dbe', accent: '#d8b4fe' },
    cell: { hair: '#1a4a1a', skin: '#3cb371', top: '#1a4a1a', bottom: '#1a1a2e', accent: '#22c55e' },
    buu: { hair: '#1a1a2e', skin: '#ff91a4', top: '#e8e0cc', bottom: '#7b4dbe', accent: '#ff91a4' },
};

// Hair style variants per character
export const HAIR_STYLES = {
    goku: 'spiky-tall', vegeta: 'spiky-up', piccolo: 'bald-antennae',
    tanjiro: 'medium', naruto: 'spiky-short', sasuke: 'spiky-back',
    sakura: 'short', kakashi: 'spiky-slant', itachi: 'ponytail',
    light: 'neat', luffy: 'messy', zoro: 'short',
    gojo: 'spiky-up', yuji: 'short', levi: 'undercut',
    frieza: 'horns', cell: 'crown', buu: 'antenna',
};

const S = 1.1; // sprite scale factor

/* Draw a character sprite at (cx, cy) center position - SCALED UP */
export function drawCharSprite(ctx, cx, cy, charId, palette, dir, frame) {
    const p = palette;
    const bobY = Math.sin(frame * 0.06) * 2;
    const y = cy + bobY;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 15 * S, 10 * S, 4 * S, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs with shoes
    ctx.fillStyle = p.bottom;
    ctx.fillRect(cx - 5 * S, y + 5 * S, 4 * S, 10 * S);
    ctx.fillRect(cx + 1 * S, y + 5 * S, 4 * S, 10 * S);

    // Shoes
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(cx - 6 * S, y + 14 * S, 5 * S, 3 * S);
    ctx.fillRect(cx + 1 * S, y + 14 * S, 5 * S, 3 * S);

    // Body/torso
    ctx.fillStyle = p.top;
    ctx.fillRect(cx - 7 * S, y - 5 * S, 14 * S, 11 * S);
    // Shirt detail - collar
    ctx.fillStyle = p.accent;
    ctx.fillRect(cx - 2 * S, y - 5 * S, 4 * S, 2 * S);
    // Belt/waist
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(cx - 7 * S, y + 4 * S, 14 * S, 2 * S);

    // Arms
    ctx.fillStyle = p.top;
    ctx.fillRect(cx - 9 * S, y - 3 * S, 2 * S, 8 * S);
    ctx.fillRect(cx + 7 * S, y - 3 * S, 2 * S, 8 * S);
    // Hands
    ctx.fillStyle = p.skin;
    ctx.fillRect(cx - 9 * S, y + 4 * S, 2 * S, 3 * S);
    ctx.fillRect(cx + 7 * S, y + 4 * S, 2 * S, 3 * S);

    // Head
    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.arc(cx, y - 11 * S, 8 * S, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(cx - 8 * S, y - 10 * S, 2 * S, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8 * S, y - 10 * S, 2 * S, 0, Math.PI * 2); ctx.fill();

    // Hair
    ctx.fillStyle = p.hair;
    const hs = HAIR_STYLES[charId] || 'neat';
    drawHair(ctx, cx, y - 11 * S, hs, p.hair);

    // Eyes - bigger and more detailed
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 5 * S, y - 13 * S, 4 * S, 3 * S);
    ctx.fillRect(cx + 1 * S, y - 13 * S, 4 * S, 3 * S);
    // Pupils
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(cx - 4 * S, y - 12 * S, 2 * S, 2 * S);
    ctx.fillRect(cx + 2 * S, y - 12 * S, 2 * S, 2 * S);
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 3 * S, y - 13 * S, 1 * S, 1 * S);
    ctx.fillRect(cx + 3 * S, y - 13 * S, 1 * S, 1 * S);

    // Mouth
    ctx.fillStyle = '#c4846c';
    ctx.fillRect(cx - 1.5 * S, y - 8 * S, 3 * S, 1 * S);

    // Special features
    if (charId === 'gojo') {
        // Blindfold
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(cx - 8 * S, y - 14 * S, 16 * S, 4 * S);
    } else if (charId === 'kakashi') {
        // Mask
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(cx - 7 * S, y - 10 * S, 14 * S, 5 * S);
        // Headband
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(cx - 8 * S, y - 15 * S, 16 * S, 3 * S);
    } else if (charId === 'tanjiro') {
        // Scar
        ctx.fillStyle = '#e8364f';
        ctx.fillRect(cx - 5 * S, y - 17 * S, 3 * S, 4 * S);
        // Hanafuda earrings
        ctx.fillStyle = '#e8364f';
        ctx.fillRect(cx - 9 * S, y - 8 * S, 1 * S, 3 * S);
    } else if (charId === 'luffy') {
        // Straw hat
        ctx.fillStyle = '#f5c542';
        ctx.fillRect(cx - 10 * S, y - 20 * S, 20 * S, 4 * S);
        ctx.fillRect(cx - 7 * S, y - 24 * S, 14 * S, 4 * S);
        // Red band
        ctx.fillStyle = '#e8364f';
        ctx.fillRect(cx - 7 * S, y - 20 * S, 14 * S, 2 * S);
    } else if (charId === 'itachi') {
        // Sharingan eyes
        ctx.fillStyle = '#e8364f';
        ctx.fillRect(cx - 4 * S, y - 12 * S, 2 * S, 2 * S);
        ctx.fillRect(cx + 2 * S, y - 12 * S, 2 * S, 2 * S);
        // Headband line
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(cx - 8 * S, y - 16 * S, 16 * S, 2 * S);
    } else if (charId === 'naruto') {
        // Headband
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(cx - 8 * S, y - 17 * S, 16 * S, 3 * S);
        // Whisker marks
        ctx.fillStyle = '#c4846c';
        ctx.fillRect(cx - 7 * S, y - 9 * S, 3 * S, 1 * S);
        ctx.fillRect(cx + 4 * S, y - 9 * S, 3 * S, 1 * S);
    } else if (charId === 'vegeta') {
        // Scouter
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(cx + 5 * S, y - 14 * S, 3 * S, 2 * S);
    } else if (charId === 'zoro') {
        // Scar on eye
        ctx.fillStyle = '#e8364f';
        ctx.fillRect(cx + 1 * S, y - 14 * S, 1 * S, 4 * S);
    }

    // Accent detail on outfit
    ctx.fillStyle = p.accent;
    ctx.fillRect(cx - 2 * S, y - 2 * S, 4 * S, 3 * S);
}

function drawHair(ctx, cx, hy, style, color) {
    ctx.fillStyle = color;
    switch (style) {
        case 'spiky-tall':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            for (let i = -2; i <= 2; i++) {
                ctx.fillRect(cx + i * 4 * S, hy - 15 * S + Math.abs(i) * S, 4 * S, 7 * S);
            }
            break;
        case 'spiky-up':
            ctx.fillRect(cx - 7 * S, hy - 7 * S, 14 * S, 4 * S);
            ctx.fillRect(cx - 5 * S, hy - 13 * S, 10 * S, 6 * S);
            ctx.fillRect(cx - 3 * S, hy - 17 * S, 6 * S, 4 * S);
            break;
        case 'spiky-short':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            ctx.fillRect(cx - 5 * S, hy - 11 * S, 4 * S, 4 * S);
            ctx.fillRect(cx + 1 * S, hy - 11 * S, 4 * S, 4 * S);
            ctx.fillRect(cx - 2 * S, hy - 13 * S, 4 * S, 4 * S);
            break;
        case 'spiky-back':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            ctx.fillRect(cx + 5 * S, hy - 7 * S, 5 * S, 8 * S);
            ctx.fillRect(cx - 4 * S, hy - 11 * S, 8 * S, 4 * S);
            break;
        case 'spiky-slant':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            ctx.fillRect(cx - 3 * S, hy - 13 * S, 12 * S, 5 * S);
            ctx.fillRect(cx + 4 * S, hy - 16 * S, 5 * S, 4 * S);
            break;
        case 'ponytail':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            ctx.fillRect(cx + 6 * S, hy - 5 * S, 4 * S, 14 * S);
            break;
        case 'bald-antennae':
            ctx.fillRect(cx - 3 * S, hy - 13 * S, 2 * S, 5 * S);
            ctx.fillRect(cx + 1 * S, hy - 13 * S, 2 * S, 5 * S);
            break;
        case 'horns':
            ctx.fillRect(cx - 9 * S, hy - 10 * S, 4 * S, 7 * S);
            ctx.fillRect(cx + 5 * S, hy - 10 * S, 4 * S, 7 * S);
            ctx.fillRect(cx - 8 * S, hy - 15 * S, 3 * S, 6 * S);
            ctx.fillRect(cx + 5 * S, hy - 15 * S, 3 * S, 6 * S);
            break;
        case 'crown':
            ctx.fillRect(cx - 7 * S, hy - 8 * S, 14 * S, 4 * S);
            ctx.fillRect(cx - 2 * S, hy - 16 * S, 4 * S, 9 * S);
            break;
        case 'antenna':
            ctx.fillRect(cx - 7 * S, hy - 8 * S, 14 * S, 5 * S);
            ctx.fillRect(cx - 1 * S, hy - 17 * S, 2 * S, 10 * S);
            break;
        case 'undercut':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 4 * S);
            ctx.fillRect(cx - 5 * S, hy - 11 * S, 10 * S, 4 * S);
            break;
        case 'messy':
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            ctx.fillRect(cx - 6 * S, hy - 11 * S, 4 * S, 4 * S);
            ctx.fillRect(cx - 1 * S, hy - 13 * S, 4 * S, 4 * S);
            ctx.fillRect(cx + 4 * S, hy - 11 * S, 4 * S, 4 * S);
            break;
        default: // neat, short, medium
            ctx.fillRect(cx - 8 * S, hy - 8 * S, 16 * S, 5 * S);
            ctx.fillRect(cx - 7 * S, hy - 11 * S, 14 * S, 4 * S);
            break;
    }
}

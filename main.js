const LegacyPlayerRenderer = new NativeClass('Terraria.Graphics.Renderers', 'LegacyPlayerRenderer');
const TextureAssets = new NativeClass('Terraria.GameContent', 'TextureAssets');
const DrawData = new NativeClass('Terraria.DataStructures', 'DrawData');
const Main = new NativeClass('Terraria', 'Main');
const Lighting = new NativeClass('Terraria', 'Lighting');
const SpriteEffects = new NativeClass('Microsoft.Xna.Framework.Graphics', 'SpriteEffects');
const Vector2 = new NativeClass('Microsoft.Xna.Framework', 'Vector2');
const Utils = new NativeClass('Terraria', 'Utils');
const Color = new NativeClass('Microsoft.Xna.Framework.Graphics', 'Color');

LegacyPlayerRenderer.DrawPlayer.hook((original, self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets) => {
    const result = original(self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets);
    const heldItem = drawPlayer.inventory[drawPlayer.selectedItem];

    if (Main.gameMenu || heldItem === null || heldItem.type === 0 || heldItem.holdStyle !== 0 ||
        !drawPlayer.active || drawPlayer.dead || drawPlayer.stoned ||
        drawPlayer.itemAnimation > 0) {
        return result;
    }

    const weaponTexture = TextureAssets.Item[heldItem.type].Value;
    const sourceRect = /*Main.itemAnimations[heldItem.type] === null ?*/ Utils['Rectangle Frame(Texture2D tex, int horizontalFrames, int verticalFrames, int frameX, int frameY, int sizeOffsetX, int sizeOffsetY)'](weaponTexture, 1, 1, 0, 0, 0, 0)/* : Main.itemAnimations[heldItem.type].GetFrame(weaponTexture, -1)*/;

    let gWidth = sourceRect.Width;
    let gHeight = sourceRect.Height;
    let drawX = drawPlayer.MountedCenter.X - Main.screenPosition.X;
    let drawY = (drawPlayer.MountedCenter.Y - Main.screenPosition.Y + drawPlayer.gfxOffY) - 3;
    const scaleItem = heldItem.scale;
    let spriteEffects = SpriteEffects.None;

    if (drawPlayer.direction < 0) { 
        spriteEffects.value__ = SpriteEffects.FlipHorizontally.value__;
    }

    if (drawPlayer.gravDir < 0) {
        drawY += 6;
        spriteEffects.value__ = SpriteEffects.FlipVertically.value__ | spriteEffects.value__;
    }


    const drawWeapon = DrawData.new();
    const weaponPosition = Vector2.new();
    weaponPosition.X = drawX;
    weaponPosition.Y = drawY;
    const origin = Vector2.new();
    origin.X = gWidth / 2;
    origin.Y = gHeight / 2;
    drawWeapon['void .ctor(Texture2D texture, Vector2 position, Rectangle sourceRect, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effect, int inactiveLayerDepth)'](weaponTexture, weaponPosition, sourceRect, Color.White, 0, origin, scaleItem, spriteEffects, 0);
    drawWeapon['void Draw(SpriteBatch sb)'](Main.spriteBatch);

    original(self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets);
});
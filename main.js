const LegacyPlayerRenderer = new NativeClass('Terraria.Graphics.Renderers', 'LegacyPlayerRenderer');
const TextureAssets = new NativeClass('Terraria.GameContent', 'TextureAssets');
const DrawData = new NativeClass('Terraria.DataStructures', 'DrawData');
const Main = new NativeClass('Terraria', 'Main');
const Lighting = new NativeClass('Terraria', 'Lighting');
const SpriteEffects = new NativeClass('Microsoft.Xna.Framework.Graphics', 'SpriteEffects');
const Vector2 = new NativeClass('Microsoft.Xna.Framework', 'Vector2');
const Utils = new NativeClass('Terraria', 'Utils');
const Item = new NativeClass('Terraria', 'Item');
const Player = new NativeClass('Terraria', 'Player');
const Color = new NativeClass('Microsoft.Xna.Framework.Graphics', 'Color');
const Rectangle = new NativeClass('Microsoft.Xna.Framework', 'Rectangle');
const DrawAnimationVertical = new NativeClass('Terraria.DataStructures', 'DrawAnimationVertical');
const SpriteEffects_FlipHorizontally = SpriteEffects.FlipHorizontally.value__;
const SpriteEffects_FlipVertically = SpriteEffects.FlipVertically.value__;

const DrawData_Constructor = DrawData['void .ctor(Texture2D texture, Vector2 position, Rectangle sourceRect, Color color, float rotation, Vector2 origin, float scale, SpriteEffects effect, int inactiveLayerDepth)'];
const DrawData_Draw = DrawData['void Draw(SpriteBatch sb)'];
const TextureAssetsItem = TextureAssets.Item;
const ColorWhite = Color.White;
const MainItemAnimations = Main.itemAnimations;
const DrawAnimationVerticalFrame = DrawAnimationVertical["Rectangle GetFrame(Texture2D texture, int frameCounterOverride)"];
const Lighting_GetColor = Lighting["Color GetColor(int x, int y)"];
const Item_GetAlpha = Item.GetAlpha;
const Player_GetImmuneAlpha = Player.GetImmuneAlpha;
const Color_mul = Color["Color op_Multiply(Color a, float amount)"];
function rectangle(x, y, width, height) {
    const rectangle = Rectangle.new();
    rectangle.X = x;
    rectangle.Y = y;
    rectangle.Width = width;
    rectangle.Height = height;

    return rectangle;
}

function vector_div(v, a) {
	return {
		X: v.X / a,
		Y: v.Y / a,
	}
}  


function modDraw_BackWeapon(data, p, length) {
    data.rotation = ((Math.PI * 1.1 + Math.PI * (length * -0.001)) * p.direction) * p.gravDir; //rotate just over 180 clockwise
    data.position.X -= 8 * p.direction; //back
    data.position.Y -= (length * 0.2 - 16) * p.gravDir; //up

    const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;
    if (playerBodyFrameNum == 7 || playerBodyFrameNum == 8 || playerBodyFrameNum == 9 ||
        playerBodyFrameNum == 14 || playerBodyFrameNum == 15 || playerBodyFrameNum == 16) {
        data.position.Y -= 2 * p.gravDir; //up
    }
	
	return data;
}

let weaponFrame = 0;
LegacyPlayerRenderer.DrawPlayer.hook((original, self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets) => {
    const heldItem = drawPlayer.HeldItem;

    if (heldItem === null || heldItem.type === 0 || heldItem.holdStyle !== 0 || !drawPlayer.active || drawPlayer.dead || drawPlayer.stoned || drawPlayer.itemAnimation > 0) {
        original(self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets);
        return;
    }


    let drawX = drawPlayer.MountedCenter.X - Main.screenPosition.X;
    let drawY = (drawPlayer.MountedCenter.Y - Main.screenPosition.Y + drawPlayer.gfxOffY) - 3.0;

    let tempSpriteEffectsValue = 0;
    if (drawPlayer.direction < 0) {
        tempSpriteEffectsValue = SpriteEffects_FlipHorizontally;
    }

    if (drawPlayer.gravDir < 0) {
        drawY += 6.0;
        tempSpriteEffectsValue = SpriteEffects_FlipVertically | tempSpriteEffectsValue;
    }

    let drawWeapon = DrawData.new();

    const weaponTexture = TextureAssetsItem[heldItem.type].Value;
	const gWidth = weaponTexture.Width;
    let gHeight = weaponTexture.Height;
	
	
	
    const weaponPosition = Vector2.new();
    weaponPosition.X = drawX;
    weaponPosition.Y = drawY;
	
	let sourceRect = null;
	const itemAnimation = MainItemAnimations[heldItem.type];
	if (itemAnimation != null) {
		const frameCount = itemAnimation.FrameCount;
		const frameCounter = itemAnimation.TicksPerFrame;
		
		if (Main.time % frameCounter == 0) {
			weaponFrame++
			if (weaponFrame >= frameCount) {
				weaponFrame = 0;
			}
		}
		
		gHeight /= frameCount;
		
		sourceRect = rectangle(0, gHeight * weaponFrame, gWidth, gHeight);
	} else {
		sourceRect = rectangle(0, 0, gWidth, gHeight);
	}
	
	const playerCenterTile = vector_div(drawPlayer.Center, 16);
	let lighting = Lighting_GetColor(playerCenterTile.X, playerCenterTile.Y);
	lighting = Player_GetImmuneAlpha(drawPlayer, Color_mul(Item_GetAlpha(heldItem, lighting), drawPlayer.stealth), 0);
	
    const origin = Vector2.new();
    origin.X = gWidth / 2.0;
    origin.Y = gHeight / 2.0;

    let spriteEffects = SpriteEffects.None;
    spriteEffects.value__ = tempSpriteEffectsValue;
	const heldItemScale = heldItem.scale;
	const itemWidth = gWidth * heldItemScale;
    const itemHeight = gHeight * heldItemScale;
	const larger = Math.max(itemWidth, itemHeight);
    const lesser = Math.min(itemWidth, itemHeight);
	
	let data = {
		rotation: 0.0,
		position: weaponPosition
	}
	
	data = modDraw_BackWeapon(data, drawPlayer, larger);

    DrawData_Constructor(drawWeapon, weaponTexture, data.position, sourceRect, lighting, data.rotation, origin, heldItemScale, spriteEffects, 0);
	
    DrawData_Draw(drawWeapon, Main.spriteBatch);

    original(self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets);
});
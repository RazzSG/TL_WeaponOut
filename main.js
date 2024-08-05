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
const ItemID = new NativeClass('Terraria.ID', 'ItemID');
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

const HoldType = {
    None: 0,
    Hand: 1,
    Waist: 2,
    Back: 3,
    Spear: 4,
    PowerTool: 5,
    Bow: 6,
    SmallGun: 7,
    LargeGun: 8,
    Staff: 9
};

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

class WeaponDrawInfo {
    static WalkCycle(data, p) {
        const bodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;

        if ((bodyFrameNum >= 7 && bodyFrameNum <= 9) || (bodyFrameNum >= 14 && bodyFrameNum <= 16)) {
            data.position.Y -= 2 * p.gravDir;
        }

        switch (bodyFrameNum) {
            case 7:
            case 8:
            case 9:
            case 10:
                data.position.X -= p.direction * 2;
                break;
            case 14:
                data.position.X += p.direction * 2;
                break;
            case 15:
            case 16:
                data.position.X += p.direction * 4;
                break;
            case 17:
                data.position.X += p.direction * 2;
                break;
        }

        return data;
    }

    static RotationWalkCycle(FrameNum) {
        const rotationValues = {
            6: -0.6,
            7: -0.8,
            8: -1,
            9: -1,
            10: -0.8,
            11: -0.4,
            12: 0,
            13: 0.6,
            14: 0.8,
            15: 1,
            16: 1,
            17: 0.8,
            18: 0.4,
            19: 0,
        };

        return rotationValues[FrameNum] || 0;
    }

    static HandWeapon(data, p, length, width, isYoyo = false) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;
        if (isYoyo) {
            length /= 2;
            width /= 2;
        }

        if (playerBodyFrameNum < 5) {
            data.rotation = (Math.PI * 0.5 * p.direction) * p.gravDir;
            data.position.X += (4 - length * 0.1) * p.direction;
            data.position.Y += (width * 0.3 - 4 + 13) * p.gravDir;

            if (isYoyo) {
                data.position.X -= 8 * p.direction;
            }
        } else if (playerBodyFrameNum === 5) {
            data.rotation = (Math.PI * -0.25 * p.direction) * p.gravDir;
            data.position.X += (width * 0.5 - 8 - length / 2) * p.direction;
            data.position.Y += -14 * p.gravDir;
        } else {
            data.rotation = (Math.PI * 0.2 * p.direction) * p.gravDir;
            data.position.X += (-5 + width * 0.5) * p.direction;
            data.position.Y += (width * 0.5 - 8 + 14 - length / 2) * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }

    static WaistWeapon(data, p, length) {
        const maxFall = 2;
        data.rotation = (Math.PI + Math.PI * (0.1 + maxFall * 0.01) * p.direction) * p.gravDir;
        data.position.X -= (length * 0.5 - 20) * p.direction;
        data.position.Y += (14 - maxFall / 2) * p.gravDir;

        return data;
    }

    static BackWeapon(data, p, length) {
        data.rotation = ((Math.PI * 1.1 + Math.PI * (length * -0.001)) * p.direction) * p.gravDir;
        data.position.X -= 8 * p.direction;
        data.position.Y -= (length * 0.2 - 16) * p.gravDir;

        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;
        if (playerBodyFrameNum === 7 || playerBodyFrameNum === 8 || playerBodyFrameNum === 9 ||
          playerBodyFrameNum === 14 || playerBodyFrameNum === 15 || playerBodyFrameNum === 16) {
            data.position.Y -= 2 * p.gravDir;
        }

        return data;
    }

    static ForwardHoldWeapon(data, p, width) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;

        if (playerBodyFrameNum < 5) {
            data.rotation = (Math.PI * 0.4) * p.direction * p.gravDir;
            data.position.X += -6 * p.direction;
            data.position.Y += (16 - width * 0.1) * p.gravDir;
        } else if (playerBodyFrameNum === 5) {
            data.rotation = (Math.PI * -0.35) * p.direction * p.gravDir;
            data.position.X += -8 * p.direction;
            data.position.Y += (width * 0.1 - 12) * p.gravDir;
        } else {
            data.rotation = (Math.PI * 0.2) * p.direction * p.gravDir;
            data.position.X += -2 * p.direction;
            data.position.Y += (10 - width * 0.1) * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }

    static PoleWeapon(data, p, length) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;

        if (playerBodyFrameNum < 5) {
            data.rotation = (Math.PI * 0.4 - (length * 0.002)) * p.direction * p.gravDir;
            data.position.X += 8 * p.direction;
            data.position.Y += (length * 0.1 + 14) * p.gravDir;
        } else if (playerBodyFrameNum === 5) {
            data.rotation = (Math.PI * 0.1 + (length * 0.002)) * p.direction * p.gravDir;
            data.position.X += 6 * p.direction;
            data.position.Y -= (10 + length * 0.1) * p.gravDir;
        } else {
            data.rotation = (Math.PI * 0.3) * p.direction * p.gravDir;
            data.position.X += 10 * p.direction;
            data.position.Y += (length * 0.1 + 6) * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }

    static DrillWeapon(data, p, length) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;

        if (playerBodyFrameNum < 5) {
        data.rotation = (Math.PI * 0.1 * p.direction) * p.gravDir;
        data.position.X += (8 - (length * 0.1)) * p.direction;
        data.position.Y += 14 * p.gravDir;
        } else if (playerBodyFrameNum === 5)  {
            data.rotation = (Math.PI * -0.5 * p.direction) * p.gravDir;
            data.position.X -= 7 * p.direction;
            data.position.Y -= (24 - (length * 0.2)) * p.gravDir;
        } else {
            data.rotation = (Math.PI * 0.05 * p.direction) * p.gravDir;
            data.position.X += (10 - (length * 0.1)) * p.direction;
            data.position.Y += 10 * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }
    
    static AimedWeapon(data, p, length) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;

        if (playerBodyFrameNum < 5) {
            data.rotation = (Math.PI * 0.5 * p.direction) * p.gravDir;
            data.position.X += -2 * p.direction;
            data.position.Y += (length * 0.5) * p.gravDir;
        } else if (playerBodyFrameNum === 5) {
            data.rotation = (Math.PI * -0.75 * p.direction) * p.gravDir;
            data.position.X += (-10 - length * 0.2) * p.direction;
            data.position.Y += (10 - length / 2) * p.gravDir;
        } else {
            data.rotation = (Math.PI * 0.1 * p.direction) * p.gravDir;
            data.position.X += 6 * p.direction;
            data.position.Y += 8 * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }

    static HeavyWeapon(data, p, width) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;
        
        if (playerBodyFrameNum < 5 || (playerBodyFrameNum === 10 && p.velocity.X === 0))  {
            data.rotation = (Math.PI * 0.005) * width * p.direction * p.gravDir;
            data.position.X += 4 * p.direction;
            data.position.Y += (width * 0.1 + 6) * p.gravDir;
        } else if (playerBodyFrameNum === 5) {
            data.rotation = (Math.PI * -0.002) * width * p.direction * p.gravDir;
            data.position.X += 2 * p.direction;
            data.position.Y -= (width * 0.1 + 10) * p.gravDir;
        } else {
            data.rotation = (Math.PI * 0.008) * (width * 0.2 + this.RotationWalkCycle(playerBodyFrameNum) * 6) * p.direction * p.gravDir;
            data.position.X += 8 * p.direction;
            data.position.Y += width * 0.15 * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }
    
    static MagicWeapon(data, p, length) {
        const playerBodyFrameNum = p.bodyFrame.Y / p.bodyFrame.Height;
        
        if (playerBodyFrameNum < 5) {
            data.rotation = (Math.PI * 0.2) * p.direction * p.gravDir;
            data.position.X += (length * 0.1 + 4) * p.direction;
            data.position.Y += (length * 0.1 + 6) * p.gravDir;
        } else if (playerBodyFrameNum === 5) {
            data.rotation = (Math.PI * -0.45 - (length * 0.002)) * p.direction * p.gravDir;
            data.position.X -= (length * 0.1 + 16) * p.direction;
            data.position.Y -= (length * 0.16 + 14) * p.gravDir;
        } else {
            data.rotation = (Math.PI * -0.2 - (length * 0.002)) * p.direction * p.gravDir;
            data.position.X -= 2 * p.direction;
            data.position.Y -= (length * 0.4 - 12) * p.gravDir;
            data = this.WalkCycle(data, p);
        }

        return data;
    }
    
    static PickItemDrawType(drawOnBack, drawWeapon, weaponTexture, sourceRect, lighting, origin, drawPlayer, heldItem, heldItemScale, spriteEffects, isYoyo, gWidth, gHeight, data, itemWidth, itemHeight, larger, lesser) {
        const isAStaff = Item.staff[heldItem.type];
        const isMagic = heldItem.magic;
        const isMelee = heldItem.melee;
        const isShoot = heldItem.shoot;
        const isNoUseGraphic = heldItem.noUseGraphic;
        const isAutoReuse = heldItem.autoReuse;
        let holdType = HoldType.None;
        
        if (heldItem.useStyle === 1 || heldItem.useStyle === 2 || heldItem.useStyle === 3) {
            if ((larger < 28 && !isMelee) || (larger <= 32 && isShoot !== 0) || (larger <= 24 && !isMagic)) {
                if (drawPlayer.grapCount > 0 || drawOnBack) return;
                holdType = HoldType.Hand;
            } else if (larger <= 48 && (heldItem.pick <= 0 || (heldItem.pick > 0 && heldItem.axe > 0))) {
                if (!drawOnBack) return;
                holdType = HoldType.Waist;
            } else {
                if (!drawOnBack) return;
                holdType = HoldType.Back;
            }
        } 
        
        if (heldItem.useStyle === 4 || heldItem.useStyle === 5 || heldItem.useStyle === 13) {
            if (gHeight >= gWidth * 1.2 && !isAStaff) {
                if (drawPlayer.grapCount > 0 || drawOnBack) return;
                holdType = HoldType.Bow;
            } else if (gWidth >= gHeight * 1.2 && !isAStaff) {
                if (isNoUseGraphic && isMelee) {
                    if (drawPlayer.grapCount > 0 || drawOnBack) return;
                    holdType = HoldType.PowerTool;
                } else {
                    if (larger < 45) {
                        if (drawPlayer.grapCount > 0 || drawOnBack) return;
                        holdType = HoldType.SmallGun;
                    } else {
                        if (drawOnBack) return;
                        holdType = HoldType.LargeGun;
                    }
                }
            } else {
                if (isNoUseGraphic && !isAStaff) {
                    if (!isAutoReuse) {
                        if (drawPlayer.grapCount > 0 || drawOnBack) return;
                        if (isYoyo) {
                            holdType = HoldType.Hand;
                        } else {
                            holdType = HoldType.Spear;
                        }
                    } else {
                        if (larger <= 48) {
                            if (!drawOnBack) return;
                            holdType = HoldType.Waist;
                        } else {
                            if (!drawOnBack) return;
                            holdType = HoldType.Back;
                        }
                    }
                } else {
                    if (larger + lesser <= 72) {
                        if (drawPlayer.grapCount > 0 || drawOnBack) return;
                        holdType = HoldType.Hand;
                    } else if (lesser <= 42) {
                        if (drawPlayer.grapCount > 0 || drawOnBack) return;
                        holdType = HoldType.Spear;
                    } else {
                        if (drawPlayer.grapCount > 0 || drawOnBack) return;
                        holdType = HoldType.Staff;
                    }
                }
            }
        }
        

        switch (holdType) {
            case HoldType.Hand:
                data = this.HandWeapon(data, drawPlayer, larger, lesser);
                break;
            case HoldType.Waist:
                data = this.WaistWeapon(data, drawPlayer, larger);
                break;
            case HoldType.Spear:
                data = this.PoleWeapon(data, drawPlayer, larger);
                break;
            case HoldType.PowerTool:
                data = this.DrillWeapon(data, drawPlayer, larger);
                break;
            case HoldType.Back:
                data = this.BackWeapon(data, drawPlayer, larger);
                break;
            case HoldType.Bow:
                data = this.ForwardHoldWeapon(data, drawPlayer, lesser);
                break;
            case HoldType.SmallGun:
                data = this.AimedWeapon(data, drawPlayer, larger);
                break;
            case HoldType.LargeGun:
                data = this.HeavyWeapon(data, drawPlayer, lesser);
                break;
            case HoldType.Staff:
                data = this.MagicWeapon(data, drawPlayer, larger);
                break;
        }

        DrawData_Constructor(drawWeapon, weaponTexture, data.position, sourceRect, lighting, data.rotation, origin, heldItemScale, spriteEffects, 0);

        DrawData_Draw(drawWeapon, Main.spriteBatch);
    }
}

let weaponFrame = 0;
LegacyPlayerRenderer.DrawPlayer.hook((original, self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets) => {
    const heldItem = drawPlayer.HeldItem;
    
    if (heldItem === null || heldItem.type === 0 || heldItem.holdStyle !== 0 || !drawPlayer.active || drawPlayer.dead || drawPlayer.stoned || drawPlayer.itemAnimation > 0) {
        original(self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets);
        return;
    }

    let isYoyo = ItemID.Sets.Yoyo[heldItem.type];

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

    let sourceRect;
    const itemAnimation = MainItemAnimations[heldItem.type];
    if (itemAnimation != null) {
        const frameCount = itemAnimation.FrameCount;
        const frameCounter = itemAnimation.TicksPerFrame;
        
        if (Main.time % frameCounter === 0) {
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
    let heldItemScale = heldItem.scale;

    if (isYoyo) {
        heldItemScale *= 0.6;
    }
    
    const itemWidth = gWidth * heldItemScale;
    const itemHeight = gHeight * heldItemScale;
    const larger = Math.max(itemWidth, itemHeight);
    const lesser = Math.min(itemWidth, itemHeight);
    
    let data = {
        rotation: 0.0,
        position: weaponPosition
    }

    WeaponDrawInfo.PickItemDrawType(true, drawWeapon, weaponTexture, sourceRect, lighting, origin, drawPlayer, heldItem, heldItemScale, spriteEffects, isYoyo, gWidth, gHeight, data, itemWidth, itemHeight, larger, lesser);
    
    original(self, camera, drawPlayer, position, rotation, rotationOrigin, shadow, scale, positionalOffsets);

    WeaponDrawInfo.PickItemDrawType(false, drawWeapon, weaponTexture, sourceRect, lighting, origin, drawPlayer, heldItem, heldItemScale, spriteEffects, isYoyo, gWidth, gHeight, data, itemWidth, itemHeight, larger, lesser);
});
# First-Person 3D Voxel Sandbox (Python + Ursina) — SAFE MINIMAL VERSION
# Requires: pip install ursina perlin-noise
# Run: python voxel_fp3d.py

from ursina import *
from ursina.prefabs.first_person_controller import FirstPersonController
from perlin_noise import PerlinNoise
import json, os, math, time, sys

CHUNK_SIZE = 16
VIEW_DISTANCE = 3
BASE_HEIGHT = 4
AMPLITUDE = 10
FREQ = 0.08
SEED = 2025
SAVE_FILE = 'voxel_world_save.json'

# (Name, kind, tint)
PALETTE = [
    ('Stone','stone', color.gray),
    ('Grass','grass', color.lime),
    ('Dirt','dirt', color.brown),
    ('Sand','sand', color.rgb(230,220,150)),
    ('Wood','wood', color.rgb(150,95,50)),
    ('Leaf','leaf', color.rgb(60,140,60)),
]

MINE_TIME = {'dirt':0.8,'grass':0.9,'sand':0.7,'wood':2.5,'leaf':0.2,'stone':5.0}

class Voxel(Button):
    def __init__(self, position=(0,0,0), kind='stone', tint=color.white):
        super().__init__(parent=scene, model='cube', texture='white_cube', origin_y=0.5,
                         position=position, color=tint, scale=1)
        self.kind = kind
    def input(self, key):
        if 'game' not in globals() or getattr(game,'in_menu',False):
            return
        if self.hovered:
            if key == 'left mouse down':
                name, kind, tint = game.current_block
                p = self.position + mouse.normal
                px,py,pz = (int(round(p.x)), int(round(p.y)), int(round(p.z)))
                if py >= 0:
                    game.place_block((px,py,pz), kind)
            if key == 'right mouse down':
                game.begin_mine(self)

class Chunk:
    def __init__(self, cx, cz, noise):
        self.cx, self.cz = cx, cz
        self.entities = []
        ox, oz = cx*CHUNK_SIZE, cz*CHUNK_SIZE
        for x in range(CHUNK_SIZE):
            for z in range(CHUNK_SIZE):
                wx, wz = ox+x, oz+z
                h = BASE_HEIGHT + int(noise([wx*FREQ, wz*FREQ]) * AMPLITUDE)
                self.entities.append(Voxel((wx,0,wz), 'stone', color.rgb(20,20,25)))
                for y in range(1, h+1):
                    if y == h:
                        kind, tint = 'grass', color.lime
                    elif y >= h-2:
                        kind, tint = 'dirt', color.brown
                    else:
                        kind, tint = 'stone', color.gray
                    self.entities.append(Voxel((wx,y,wz), kind, tint))
        self.spawn_trees(ox, oz, noise)
    def spawn_trees(self, ox, oz, noise):
        from random import randint
        for _ in range(2):
            tx = ox + randint(2, CHUNK_SIZE-3)
            tz = oz + randint(2, CHUNK_SIZE-3)
            h = BASE_HEIGHT + int(noise([tx*FREQ, tz*FREQ]) * AMPLITUDE)
            th = randint(3,5)
            for i in range(th):
                self.entities.append(Voxel((tx,h+i,tz), 'wood', color.rgb(150,95,50)))
            for lx in range(-2,3):
                for lz in range(-2,3):
                    for ly in range(2,4):
                        if abs(lx)+abs(lz)+abs(ly) < 6:
                            self.entities.append(Voxel((tx+lx,h+th-1+ly,tz+lz), 'leaf', color.rgb(60,140,60)))
    def destroy(self):
        for e in self.entities: destroy(e)
        self.entities.clear()

class World:
    def __init__(self):
        self.noise = PerlinNoise(octaves=3, seed=SEED)
        self.chunks = {}
        self.placed = {}
        self.removed = set()
    def key_for(self, x, z):
        return (int(math.floor(x/CHUNK_SIZE)), int(math.floor(z/CHUNK_SIZE)))
    def ensure_chunks(self, px, pz):
        pcx, pcz = self.key_for(px,pz)
        need = {(pcx+dx, pcz+dz) for dx in range(-VIEW_DISTANCE, VIEW_DISTANCE+1) for dz in range(-VIEW_DISTANCE, VIEW_DISTANCE+1)}
        for k in list(self.chunks.keys()):
            if k not in need:
                self.chunks[k].destroy(); del self.chunks[k]
        for k in need:
            if k not in self.chunks:
                self.chunks[k] = Chunk(*k, self.noise)
        for pos, kind in self.placed.items():
            if self.key_for(pos[0], pos[2]) in self.chunks:
                tint = next((c for n,k,c in PALETTE if k==kind), None)
                if tint is not None:
                    Voxel(pos, kind, tint)
        for pos in list(self.removed):
            for e in scene.entities:
                if isinstance(e,Voxel) and (int(round(e.x)),int(round(e.y)),int(round(e.z)))==pos:
                    destroy(e)
    def place(self, pos, kind):
        for e in scene.entities:
            if isinstance(e,Voxel) and (int(round(e.x)),int(round(e.y)),int(round(e.z)))==pos:
                return
        tint = next((c for n,k,c in PALETTE if k==kind), None)
        if tint is None: return
        Voxel(pos, kind, tint)
        self.placed[pos]=kind
        self.removed.discard(pos)
    def remove_entity(self, e):
        pos = (int(round(e.x)), int(round(e.y)), int(round(e.z)))
        destroy(e)
        self.removed.add(pos)
        self.placed.pop(pos, None)
    def save(self, meta):
        data = {
            'placed': {f"{x},{y},{z}":k for (x,y,z),k in self.placed.items()},
            'removed': [f"{x},{y},{z}" for (x,y,z) in self.removed],
            'meta': meta,
        }
        with open(SAVE_FILE,'w') as f: json.dump(data,f)
        print('[SAVE] World saved to', SAVE_FILE)
    def load(self):
        if not os.path.exists(SAVE_FILE):
            print('[SAVE] No save found.'); return None
        with open(SAVE_FILE) as f: data=json.load(f)
        self.placed.clear(); self.removed.clear()
        for k,v in data.get('placed',{}).items():
            x,y,z = map(int, k.split(',')); self.placed[(x,y,z)] = v
        for s in data.get('removed',[]):
            x,y,z = map(int, s.split(',')); self.removed.add((x,y,z))
        print('[SAVE] World loaded from', SAVE_FILE)
        return data.get('meta',{})

class Game(Ursina):
    def __init__(self):
        super().__init__()
        window.title = 'First-Person Voxel Sandbox — Ursina'
        window.borderless = False
        DirectionalLight(shadows=True).look_at(Vec3(1,-1,-0.6))
        AmbientLight(color=color.rgba(255,255,255,80))
        Sky()
        global player
        player = FirstPersonController(y=32, speed=6, origin_y=0.5)
        player.gravity = 1
        player.jump_height = 1.0
        player.cursor.visible = True
        self.block_index = 1
        self.current_block = PALETTE[self.block_index]
        self.hud = Text(text='', origin=(0,-18), position=window.top_left + Vec2(0.02,-0.02), background=True)
        self.update_hud()
        self.world = World()
        self.update_chunks()
        self.in_menu = False
        self.mining = {'target':None, 'start':0.0, 'need':999.0}
        self.mine_bar = Entity(parent=camera.ui, model='quad', color=color.azure, scale=(0,0.01), position=(0,-0.46), enabled=False)
        self.cross_v = Entity(model='quad', parent=camera.ui, scale=(0.002,0.04), color=color.white)
        self.cross_h = duplicate(self.cross_v, rotation_z=90)
        print('[Init] Game started')
    def update_hud(self):
        name,kind,_ = self.current_block
        self.hud.text = f'Block: {name} (1-6) | LMB place | Hold RMB mine | F5 save F9 load'
    def update_chunks(self):
        self.world.ensure_chunks(player.x, player.z)
    def begin_mine(self, voxel):
        need = MINE_TIME.get(voxel.kind, 1.5)
        self.mining = {'target':voxel, 'start':time.time(), 'need':need}
        self.mine_bar.enabled = True
        self.mine_bar.scale_x = 0
    def update_mining(self):
        if held_keys['right mouse'] and self.mining['target'] and self.mining['target'].enabled:
            el = time.time() - self.mining['start']
            need = self.mining['need']
            self.mine_bar.scale_x = max(0.001, min(0.45, el/need*0.45))
            if el >= need:
                v = self.mining['target']
                self.world.remove_entity(v)
                self.mining['target'] = None
                self.mine_bar.enabled = False
        else:
            self.mining['target'] = None
            self.mine_bar.enabled = False
    def input(self, key):
        if key in ('1','2','3','4','5','6'):
            i = max(0, min(len(PALETTE)-1, int(key)-1))
            self.block_index = i
            self.current_block = PALETTE[self.block_index]
            self.update_hud()
        if key == 'f5':
            self.world.save({'player':(player.x,player.y,player.z)})
        if key == 'f9':
            meta = self.world.load(); self.update_chunks()
            if meta and 'player' in meta:
                x,y,z = meta['player']; player.position = Vec3(x,y,z)
    def update(self):
        if not hasattr(self,'_last_chunk'): self._last_chunk = None
        now = self.world.key_for(player.x, player.z)
        if now != self._last_chunk:
            self._last_chunk = now; self.update_chunks()
        self.update_mining()
    def place_block(self, pos, kind):
        self.world.place(pos, kind)

if __name__ == '__main__':
    try:
        game = Game(); print('[Init] Game created, launching...')
        game.run()
    except Exception as e:
        print('[FATAL]', e); import traceback; traceback.print_exc(); sys.exit(1)

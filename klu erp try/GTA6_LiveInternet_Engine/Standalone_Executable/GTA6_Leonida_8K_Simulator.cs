// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.
// GTA VI Leonida 8K Ultra Graphics Simulation Engine & Live Open-World Sandbox

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Media;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace GTA6_Leonida_8K_Engine
{
    public enum EWeatherCycle { TropicalSunset, NeonMidnight, MiamiRainstorm, HurricaneCategory5 }
    public enum EProtagonist { Lucia, Jason }
    public enum EGraphicsPreset { High1080p, Ultra4K, Photorealistic8K }

    public class Building3D
    {
        public float X, Z, Width, Depth, Height;
        public Color WallColor;
        public Color NeonColor;
        public string NeonSign;
    }

    public class PalmTree3D
    {
        public float X, Z;
        public float Height;
        public float LeanAngle;
    }

    public class TrafficCar3D
    {
        public float X, Z, Speed;
        public Color Color;
        public bool IsPolice;
        public float SirenTimer;
    }

    public class ParticleEffect
    {
        public float X, Y, Z;
        public float VelX, VelY, VelZ;
        public float Life, MaxLife;
        public Color Color;
        public float Size;
    }

    public class SkidMark
    {
        public float LeftX, LeftZ;
        public float RightX, RightZ;
        public float Alpha;
    }

    public class StockItem
    {
        public string Ticker;
        public string Company;
        public double Price;
        public double Change;
    }

    public class ReelClip
    {
        public string Handle;
        public string Caption;
        public string Views;
        public string Likes;
        public Color AccentColor;
    }

    public class GTA6_SimulatorForm : Form
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        // Engine Timers & Game Loop
        private System.Windows.Forms.Timer gameTimer;
        private DateTime lastFrameTime;
        private float deltaTime = 0.016f;
        private float totalTime = 0.0f;
        private int frameCount = 0;
        private float fps = 60.0f;
        private float fpsTimer = 0.0f;

        // Graphics Pipeline Settings
        private EGraphicsPreset graphicsPreset = EGraphicsPreset.Photorealistic8K;
        private bool enableRayTracingSSR = true;
        private bool enableHDRBloom = true;
        private bool enableVolumetricFog = true;
        private bool enableMotionBlur = true;
        private int internalRenderWidth = 3840;
        private int internalRenderHeight = 2160;

        // Player Vehicle Dynamics
        private float playerWorldX = 0.0f;
        private float playerWorldZ = 0.0f;
        private float playerHeading = 0.0f;
        private float playerSpeedKmh = 120.0f;
        private float maxSpeedKmh = 345.0f;
        private float playerRpm = 4500.0f;
        private int currentGear = 4;
        private float steeringInput = 0.0f;
        private float throttleInput = 0.0f;
        private float brakeInput = 0.0f;
        private bool isHandbraking = false;
        private float driftAngle = 0.0f;
        private float surfaceGrip = 1.0f;
        private string surfaceName = "Dry Asphalt";
        private float tireWear = 0.05f;

        // Dual Protagonists
        private EProtagonist activeProtagonist = EProtagonist.Lucia;
        private float luciaHealth = 100.0f;
        private float luciaArmor = 85.0f;
        private float luciaStamina = 95.0f;
        private float jasonHealth = 100.0f;
        private float jasonArmor = 100.0f;
        private float jasonStamina = 90.0f;
        private double duffleCash = 348500.0;
        private string activeWeapon = "Tactical Carbine 5.56";
        private int ammoReserve = 180;
        private int ammoClip = 30;

        // Sensory Focus
        private bool isSensoryFocus = false;
        private float timeDilation = 1.0f;

        // Law Enforcement Heat (6 Stars)
        private int wantedLevel = 1;
        private float wantedCooldownTimer = 0.0f;
        private bool isWitnessCalling = false;
        private float witnessTimer = 6.0f;
        private float heliSpotlightAngle = 0.0f;

        // Weather & Environment
        private EWeatherCycle currentWeather = EWeatherCycle.TropicalSunset;
        private float weatherTransitionTimer = 0.0f;
        private float rainIntensity = 0.0f;
        private float windSpeed = 15.0f;
        private float lightningFlash = 0.0f;

        // In-Game Smartphone
        private bool isPhoneOpen = false;
        private int activePhoneTab = 0; // 0=Eyefind, 1=BAWSAQ, 2=Reelz, 3=Bank
        private string phoneSearchQuery = "gator in ocean drive gas station";
        private string searchResultTitle = "LEONIDA HEADLINE: 14ft Gator Steals High-Octane Fuel on Ocean Drive";
        private string searchResultSnippet = "VCPD cruisers engaged in pursuit after armed suspect and pet alligator breached convenience store.";

        // World Objects
        private List<Building3D> buildings = new List<Building3D>();
        private List<PalmTree3D> palmTrees = new List<PalmTree3D>();
        private List<TrafficCar3D> trafficCars = new List<TrafficCar3D>();
        private List<ParticleEffect> particles = new List<ParticleEffect>();
        private List<SkidMark> skidMarks = new List<SkidMark>();
        private List<StockItem> stockList = new List<StockItem>();
        private List<ReelClip> reelList = new List<ReelClip>();

        // Keyboard State
        private bool keyW, keyS, keyA, keyD, keySpace, keyShift;

        // UI Controls & Rectangles
        private Rectangle btnPresetRect;
        private Rectangle btnPhoneRect;
        private Rectangle btnSwapCharRect;
        private Rectangle btnSensoryRect;
        private Rectangle btnWeatherRect;
        private Rectangle btnCrimeRect;
        private Rectangle btnClearHeatRect;
        private Rectangle phoneFrameRect;

        public GTA6_SimulatorForm()
        {
            try { SetProcessDPIAware(); } catch { }

            this.Text = "GTA VI - Leonida & Vice City 8K Ultra Engine Simulator [Unreal 5.5 / C++ Architecture]";
            this.Size = new Size(1600, 920);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(7, 9, 14);
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer, true);

            InitializeWorldEnvironment();
            InitializeStocksAndReels();

            lastFrameTime = DateTime.Now;

            gameTimer = new System.Windows.Forms.Timer();
            gameTimer.Interval = 16; // ~60 FPS
            gameTimer.Tick += GameLoopTick;
            gameTimer.Start();

            this.KeyDown += OnKeyDown;
            this.KeyUp += OnKeyUp;
            this.MouseClick += OnMouseClick;
            this.Resize += (s, e) => { this.Invalidate(); };
        }

        private void InitializeWorldEnvironment()
        {
            buildings.Clear();
            palmTrees.Clear();
            trafficCars.Clear();

            string[] signs = new string[] {
                "HOTEL OCEANA", "THE CORONADO", "AMMU-NATION 24/7", "MALIBU CLUB",
                "EYEFIND HQ", "LEONIDA RESORTS", "BAWSAQ TRADING", "CHEETAH CASINO"
            };
            Color[] neons = new Color[] {
                Color.FromArgb(255, 42, 133), Color.FromArgb(0, 240, 255),
                Color.FromArgb(245, 158, 11), Color.FromArgb(157, 78, 221),
                Color.FromArgb(16, 185, 129), Color.FromArgb(239, 68, 68)
            };

            Random rng = new Random(1337);

            // Generate Ocean Drive Art Deco Strip (Left and Right sides)
            for (int i = 0; i < 40; i++)
            {
                float zPos = i * 75.0f;

                // Left side buildings
                buildings.Add(new Building3D
                {
                    X = -18.0f - (float)(rng.NextDouble() * 8.0),
                    Z = zPos,
                    Width = 14.0f + (float)(rng.NextDouble() * 6.0),
                    Depth = 45.0f,
                    Height = 25.0f + (float)(rng.NextDouble() * 35.0),
                    WallColor = Color.FromArgb(20 + rng.Next(25), 24 + rng.Next(25), 40 + rng.Next(30)),
                    NeonColor = neons[rng.Next(neons.Length)],
                    NeonSign = signs[rng.Next(signs.Length)]
                });

                // Right side Palm trees & Boardwalk
                palmTrees.Add(new PalmTree3D
                {
                    X = 14.0f + (float)(rng.NextDouble() * 3.0),
                    Z = zPos + (float)(rng.NextDouble() * 20.0),
                    Height = 12.0f + (float)(rng.NextDouble() * 6.0),
                    LeanAngle = (float)(rng.NextDouble() * 0.2 - 0.1)
                });

                // Left side Palm trees
                palmTrees.Add(new PalmTree3D
                {
                    X = -12.0f - (float)(rng.NextDouble() * 2.0),
                    Z = zPos + 35.0f,
                    Height = 11.0f + (float)(rng.NextDouble() * 5.0),
                    LeanAngle = (float)(rng.NextDouble() * 0.2 - 0.1)
                });
            }

            // Spawn Traffic & VCPD Cruisers
            for (int i = 0; i < 12; i++)
            {
                trafficCars.Add(new TrafficCar3D
                {
                    X = (i % 2 == 0) ? 4.5f : -4.5f,
                    Z = 60.0f + i * 110.0f,
                    Speed = 50.0f + rng.Next(40),
                    Color = (i % 3 == 0) ? Color.White : (i % 3 == 1) ? Color.FromArgb(220, 38, 38) : Color.FromArgb(37, 99, 235),
                    IsPolice = (i == 2 || i == 6 || i == 9),
                    SirenTimer = (float)rng.NextDouble() * 5.0f
                });
            }
        }

        private void InitializeStocksAndReels()
        {
            stockList.Add(new StockItem { Ticker = "FRT", Company = "Fruit Computers Inc.", Price = 232.40, Change = 1.85 });
            stockList.Add(new StockItem { Ticker = "TNK", Company = "Tinkle Telecom", Price = 19.85, Change = -0.75 });
            stockList.Add(new StockItem { Ticker = "BTB", Company = "BitBull Crypto Reserves", Price = 63800.0, Change = 4.90 });
            stockList.Add(new StockItem { Ticker = "LFK", Company = "Lifeinvader Social VR", Price = 540.20, Change = 2.15 });
            stockList.Add(new StockItem { Ticker = "AMM", Company = "Ammu-Nation Global", Price = 478.90, Change = 3.60 });
            stockList.Add(new StockItem { Ticker = "FLY", Company = "FlyUS Airways Leonida", Price = 44.15, Change = -2.30 });

            reelList.Add(new ReelClip
            {
                Handle = "@ViceCityDrifter",
                Caption = "Twin turbo Torero XO 8K drift past VCPD barricade on Biscayne Bay! 🔥🚗💨 #ViceLife #LeonidaReelz",
                Views = "4.8M Views",
                Likes = "890K Likes",
                AccentColor = Color.FromArgb(255, 42, 133)
            });
            reelList.Add(new ReelClip
            {
                Handle = "@FloridaManNews",
                Caption = "Local man seen carrying a 12-foot alligator into Maze Bank to secure a mortgage loan 🐊🏦 #Leonida",
                Views = "9.2M Views",
                Likes = "1.6M Likes",
                AccentColor = Color.FromArgb(0, 240, 255)
            });
            reelList.Add(new ReelClip
            {
                Handle = "@WeazelNewsLive",
                Caption = "Category 5 Hurricane approaching Ocean Drive. Locals hosting rooftop barbecue with jet-skis ready! 🌀🍹",
                Views = "2.1M Views",
                Likes = "420K Likes",
                AccentColor = Color.FromArgb(245, 158, 11)
            });
        }

        private void GameLoopTick(object sender, EventArgs e)
        {
            DateTime now = DateTime.Now;
            deltaTime = (float)(now - lastFrameTime).TotalSeconds;
            if (deltaTime > 0.05f) deltaTime = 0.05f;
            lastFrameTime = now;

            totalTime += deltaTime;
            fpsTimer += deltaTime;
            frameCount++;
            if (fpsTimer >= 0.5f)
            {
                fps = frameCount / fpsTimer;
                frameCount = 0;
                fpsTimer = 0.0f;
            }

            timeDilation = isSensoryFocus ? 0.35f : 1.0f;
            float dt = deltaTime * timeDilation;

            UpdateVehiclePhysics(dt);
            UpdateTrafficAndPolice(dt);
            UpdateParticlesAndWeather(dt);

            this.Invalidate();
        }

        private void UpdateVehiclePhysics(float dt)
        {
            // Input processing
            throttleInput = keyW ? 1.0f : 0.0f;
            brakeInput = keyS ? 1.0f : 0.0f;
            steeringInput = (keyD ? 1.0f : 0.0f) - (keyA ? 1.0f : 0.0f);
            isHandbraking = keySpace;

            bool isNitroActive = keyShift && ((activeProtagonist == EProtagonist.Lucia ? luciaStamina : jasonStamina) > 10.0f);
            if (isNitroActive)
            {
                if (activeProtagonist == EProtagonist.Lucia) luciaStamina = Math.Max(0.0f, luciaStamina - dt * 20.0f);
                else jasonStamina = Math.Max(0.0f, jasonStamina - dt * 20.0f);
            }
            else
            {
                if (activeProtagonist == EProtagonist.Lucia) luciaStamina = Math.Min(100.0f, luciaStamina + dt * 8.0f);
                else jasonStamina = Math.Min(100.0f, jasonStamina + dt * 8.0f);
            }

            tireWear = Math.Min(1.0f, tireWear + (isHandbraking ? dt * 0.015f : (playerSpeedKmh > 100.0f ? dt * 0.0005f : 0.0f)));
            float effectiveGrip = Math.Max(0.2f, surfaceGrip - (tireWear * 0.15f));

            // Acceleration & Braking
            float targetAccel = 0.0f;
            if (throttleInput > 0)
            {
                float nitroMult = isNitroActive ? 1.55f : 1.0f;
                targetAccel = (maxSpeedKmh - playerSpeedKmh) * 0.45f * effectiveGrip * nitroMult;
            }
            else if (brakeInput > 0)
            {
                targetAccel = -playerSpeedKmh * 1.2f;
            }
            else
            {
                targetAccel = -playerSpeedKmh * 0.15f; // Rolling resistance
            }

            if (isHandbraking)
            {
                targetAccel -= playerSpeedKmh * 0.8f;
                driftAngle += steeringInput * 45.0f * dt;
                driftAngle = Math.Max(-35.0f, Math.Min(35.0f, driftAngle));

                // Spawn smoke particles at tires
                if (playerSpeedKmh > 30.0f && particles.Count < 250)
                {
                    for (int i = 0; i < 3; i++)
                    {
                        particles.Add(new ParticleEffect
                        {
                            X = playerWorldX + (float)(new Random().NextDouble() * 2.0 - 1.0),
                            Y = 0.1f,
                            Z = playerWorldZ - 2.5f,
                            VelX = (float)(new Random().NextDouble() * 4.0 - 2.0),
                            VelY = 1.5f + (float)new Random().NextDouble() * 2.0f,
                            VelZ = -playerSpeedKmh * 0.05f,
                            Life = 0.6f,
                            MaxLife = 0.6f,
                            Color = Color.FromArgb(160, 220, 220, 230),
                            Size = 8.0f
                        });
                    }
                }
            }
            else
            {
                driftAngle *= (1.0f - dt * 4.0f);
            }

            if (isNitroActive && particles.Count < 280)
            {
                for (int i = 0; i < 2; i++)
                {
                    particles.Add(new ParticleEffect
                    {
                        X = playerWorldX + (float)(new Random().NextDouble() * 0.6 - 0.3),
                        Y = 0.2f,
                        Z = playerWorldZ - 2.8f,
                        VelX = (float)(new Random().NextDouble() * 2.0 - 1.0),
                        VelY = 0.4f,
                        VelZ = -playerSpeedKmh * 0.1f - 15.0f,
                        Life = 0.35f,
                        MaxLife = 0.35f,
                        Color = Color.FromArgb(220, 0, 240, 255),
                        Size = 6.0f
                    });
                }
            }

            playerSpeedKmh += targetAccel * dt;
            playerSpeedKmh = Math.Max(0.0f, Math.Min(maxSpeedKmh, playerSpeedKmh));

            // Steering & World Position
            float turnRate = (playerSpeedKmh / maxSpeedKmh) * 65.0f * (1.1f - (playerSpeedKmh / maxSpeedKmh) * 0.5f);
            playerHeading += steeringInput * turnRate * dt;

            float speedMs = (playerSpeedKmh / 3.6f);
            playerWorldZ += speedMs * dt;
            playerWorldX += (steeringInput * (speedMs * 0.35f) + (driftAngle * 0.05f)) * dt;
            playerWorldX = Math.Max(-11.0f, Math.Min(11.0f, playerWorldX)); // Constrain to roadway

            // RPM and Gear Simulation
            if (playerSpeedKmh < 40) currentGear = 1;
            else if (playerSpeedKmh < 85) currentGear = 2;
            else if (playerSpeedKmh < 145) currentGear = 3;
            else if (playerSpeedKmh < 210) currentGear = 4;
            else if (playerSpeedKmh < 285) currentGear = 5;
            else currentGear = 6;

            float gearMinSpeed = (currentGear - 1) * 50.0f;
            float gearMaxSpeed = currentGear * 60.0f;
            playerRpm = 2000.0f + ((playerSpeedKmh - gearMinSpeed) / 60.0f) * 6500.0f;
            playerRpm = Math.Max(1000.0f, Math.Min(8800.0f, playerRpm));

            // Wrap world Z for infinite road driving
            if (playerWorldZ > 3000.0f)
            {
                playerWorldZ -= 2000.0f;
                foreach (var car in trafficCars) car.Z -= 2000.0f;
            }
        }

        private void UpdateTrafficAndPolice(float dt)
        {
            heliSpotlightAngle += dt * 1.5f;

            foreach (var car in trafficCars)
            {
                float carSpeedMs = car.Speed / 3.6f;
                car.Z += carSpeedMs * dt;
                car.SirenTimer += dt * 8.0f;

                // Loop traffic cars
                if (car.Z < playerWorldZ - 50.0f)
                {
                    car.Z = playerWorldZ + 350.0f + (float)(new Random().NextDouble() * 200.0);
                }
            }

            // Witness 911 Call Timer
            if (isWitnessCalling)
            {
                witnessTimer -= dt;
                if (witnessTimer <= 0.0f)
                {
                    isWitnessCalling = false;
                    wantedLevel = Math.Min(6, wantedLevel + 1);
                }
            }

            // Wanted Cooldown
            if (wantedLevel > 0 && !isWitnessCalling)
            {
                wantedCooldownTimer += dt;
                if (wantedCooldownTimer >= 20.0f)
                {
                    wantedLevel--;
                    wantedCooldownTimer = 0.0f;
                }
            }
        }

        private void UpdateParticlesAndWeather(float dt)
        {
            weatherTransitionTimer += dt;

            // Update and clean particles
            for (int i = particles.Count - 1; i >= 0; i--)
            {
                var p = particles[i];
                p.Life -= dt;
                p.X += p.VelX * dt;
                p.Y += p.VelY * dt;
                p.Z += p.VelZ * dt;
                if (p.Life <= 0.0f) particles.RemoveAt(i);
            }

            // Volumetric Fog Generator
            if (enableVolumetricFog && (currentWeather == EWeatherCycle.MiamiRainstorm || currentWeather == EWeatherCycle.HurricaneCategory5) && particles.Count < 320)
            {
                particles.Add(new ParticleEffect
                {
                    X = playerWorldX + (float)(new Random().NextDouble() * 36.0 - 18.0),
                    Y = 1.5f + (float)new Random().NextDouble() * 3.5f,
                    Z = playerWorldZ + 15.0f + (float)new Random().NextDouble() * 45.0f,
                    VelX = -windSpeed * 0.15f,
                    VelY = 0.05f,
                    VelZ = 0.0f,
                    Life = 1.4f,
                    MaxLife = 1.4f,
                    Color = Color.FromArgb(35, 160, 185, 210),
                    Size = 16.0f
                });
            }

            // Rain particle generator
            if (currentWeather == EWeatherCycle.MiamiRainstorm || currentWeather == EWeatherCycle.HurricaneCategory5)
            {
                rainIntensity = (currentWeather == EWeatherCycle.HurricaneCategory5) ? 1.0f : 0.65f;
                surfaceGrip = (currentWeather == EWeatherCycle.HurricaneCategory5) ? 0.45f : 0.65f;
                surfaceName = (currentWeather == EWeatherCycle.HurricaneCategory5) ? "Hurricane Flooded Slick" : "Wet Rain Slick";

                if (particles.Count < 300)
                {
                    for (int i = 0; i < 8; i++)
                    {
                        particles.Add(new ParticleEffect
                        {
                            X = playerWorldX + (float)(new Random().NextDouble() * 30.0 - 15.0),
                            Y = 12.0f + (float)new Random().NextDouble() * 8.0f,
                            Z = playerWorldZ + 20.0f + (float)new Random().NextDouble() * 60.0f,
                            VelX = -windSpeed * 0.4f,
                            VelY = -25.0f,
                            VelZ = 0.0f,
                            Life = 0.8f,
                            MaxLife = 0.8f,
                            Color = Color.FromArgb(120, 180, 220, 255),
                            Size = 2.5f
                        });
                    }
                }

                // Random Lightning Flash
                if (new Random().Next(0, 180) == 42)
                {
                    lightningFlash = 1.0f;
                }
            }
            else
            {
                rainIntensity = 0.0f;
                surfaceGrip = 1.0f;
                surfaceName = "Dry Asphalt";
            }

            if (lightningFlash > 0.0f)
            {
                lightningFlash -= dt * 3.5f;
                if (lightningFlash < 0.0f) lightningFlash = 0.0f;
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;

            int screenW = this.ClientSize.Width;
            int screenH = this.ClientSize.Height;

            // 1. Render 3D World Viewport
            Render3DWorld(g, screenW, screenH);

            // 2. Render Sensory Focus & Post-Processing Overlays
            RenderPostProcessingFX(g, screenW, screenH);

            // 3. Render Vehicle HUD & Speedometer
            RenderVehicleDashboardHUD(g, screenW, screenH);

            // 4. Render Dual-Protagonist & Armory HUD
            RenderProtagonistHUD(g, screenW, screenH);

            // 5. Render 6-Star Wanted Heat & Radio Dispatch
            RenderWantedHeatHUD(g, screenW, screenH);

            // 6. Render In-Game Smartphone (if toggled open)
            if (isPhoneOpen)
            {
                RenderSmartphoneOverlay(g, screenW, screenH);
            }

            // 7. Render Top Control Toolbar & 8K Graphics Settings
            RenderTopToolbar(g, screenW, screenH);
        }

        private void Render3DWorld(Graphics g, int w, int h)
        {
            // Sky Gradient based on Weather Cycle
            Color skyTop, skyHorizon, roadColor;
            switch (currentWeather)
            {
                case EWeatherCycle.TropicalSunset:
                    skyTop = Color.FromArgb(24, 12, 48);
                    skyHorizon = Color.FromArgb(255, 78, 120);
                    roadColor = Color.FromArgb(28, 30, 42);
                    break;
                case EWeatherCycle.NeonMidnight:
                    skyTop = Color.FromArgb(4, 6, 14);
                    skyHorizon = Color.FromArgb(20, 28, 55);
                    roadColor = Color.FromArgb(16, 18, 26);
                    break;
                case EWeatherCycle.MiamiRainstorm:
                    skyTop = Color.FromArgb(15, 20, 32);
                    skyHorizon = Color.FromArgb(40, 55, 80);
                    roadColor = Color.FromArgb(20, 24, 34);
                    break;
                case EWeatherCycle.HurricaneCategory5:
                default:
                    skyTop = Color.FromArgb(10, 8, 20);
                    skyHorizon = Color.FromArgb(60, 40, 85);
                    roadColor = Color.FromArgb(14, 16, 22);
                    break;
            }

            if (lightningFlash > 0.1f)
            {
                skyHorizon = Color.FromArgb((int)(skyHorizon.R + (255 - skyHorizon.R) * lightningFlash),
                                            (int)(skyHorizon.G + (255 - skyHorizon.G) * lightningFlash),
                                            (int)(skyHorizon.B + (255 - skyHorizon.B) * lightningFlash));
            }

            int horizonY = (int)(h * 0.44f);

            // Draw Sky
            using (LinearGradientBrush skyBrush = new LinearGradientBrush(new Point(0, 0), new Point(0, horizonY), skyTop, skyHorizon))
            {
                g.FillRectangle(skyBrush, 0, 0, w, horizonY);
            }

            // Draw Sunset Sun / Neon Moon
            if (currentWeather == EWeatherCycle.TropicalSunset)
            {
                using (SolidBrush sunBrush = new SolidBrush(Color.FromArgb(255, 220, 110)))
                {
                    g.FillEllipse(sunBrush, w / 2 - 50, horizonY - 60, 100, 100);
                }
            }

            // Draw Ground / Ocean (Right side) & City Boardwalk (Left side)
            using (SolidBrush groundBrush = new SolidBrush(Color.FromArgb(12, 16, 26)))
            {
                g.FillRectangle(groundBrush, 0, horizonY, w, h - horizonY);
            }

            // 3D Perspective Transformation Helper
            Func<float, float, float, PointF> project3D = (wx, wy, wz) =>
            {
                float relX = wx - playerWorldX;
                float relZ = wz - playerWorldZ;
                if (relZ <= 0.5f) relZ = 0.5f;

                float fov = 420.0f;
                float screenX = (w / 2.0f) + (relX / relZ) * fov;
                float screenY = horizonY + ((4.0f - wy) / relZ) * fov;
                return new PointF(screenX, screenY);
            };

            // Draw Ocean Drive Road (Perspective Quad)
            PointF roadFarLeft = project3D(-10.0f, 0.0f, playerWorldZ + 350.0f);
            PointF roadFarRight = project3D(10.0f, 0.0f, playerWorldZ + 350.0f);
            PointF roadNearLeft = project3D(-10.0f, 0.0f, playerWorldZ + 4.0f);
            PointF roadNearRight = project3D(10.0f, 0.0f, playerWorldZ + 4.0f);

            using (SolidBrush roadBrush = new SolidBrush(roadColor))
            {
                g.FillPolygon(roadBrush, new PointF[] { roadFarLeft, roadFarRight, roadNearRight, roadNearLeft });
            }

            // Ray-Traced Style Wet Road Reflections (SSR)
            if (enableRayTracingSSR && (rainIntensity > 0.1f || currentWeather == EWeatherCycle.NeonMidnight))
            {
                using (LinearGradientBrush wetReflectBrush = new LinearGradientBrush(
                    new Point(0, horizonY), new Point(0, h),
                    Color.FromArgb((int)(70 * (rainIntensity > 0 ? rainIntensity : 0.4f)), 0, 240, 255),
                    Color.FromArgb(0, 255, 42, 133)))
                {
                    g.FillPolygon(wetReflectBrush, new PointF[] { roadFarLeft, roadFarRight, roadNearRight, roadNearLeft });
                }
            }

            // Draw Road Markings & Center Yellow Lines
            for (float z = (float)(Math.Floor(playerWorldZ / 20.0f) * 20.0f); z < playerWorldZ + 340.0f; z += 20.0f)
            {
                PointF p1 = project3D(0.0f, 0.02f, z);
                PointF p2 = project3D(0.0f, 0.02f, z + 10.0f);
                float width = Math.Max(1.0f, 40.0f / (z - playerWorldZ + 1.0f));

                using (Pen linePen = new Pen(Color.FromArgb(245, 158, 11), width))
                {
                    g.DrawLine(linePen, p1, p2);
                }
            }

            // Sort & Render 3D Objects from back to front (Painters Algorithm)
            List<Tuple<float, Action>> renderQueue = new List<Tuple<float, Action>>();

            // Buildings
            foreach (var b in buildings)
            {
                if (b.Z >= playerWorldZ - 10.0f && b.Z <= playerWorldZ + 400.0f)
                {
                    float dist = b.Z - playerWorldZ;
                    renderQueue.Add(new Tuple<float, Action>(dist, () =>
                    {
                        PointF bBaseLeft = project3D(b.X, 0.0f, b.Z);
                        PointF bBaseRight = project3D(b.X + b.Width, 0.0f, b.Z);
                        PointF bTopLeft = project3D(b.X, b.Height, b.Z);
                        PointF bTopRight = project3D(b.X + b.Width, b.Height, b.Z);

                        float bWidth = Math.Abs(bBaseRight.X - bBaseLeft.X);
                        float bHeight = Math.Abs(bBaseLeft.Y - bTopLeft.Y);

                        if (bWidth > 2 && bHeight > 2)
                        {
                            using (SolidBrush wallBrush = new SolidBrush(b.WallColor))
                            {
                                g.FillPolygon(wallBrush, new PointF[] { bBaseLeft, bBaseRight, bTopRight, bTopLeft });
                            }
                            using (Pen borderPen = new Pen(Color.FromArgb(50, 255, 255, 255), 1))
                            {
                                g.DrawPolygon(borderPen, new PointF[] { bBaseLeft, bBaseRight, bTopRight, bTopLeft });
                            }

                            // Neon Sign Glowing Header
                            if (dist < 220.0f)
                            {
                                using (SolidBrush neonBrush = new SolidBrush(b.NeonColor))
                                using (Font neonFont = new Font("Arial", Math.Max(7, 24.0f / (dist * 0.05f)), FontStyle.Bold))
                                {
                                    g.DrawString(b.NeonSign, neonFont, neonBrush, bTopLeft.X + 4, bTopLeft.Y + 6);
                                }
                            }
                        }
                    }));
                }
            }

            // Palm Trees
            foreach (var palm in palmTrees)
            {
                if (palm.Z >= playerWorldZ - 10.0f && palm.Z <= playerWorldZ + 350.0f)
                {
                    float dist = palm.Z - playerWorldZ;
                    renderQueue.Add(new Tuple<float, Action>(dist, () =>
                    {
                        PointF trunkBase = project3D(palm.X, 0.0f, palm.Z);
                        PointF trunkTop = project3D(palm.X + palm.LeanAngle * 10.0f, palm.Height, palm.Z);
                        float trunkThickness = Math.Max(2.0f, 60.0f / (dist + 1.0f));

                        using (Pen trunkPen = new Pen(Color.FromArgb(78, 59, 45), trunkThickness))
                        {
                            g.DrawLine(trunkPen, trunkBase, trunkTop);
                        }

                        // Palm Fronds
                        float frondSize = Math.Max(4.0f, 160.0f / (dist + 1.0f));
                        using (SolidBrush leafBrush = new SolidBrush(Color.FromArgb(34, 139, 34)))
                        {
                            g.FillEllipse(leafBrush, trunkTop.X - frondSize / 2, trunkTop.Y - frondSize / 2, frondSize, frondSize * 0.6f);
                        }
                    }));
                }
            }

            // Traffic Cars & Police Cruisers
            foreach (var car in trafficCars)
            {
                if (car.Z >= playerWorldZ - 10.0f && car.Z <= playerWorldZ + 350.0f)
                {
                    float dist = car.Z - playerWorldZ;
                    renderQueue.Add(new Tuple<float, Action>(dist, () =>
                    {
                        PointF carBase = project3D(car.X, 0.0f, car.Z);
                        float carW = Math.Max(8.0f, 180.0f / (dist + 1.0f));
                        float carH = carW * 0.55f;

                        RectangleF carRect = new RectangleF(carBase.X - carW / 2, carBase.Y - carH, carW, carH);
                        using (SolidBrush carBrush = new SolidBrush(car.Color))
                        {
                            g.FillRectangle(carBrush, carRect);
                        }
                        using (Pen carOutline = new Pen(Color.Black, 1.5f))
                        {
                            g.DrawRectangle(carOutline, carRect.X, carRect.Y, carRect.Width, carRect.Height);
                        }

                        // Flashing Police Strobe Lights
                        if (car.IsPolice)
                        {
                            Color strobe = ((int)car.SirenTimer % 2 == 0) ? Color.FromArgb(239, 68, 68) : Color.FromArgb(0, 240, 255);
                            using (SolidBrush strobeBrush = new SolidBrush(strobe))
                            {
                                g.FillRectangle(strobeBrush, carBase.X - carW * 0.3f, carBase.Y - carH - 4, carW * 0.6f, 4);
                            }
                        }
                    }));
                }
            }

            // Sort by distance descending (farthest first)
            renderQueue.Sort((a, b) => b.Item1.CompareTo(a.Item1));
            foreach (var item in renderQueue)
            {
                item.Item2();
            }

            // Render Player Vehicle (Pegassi Torero XO) in foreground
            RenderPlayerSupercar(g, w, h);

            // Render Particles (Smoke / Rain)
            foreach (var p in particles)
            {
                PointF pt = project3D(p.X, p.Y, p.Z);
                float pSize = Math.Max(1.5f, (p.Size * 80.0f) / (p.Z - playerWorldZ + 1.0f));
                using (SolidBrush pBrush = new SolidBrush(p.Color))
                {
                    g.FillEllipse(pBrush, pt.X - pSize / 2, pt.Y - pSize / 2, pSize, pSize);
                }
            }

            // VCPD Police Helicopter Spotlight if wanted >= 3
            if (wantedLevel >= 3)
            {
                PointF heliTarget = project3D(playerWorldX + (float)Math.Sin(heliSpotlightAngle) * 3.0f, 0.0f, playerWorldZ + 15.0f);
                using (GraphicsPath spotlightPath = new GraphicsPath())
                {
                    spotlightPath.AddPolygon(new PointF[] {
                        new PointF(w * 0.75f, 20),
                        new PointF(heliTarget.X - 90, heliTarget.Y),
                        new PointF(heliTarget.X + 90, heliTarget.Y)
                    });
                    using (PathGradientBrush spotBrush = new PathGradientBrush(spotlightPath))
                    {
                        spotBrush.CenterColor = Color.FromArgb(140, 255, 255, 255);
                        spotBrush.SurroundColors = new Color[] { Color.FromArgb(0, 255, 255, 255) };
                        g.FillPath(spotBrush, spotlightPath);
                    }
                }
            }
        }

        private void RenderPlayerSupercar(Graphics g, int w, int h)
        {
            float carScreenX = w / 2.0f + (driftAngle * 3.5f);
            float carScreenY = h * 0.82f;
            float carWidth = 240.0f;
            float carHeight = 90.0f;

            GraphicsState state = g.Save();
            g.TranslateTransform(carScreenX, carScreenY);
            g.RotateTransform(driftAngle * 0.7f);

            // Supercar Body (Aerodynamic Pegassi Torero XO)
            Color bodyColor = (activeProtagonist == EProtagonist.Lucia) ? Color.FromArgb(255, 42, 133) : Color.FromArgb(0, 240, 255);
            using (GraphicsPath carBody = new GraphicsPath())
            {
                carBody.AddPolygon(new PointF[] {
                    new PointF(-carWidth * 0.45f, 0),
                    new PointF(carWidth * 0.45f, 0),
                    new PointF(carWidth * 0.40f, -carHeight * 0.45f),
                    new PointF(carWidth * 0.28f, -carHeight),
                    new PointF(-carWidth * 0.28f, -carHeight),
                    new PointF(-carWidth * 0.40f, -carHeight * 0.45f)
                });

                using (LinearGradientBrush carBrush = new LinearGradientBrush(
                    new PointF(0, -carHeight), new PointF(0, 0),
                    Color.FromArgb(255, (int)(bodyColor.R * 0.8), (int)(bodyColor.G * 0.8), (int)(bodyColor.B * 0.8)),
                    bodyColor))
                {
                    g.FillPath(carBrush, carBody);
                }
                using (Pen outlinePen = new Pen(Color.FromArgb(15, 20, 30), 3.0f))
                {
                    g.DrawPath(outlinePen, carBody);
                }
            }

            // Rear Windshield & Roof
            using (SolidBrush glassBrush = new SolidBrush(Color.FromArgb(220, 20, 24, 38)))
            {
                g.FillPolygon(glassBrush, new PointF[] {
                    new PointF(-carWidth * 0.25f, -carHeight * 0.88f),
                    new PointF(carWidth * 0.25f, -carHeight * 0.88f),
                    new PointF(carWidth * 0.32f, -carHeight * 0.50f),
                    new PointF(-carWidth * 0.32f, -carHeight * 0.50f)
                });
            }

            // LED Neon Taillights & Twin Titanium Exhausts
            using (SolidBrush tailLightBrush = new SolidBrush(Color.FromArgb(255, 239, 68, 68)))
            {
                g.FillRectangle(tailLightBrush, -carWidth * 0.42f, -carHeight * 0.32f, carWidth * 0.25f, 8);
                g.FillRectangle(tailLightBrush, carWidth * 0.17f, -carHeight * 0.32f, carWidth * 0.25f, 8);
            }

            // Quad Exhaust Flame Boost (when accelerating at high RPM)
            if (throttleInput > 0 && playerRpm > 6000.0f)
            {
                using (SolidBrush flameBrush = new SolidBrush(Color.FromArgb(220, 0, 240, 255)))
                {
                    g.FillEllipse(flameBrush, -carWidth * 0.15f, -8, 20, 35);
                    g.FillEllipse(flameBrush, carWidth * 0.05f, -8, 20, 35);
                }
            }

            // Dual Protagonist Silhouette inside Cockpit
            using (SolidBrush charBrush = new SolidBrush(Color.FromArgb(180, 240, 240, 250)))
            {
                // Driver (Active Protagonist)
                g.FillEllipse(charBrush, -carWidth * 0.14f, -carHeight * 0.82f, 22, 22);
                // Passenger (Companion AI)
                g.FillEllipse(charBrush, carWidth * 0.05f, -carHeight * 0.82f, 22, 22);
            }

            g.Restore(state);
        }

        private void RenderPostProcessingFX(Graphics g, int w, int h)
        {
            // Sensory Focus Slomo Radial Tint
            if (isSensoryFocus)
            {
                using (GraphicsPath radialPath = new GraphicsPath())
                {
                    radialPath.AddEllipse(-w * 0.2f, -h * 0.2f, w * 1.4f, h * 1.4f);
                    using (PathGradientBrush pgb = new PathGradientBrush(radialPath))
                    {
                        pgb.CenterColor = Color.FromArgb(0, 0, 240, 255);
                        pgb.SurroundColors = new Color[] { Color.FromArgb(130, 0, 240, 255) };
                        g.FillRectangle(pgb, 0, 0, w, h);
                    }
                }
                using (Font focusFont = new Font("Impact", 24, FontStyle.Italic))
                using (SolidBrush focusBrush = new SolidBrush(Color.FromArgb(0, 240, 255)))
                {
                    g.DrawString("👁️ SENSORY FOCUS ENGAGED (0.35x SLOMO)", focusFont, focusBrush, w / 2 - 240, 75);
                }
            }

            // 8K HDR Bloom Glow Filter on Edges
            if (enableHDRBloom)
            {
                using (Pen bloomPen = new Pen(Color.FromArgb(35, 255, 42, 133), 4.0f))
                {
                    g.DrawRectangle(bloomPen, 2, 2, w - 4, h - 4);
                }
            }

            // High-Speed Motion Blur Streamlines
            if (enableMotionBlur && playerSpeedKmh > 180.0f)
            {
                int blurLines = Math.Min(24, (int)((playerSpeedKmh - 180.0f) / 6.0f));
                Random r = new Random(42);
                using (Pen blurPen = new Pen(Color.FromArgb(60, 255, 255, 255), 1.5f))
                {
                    for (int i = 0; i < blurLines; i++)
                    {
                        int y = r.Next(h);
                        int len = r.Next(40, 140);
                        g.DrawLine(blurPen, 0, y, len, y);
                        g.DrawLine(blurPen, w - len, y, w, y);
                    }
                }
            }
        }

        private void RenderVehicleDashboardHUD(Graphics g, int w, int h)
        {
            int dashW = 280;
            int dashH = 110;
            int dashX = w / 2 - dashW / 2;
            int dashY = h - dashH - 20;

            // Background Pod
            using (SolidBrush bgBrush = new SolidBrush(Color.FromArgb(210, 15, 19, 31)))
            using (Pen borderPen = new Pen(Color.FromArgb(80, 0, 240, 255), 1.5f))
            {
                g.FillRectangle(bgBrush, dashX, dashY, dashW, dashH);
                g.DrawRectangle(borderPen, dashX, dashY, dashW, dashH);
            }

            // Speed Display
            using (Font speedFont = new Font("Impact", 38, FontStyle.Regular))
            using (SolidBrush speedBrush = new SolidBrush(Color.FromArgb(0, 240, 255)))
            {
                g.DrawString(Math.Round(playerSpeedKmh).ToString("000"), speedFont, speedBrush, dashX + 20, dashY + 12);
            }

            using (Font unitFont = new Font("Arial", 11, FontStyle.Bold))
            using (SolidBrush unitBrush = new SolidBrush(Color.FromArgb(156, 163, 175)))
            {
                g.DrawString("KM/H", unitFont, unitBrush, dashX + 115, dashY + 36);
                g.DrawString("GEAR " + currentGear, unitFont, new SolidBrush(Color.FromArgb(255, 42, 133)), dashX + 180, dashY + 16);
            }

            // RPM Bar
            float rpmPercent = (playerRpm - 1000.0f) / 7800.0f;
            rpmPercent = Math.Max(0.0f, Math.Min(1.0f, rpmPercent));
            int barW = 240;
            int barH = 8;
            g.FillRectangle(new SolidBrush(Color.FromArgb(30, 41, 59)), dashX + 20, dashY + 68, barW, barH);
            Color rpmColor = (rpmPercent > 0.85f) ? Color.FromArgb(239, 68, 68) : Color.FromArgb(16, 185, 129);
            g.FillRectangle(new SolidBrush(rpmColor), dashX + 20, dashY + 68, (int)(barW * rpmPercent), barH);

            // Traction & Surface Tag
            using (Font surfFont = new Font("Arial", 8.0f, FontStyle.Regular))
            {
                g.DrawString("Surface: " + surfaceName + " (" + surfaceGrip.ToString("0.00") + "x) | Tire Wear: " + Math.Round(tireWear * 100) + "%", surfFont, Brushes.LightGray, dashX + 12, dashY + 85);
            }
        }

        private void RenderProtagonistHUD(Graphics g, int w, int h)
        {
            int hudX = 25;
            int hudY = h - 195;
            int hudW = 310;
            int hudH = 175;

            // Background Card
            using (SolidBrush cardBrush = new SolidBrush(Color.FromArgb(220, 15, 19, 31)))
            using (Pen borderPen = new Pen(Color.FromArgb(60, 255, 255, 255), 1.0f))
            {
                g.FillRectangle(cardBrush, hudX, hudY, hudW, hudH);
                g.DrawRectangle(borderPen, hudX, hudY, hudW, hudH);
            }

            // Active Protagonist Header
            string activeName = (activeProtagonist == EProtagonist.Lucia) ? "LUCIA CAMINOS" : "JASON DUVAL";
            Color nameColor = (activeProtagonist == EProtagonist.Lucia) ? Color.FromArgb(255, 42, 133) : Color.FromArgb(0, 240, 255);
            using (Font titleFont = new Font("Impact", 15, FontStyle.Regular))
            using (SolidBrush titleBrush = new SolidBrush(nameColor))
            {
                g.DrawString(activeName, titleFont, titleBrush, hudX + 15, hudY + 10);
            }

            using (Font subFont = new Font("Arial", 8, FontStyle.Bold))
            {
                g.DrawString("DIRECT PLAYER CONTROL [TAB to Swap]", subFont, Brushes.Gray, hudX + 15, hudY + 32);
            }

            // Health Bar (Red)
            float hp = (activeProtagonist == EProtagonist.Lucia) ? luciaHealth : jasonHealth;
            g.FillRectangle(new SolidBrush(Color.FromArgb(40, 20, 20)), hudX + 15, hudY + 50, 280, 7);
            g.FillRectangle(new SolidBrush(Color.FromArgb(239, 68, 68)), hudX + 15, hudY + 50, (int)(280 * (hp / 100.0f)), 7);

            // Armor Bar (Blue)
            float armor = (activeProtagonist == EProtagonist.Lucia) ? luciaArmor : jasonArmor;
            g.FillRectangle(new SolidBrush(Color.FromArgb(20, 30, 50)), hudX + 15, hudY + 62, 280, 7);
            g.FillRectangle(new SolidBrush(Color.FromArgb(59, 130, 246)), hudX + 15, hudY + 62, (int)(280 * (armor / 100.0f)), 7);

            // Stamina Bar (Green)
            float stamina = (activeProtagonist == EProtagonist.Lucia) ? luciaStamina : jasonStamina;
            g.FillRectangle(new SolidBrush(Color.FromArgb(20, 40, 30)), hudX + 15, hudY + 74, 280, 6);
            g.FillRectangle(new SolidBrush(Color.FromArgb(16, 185, 129)), hudX + 15, hudY + 74, (int)(280 * (stamina / 100.0f)), 6);

            // Duffle Bag Loot Cash
            using (Font cashFont = new Font("Arial", 10.5f, FontStyle.Bold))
            using (SolidBrush cashBrush = new SolidBrush(Color.FromArgb(245, 158, 11)))
            {
                g.DrawString("DUFFLE CASH: $" + duffleCash.ToString("N0") + " | STAMINA: " + Math.Round(stamina) + "%", cashFont, cashBrush, hudX + 15, hudY + 88);
            }

            // Weapon & Ammo
            using (Font wepFont = new Font("Arial", 9.0f, FontStyle.Regular))
            {
                g.DrawString("🔫 " + activeWeapon + " (" + ammoClip + "/" + ammoReserve + ")", wepFont, Brushes.White, hudX + 15, hudY + 112);
                g.DrawString("Companion AI: Covering Rear Quadrant", wepFont, Brushes.LightGreen, hudX + 15, hudY + 132);
            }
        }

        private void RenderWantedHeatHUD(Graphics g, int w, int h)
        {
            int starX = w - 240;
            int starY = 25;

            // 6-Star Wanted Rating Header
            using (Font font = new Font("Impact", 22, FontStyle.Regular))
            {
                for (int i = 0; i < 6; i++)
                {
                    bool active = (i < wantedLevel);
                    Color starColor = active ? Color.FromArgb(239, 68, 68) : Color.FromArgb(60, 60, 70);
                    using (SolidBrush brush = new SolidBrush(starColor))
                    {
                        g.DrawString("★", font, brush, starX + i * 32, starY);
                    }
                }
            }

            // Witness 911 Dialing Banner
            if (isWitnessCalling)
            {
                using (SolidBrush warnBrush = new SolidBrush(Color.FromArgb(220, 239, 68, 68)))
                using (Font warnFont = new Font("Arial", 10, FontStyle.Bold))
                {
                    g.FillRectangle(warnBrush, starX - 80, starY + 45, 300, 28);
                    g.DrawString("⚠️ WITNESS 911 CALL (" + witnessTimer.ToString("0.0") + "s) - INTIMIDATE!", warnFont, Brushes.White, starX - 70, starY + 51);
                }
            }
        }

        private void RenderTopToolbar(Graphics g, int w, int h)
        {
            // Bar background
            using (SolidBrush barBrush = new SolidBrush(Color.FromArgb(240, 15, 19, 31)))
            using (Pen borderPen = new Pen(Color.FromArgb(60, 255, 255, 255)))
            {
                g.FillRectangle(barBrush, 0, 0, w, 55);
                g.DrawLine(borderPen, 0, 55, w, 55);
            }

            // Title
            using (Font titleFont = new Font("Impact", 16, FontStyle.Italic))
            using (SolidBrush titleBrush = new SolidBrush(Color.FromArgb(255, 42, 133)))
            {
                g.DrawString("LEONIDA 8K ULTRA SIMULATOR", titleFont, titleBrush, 20, 14);
            }

            // FPS & Engine Resolution Tag
            using (Font statFont = new Font("Arial", 9, FontStyle.Bold))
            {
                string resTag = internalRenderWidth + "x" + internalRenderHeight + ((graphicsPreset == EGraphicsPreset.Photorealistic8K) ? " (Ray Tracing SSR)" : (graphicsPreset == EGraphicsPreset.Ultra4K) ? " (DLSS 3.5)" : " (Native 60FPS)");
                g.DrawString("FPS: " + Math.Round(fps, 1) + " | " + resTag, statFont, new SolidBrush(Color.FromArgb(0, 240, 255)), 280, 18);
            }

            // Buttons
            btnPresetRect = new Rectangle(w - 790, 12, 105, 32);
            btnWeatherRect = new Rectangle(w - 680, 12, 105, 32);
            btnPhoneRect = new Rectangle(w - 570, 12, 100, 32);
            btnSwapCharRect = new Rectangle(w - 465, 12, 100, 32);
            btnSensoryRect = new Rectangle(w - 360, 12, 100, 32);
            btnCrimeRect = new Rectangle(w - 255, 12, 120, 32);
            btnClearHeatRect = new Rectangle(w - 130, 12, 115, 32);

            DrawButton(g, btnPresetRect, "🎨 8K Mode", Color.FromArgb(157, 78, 221));
            DrawButton(g, btnWeatherRect, "🌀 Weather", Color.FromArgb(245, 158, 11));
            DrawButton(g, btnPhoneRect, "📱 Phone [P]", isPhoneOpen ? Color.FromArgb(255, 42, 133) : Color.FromArgb(30, 41, 59));
            DrawButton(g, btnSwapCharRect, "👥 Swap [Tab]", Color.FromArgb(0, 240, 255));
            DrawButton(g, btnSensoryRect, "👁️ Slomo [E]", isSensoryFocus ? Color.FromArgb(0, 240, 255) : Color.FromArgb(30, 41, 59));
            DrawButton(g, btnCrimeRect, "🚨 Robbery", Color.FromArgb(239, 68, 68));
            DrawButton(g, btnClearHeatRect, "🛡️ Clear Heat", Color.FromArgb(16, 185, 129));
        }

        private void DrawButton(Graphics g, Rectangle r, string text, Color accent)
        {
            using (SolidBrush bgBrush = new SolidBrush(Color.FromArgb(220, 20, 26, 40)))
            using (Pen pen = new Pen(accent, 1.5f))
            using (Font font = new Font("Arial", 8.5f, FontStyle.Bold))
            {
                g.FillRectangle(bgBrush, r);
                g.DrawRectangle(pen, r);
                g.DrawString(text, font, Brushes.White, r.X + 8, r.Y + 8);
            }
        }

        private void RenderSmartphoneOverlay(Graphics g, int w, int h)
        {
            int phoneW = 340;
            int phoneH = 580;
            int phoneX = w - phoneW - 35;
            int phoneY = 75;
            phoneFrameRect = new Rectangle(phoneX, phoneY, phoneW, phoneH);

            // Smartphone Frame
            using (SolidBrush phoneBrush = new SolidBrush(Color.FromArgb(245, 12, 15, 24)))
            using (Pen borderPen = new Pen(Color.FromArgb(255, 42, 133), 2.0f))
            {
                g.FillRectangle(phoneBrush, phoneFrameRect);
                g.DrawRectangle(borderPen, phoneFrameRect);
            }

            // Top Status Bar
            using (Font statFont = new Font("Arial", 8, FontStyle.Regular))
            {
                g.DrawString("14:20 PM | 5G 98% 🔋", statFont, Brushes.Gray, phoneX + 15, phoneY + 10);
            }

            // App Tabs (Eyefind, BAWSAQ, Reelz, Bank)
            string[] tabs = new string[] { "🌐 Eyefind", "📈 BAWSAQ", "📱 Reelz", "🏦 Bank" };
            for (int i = 0; i < 4; i++)
            {
                Rectangle tabRect = new Rectangle(phoneX + 10 + i * 80, phoneY + 30, 75, 26);
                bool isActive = (activePhoneTab == i);
                using (SolidBrush tabBrush = new SolidBrush(isActive ? Color.FromArgb(255, 42, 133) : Color.FromArgb(30, 38, 55)))
                using (Font tabFont = new Font("Arial", 7.5f, FontStyle.Bold))
                {
                    g.FillRectangle(tabBrush, tabRect);
                    g.DrawString(tabs[i], tabFont, Brushes.White, tabRect.X + 6, tabRect.Y + 6);
                }
            }

            int contentY = phoneY + 68;

            // 1. Eyefind Search
            if (activePhoneTab == 0)
            {
                using (Font titleFont = new Font("Impact", 13, FontStyle.Regular))
                using (SolidBrush titleBrush = new SolidBrush(Color.FromArgb(0, 240, 255)))
                {
                    g.DrawString("EYEFIND 2.0 LIVE WEB ENGINE", titleFont, titleBrush, phoneX + 15, contentY);
                }
                using (Font bodyFont = new Font("Arial", 8.5f, FontStyle.Bold))
                using (Font snippetFont = new Font("Arial", 8.0f, FontStyle.Regular))
                {
                    g.DrawString("Query: \"" + phoneSearchQuery + "\"", snippetFont, Brushes.Yellow, phoneX + 15, contentY + 28);
                    g.DrawString(searchResultTitle, bodyFont, Brushes.Cyan, new RectangleF(phoneX + 15, contentY + 50, 310, 45));
                    g.DrawString(searchResultSnippet, snippetFont, Brushes.LightGray, new RectangleF(phoneX + 15, contentY + 100, 310, 70));
                }
            }
            // 2. BAWSAQ Stocks
            else if (activePhoneTab == 1)
            {
                using (Font titleFont = new Font("Impact", 13, FontStyle.Regular))
                {
                    g.DrawString("BAWSAQ VICE CITY EXCHANGE", titleFont, Brushes.White, phoneX + 15, contentY);
                }
                int stockY = contentY + 30;
                using (Font stockFont = new Font("Arial", 8.5f, FontStyle.Regular))
                using (Font valFont = new Font("Arial", 8.5f, FontStyle.Bold))
                {
                    foreach (var s in stockList)
                    {
                        g.DrawString(s.Ticker + " - " + s.Company, stockFont, Brushes.White, phoneX + 15, stockY);
                        Brush col = (s.Change >= 0) ? Brushes.LimeGreen : Brushes.Crimson;
                        string changeStr = (s.Change >= 0 ? "+" : "") + s.Change.ToString("0.00") + "%";
                        g.DrawString("$" + s.Price.ToString("0.00") + " (" + changeStr + ")", valFont, col, phoneX + 195, stockY);
                        stockY += 24;
                    }
                }
            }
            // 3. Leonida Reelz Feed
            else if (activePhoneTab == 2)
            {
                int reelY = contentY;
                foreach (var r in reelList)
                {
                    using (SolidBrush cardBrush = new SolidBrush(Color.FromArgb(20, 28, 45)))
                    using (Pen rPen = new Pen(r.AccentColor, 1.0f))
                    using (Font hFont = new Font("Arial", 8.5f, FontStyle.Bold))
                    using (Font cFont = new Font("Arial", 8.0f, FontStyle.Regular))
                    {
                        Rectangle reelRect = new Rectangle(phoneX + 12, reelY, 315, 80);
                        g.FillRectangle(cardBrush, reelRect);
                        g.DrawRectangle(rPen, reelRect);
                        g.DrawString(r.Handle + " • " + r.Views, hFont, new SolidBrush(r.AccentColor), phoneX + 18, reelY + 6);
                        g.DrawString(r.Caption, cFont, Brushes.White, new RectangleF(phoneX + 18, reelY + 24, 300, 50));
                        reelY += 90;
                    }
                }
            }
            // 4. Maze Bank
            else
            {
                using (Font bankFont = new Font("Impact", 16, FontStyle.Regular))
                using (Font valFont = new Font("Arial", 12, FontStyle.Bold))
                {
                    g.DrawString("MAZE BANK ONLINE", bankFont, Brushes.LimeGreen, phoneX + 15, contentY + 20);
                    g.DrawString("Checking Balance: $148,920.50", valFont, Brushes.White, phoneX + 15, contentY + 60);
                    g.DrawString("Laundered Stash:  $250,000.00", valFont, Brushes.Gold, phoneX + 15, contentY + 90);
                }
            }
        }

        private void OnKeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.W || e.KeyCode == Keys.Up) keyW = true;
            if (e.KeyCode == Keys.S || e.KeyCode == Keys.Down) keyS = true;
            if (e.KeyCode == Keys.A || e.KeyCode == Keys.Left) keyA = true;
            if (e.KeyCode == Keys.D || e.KeyCode == Keys.Right) keyD = true;
            if (e.KeyCode == Keys.Space) keySpace = true;
            if (e.KeyCode == Keys.ShiftKey) keyShift = true;

            if (e.KeyCode == Keys.P || e.KeyCode == Keys.M)
            {
                isPhoneOpen = !isPhoneOpen;
            }
            if (e.KeyCode == Keys.Tab)
            {
                activeProtagonist = (activeProtagonist == EProtagonist.Lucia) ? EProtagonist.Jason : EProtagonist.Lucia;
            }
            if (e.KeyCode == Keys.E)
            {
                isSensoryFocus = !isSensoryFocus;
            }
        }

        private void OnKeyUp(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.W || e.KeyCode == Keys.Up) keyW = false;
            if (e.KeyCode == Keys.S || e.KeyCode == Keys.Down) keyS = false;
            if (e.KeyCode == Keys.A || e.KeyCode == Keys.Left) keyA = false;
            if (e.KeyCode == Keys.D || e.KeyCode == Keys.Right) keyD = false;
            if (e.KeyCode == Keys.Space) keySpace = false;
            if (e.KeyCode == Keys.ShiftKey) keyShift = false;
        }

        private void OnMouseClick(object sender, MouseEventArgs e)
        {
            Point pt = e.Location;

            // Toolbar Button Clicks
            if (btnPresetRect.Contains(pt))
            {
                if (graphicsPreset == EGraphicsPreset.Photorealistic8K)
                {
                    graphicsPreset = EGraphicsPreset.High1080p;
                    internalRenderWidth = 1920; internalRenderHeight = 1080;
                }
                else if (graphicsPreset == EGraphicsPreset.High1080p)
                {
                    graphicsPreset = EGraphicsPreset.Ultra4K;
                    internalRenderWidth = 3840; internalRenderHeight = 2160;
                }
                else
                {
                    graphicsPreset = EGraphicsPreset.Photorealistic8K;
                    internalRenderWidth = 7680; internalRenderHeight = 4320;
                }
            }
            else if (btnWeatherRect.Contains(pt))
            {
                currentWeather = (EWeatherCycle)(((int)currentWeather + 1) % 4);
            }
            else if (btnPhoneRect.Contains(pt))
            {
                isPhoneOpen = !isPhoneOpen;
            }
            else if (btnSwapCharRect.Contains(pt))
            {
                activeProtagonist = (activeProtagonist == EProtagonist.Lucia) ? EProtagonist.Jason : EProtagonist.Lucia;
            }
            else if (btnSensoryRect.Contains(pt))
            {
                isSensoryFocus = !isSensoryFocus;
            }
            else if (btnCrimeRect.Contains(pt))
            {
                wantedLevel = Math.Min(6, wantedLevel + 2);
                isWitnessCalling = true;
                witnessTimer = 6.0f;
                duffleCash += 50000.0;
            }
            else if (btnClearHeatRect.Contains(pt))
            {
                wantedLevel = 0;
                isWitnessCalling = false;
                wantedCooldownTimer = 0.0f;
            }

            // Phone Tab Clicks
            if (isPhoneOpen && phoneFrameRect.Contains(pt))
            {
                for (int i = 0; i < 4; i++)
                {
                    Rectangle tabRect = new Rectangle(phoneFrameRect.X + 10 + i * 80, phoneFrameRect.Y + 30, 75, 26);
                    if (tabRect.Contains(pt))
                    {
                        activePhoneTab = i;
                        break;
                    }
                }
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new GTA6_SimulatorForm());
        }
    }
}
